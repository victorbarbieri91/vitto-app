// =====================================================
// PERSISTENCIA DE MENSAGENS
// =====================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { ChatMessage } from './types.ts';

export async function saveMessage(
  supabase: SupabaseClient,
  sessionId: string,
  role: string,
  content: string,
): Promise<string | null> {
  const { data, error } = await supabase.from('app_chat_mensagens').insert({
    sessao_id: sessionId,
    role,
    content,
    metadata: {},
  }).select('id').single();

  if (error) {
    console.error('Erro ao salvar mensagem:', error);
    return null;
  }
  return data?.id || null;
}

export async function loadSessionHistory(
  supabase: SupabaseClient,
  sessionId: string,
  limit: number = 10,
): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('app_chat_mensagens')
      .select('role, content')
      .eq('sessao_id', sessionId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return [];

    return data.reverse().map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  } catch (e) {
    console.error('Erro ao carregar historico:', e);
    return [];
  }
}

export function embedMessageAsync(
  messageId: string,
  content: string,
): void {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey || !messageId) return;

  fetch(`${supabaseUrl}/functions/v1/embed-and-save`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: content,
      table: 'app_chat_mensagens',
      id: messageId,
      column: 'embedding',
    }),
  }).catch(e => console.error('Async embed error:', e));
}
