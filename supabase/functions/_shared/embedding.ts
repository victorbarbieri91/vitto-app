// =====================================================
// EMBEDDING (OpenAI)
// =====================================================

import { OPENAI_EMBEDDING_URL, EMBEDDING_MODEL } from './config.ts';

export async function generateEmbedding(text: string, retries = 2): Promise<number[] | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) { console.warn('generateEmbedding: OPENAI_API_KEY nao encontrada'); return null; }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(OPENAI_EMBEDDING_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        console.warn(`generateEmbedding: tentativa ${attempt}/${retries} falhou (${resp.status}): ${errText.substring(0, 200)}`);
        if (attempt < retries) { await new Promise(r => setTimeout(r, 500 * attempt)); continue; }
        return null;
      }
      const data = await resp.json();
      const embedding = data.data?.[0]?.embedding || null;
      if (embedding) console.log(`generateEmbedding: sucesso na tentativa ${attempt}`);
      return embedding;
    } catch (e) {
      console.warn(`generateEmbedding: tentativa ${attempt}/${retries} excecao:`, (e as Error).message || e);
      if (attempt < retries) { await new Promise(r => setTimeout(r, 500 * attempt)); continue; }
      return null;
    }
  }
  return null;
}
