// =====================================================
// CONFIGURACAO COMPARTILHADA
// =====================================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
export const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
export const MODEL = 'gpt-5-mini';
export const EMBEDDING_MODEL = 'text-embedding-3-small';
