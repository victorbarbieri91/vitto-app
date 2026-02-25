import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from '../_shared/config.ts';
import { loadUserProfile } from '../_shared/user-profile.ts';
import { saveMessage, loadSessionHistory, embedMessageAsync } from '../_shared/persistence.ts';
import { sseEvent } from '../_shared/sse.ts';
import { streamingAgentLoop } from '../_shared/agent-loop.ts';
import { INTERVIEW_TOOLSET } from './tools.ts';
import { executeInterviewTool } from './tool-executor.ts';
import { buildInterviewSystemPrompt } from './system-prompt.ts';

// =====================================================
// MAIN HANDLER - ENTREVISTA
// =====================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userId = user.id;
    const body = await req.json();
    const { messages, sessionId, userData } = body;

    // Validar mensagens
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    if (!lastUserMsg) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let userContent = lastUserMsg.content;
    if (userData) {
      userContent += `\n\nDados adicionais fornecidos: ${JSON.stringify(userData)}`;
    }

    // Garantir sessao
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: newSession, error } = await supabase
        .from('app_chat_sessoes')
        .insert({ user_id: userId, titulo: 'Entrevista Inicial', metadata: { type: 'interview' } })
        .select()
        .single();
      if (error) throw error;
      activeSessionId = newSession.id;
    }

    // Salvar mensagem do usuario
    const userMsgId = await saveMessage(supabase, activeSessionId, 'user', userContent);

    // === BUILD CONTEXT ===
    const userProfile = await loadUserProfile(supabase, userId);

    // Carregar progresso da entrevista
    const progressResult = await executeInterviewTool(supabase, userId, 'get_interview_progress', {});
    const progressData = progressResult.success ? progressResult.data as Record<string, unknown> : undefined;
    const systemPrompt = buildInterviewSystemPrompt(userProfile, progressData);

    console.log(`ENTREVISTA MODE: ${INTERVIEW_TOOLSET.length} tools disponiveis`);

    // Load session history (20 mensagens para manter contexto da entrevista)
    const history = await loadSessionHistory(supabase, activeSessionId, 20);
    console.log(`History: ${history.length} mensagens`);

    // Filter history to avoid duplicating the current message
    const filteredHistory = history.filter(m =>
      !(m.role === 'user' && m.content === userContent)
    );

    // Embed user message async
    if (userMsgId) embedMessageAsync(userMsgId, userContent);

    // === STREAMING SSE ===
    const { readable, writable } = new TransformStream<Uint8Array>();
    const writer = writable.getWriter();

    (async () => {
      try {
        const assistantContent = await streamingAgentLoop(
          supabase,
          writer,
          userId,
          userContent,
          activeSessionId,
          INTERVIEW_TOOLSET,
          systemPrompt,
          filteredHistory,
          12, // More iterations for interview (multiple tools per turn)
          executeInterviewTool,
          { confirmationTools: [] }, // Sem confirmacoes na entrevista
        );

        if (assistantContent) {
          const assistantMsgId = await saveMessage(supabase, activeSessionId, 'assistant', assistantContent);
          if (assistantMsgId) embedMessageAsync(assistantMsgId, assistantContent);
        }

        writer.write(sseEvent({ type: 'done', sessionId: activeSessionId, content: assistantContent || '' }));
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Streaming error:', error);
        writer.write(sseEvent({ type: 'error', error: errMsg }));
      } finally {
        writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Error in entrevista-ia:', error);
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
