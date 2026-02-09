import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// =====================================================
// TIPOS
// =====================================================

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;
  };
}

interface RAGResult {
  source: string;
  content: string;
  title: string;
  category: string;
  weighted_score: number;
}

interface DataRequest {
  fields: FieldDefinition[];
  context: string;
}

interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'currency';
  required: boolean;
  options?: { value: string; label: string }[];
}

// =====================================================
// CONFIGURACAO
// =====================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const MODEL = 'gpt-5-mini';
const EMBEDDING_MODEL = 'text-embedding-3-small';

// =====================================================
// TOOL DEFINITIONS (21 tools - v18 com update_user_profile)
// =====================================================

const ALL_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'query_saldo',
      description: 'Consulta saldo detalhado. Use para obter saldos atualizados ou de conta especifica.',
      parameters: {
        type: 'object',
        properties: {
          conta_id: { type: 'number', description: 'ID da conta especifica (opcional)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_transacoes',
      description: 'Consulta transacoes com filtros. Pode filtrar por tipo, categoria, conta, cartao, mes e status.',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['receita', 'despesa', 'despesa_cartao', 'todos'], description: 'Tipo da transacao' },
          categoria_id: { type: 'number', description: 'ID da categoria' },
          conta_id: { type: 'number', description: 'ID da conta bancaria' },
          cartao_id: { type: 'number', description: 'ID do cartao de credito' },
          mes: { type: 'number', description: 'Mes (1-12)' },
          ano: { type: 'number', description: 'Ano' },
          status: { type: 'string', enum: ['pendente', 'confirmado', 'cancelado', 'todos'], description: 'Status da transacao' },
          limit: { type: 'number', description: 'Limite de resultados (default: 20)' },
          busca: { type: 'string', description: 'Texto para buscar na descricao' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_categorias',
      description: 'Lista categorias disponiveis para receitas ou despesas.',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['receita', 'despesa', 'todos'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_contas',
      description: 'Lista todas as contas bancarias do usuario com saldos.',
      parameters: {
        type: 'object',
        properties: {
          apenas_ativas: { type: 'boolean' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_metas',
      description: 'Lista metas financeiras com progresso.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_orcamentos',
      description: 'Lista orcamentos do mes com valores gastos.',
      parameters: {
        type: 'object',
        properties: {
          mes: { type: 'number' },
          ano: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analise_gastos',
      description: 'Analisa gastos por categoria no periodo. Retorna totais e percentuais.',
      parameters: {
        type: 'object',
        properties: {
          mes: { type: 'number' },
          ano: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'analise_evolucao',
      description: 'Analisa evolucao financeira ao longo dos meses.',
      parameters: {
        type: 'object',
        properties: {
          meses: { type: 'number', description: 'Quantidade de meses para analisar (default: 6)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_transacoes_recorrentes',
      description: 'Lista transacoes fixas/recorrentes (salario, aluguel, etc).',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_cartoes',
      description: 'Lista cartoes de credito com limites, fatura atual aberta e total de despesas do mes.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_fatura',
      description: 'Consulta uma fatura especifica com todas as transacoes.',
      parameters: {
        type: 'object',
        properties: {
          cartao_id: { type: 'number', description: 'ID do cartao' },
          mes: { type: 'number', description: 'Mes da fatura (1-12)' },
          ano: { type: 'number', description: 'Ano da fatura' }
        },
        required: ['cartao_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_indicadores',
      description: 'Consulta indicadores financeiros calculados: score de saude, taxa de economia, burn rate, tendencias.',
      parameters: {
        type: 'object',
        properties: {
          mes: { type: 'number' },
          ano: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_patrimonio',
      description: 'Lista ativos patrimoniais: investimentos, imoveis, veiculos, etc.',
      parameters: {
        type: 'object',
        properties: {
          categoria: { type: 'string', enum: ['liquidez', 'renda_fixa', 'renda_variavel', 'cripto', 'imoveis', 'veiculos', 'previdencia', 'outros', 'todos'] }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: 'Salva uma informacao importante sobre o usuario para lembrar no futuro.',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['preferencia', 'objetivo', 'padrao', 'insight', 'lembrete'] },
          conteudo: { type: 'string', description: 'O que deve ser lembrado' }
        },
        required: ['tipo', 'conteudo']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_transaction',
      description: 'Cria transacao (receita ou despesa em conta BANCARIA). REQUER CONFIRMACAO.',
      parameters: {
        type: 'object',
        properties: {
          descricao: { type: 'string' },
          valor: { type: 'number' },
          tipo: { type: 'string', enum: ['receita', 'despesa'] },
          categoria_id: { type: 'number' },
          conta_id: { type: 'number' },
          data: { type: 'string', description: 'YYYY-MM-DD' },
          observacoes: { type: 'string' }
        },
        required: ['descricao', 'valor', 'tipo', 'categoria_id', 'conta_id', 'data']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_transaction_cartao',
      description: 'Cria despesa no cartao de credito. Use quando o usuario mencionar cartao, credito, parcelado. REQUER CONFIRMACAO.',
      parameters: {
        type: 'object',
        properties: {
          descricao: { type: 'string' },
          valor: { type: 'number' },
          categoria_id: { type: 'number' },
          cartao_id: { type: 'number' },
          data: { type: 'string', description: 'YYYY-MM-DD' },
          parcelas: { type: 'number', description: 'Numero de parcelas (1 = a vista)' },
          observacoes: { type: 'string' }
        },
        required: ['descricao', 'valor', 'categoria_id', 'cartao_id', 'data']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_transaction',
      description: 'Atualiza transacao existente. REQUER CONFIRMACAO.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          descricao: { type: 'string' },
          valor: { type: 'number' },
          categoria_id: { type: 'number' },
          data: { type: 'string' },
          observacoes: { type: 'string' }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_transaction',
      description: 'Remove transacao. REQUER CONFIRMACAO.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        },
        required: ['id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'pagar_fatura',
      description: 'Marca uma fatura como paga. REQUER CONFIRMACAO.',
      parameters: {
        type: 'object',
        properties: {
          fatura_id: { type: 'number' },
          conta_id: { type: 'number', description: 'Conta de onde saira o pagamento' },
          data_pagamento: { type: 'string', description: 'YYYY-MM-DD' }
        },
        required: ['fatura_id', 'conta_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'request_user_data',
      description: 'Solicita dados via modal quando informacoes estao faltando.',
      parameters: {
        type: 'object',
        properties: {
          context: { type: 'string' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                label: { type: 'string' },
                type: { type: 'string', enum: ['text', 'number', 'date', 'select', 'currency'] },
                required: { type: 'boolean' },
                options: { type: 'array', items: { type: 'object', properties: { value: { type: 'string' }, label: { type: 'string' } } } }
              }
            }
          }
        },
        required: ['context', 'fields']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_user_profile',
      description: 'Atualiza informacoes permanentes do usuario (preferencias, objetivos, perfil financeiro). Use para dados que devem persistir entre conversas. Diferente de save_memory (temporario), este eh o perfil permanente.',
      parameters: {
        type: 'object',
        properties: {
          field: { type: 'string', description: 'Campo a atualizar (ex: objetivo_principal, perfil_investidor, preferencia_notificacao, salario_liquido, dia_pagamento, etc)' },
          value: { description: 'Valor do campo (string, numero ou objeto)' },
          action: { type: 'string', enum: ['set', 'delete'], description: 'set para definir/atualizar, delete para remover (default: set)' }
        },
        required: ['field', 'value']
      }
    }
  }
];

const CONFIRMATION_REQUIRED_TOOLS = [
  'create_transaction', 'create_transaction_cartao', 'update_transaction',
  'delete_transaction', 'pagar_fatura'
];

// Roteamento de tools removido - o agente GPT-5-mini recebe ALL_TOOLS
// e escolhe sozinho quais usar baseado na intencao do usuario

// =====================================================
// EMBEDDING (direto via OpenAI - sem hop extra)
// =====================================================

async function generateEmbedding(text: string, retries = 2): Promise<number[] | null> {
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
      console.warn(`generateEmbedding: tentativa ${attempt}/${retries} excecao:`, e.message || e);
      if (attempt < retries) { await new Promise(r => setTimeout(r, 500 * attempt)); continue; }
      return null;
    }
  }
  return null;
}

// =====================================================
// RAG SEARCH (apenas memorias do usuario - Layer 3)
// Knowledge Base agora eh carregado via SQL direto (Layer 1)
// Historico de sessao eh carregado via loadSessionHistory (Layer 2)
// =====================================================

async function ragSearchMemories(
  supabase: SupabaseClient,
  embedding: number[],
  userId: string,
): Promise<RAGResult[]> {
  try {
    const { data, error } = await supabase.rpc('rag_search_by_source', {
      query_embedding: embedding,
      p_source: 'memory',
      p_user_id: userId,
      p_match_threshold: 0.5,
      p_max_results: 5,
    });

    if (error) {
      console.error('RAG memory error:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('RAG memory exception:', e);
    return [];
  }
}

// =====================================================
// LAYER 1: KNOWLEDGE BASE (SQL direto, 100% confiavel)
// =====================================================

async function loadKnowledgeBase(supabase: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('app_knowledge_base')
      .select('titulo, conteudo, categoria')
      .eq('ativo', true)
      .order('categoria');

    if (error || !data || data.length === 0) {
      console.warn('loadKnowledgeBase: nenhuma regra encontrada');
      return '';
    }

    console.log(`loadKnowledgeBase: ${data.length} regras carregadas`);

    // Agrupar por categoria para melhor organizacao
    const byCategory: Record<string, string[]> = {};
    for (const rule of data) {
      const cat = rule.categoria || 'geral';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(`- **${rule.titulo}**: ${rule.conteudo}`);
    }

    let block = '';
    for (const [cat, rules] of Object.entries(byCategory)) {
      block += `\n[${cat}]\n${rules.join('\n')}`;
    }

    return block;
  } catch (e) {
    console.error('loadKnowledgeBase error:', e);
    return '';
  }
}

// =====================================================
// LAYER 4: USER PROFILE (SQL direto, 100% confiavel)
// =====================================================

interface UserProfile {
  nome: string;
  receita_mensal: number | null;
  meta_despesa: number | null;
  ai_context: Record<string, unknown>;
}

async function loadUserProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('app_perfil')
      .select('nome, receita_mensal_estimada, meta_despesa_percentual, ai_context')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('loadUserProfile: perfil nao encontrado');
      return { nome: 'Usuario', receita_mensal: null, meta_despesa: null, ai_context: {} };
    }

    return {
      nome: data.nome || 'Usuario',
      receita_mensal: data.receita_mensal_estimada,
      meta_despesa: data.meta_despesa_percentual,
      ai_context: data.ai_context || {},
    };
  } catch (e) {
    console.error('loadUserProfile error:', e);
    return { nome: 'Usuario', receita_mensal: null, meta_despesa: null, ai_context: {} };
  }
}

// =====================================================
// SYSTEM PROMPT (4 camadas: knowledge + profile + memories + instrucoes)
// =====================================================

function buildSystemPrompt(
  userProfile: UserProfile,
  knowledgeBlock: string,
  memoryResults: RAGResult[],
): string {
  const now = new Date();
  const dataAtual = now.toLocaleDateString('pt-BR');
  const mesAtual = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // === LAYER 4: User Profile ===
  let profileBlock = '';
  if (userProfile.receita_mensal) {
    profileBlock += `\n- Receita mensal estimada: R$ ${userProfile.receita_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  if (userProfile.meta_despesa) {
    profileBlock += `\n- Meta de despesas: ${userProfile.meta_despesa}% da receita`;
  }
  const ctx = userProfile.ai_context;
  if (ctx && Object.keys(ctx).length > 0) {
    for (const [key, value] of Object.entries(ctx)) {
      profileBlock += `\n- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`;
    }
  }

  // === LAYER 3: Memorias (RAG, bonus) ===
  let memoryBlock = '';
  if (memoryResults.length > 0) {
    memoryBlock = '\n\n### Memorias do usuario:\n';
    memoryBlock += memoryResults.map(m => `- [${m.category}] ${m.content}`).join('\n');
  }

  return `Voce eh o Vitto, assistente financeiro pessoal inteligente e amigavel.
Data atual: ${dataAtual} (${mesAtual}). Usuario: ${userProfile.nome}.

INSTRUCOES:
1. Use o CONTEXTO abaixo para responder com precisao
2. NUNCA invente dados financeiros - so use dados das tools ou do contexto
3. Se faltar informacao, use as tools disponiveis para consultar
4. Para acoes destrutivas (criar/editar/excluir transacoes), SEMPRE confirme antes
5. Responda em portugues brasileiro, conciso e amigavel
6. Formate valores em R$ (ex: R$ 1.234,56) e datas em DD/MM/AAAA
7. Use markdown para formatacao: **negrito** para valores, listas para multiplos itens
8. Se o usuario quiser criar conta, orcamento, meta ou cartao, oriente a usar as abas do app
9. Use save_memory para informacoes temporais/pontuais. Use update_user_profile para informacoes permanentes (preferencias, objetivos, perfil financeiro)
10. IMPORTANTE - COLETA DE DADOS VIA MODAL: Quando precisar de QUALQUER informacao que o usuario nao forneceu (cartao, mes, conta, valor, tipo, etc), SEMPRE use a tool request_user_data para coletar via modal interativo. NUNCA faca perguntas no texto da conversa. O modal eh mais rapido e engajante para o usuario. Exemplos: se o usuario pedir despesas do cartao sem dizer qual, use request_user_data com um campo select listando os cartoes. Se pedir para criar transacao sem dados, use request_user_data com os campos necessarios.
11. Para consultas de despesas de cartao de credito em um mes especifico, prefira query_fatura (que inclui transacoes fixas e parceladas) em vez de query_transacoes

### Perfil do usuario:${profileBlock || '\nNenhum dado de perfil.'}

### Regras e conhecimento do sistema:${knowledgeBlock || '\nNenhuma regra encontrada.'}${memoryBlock}`;
}

// =====================================================
// TOOL EXECUTOR (preservado integralmente do v7)
// =====================================================

async function executeTool(
  supabase: SupabaseClient,
  userId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    switch (toolName) {
      case 'query_saldo': {
        if (args.conta_id) {
          const { data, error } = await supabase.from('app_conta').select('id, nome, saldo_atual, moeda, tipo').eq('user_id', userId).eq('id', args.conta_id).single();
          if (error) throw error;
          return { success: true, data };
        } else {
          const { data, error } = await supabase.from('app_conta').select('id, nome, saldo_atual, moeda, tipo').eq('user_id', userId).or('status.eq.ativa,status.eq.ativo');
          if (error) throw error;
          const saldoTotal = data?.reduce((sum, c) => sum + (Number(c.saldo_atual) || 0), 0) || 0;
          return { success: true, data: { saldo_total: saldoTotal, contas: data } };
        }
      }

      case 'query_transacoes': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1;
        const ano = args.ano || now.getFullYear();
        const limit = args.limit || 20;
        let query = supabase.from('app_transacoes').select('id, descricao, valor, tipo, data, status, observacoes, parcela_atual, total_parcelas, categoria:app_categoria(id, nome, cor), conta:app_conta(id, nome), cartao:app_cartao_credito(id, nome)').eq('user_id', userId).order('data', { ascending: false }).limit(limit as number);
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const endDate = new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0];
        query = query.gte('data', startDate).lte('data', endDate);
        if (args.tipo && args.tipo !== 'todos') query = query.eq('tipo', args.tipo);
        if (args.categoria_id) query = query.eq('categoria_id', args.categoria_id);
        if (args.conta_id) query = query.eq('conta_id', args.conta_id);
        if (args.cartao_id) query = query.eq('cartao_id', args.cartao_id);
        if (args.status && args.status !== 'todos') query = query.eq('status', args.status);
        if (args.busca) query = query.ilike('descricao', `%${args.busca}%`);
        const { data, error } = await query;
        if (error) throw error;
        const total = data?.reduce((sum, t) => sum + Number(t.valor), 0) || 0;
        return { success: true, data: { transacoes: data, total, quantidade: data?.length || 0 } };
      }

      case 'query_categorias': {
        let query = supabase.from('app_categoria').select('id, nome, tipo, cor, icone').or(`user_id.eq.${userId},user_id.is.null`);
        if (args.tipo && args.tipo !== 'todos') query = query.or(`tipo.eq.${args.tipo},tipo.eq.ambos`);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data };
      }

      case 'query_contas': {
        let query = supabase.from('app_conta').select('id, nome, tipo, saldo_atual, moeda, instituicao, cor').eq('user_id', userId);
        if (args.apenas_ativas) query = query.or('status.eq.ativa,status.eq.ativo');
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data };
      }

      case 'query_metas': {
        const { data, error } = await supabase.from('app_meta_financeira').select('id, titulo, descricao, valor_meta, valor_atual, data_inicio, data_fim, cor').eq('user_id', userId);
        if (error) throw error;
        const metasComProgresso = data?.map(m => ({ ...m, percentual: m.valor_meta > 0 ? Math.round((m.valor_atual / m.valor_meta) * 100) : 0 }));
        return { success: true, data: metasComProgresso };
      }

      case 'query_orcamentos': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1;
        const ano = args.ano || now.getFullYear();
        const { data: orcamentos, error } = await supabase.from('app_orcamento').select('id, valor, mes, ano, categoria:app_categoria(id, nome, cor)').eq('user_id', userId).eq('mes', mes).eq('ano', ano);
        if (error) throw error;
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const endDate = new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0];
        const { data: gastos } = await supabase.from('app_transacoes').select('categoria_id, valor').eq('user_id', userId).in('tipo', ['despesa', 'despesa_cartao']).gte('data', startDate).lte('data', endDate);
        const gastosPorCat: Record<number, number> = {};
        (gastos || []).forEach(g => { gastosPorCat[g.categoria_id] = (gastosPorCat[g.categoria_id] || 0) + Number(g.valor); });
        const orcamentosComGastos = (orcamentos || []).map(o => ({ ...o, gasto: gastosPorCat[(o.categoria as any)?.id] || 0, percentual_usado: o.valor > 0 ? Math.round((gastosPorCat[(o.categoria as any)?.id] || 0) / o.valor * 100) : 0 }));
        return { success: true, data: orcamentosComGastos };
      }

      case 'analise_gastos': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1;
        const ano = args.ano || now.getFullYear();
        const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
        const endDate = new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0];
        const { data, error } = await supabase.from('app_transacoes').select('valor, tipo, categoria:app_categoria(id, nome, cor)').eq('user_id', userId).in('tipo', ['despesa', 'despesa_cartao']).gte('data', startDate).lte('data', endDate);
        if (error) throw error;
        const porCategoria: Record<string, { nome: string; total: number; cor: string }> = {};
        let totalGeral = 0;
        data?.forEach(t => { const cat = t.categoria as { id: number; nome: string; cor: string }; if (!porCategoria[cat.id]) porCategoria[cat.id] = { nome: cat.nome, total: 0, cor: cat.cor }; porCategoria[cat.id].total += Number(t.valor); totalGeral += Number(t.valor); });
        const analise = Object.values(porCategoria).map(c => ({ ...c, percentual: totalGeral > 0 ? Math.round((c.total / totalGeral) * 100) : 0 })).sort((a, b) => b.total - a.total);
        return { success: true, data: { total: totalGeral, por_categoria: analise, mes, ano } };
      }

      case 'analise_evolucao': {
        const mesesAnalisar = Number(args.meses) || 6;
        const resultados = [];
        const now = new Date();
        for (let i = 0; i < mesesAnalisar; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mes = d.getMonth() + 1; const ano = d.getFullYear();
          const startDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
          const endDate = new Date(ano, mes, 0).toISOString().split('T')[0];
          const { data } = await supabase.from('app_transacoes').select('valor, tipo').eq('user_id', userId).gte('data', startDate).lte('data', endDate);
          const receitas = (data || []).filter(t => t.tipo === 'receita').reduce((s, t) => s + Number(t.valor), 0);
          const despesas = (data || []).filter(t => t.tipo === 'despesa' || t.tipo === 'despesa_cartao').reduce((s, t) => s + Number(t.valor), 0);
          resultados.push({ mes: d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }), receitas, despesas, saldo: receitas - despesas });
        }
        return { success: true, data: resultados.reverse() };
      }

      case 'query_transacoes_recorrentes': {
        const { data, error } = await supabase.from('app_transacoes_fixas').select('id, descricao, valor, tipo, dia_mes, ativo, categoria:app_categoria(id, nome, cor), conta:app_conta(id, nome), cartao:app_cartao_credito(id, nome)').eq('user_id', userId);
        if (error) throw error;
        return { success: true, data };
      }

      case 'query_cartoes': {
        const now = new Date();
        const mesAtual = now.getMonth() + 1; const anoAtual = now.getFullYear();
        const startDate = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
        const endDate = new Date(anoAtual, mesAtual, 0).toISOString().split('T')[0];
        const { data: cartoes, error } = await supabase.from('app_cartao_credito').select('id, nome, limite, dia_fechamento, dia_vencimento, cor, ultimos_quatro_digitos').eq('user_id', userId);
        if (error) throw error;
        const cartoesComFatura = [];
        for (const cartao of (cartoes || [])) {
          const { data: despesas } = await supabase.from('app_transacoes').select('valor').eq('user_id', userId).eq('cartao_id', cartao.id).gte('data', startDate).lte('data', endDate);
          const totalDespesas = (despesas || []).reduce((sum, t) => sum + Number(t.valor), 0);
          const { data: fatura } = await supabase.from('app_fatura').select('id, mes, ano, valor_total, status, data_vencimento').eq('cartao_id', cartao.id).eq('mes', mesAtual).eq('ano', anoAtual).single();
          cartoesComFatura.push({ ...cartao, limite_disponivel: cartao.limite - totalDespesas, despesas_mes_atual: totalDespesas, fatura_atual: fatura || null });
        }
        return { success: true, data: cartoesComFatura };
      }

      case 'query_fatura': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1; const ano = args.ano || now.getFullYear();
        const { data: cartao } = await supabase.from('app_cartao_credito').select('nome, dia_fechamento').eq('id', args.cartao_id).single();
        const { data: fatura } = await supabase.from('app_fatura').select('id, cartao_id, mes, ano, valor_total, status, data_vencimento, data_pagamento').eq('cartao_id', args.cartao_id).eq('mes', mes).eq('ano', ano).single();

        if (fatura?.id) {
          // Usar RPCs do banco que combinam transacoes reais + fixas (mesma logica do frontend)
          const [transResult, totalResult] = await Promise.all([
            supabase.rpc('obter_transacoes_fatura', { p_fatura_id: fatura.id }),
            supabase.rpc('calcular_valor_total_fatura', { p_fatura_id: fatura.id }),
          ]);
          const transacoes = transResult.data || [];
          const total = totalResult.data || 0;
          const parceladas = transacoes.filter((t: any) => t.total_parcelas && t.total_parcelas > 1).length;
          const fixas = transacoes.filter((t: any) => t.is_fixed).length;
          const avista = transacoes.length - parceladas - fixas;
          console.log(`query_fatura: RPC retornou ${transacoes.length} transacoes (${parceladas} parceladas, ${fixas} fixas, ${avista} avista), total R$ ${total}`);
          return { success: true, data: { cartao: cartao?.nome, fatura: { ...fatura, valor_total: total }, transacoes, total, quantidade: transacoes.length, resumo: { parceladas, fixas, avista } } };
        }

        // Fallback: fatura nao existe no banco - query manual
        const diaFechamento = cartao?.dia_fechamento || 1;
        const mesNum = Number(mes); const anoNum = Number(ano);
        const fimCiclo = new Date(anoNum, mesNum - 1, diaFechamento);
        const inicioCiclo = new Date(anoNum, mesNum - 2, diaFechamento + 1);
        const startDate = inicioCiclo.toISOString().split('T')[0];
        const endDate = fimCiclo.toISOString().split('T')[0];
        console.log(`query_fatura: fallback manual ciclo ${startDate} a ${endDate}`);
        const { data: transacoes, error } = await supabase.from('app_transacoes').select('id, descricao, valor, data, status, parcela_atual, total_parcelas, categoria:app_categoria(id, nome, cor)').eq('user_id', userId).eq('cartao_id', args.cartao_id).gte('data', startDate).lte('data', endDate).order('data', { ascending: false });
        if (error) throw error;
        const total = (transacoes || []).reduce((sum, t) => sum + Number(t.valor), 0);
        return { success: true, data: { cartao: cartao?.nome, fatura: { mes, ano, status: 'aberta', valor_total: total }, transacoes, total, quantidade: transacoes?.length || 0 } };
      }

      case 'query_indicadores': {
        const now = new Date();
        const mes = args.mes || now.getMonth() + 1; const ano = args.ano || now.getFullYear();
        const { data, error } = await supabase.from('app_indicadores').select('*').eq('user_id', userId).eq('mes', mes).eq('ano', ano).is('conta_id', null).single();
        if (error && error.code !== 'PGRST116') throw error;
        return { success: true, data: data || { mensagem: 'Indicadores nao disponiveis para este periodo' } };
      }

      case 'query_patrimonio': {
        let query = supabase.from('app_patrimonio_ativo').select('id, nome, categoria, subcategoria, valor_atual, valor_aquisicao, data_aquisicao, instituicao, observacoes, ativo, dados_especificos').eq('user_id', userId).eq('ativo', true);
        if (args.categoria && args.categoria !== 'todos') query = query.eq('categoria', args.categoria);
        const { data, error } = await query;
        if (error) throw error;
        const totaisPorCategoria: Record<string, number> = {};
        let totalGeral = 0;
        (data || []).forEach(ativo => { totaisPorCategoria[ativo.categoria] = (totaisPorCategoria[ativo.categoria] || 0) + Number(ativo.valor_atual); totalGeral += Number(ativo.valor_atual); });
        return { success: true, data: { ativos: data, total_geral: totalGeral, totais_por_categoria: totaisPorCategoria, quantidade: data?.length || 0 } };
      }

      case 'save_memory': {
        const scoreByType: Record<string, number> = {
          preferencia: 0.8,
          objetivo: 0.9,
          padrao: 0.7,
          insight: 0.6,
          lembrete: 0.85,
        };

        let embedding = null;
        try {
          embedding = await generateEmbedding(`[${args.tipo}] ${args.conteudo}`);
        } catch (e) {
          console.error('Erro ao gerar embedding para memoria:', e);
        }
        const insertData: any = {
          usuario_id: userId,
          tipo_conteudo: args.tipo,
          conteudo: args.conteudo,
          ativo: true,
          relevancia_score: scoreByType[args.tipo as string] || 0.5,
        };
        if (embedding) insertData.embedding = embedding;
        const { error } = await supabase.from('app_memoria_ia').insert(insertData);
        if (error) throw error;
        return { success: true, data: { saved: true, message: 'Memoria salva com sucesso' } };
      }

      case 'create_transaction': {
        const { data, error } = await supabase.from('app_transacoes').insert({ user_id: userId, descricao: args.descricao, valor: args.valor, tipo: args.tipo, categoria_id: args.categoria_id, conta_id: args.conta_id, data: args.data, observacoes: args.observacoes || null, status: 'confirmado' }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_transaction_cartao': {
        const parcelas = Number(args.parcelas) || 1;
        const valorParcela = Number(args.valor) / parcelas;
        const grupoParcelamento = parcelas > 1 ? crypto.randomUUID() : null;
        const transacoes = [];
        for (let i = 0; i < parcelas; i++) {
          const dataBase = new Date(args.data as string);
          dataBase.setMonth(dataBase.getMonth() + i);
          transacoes.push({ user_id: userId, descricao: parcelas > 1 ? `${args.descricao} (${i+1}/${parcelas})` : args.descricao, valor: valorParcela, tipo: 'despesa_cartao', categoria_id: args.categoria_id, cartao_id: args.cartao_id, data: dataBase.toISOString().split('T')[0], observacoes: args.observacoes || null, status: 'confirmado', parcela_atual: parcelas > 1 ? i + 1 : null, total_parcelas: parcelas > 1 ? parcelas : null, grupo_parcelamento: grupoParcelamento });
        }
        const { data, error } = await supabase.from('app_transacoes').insert(transacoes).select();
        if (error) throw error;
        return { success: true, data: { criadas: data?.length || 0, transacoes: data } };
      }

      case 'update_transaction': {
        const { id, ...updates } = args;
        const { data, error } = await supabase.from('app_transacoes').update(updates).eq('id', id).eq('user_id', userId).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'delete_transaction': {
        const { error } = await supabase.from('app_transacoes').delete().eq('id', args.id).eq('user_id', userId);
        if (error) throw error;
        return { success: true, data: { deleted: true, id: args.id } };
      }

      case 'pagar_fatura': {
        const { data: fatura, error: faturaError } = await supabase.from('app_fatura').select('id, cartao_id, valor_total, mes, ano').eq('id', args.fatura_id).single();
        if (faturaError) throw faturaError;
        const dataPagamento = args.data_pagamento || new Date().toISOString().split('T')[0];
        const { error: updateError } = await supabase.from('app_fatura').update({ status: 'paga', data_pagamento: dataPagamento }).eq('id', args.fatura_id);
        if (updateError) throw updateError;
        const { error: transError } = await supabase.from('app_transacoes').insert({ user_id: userId, descricao: `Pagamento de fatura ${fatura.mes}/${fatura.ano}`, valor: fatura.valor_total, tipo: 'despesa', categoria_id: 22, conta_id: args.conta_id, data: dataPagamento, status: 'confirmado' });
        if (transError) throw transError;
        return { success: true, data: { pago: true, valor: fatura.valor_total } };
      }

      case 'update_user_profile': {
        const field = args.field as string;
        const value = args.value;
        const action = (args.action as string) || 'set';

        // Buscar ai_context atual
        const { data: perfil, error: perfilError } = await supabase
          .from('app_perfil')
          .select('ai_context')
          .eq('id', userId)
          .single();
        if (perfilError) throw perfilError;

        const currentContext = perfil?.ai_context || {};

        if (action === 'delete') {
          delete currentContext[field];
        } else {
          currentContext[field] = value;
        }

        const { error: updateError } = await supabase
          .from('app_perfil')
          .update({ ai_context: currentContext })
          .eq('id', userId);
        if (updateError) throw updateError;

        console.log(`update_user_profile: ${action} field "${field}"`);
        return { success: true, data: { updated: true, field, action } };
      }

      case 'create_goal':
      case 'create_budget':
      case 'create_conta':
      case 'create_cartao':
        return { success: false, error: 'Para uma melhor experiencia, faca isso diretamente na aba correspondente do app Vitto!' };

      default:
        return { success: false, error: `Tool desconhecida: ${toolName}` };
    }
  } catch (error) {
    console.error(`Erro ao executar tool ${toolName}:`, error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// HELPERS (preservados)
// =====================================================

function generateActionPreview(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case 'create_transaction':
      return `Vou criar uma ${args.tipo === 'receita' ? 'receita' : 'despesa'} de **R$ ${Number(args.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**:\n\n\ud83d\udcdd **Descricao:** ${args.descricao}\n\ud83d\udcc5 **Data:** ${formatDate(args.data as string)}\n\nConfirma esta operacao?`;
    case 'create_transaction_cartao': {
      const parcelas = Number(args.parcelas) || 1;
      return `Vou criar uma despesa no cartao de **R$ ${Number(args.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**${parcelas > 1 ? ` em **${parcelas}x**` : ''}:\n\n\ud83d\udcb3 **Descricao:** ${args.descricao}\n\ud83d\udcc5 **Data:** ${formatDate(args.data as string)}\n\nConfirma esta operacao?`;
    }
    case 'update_transaction':
      return `Vou atualizar a transacao #${args.id}:\n\n${Object.entries(args).filter(([key]) => key !== 'id').map(([key, value]) => `**${key}:** ${value}`).join('\n')}\n\nConfirma?`;
    case 'delete_transaction':
      return `\u26a0\ufe0f Vou remover a transacao #${args.id}.\n\n**Esta acao nao pode ser desfeita.**\n\nConfirma a exclusao?`;
    case 'pagar_fatura':
      return `Vou marcar a fatura como paga e debitar da conta selecionada.\n\nConfirma o pagamento?`;
    default:
      return `Confirma a execucao de ${toolName}?`;
  }
}

function generateSuccessMessage(actionType: string, args: Record<string, unknown>): string {
  switch (actionType) {
    case 'create_transaction':
      return `\u2705 Pronto! ${args.tipo === 'receita' ? 'Receita' : 'Despesa'} de **R$ ${Number(args.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** registrada com sucesso!`;
    case 'create_transaction_cartao':
      return `\u2705 Pronto! Despesa no cartao de **R$ ${Number(args.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** registrada com sucesso!`;
    case 'update_transaction':
      return '\u2705 Transacao atualizada com sucesso!';
    case 'delete_transaction':
      return '\u2705 Transacao removida com sucesso!';
    case 'pagar_fatura':
      return '\u2705 Fatura paga com sucesso!';
    default:
      return '\u2705 Operacao realizada com sucesso!';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// =====================================================
// OPENAI STREAMING
// =====================================================

async function processOpenAIStream(
  response: Response,
  onToken: (text: string) => void,
): Promise<{ content: string; toolCalls: ToolCall[] | null }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';
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

        if (delta.content) {
          fullContent += delta.content;
          onToken(delta.content);
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const existing = toolCallsMap.get(tc.index) || { id: '', name: '', arguments: '' };
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.arguments += tc.function.arguments;
            toolCallsMap.set(tc.index, existing);
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

// =====================================================
// PROCESS CONFIRMED ACTION (preservado)
// =====================================================

async function processConfirmedAction(
  supabase: SupabaseClient,
  actionId: string,
  confirmed: boolean,
  userId: string,
): Promise<{ type: string; message?: string; error?: string }> {
  const { data: action, error } = await supabase
    .from('app_pending_actions').select('*')
    .eq('id', actionId).eq('user_id', userId).eq('status', 'pending').single();

  if (error || !action) {
    return { type: 'error', error: 'Acao nao encontrada ou ja processada.' };
  }

  if (new Date(action.expires_at) < new Date()) {
    await supabase.from('app_pending_actions').update({ status: 'expired' }).eq('id', actionId);
    return { type: 'error', error: 'Esta acao expirou. Por favor, solicite novamente.' };
  }

  if (!confirmed) {
    await supabase.from('app_pending_actions').update({ status: 'rejected' }).eq('id', actionId);
    return { type: 'complete', message: 'Operacao cancelada. Como posso ajudar?' };
  }

  const result = await executeTool(supabase, userId, action.action_type, action.action_data);
  await supabase.from('app_pending_actions').update({ status: 'confirmed' }).eq('id', actionId);

  if (result.success) {
    return { type: 'complete', message: generateSuccessMessage(action.action_type, action.action_data) };
  }
  return { type: 'error', error: result.error || 'Erro ao executar a operacao.' };
}

// =====================================================
// PERSISTENCIA DE MENSAGENS
// =====================================================

async function saveMessage(
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

async function loadSessionHistory(
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

    // Reverter para ordem cronológica e converter para ChatMessage
    return data.reverse().map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
  } catch (e) {
    console.error('Erro ao carregar historico:', e);
    return [];
  }
}

function embedMessageAsync(
  messageId: string,
  content: string,
): void {
  // Fire-and-forget: gera embedding e salva via embed-and-save
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

// =====================================================
// SSE HELPERS
// =====================================================

function sseEvent(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

// =====================================================
// STREAMING AGENT LOOP
// =====================================================

async function streamingAgentLoop(
  supabase: SupabaseClient,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  userId: string,
  userMessage: string,
  sessionId: string,
  tools: Tool[],
  systemPrompt: string,
  history: ChatMessage[] = [],
  maxIterations: number = 8,
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY nao configurada');

  // Mensagens de trabalho: historico da sessao + mensagem atual
  const workingMessages: ChatMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];
  console.log(`Agent loop: ${history.length} mensagens de historico + mensagem atual`);

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

    // Processar stream do OpenAI
    const { content, toolCalls } = await processOpenAIStream(
      openaiResponse,
      (token) => {
        // Encaminhar cada token para o cliente via SSE
        writer.write(sseEvent({ type: 'token', content: token }));
      },
    );

    // Se nao tem tool calls, resposta completa
    if (!toolCalls || toolCalls.length === 0) {
      fullResponse = content;
      break;
    }

    // PRIMEIRO: verificar se alguma tool requer confirmacao ou request_user_data
    // (essas interrompem o fluxo)
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      let toolArgs: Record<string, unknown> = {};
      try {
        toolArgs = JSON.parse(toolCall.function.arguments || '{}');
      } catch {
        toolArgs = {};
      }

      // Acao que requer confirmacao -> interromper stream
      if (CONFIRMATION_REQUIRED_TOOLS.includes(toolName)) {
        const { data: pendingAction, error } = await supabase
          .from('app_pending_actions')
          .insert({
            user_id: userId,
            sessao_id: sessionId,
            action_type: toolName,
            action_data: toolArgs,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        const previewMessage = generateActionPreview(toolName, toolArgs);

        writer.write(sseEvent({
          type: 'needs_confirmation',
          message: previewMessage,
          pendingAction: {
            id: pendingAction.id,
            action_type: toolName,
            action_data: toolArgs,
            preview_message: previewMessage,
          },
        }));

        return previewMessage;
      }

      // request_user_data -> interromper stream
      if (toolName === 'request_user_data') {
        writer.write(sseEvent({
          type: 'needs_data',
          message: toolArgs.context,
          dataRequest: {
            fields: toolArgs.fields,
            context: toolArgs.context,
          },
        }));

        return toolArgs.context as string || '';
      }
    }

    // SEGUNDO: executar TODAS as tools normais
    const toolResults: { id: string; result: string }[] = [];
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      let toolArgs: Record<string, unknown> = {};
      try {
        toolArgs = JSON.parse(toolCall.function.arguments || '{}');
      } catch {
        toolArgs = {};
      }

      console.log(`Tool call: ${toolName}`, toolArgs);
      writer.write(sseEvent({ type: 'tool_start', tool: toolName }));

      const result = await executeTool(supabase, userId, toolName, toolArgs);
      toolResults.push({ id: toolCall.id, result: JSON.stringify(result) });
    }

    // UMA unica mensagem assistant com TODAS as tool calls (formato correto OpenAI)
    workingMessages.push({
      role: 'assistant',
      content: content || '',
      tool_calls: toolCalls,
    });

    // N mensagens tool (uma por resultado)
    for (const tr of toolResults) {
      workingMessages.push({
        role: 'tool',
        tool_call_id: tr.id,
        content: tr.result,
      });
    }

    // Continua o loop para obter resposta final apos tool execution
  }

  if (!fullResponse && iteration >= maxIterations) {
    fullResponse = 'Desculpe, nao consegui processar sua solicitacao. Tente reformular.';
  }

  return fullResponse;
}

// =====================================================
// MAIN HANDLER
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
    const { messages, sessionId, confirmationToken, confirmed, userData } = body;

    // === FLUXO 1: Confirmacao de acao pendente (JSON, sem streaming) ===
    if (confirmationToken) {
      const result = await processConfirmedAction(supabase, confirmationToken, confirmed, userId);

      // Salvar resposta de confirmacao na sessao se possivel
      if (sessionId && result.message) {
        const msgId = await saveMessage(supabase, sessionId, 'assistant', result.message);
        if (msgId) embedMessageAsync(msgId, result.message);
      }

      return new Response(
        JSON.stringify({ ...result, sessionId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // === FLUXO 2: Mensagem do usuario (SSE streaming) ===
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Extrair ultima mensagem do usuario
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMsg) {
      return new Response(
        JSON.stringify({ error: 'No user message found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let userContent = lastUserMsg.content;

    // Se tem userData, anexar ao conteudo
    if (userData) {
      userContent += `\n\nDados adicionais fornecidos: ${JSON.stringify(userData)}`;
    }

    // Garantir sessao
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const titulo = userContent.substring(0, 50) || 'Nova conversa';
      const { data: newSession, error } = await supabase
        .from('app_chat_sessoes')
        .insert({ user_id: userId, titulo })
        .select()
        .single();
      if (error) throw error;
      activeSessionId = newSession.id;
    }

    // Salvar mensagem do usuario no banco (UNICA fonte de verdade)
    const userMsgId = await saveMessage(supabase, activeSessionId, 'user', userContent);

    // === PIPELINE PARALELO (4 camadas) ===
    // Layer 1: Knowledge Base (SQL direto, 100% confiavel)
    // Layer 2: Session History (SQL direto, 100% confiavel, 5 msgs)
    // Layer 3: Long-term Memory (RAG, bonus - depende de embedding)
    // Layer 4: User Profile (SQL direto, 100% confiavel)
    const [knowledgeBlock, userProfile, history, queryEmbedding] = await Promise.all([
      loadKnowledgeBase(supabase),
      loadUserProfile(supabase, userId),
      loadSessionHistory(supabase, activeSessionId, 5),
      generateEmbedding(userContent),
    ]);

    console.log(`Layer 1 (Knowledge): ${knowledgeBlock.length} chars`);
    console.log(`Layer 2 (History): ${history.length} mensagens`);
    console.log(`Layer 4 (Profile): ${userProfile.nome}, ai_context keys: ${Object.keys(userProfile.ai_context).length}`);

    // Layer 3: RAG memory (bonus, depende do embedding)
    let memoryResults: RAGResult[] = [];
    if (queryEmbedding) {
      memoryResults = await ragSearchMemories(supabase, queryEmbedding, userId);
      console.log(`Layer 3 (Memory RAG): ${memoryResults.length} memorias encontradas`);
    } else {
      console.log('Layer 3 (Memory RAG): embedding falhou, pulando busca de memorias');
    }

    // Construir system prompt com as 4 camadas
    const systemPrompt = buildSystemPrompt(userProfile, knowledgeBlock, memoryResults);
    console.log(`System prompt total: ${systemPrompt.length} chars`);

    // Enviar TODAS as tools - o agente escolhe sozinho
    const selectedTools = ALL_TOOLS;
    console.log(`Tools disponiveis: ${selectedTools.length} (ALL_TOOLS)`);

    // Remover a ultima mensagem do historico se for a mensagem atual (evitar duplicata)
    const filteredHistory = history.filter(m =>
      !(m.role === 'user' && m.content === userContent)
    );

    // Embed mensagem do usuario async
    if (userMsgId) embedMessageAsync(userMsgId, userContent);

    // === STREAMING SSE ===
    const { readable, writable } = new TransformStream<Uint8Array>();
    const writer = writable.getWriter();

    // Processar em background enquanto stream eh retornado
    (async () => {
      try {
        const assistantContent = await streamingAgentLoop(
          supabase,
          writer,
          userId,
          userContent,
          activeSessionId,
          selectedTools,
          systemPrompt,
          filteredHistory,
        );

        // Salvar resposta do assistente (UNICA fonte de verdade)
        if (assistantContent) {
          const assistantMsgId = await saveMessage(supabase, activeSessionId, 'assistant', assistantContent);
          if (assistantMsgId) embedMessageAsync(assistantMsgId, assistantContent);
        }

        // Enviar evento de conclusao
        writer.write(sseEvent({
          type: 'done',
          sessionId: activeSessionId,
        }));
      } catch (error) {
        console.error('Streaming error:', error);
        writer.write(sseEvent({
          type: 'error',
          error: error.message || 'Erro interno',
        }));
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

  } catch (error) {
    console.error('Error in central-ia:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
