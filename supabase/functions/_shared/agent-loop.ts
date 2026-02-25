// =====================================================
// STREAMING AGENT LOOP (compartilhado)
// =====================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ChatMessage, Tool, ToolCall, ToolResult } from './types.ts';
import { OPENAI_CHAT_URL, MODEL } from './config.ts';
import { processOpenAIStream } from './openai-stream.ts';
import { sseEvent } from './sse.ts';

export type ExecuteToolFn = (
  supabase: SupabaseClient,
  userId: string,
  toolName: string,
  args: Record<string, unknown>
) => Promise<ToolResult>;

export type GenerateActionPreviewFn = (
  toolName: string,
  args: Record<string, unknown>
) => string;

export interface AgentLoopOptions {
  confirmationTools: string[];
  generateActionPreview?: GenerateActionPreviewFn;
}

export async function streamingAgentLoop(
  supabase: SupabaseClient,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  userId: string,
  userMessage: string,
  sessionId: string,
  tools: Tool[],
  systemPrompt: string,
  history: ChatMessage[],
  maxIterations: number,
  executeTool: ExecuteToolFn,
  options: AgentLoopOptions,
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY nao configurada');

  const workingMessages: ChatMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];
  console.log(`Agent loop: ${history.length} mensagens de historico + mensagem atual (confirmable=${options.confirmationTools.length})`);

  const confirmationTools = options.confirmationTools;

  let fullResponse = '';
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`Agent loop iteracao ${iteration}`);

    const openaiResponse = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...workingMessages.map(m => {
            const msg: Record<string, unknown> = { role: m.role, content: m.content };
            if (m.tool_calls) msg.tool_calls = m.tool_calls;
            if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
            return msg;
          }),
        ],
        tools: tools.map(t => ({ type: t.type, function: t.function })),
        tool_choice: 'auto',
        stream: true,
        max_completion_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const { content, toolCalls } = await processOpenAIStream(
      openaiResponse,
      (token) => {
        writer.write(sseEvent({ type: 'token', content: token }));
      },
    );

    if (!toolCalls || toolCalls.length === 0) {
      fullResponse = content;
      break;
    }

    // ============================================================
    // FASE 1: Classificar tool calls em normais vs especiais
    // ============================================================
    const specialCalls: {
      buttons: { tc: ToolCall; args: Record<string, unknown> } | null;
      confirmation: { tc: ToolCall; args: Record<string, unknown> } | null;
      dataRequest: { tc: ToolCall; args: Record<string, unknown> } | null;
      finalize: { tc: ToolCall; args: Record<string, unknown> } | null;
    } = { buttons: null, confirmation: null, dataRequest: null, finalize: null };
    const normalCalls: { tc: ToolCall; args: Record<string, unknown> }[] = [];

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      let toolArgs: Record<string, unknown> = {};
      try { toolArgs = JSON.parse(toolCall.function.arguments || '{}'); } catch { toolArgs = {}; }

      if (toolName === 'show_interactive_buttons') {
        specialCalls.buttons = { tc: toolCall, args: toolArgs };
      } else if (toolName === 'finalizar_entrevista') {
        specialCalls.finalize = { tc: toolCall, args: toolArgs };
      } else if (toolName === 'request_user_data') {
        specialCalls.dataRequest = { tc: toolCall, args: toolArgs };
      } else if (confirmationTools.includes(toolName)) {
        specialCalls.confirmation = { tc: toolCall, args: toolArgs };
      } else {
        normalCalls.push({ tc: toolCall, args: toolArgs });
      }
    }

    // ============================================================
    // FASE 2: Executar TODAS as tools normais primeiro
    // ============================================================
    const toolResults: { id: string; result: string }[] = [];
    for (const { tc, args } of normalCalls) {
      console.log(`Tool call: ${tc.function.name}`, args);
      writer.write(sseEvent({ type: 'tool_start', tool: tc.function.name }));
      const result = await executeTool(supabase, userId, tc.function.name, args);
      toolResults.push({ id: tc.id, result: JSON.stringify(result) });
    }

    // ============================================================
    // FASE 3: Tratar finalizar_entrevista (precisa continuar o loop)
    // ============================================================
    if (specialCalls.finalize) {
      const { tc, args } = specialCalls.finalize;
      const result = await executeTool(supabase, userId, 'finalizar_entrevista', args);
      if (result.success) {
        writer.write(sseEvent({ type: 'interview_complete' }));
      }
      toolResults.push({ id: tc.id, result: JSON.stringify(result) });
    }

    // Push assistant message com TODOS os tool calls + resultados
    workingMessages.push({
      role: 'assistant',
      content: content || '',
      tool_calls: toolCalls,
    });
    for (const tr of toolResults) {
      workingMessages.push({
        role: 'tool',
        tool_call_id: tr.id,
        content: tr.result,
      });
    }

    // Fake tool results para tools especiais que interrompem o loop
    if (specialCalls.buttons) {
      workingMessages.push({
        role: 'tool',
        tool_call_id: specialCalls.buttons.tc.id,
        content: JSON.stringify({ success: true, message: 'Botoes exibidos para o usuario. Aguarde a resposta dele na proxima mensagem.' }),
      });
    }
    if (specialCalls.confirmation) {
      workingMessages.push({
        role: 'tool',
        tool_call_id: specialCalls.confirmation.tc.id,
        content: JSON.stringify({ success: true, message: 'Aguardando confirmacao do usuario.' }),
      });
    }
    if (specialCalls.dataRequest) {
      workingMessages.push({
        role: 'tool',
        tool_call_id: specialCalls.dataRequest.tc.id,
        content: JSON.stringify({ success: true, message: 'Modal de dados exibido para o usuario.' }),
      });
    }

    // ============================================================
    // FASE 4: Emitir eventos especiais e interromper se necessario
    // ============================================================

    // Se tem finalizar_entrevista mas NAO tem buttons/confirmation/dataRequest, continua o loop
    // para o AI gerar a mensagem de despedida
    if (specialCalls.finalize && !specialCalls.buttons && !specialCalls.confirmation && !specialCalls.dataRequest) {
      continue;
    }

    // Confirmation required -> interrompe
    if (specialCalls.confirmation) {
      const { tc, args } = specialCalls.confirmation;
      const { data: pendingAction, error } = await supabase
        .from('app_pending_actions')
        .insert({ user_id: userId, sessao_id: sessionId, action_type: tc.function.name, action_data: args, status: 'pending' })
        .select().single();

      if (error) throw error;

      const previewMessage = options.generateActionPreview
        ? options.generateActionPreview(tc.function.name, args)
        : `Confirma a execucao de ${tc.function.name}?`;
      writer.write(sseEvent({
        type: 'needs_confirmation',
        message: previewMessage,
        pendingAction: { id: pendingAction.id, action_type: tc.function.name, action_data: args, preview_message: previewMessage },
      }));
      return previewMessage;
    }

    // request_user_data -> interrompe
    if (specialCalls.dataRequest) {
      const { args } = specialCalls.dataRequest;
      writer.write(sseEvent({
        type: 'needs_data',
        message: args.context,
        dataRequest: { fields: args.fields, context: args.context },
      }));
      return args.context as string || '';
    }

    // show_interactive_buttons -> interrompe (mas tools normais ja foram executadas!)
    if (specialCalls.buttons) {
      const questionText = (specialCalls.buttons.args.question as string) || '';
      // Usar content da IA se disponivel (pode ter sido suprimido pelo processOpenAIStream quando hasToolCalls=true)
      // Fallback para question do tool args
      const textToShow = content || questionText;

      // Emitir texto como tokens
      if (textToShow) {
        writer.write(sseEvent({ type: 'token', content: textToShow }));
      }

      writer.write(sseEvent({
        type: 'interactive_buttons',
        buttons: specialCalls.buttons.args.buttons,
      }));
      return textToShow;
    }

    // Se so tinha finalizar_entrevista (com outros especiais), continua
    if (specialCalls.finalize) {
      continue;
    }
  }

  if (!fullResponse && iteration >= maxIterations) {
    fullResponse = 'Desculpe, não consegui processar sua solicitação. Tente reformular.';
  }

  return fullResponse;
}
