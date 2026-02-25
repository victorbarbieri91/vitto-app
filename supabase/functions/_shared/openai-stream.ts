// =====================================================
// OPENAI STREAMING PARSER
// =====================================================

import type { ToolCall } from './types.ts';

export async function processOpenAIStream(
  response: Response,
  onToken: (text: string) => void,
): Promise<{ content: string; toolCalls: ToolCall[] | null }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';
  let hasToolCalls = false;
  const toolCallsMap = new Map<number, { id: string; name: string; arguments: string }>();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') continue;

      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.tool_calls) {
          hasToolCalls = true;
          for (const tc of delta.tool_calls) {
            const existing = toolCallsMap.get(tc.index) || { id: '', name: '', arguments: '' };
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.arguments += tc.function.arguments;
            toolCallsMap.set(tc.index, existing);
          }
        }

        // Sempre preservar fullContent (para salvar no DB)
        // So emitir tokens via onToken se NAO ha tool calls em andamento
        if (delta.content) {
          fullContent += delta.content;
          if (!hasToolCalls) {
            onToken(delta.content);
          }
        }
      } catch { /* skip malformed chunks */ }
    }
  }

  const toolCalls = toolCallsMap.size > 0
    ? Array.from(toolCallsMap.values()).map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.arguments },
      }))
    : null;

  return { content: fullContent, toolCalls };
}
