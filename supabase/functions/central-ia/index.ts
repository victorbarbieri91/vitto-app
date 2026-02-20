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
// TOOL DEFINITIONS - MODO NORMAL (21 tools)
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

// =====================================================
// INTERVIEW TOOLS (8 tools adicionais para entrevista)
// =====================================================

const INTERVIEW_TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'create_conta',
      description: 'Cria uma conta bancária para o usuário. Use durante a entrevista quando o usuário informar suas contas.',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome da conta (ex: Nubank, Itaú, Conta Corrente BB)' },
          tipo: { type: 'string', enum: ['conta_corrente', 'conta_poupanca', 'carteira', 'investimento'], description: 'Tipo da conta' },
          saldo_inicial: { type: 'number', description: 'Saldo atual aproximado' },
          instituicao: { type: 'string', description: 'Nome do banco/instituição' },
          cor: { type: 'string', description: 'Cor hex para a conta (ex: #8B5CF6 para Nubank, #FF6B00 para Inter, #003DA5 para Itaú)' }
        },
        required: ['nome', 'tipo', 'saldo_inicial']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_cartao',
      description: 'Cria um cartão de crédito. Use quando o usuário informar seus cartões.',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome do cartão (ex: Nubank Mastercard, Itaú Visa Platinum)' },
          limite: { type: 'number', description: 'Limite total do cartão' },
          dia_fechamento: { type: 'number', description: 'Dia do fechamento da fatura (1-31)' },
          dia_vencimento: { type: 'number', description: 'Dia do vencimento da fatura (1-31)' },
          ultimos_quatro_digitos: { type: 'string', description: 'Últimos 4 dígitos do cartão (opcional)' },
          cor: { type: 'string', description: 'Cor hex para o cartão' }
        },
        required: ['nome', 'limite', 'dia_fechamento', 'dia_vencimento']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_transacao_fixa',
      description: 'Cria uma transação fixa/recorrente (salário, aluguel, assinatura, etc). Use quando o usuário informar receitas ou despesas que se repetem todo mês.',
      parameters: {
        type: 'object',
        properties: {
          descricao: { type: 'string', description: 'Descrição (ex: Salário, Aluguel, Netflix)' },
          valor: { type: 'number', description: 'Valor mensal (sempre positivo)' },
          tipo: { type: 'string', enum: ['receita', 'despesa', 'despesa_cartao'], description: 'Tipo da transação' },
          categoria_id: { type: 'number', description: 'ID da categoria. Use query_categorias para obter IDs válidos.' },
          conta_id: { type: 'number', description: 'ID da conta bancária (obrigatório para receita/despesa). Use query_contas para obter IDs.' },
          cartao_id: { type: 'number', description: 'ID do cartão (obrigatório para despesa_cartao). Use query_cartoes para obter IDs.' },
          dia_mes: { type: 'number', description: 'Dia do mês em que ocorre (1-31)' }
        },
        required: ['descricao', 'valor', 'tipo', 'categoria_id', 'dia_mes']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_meta',
      description: 'Cria uma meta financeira para o usuário.',
      parameters: {
        type: 'object',
        properties: {
          titulo: { type: 'string', description: 'Nome da meta (ex: Reserva de emergência, Viagem, Carro novo)' },
          valor_meta: { type: 'number', description: 'Valor alvo da meta' },
          valor_atual: { type: 'number', description: 'Quanto já tem guardado para esta meta (default: 0)' },
          data_fim: { type: 'string', description: 'Data alvo YYYY-MM-DD' },
          descricao: { type: 'string', description: 'Descrição opcional' },
          cor: { type: 'string', description: 'Cor hex' }
        },
        required: ['titulo', 'valor_meta', 'data_fim']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_orcamento',
      description: 'Cria orçamento mensal para uma categoria.',
      parameters: {
        type: 'object',
        properties: {
          categoria_id: { type: 'number', description: 'ID da categoria' },
          valor: { type: 'number', description: 'Valor limite mensal' },
          tipo: { type: 'string', enum: ['receita', 'despesa'], description: 'Tipo do orçamento' }
        },
        required: ['categoria_id', 'valor', 'tipo']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_perfil_financeiro',
      description: 'Atualiza o perfil financeiro do usuário na entrevista. Use para salvar informações como: situação financeira, objetivos, hábitos de consumo, dívidas, patrimônio estimado, composição familiar, perfil investidor.',
      parameters: {
        type: 'object',
        properties: {
          field: { type: 'string', description: 'Campo do perfil (ex: situacao_financeira, objetivos, dividas, patrimonio_estimado, composicao_familiar, perfil_investidor, habitos_consumo, renda_mensal_total, comprometimento_renda)' },
          value: { description: 'Valor do campo (string, número ou objeto)' }
        },
        required: ['field', 'value']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'finalizar_entrevista',
      description: 'Finaliza a entrevista e marca o onboarding como completo. Chame APENAS quando tiver coletado informações suficientes OU quando o usuário quiser encerrar. Retorna resumo do que foi criado.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_interview_progress',
      description: 'Retorna o que já foi cadastrado na entrevista: quantas contas, cartões, transações fixas, etc. Use para saber o que falta perguntar.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
,
  {
    type: 'function',
    function: {
      name: 'show_interactive_buttons',
      description: 'Mostra botões interativos na interface para o usuário escolher em vez de digitar. Use para perguntas com opções definidas: sim/não, tipo de conta, escolhas curtas. O usuário clica em um botão e a resposta é enviada automaticamente. SEMPRE use para perguntas com resposta fechada. IMPORTANTE: o value de cada botão DEVE ser texto natural em português (ex: "Conta Corrente", NÃO "conta_corrente"). NUNCA misture botões com perguntas de texto livre na mesma mensagem. O parâmetro question DEVE conter a pergunta completa que acompanha os botões.',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'A pergunta ou mensagem de contexto que acompanha os botões. OBRIGATÓRIO. Ex: "Que tipo de conta é o Nubank?"' },
          buttons: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', description: 'Texto exibido no botão - em português natural' },
                value: { type: 'string', description: 'Valor enviado como resposta - DEVE ser texto natural em português, idêntico ou similar ao label. Ex: "Conta Corrente", NÃO "conta_corrente"' }
              },
              required: ['label', 'value']
            },
            description: 'Lista de botões. Máximo 5 botões. Values devem ser texto natural em português.'
          }
        },
        required: ['question', 'buttons']
      }
    }
  }
];

// =====================================================
// EMBEDDING
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
// RAG SEARCH
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
// KNOWLEDGE BASE
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
// USER PROFILE
// =====================================================

interface UserProfile {
  nome: string;
  receita_mensal: number | null;
  meta_despesa: number | null;
  ai_context: Record<string, unknown>;
  perfil_financeiro: Record<string, unknown>;
}

async function loadUserProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('app_perfil')
      .select('nome, receita_mensal_estimada, meta_despesa_percentual, ai_context, perfil_financeiro')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('loadUserProfile: perfil nao encontrado');
      return { nome: 'Usuario', receita_mensal: null, meta_despesa: null, ai_context: {}, perfil_financeiro: {} };
    }

    return {
      nome: data.nome || 'Usuario',
      receita_mensal: data.receita_mensal_estimada,
      meta_despesa: data.meta_despesa_percentual,
      ai_context: data.ai_context || {},
      perfil_financeiro: data.perfil_financeiro || {},
    };
  } catch (e) {
    console.error('loadUserProfile error:', e);
    return { nome: 'Usuario', receita_mensal: null, meta_despesa: null, ai_context: {}, perfil_financeiro: {} };
  }
}

// =====================================================
// SYSTEM PROMPT - MODO NORMAL
// =====================================================

function buildSystemPrompt(
  userProfile: UserProfile,
  knowledgeBlock: string,
  memoryResults: RAGResult[],
): string {
  const now = new Date();
  const dataAtual = now.toLocaleDateString('pt-BR');
  const mesAtual = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

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

  let memoryBlock = '';
  if (memoryResults.length > 0) {
    memoryBlock = '\n\n### Memórias do usuário:\n';
    memoryBlock += memoryResults.map(m => `- [${m.category}] ${m.content}`).join('\n');
  }

  return `Você é o Vitto, assistente financeiro pessoal inteligente e amigável.
Responda sempre em português brasileiro correto, com acentuação e gramática adequadas.
Data atual: ${dataAtual} (${mesAtual}). Usuário: ${userProfile.nome}.
Tudo que você escrever será exibido diretamente ao usuário na tela. Sua resposta É o que o usuário vê.

INSTRUÇÕES:
1. Use o CONTEXTO abaixo para responder com precisão
2. NUNCA invente dados financeiros - só use dados das tools ou do contexto
3. Se faltar informação, use as tools disponíveis para consultar
4. Para ações destrutivas (criar/editar/excluir transações), SEMPRE confirme antes
5. Responda de forma concisa e amigável
6. Formate valores em R$ (ex: R$ 1.234,56) e datas em DD/MM/AAAA
7. Use markdown para formatação: **negrito** para valores, listas para múltiplos itens
8. Se o usuário quiser criar conta, orçamento, meta ou cartão, oriente a usar as abas do app
9. Use save_memory para informações temporais/pontuais. Use update_user_profile para informações permanentes (preferências, objetivos, perfil financeiro)
10. IMPORTANTE - COLETA DE DADOS VIA MODAL: Quando precisar de QUALQUER informação que o usuário não forneceu (cartão, mês, conta, valor, tipo, etc), SEMPRE use a tool request_user_data para coletar via modal interativo. NUNCA faça perguntas no texto da conversa. O modal é mais rápido e engajante para o usuário. Exemplos: se o usuário pedir despesas do cartão sem dizer qual, use request_user_data com um campo select listando os cartões. Se pedir para criar transação sem dados, use request_user_data com os campos necessários.
11. Para consultas de despesas de cartão de crédito em um mês específico, prefira query_fatura (que inclui transações fixas e parceladas) em vez de query_transacoes

### Perfil do usuário:${profileBlock || '\nNenhum dado de perfil.'}

### Regras e conhecimento do sistema:${knowledgeBlock || '\nNenhuma regra encontrada.'}${memoryBlock}`;
}

// =====================================================
// SYSTEM PROMPT - MODO ENTREVISTA
// =====================================================

function buildInterviewSystemPrompt(userProfile: UserProfile, progressData?: any): string {
  const now = new Date();
  const dataAtual = now.toLocaleDateString('pt-BR');

  // Construir bloco de progresso atual
  let progressBlock = '';
  if (progressData) {
    const p = progressData;
    const parts: string[] = [];
    if (p.contas?.quantidade > 0) {
      parts.push(`- **Contas criadas (${p.contas.quantidade})**: ${p.contas.items?.map((c: any) => `${c.nome} (R$ ${c.saldo_atual})`).join(', ')}`);
    }
    if (p.cartoes?.quantidade > 0) {
      parts.push(`- **Cartões criados (${p.cartoes.quantidade})**: ${p.cartoes.items?.map((c: any) => `${c.nome} (limite R$ ${c.limite})`).join(', ')}`);
    }
    if (p.receitas_fixas?.quantidade > 0) {
      parts.push(`- **Receitas fixas (${p.receitas_fixas.quantidade})**: ${p.receitas_fixas.items?.map((r: any) => `${r.descricao} R$ ${r.valor}`).join(', ')}`);
    }
    if (p.despesas_fixas?.quantidade > 0) {
      parts.push(`- **Despesas fixas (${p.despesas_fixas.quantidade})**: ${p.despesas_fixas.items?.map((d: any) => `${d.descricao} R$ ${d.valor}`).join(', ')}`);
    }
    if (p.metas?.quantidade > 0) {
      parts.push(`- **Metas (${p.metas.quantidade})**: ${p.metas.items?.map((m: any) => m.titulo).join(', ')}`);
    }
    if (p.perfil_financeiro?.campos_preenchidos > 0) {
      parts.push(`- **Perfil financeiro**: ${p.perfil_financeiro.campos.join(', ')}`);
    }
    if (parts.length > 0) {
      progressBlock = `\n\n## PROGRESSO ATUAL (já cadastrado)\n${parts.join('\n')}\n\nContinue a partir do que FALTA. Não pergunte novamente o que já foi cadastrado.`;
    } else {
      progressBlock = '\n\n## PROGRESSO ATUAL\nNenhum dado cadastrado ainda. Comece do início (FASE 1).';
    }
  }

  return `Você é o **Vitto**, assistente financeiro do app Vitto. Você conduz a ENTREVISTA INICIAL para configurar o sistema financeiro do usuário de forma descontraída e acolhedora.
Responda sempre em português brasileiro correto, com acentuação e gramática adequadas.
Tudo que você escrever será exibido diretamente ao usuário na tela. Sua resposta É o que o usuário vê.
Os botões interativos são renderizados automaticamente pela interface quando você chama show_interactive_buttons. O usuário os vê naturalmente na tela - não precisa ser instruído sobre eles.

Data atual: ${dataAtual}. Nome do usuário: ${userProfile.nome}.${progressBlock}

## TOM E ESTILO
- Simpático e natural, como um amigo que entende de finanças. Seja acolhedor mas conciso.
- Mensagens de 2-3 frases curtas + pergunta. Não seja robótico nem exageradamente entusiasmado.
- Confirme ações com carinho: "Pronto, criei sua conta **Nubank**! ✓" e siga para a próxima pergunta.
- Use **negrito** para valores e nomes. Formate valores em R$.
- Pode usar 1 emoji por mensagem (não exagere).
- Se o usuário pular algo: "Tranquilo! Pode completar depois quando quiser." e avance.
- Cada mensagem deve ter APENAS UMA pergunta ou ação. Não consolide várias perguntas.

## REGRAS DE BOTÕES (CRÍTICO)
- Quando usar show_interactive_buttons, o value de cada botão DEVE ser texto natural em português.
  Exemplo CORRETO: { label: "Conta Corrente", value: "Conta Corrente" }
  Exemplo ERRADO: { label: "Conta Corrente", value: "conta_corrente" }
- NUNCA misture botões com perguntas de texto livre na mesma mensagem.
  Se precisa de um valor numérico (saldo, limite), pergunte SEM botões.
  Se precisa de uma escolha (tipo de conta, sim/não), use APENAS botões.
- SEMPRE escreva uma frase de contexto ANTES de chamar show_interactive_buttons. Nunca mande só botões sem texto.
- Não consolide muitas perguntas. Uma informação por vez.

## ROTEIRO

**FASE 1 - INÍCIO** (1 msg):
O card de boas-vindas já explicou tudo. Sua primeira mensagem deve ser acolhedora e rápida:
"Que bom ter você aqui, ${userProfile.nome}! 😊 Vamos começar configurando suas contas. Me conta: quais bancos ou contas você usa no dia a dia? (ex: Nubank, Itaú, Inter, PicPay)"

**FASE 2 - CONTAS** (várias msgs, uma pergunta por vez):
- Quando o usuário informar os bancos, para CADA conta pergunte UMA coisa por vez:
  1. Primeiro: tipo da conta (botões: "Conta Corrente" / "Poupança" / "Investimento" / "Carteira digital")
  2. Depois: "Qual o saldo aproximado da sua conta **Nubank**?" (SEM botões - resposta livre)
- Crie a conta com create_conta assim que tiver as infos
- Cores por banco: Nubank=#8B5CF6, Inter=#FF6B00, Itaú=#003DA5, BB=#FCCF00, Bradesco=#CC092F, Caixa=#005CA9, Santander=#EC0000, C6=#1A1A1A, PicPay=#21C25E
- Após criar todas: "Mais alguma conta que eu não mencionei?" (botões: "Tenho mais" / "Só essas")

**FASE 3 - CARTÕES** (várias msgs, uma pergunta por vez):
- "Agora vamos para os cartões de crédito! Você tem algum?" (botões: "Tenho sim" / "Não tenho")
- Se tem, pergunte UMA info por vez:
  1. "Qual o nome do cartão? (ex: Nubank, C6, Inter)"
  2. "Qual o limite total do seu **Nubank**?"
  3. "Qual o dia de fechamento e o dia de vencimento?" (pode perguntar os dois juntos)
  4. "E os últimos 4 dígitos do cartão? Ajuda a identificar depois 😉"
- SEMPRE pergunte últimos 4 dígitos
- Use create_cartao
- Após criar: "Se tiver a fatura em PDF, pode enviar pelo 📎 que eu processo pra você! Tem mais algum cartão?" (botões: "Tenho mais" / "Só esses")

**FASE 4 - RECEITAS FIXAS** (várias msgs, uma pergunta por vez):
- "Ótimo! Agora vamos falar sobre sua renda. Qual sua principal fonte de renda?" (botões: "Salário CLT" / "Freelance" / "Aluguel recebido" / "Outro")
- Depois: "Qual o valor mensal?" (SEM botões)
- Depois: "Em qual dia do mês você recebe?" (SEM botões)
- Depois: pergunte em qual conta cai (botões com as contas já criadas)
- Use query_categorias tipo='receita' ANTES de criar, depois create_transacao_fixa
- Atualize receita_mensal_estimada com update_perfil_financeiro
- "Tem mais alguma renda fixa?" (botões: "Tenho mais" / "Só essa")

**FASE 5 - DESPESAS FIXAS** (várias msgs, uma por vez):
- "Agora vamos mapear seus gastos fixos pra eu calcular certinho seu saldo previsto! 📊"
- Pergunte por categoria, UMA de cada vez:
  - "Você paga aluguel ou financiamento?" (botões: "Aluguel" / "Financiamento" / "Nenhum")
  - Se sim: "Quanto paga e em qual dia do mês?" (SEM botões)
  - Depois: "Paga em qual conta ou cartão?" (botões com contas/cartões criados + "Não tenho")
  - Depois passe para: internet, celular, streaming, plano de saúde, academia, transporte
- Para cada: valor, dia, conta ou cartão
- Use query_categorias tipo='despesa' ANTES, depois create_transacao_fixa
- Após cada bloco: "Tem mais algum gasto fixo que eu não mencionei?" (botões: "Tenho mais" / "Acho que é isso")

**FASE 6 - PERFIL** (2-3 msgs, uma pergunta por vez):
- "Estamos quase lá! Umas perguntinhas rápidas pra entender melhor seu perfil financeiro."
- Uma por vez:
  - "Você consegue guardar dinheiro todo mês?" (botões: "Sempre" / "Às vezes" / "Raramente")
  - "Tem alguma dívida em atraso?" (botões: "Não" / "Sim, poucas" / "Sim, várias")
  - "Como você se considera com dinheiro?" (botões: "Poupador" / "Equilibrado" / "Gastador")
- Use update_perfil_financeiro

**FASE 7 - FINALIZAÇÃO** (1-2 msgs):
- Use get_interview_progress para resumo
- Apresente resumo formatado e acolhedor do que foi criado
- "Prontinho, ${userProfile.nome}! Seu sistema tá configurado. Agora você pode acompanhar tudo no dashboard. Qualquer coisa, é só me chamar! 🎉"
- Chame finalizar_entrevista

## REGRAS CRÍTICAS
1. SEMPRE termine com PERGUNTA ou proposta de ação
2. Uma fase por vez, UMA PERGUNTA por vez - não consolide
3. Crie dados IMEDIATAMENTE após o usuário informar
4. CONCISO: máximo 2-3 frases curtas por mensagem + pergunta
5. Para transações fixas: SEMPRE query_categorias ANTES. NUNCA invente IDs.
6. Para transações em conta: SEMPRE query_contas ANTES. No cartão: query_cartoes.
7. Para cartões: SEMPRE pergunte últimos 4 dígitos.
8. Use show_interactive_buttons para TODAS as perguntas com opções definidas.
9. NUNCA misture botões com perguntas de texto livre. São tipos de interação DIFERENTES.
10. SEMPRE escreva texto de contexto ANTES dos botões. NUNCA mande só botões.
11. Se o usuário der várias infos de uma vez, processe TODAS, confirme e siga.
12. Values dos botões SEMPRE em português natural (ex: "Conta Corrente", NÃO "conta_corrente").`;
}

// =====================================================
// TOOL EXECUTOR
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
          const saldoTotal = data?.reduce((sum: number, c: any) => sum + (Number(c.saldo_atual) || 0), 0) || 0;
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
        const total = data?.reduce((sum: number, t: any) => sum + Number(t.valor), 0) || 0;
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
        const metasComProgresso = data?.map((m: any) => ({ ...m, percentual: m.valor_meta > 0 ? Math.round((m.valor_atual / m.valor_meta) * 100) : 0 }));
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
        (gastos || []).forEach((g: any) => { gastosPorCat[g.categoria_id] = (gastosPorCat[g.categoria_id] || 0) + Number(g.valor); });
        const orcamentosComGastos = (orcamentos || []).map((o: any) => ({ ...o, gasto: gastosPorCat[(o.categoria as any)?.id] || 0, percentual_usado: o.valor > 0 ? Math.round((gastosPorCat[(o.categoria as any)?.id] || 0) / o.valor * 100) : 0 }));
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
        data?.forEach((t: any) => { const cat = t.categoria as { id: number; nome: string; cor: string }; if (!porCategoria[cat.id]) porCategoria[cat.id] = { nome: cat.nome, total: 0, cor: cat.cor }; porCategoria[cat.id].total += Number(t.valor); totalGeral += Number(t.valor); });
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
          const receitas = (data || []).filter((t: any) => t.tipo === 'receita').reduce((s: number, t: any) => s + Number(t.valor), 0);
          const despesas = (data || []).filter((t: any) => t.tipo === 'despesa' || t.tipo === 'despesa_cartao').reduce((s: number, t: any) => s + Number(t.valor), 0);
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
          const totalDespesas = (despesas || []).reduce((sum: number, t: any) => sum + Number(t.valor), 0);
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
          const [transResult, totalResult] = await Promise.all([
            supabase.rpc('obter_transacoes_fatura', { p_fatura_id: fatura.id }),
            supabase.rpc('calcular_valor_total_fatura', { p_fatura_id: fatura.id }),
          ]);
          const transacoes = transResult.data || [];
          const total = totalResult.data || 0;
          const parceladas = transacoes.filter((t: any) => t.total_parcelas && t.total_parcelas > 1).length;
          const fixas = transacoes.filter((t: any) => t.is_fixed).length;
          const avista = transacoes.length - parceladas - fixas;
          return { success: true, data: { cartao: cartao?.nome, fatura: { ...fatura, valor_total: total }, transacoes, total, quantidade: transacoes.length, resumo: { parceladas, fixas, avista } } };
        }

        const diaFechamento = cartao?.dia_fechamento || 1;
        const mesNum = Number(mes); const anoNum = Number(ano);
        const fimCiclo = new Date(anoNum, mesNum - 1, diaFechamento);
        const inicioCiclo = new Date(anoNum, mesNum - 2, diaFechamento + 1);
        const startDate = inicioCiclo.toISOString().split('T')[0];
        const endDate = fimCiclo.toISOString().split('T')[0];
        const { data: transacoes, error } = await supabase.from('app_transacoes').select('id, descricao, valor, data, status, parcela_atual, total_parcelas, categoria:app_categoria(id, nome, cor)').eq('user_id', userId).eq('cartao_id', args.cartao_id).gte('data', startDate).lte('data', endDate).order('data', { ascending: false });
        if (error) throw error;
        const total = (transacoes || []).reduce((sum: number, t: any) => sum + Number(t.valor), 0);
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
        (data || []).forEach((ativo: any) => { totaisPorCategoria[ativo.categoria] = (totaisPorCategoria[ativo.categoria] || 0) + Number(ativo.valor_atual); totalGeral += Number(ativo.valor_atual); });
        return { success: true, data: { ativos: data, total_geral: totalGeral, totais_por_categoria: totaisPorCategoria, quantidade: data?.length || 0 } };
      }

      case 'save_memory': {
        const scoreByType: Record<string, number> = { preferencia: 0.8, objetivo: 0.9, padrao: 0.7, insight: 0.6, lembrete: 0.85 };
        let embedding = null;
        try { embedding = await generateEmbedding(`[${args.tipo}] ${args.conteudo}`); } catch (e) { console.error('Erro ao gerar embedding para memoria:', e); }
        const insertData: any = { usuario_id: userId, tipo_conteudo: args.tipo, conteudo: args.conteudo, ativo: true, relevancia_score: scoreByType[args.tipo as string] || 0.5 };
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
        const { data: perfil, error: perfilError } = await supabase.from('app_perfil').select('ai_context').eq('id', userId).single();
        if (perfilError) throw perfilError;
        const currentContext = perfil?.ai_context || {};
        if (action === 'delete') { delete currentContext[field]; } else { currentContext[field] = value; }
        const { error: updateError } = await supabase.from('app_perfil').update({ ai_context: currentContext }).eq('id', userId);
        if (updateError) throw updateError;
        return { success: true, data: { updated: true, field, action } };
      }

      // =====================================================
      // INTERVIEW-ONLY TOOLS
      // =====================================================

      case 'create_conta': {
        const { data, error } = await supabase.from('app_conta').insert({
          user_id: userId,
          nome: args.nome,
          tipo: args.tipo || 'conta_corrente',
          saldo_inicial: args.saldo_inicial || 0,
          saldo_atual: args.saldo_inicial || 0,
          instituicao: args.instituicao || null,
          cor: args.cor || '#4F46E5',
          status: 'ativo',
          moeda: 'BRL',
        }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_cartao': {
        const { data, error } = await supabase.from('app_cartao_credito').insert({
          user_id: userId,
          nome: args.nome,
          limite: args.limite,
          dia_fechamento: args.dia_fechamento,
          dia_vencimento: args.dia_vencimento,
          ultimos_quatro_digitos: args.ultimos_quatro_digitos || null,
          cor: args.cor || '#1A1A1A',
        }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_transacao_fixa': {
        const today = new Date().toISOString().split('T')[0];
        const insertData: any = {
          user_id: userId,
          descricao: args.descricao,
          valor: Math.abs(Number(args.valor)),
          tipo: args.tipo,
          categoria_id: args.categoria_id,
          dia_mes: args.dia_mes || 1,
          data_inicio: today,
          ativo: true,
        };
        if (args.conta_id) insertData.conta_id = args.conta_id;
        if (args.cartao_id) insertData.cartao_id = args.cartao_id;
        const { data, error } = await supabase.from('app_transacoes_fixas').insert(insertData).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_meta': {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase.from('app_meta_financeira').insert({
          user_id: userId,
          titulo: args.titulo,
          valor_meta: args.valor_meta,
          valor_atual: args.valor_atual || 0,
          data_inicio: today,
          data_fim: args.data_fim,
          descricao: args.descricao || null,
          cor: args.cor || '#10B981',
        }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'create_orcamento': {
        const now = new Date();
        const { data, error } = await supabase.from('app_orcamento').insert({
          user_id: userId,
          categoria_id: args.categoria_id,
          valor: args.valor,
          tipo: args.tipo || 'despesa',
          mes: now.getMonth() + 1,
          ano: now.getFullYear(),
        }).select().single();
        if (error) throw error;
        return { success: true, data };
      }

      case 'update_perfil_financeiro': {
        const field = args.field as string;
        const value = args.value;
        const { data: perfil, error: perfilError } = await supabase.from('app_perfil').select('perfil_financeiro').eq('id', userId).single();
        if (perfilError) throw perfilError;
        const currentPerfil = perfil?.perfil_financeiro || {};
        currentPerfil[field] = value;
        const { error: updateError } = await supabase.from('app_perfil').update({ perfil_financeiro: currentPerfil }).eq('id', userId);
        if (updateError) throw updateError;
        return { success: true, data: { updated: true, field } };
      }

      case 'finalizar_entrevista': {
        // Marcar onboarding como completo
        const { error } = await supabase.from('app_perfil').update({
          onboarding_completed: true,
        }).eq('id', userId);
        if (error) throw error;

        // Calcular receita mensal total a partir de transacoes fixas de receita
        const { data: receitasFixas } = await supabase.from('app_transacoes_fixas')
          .select('valor').eq('user_id', userId).eq('tipo', 'receita').eq('ativo', true);
        const receitaTotal = (receitasFixas || []).reduce((sum: number, r: any) => sum + Number(r.valor), 0);
        if (receitaTotal > 0) {
          await supabase.from('app_perfil').update({ receita_mensal_estimada: receitaTotal }).eq('id', userId);
        }

        return { success: true, data: { completed: true, message: 'Entrevista finalizada com sucesso!' } };
      }

      case 'get_interview_progress': {
        const [contas, cartoes, fixas, metas, orcamentos] = await Promise.all([
          supabase.from('app_conta').select('id, nome, tipo, saldo_atual').eq('user_id', userId),
          supabase.from('app_cartao_credito').select('id, nome, limite').eq('user_id', userId),
          supabase.from('app_transacoes_fixas').select('id, descricao, valor, tipo').eq('user_id', userId).eq('ativo', true),
          supabase.from('app_meta_financeira').select('id, titulo, valor_meta').eq('user_id', userId),
          supabase.from('app_orcamento').select('id, valor').eq('user_id', userId),
        ]);
        const { data: perfil } = await supabase.from('app_perfil').select('perfil_financeiro').eq('id', userId).single();
        const perfilFields = Object.keys(perfil?.perfil_financeiro || {});

        const receitasFixas = (fixas.data || []).filter((f: any) => f.tipo === 'receita');
        const despesasFixas = (fixas.data || []).filter((f: any) => f.tipo === 'despesa' || f.tipo === 'despesa_cartao');

        return {
          success: true,
          data: {
            contas: { quantidade: contas.data?.length || 0, items: contas.data },
            cartoes: { quantidade: cartoes.data?.length || 0, items: cartoes.data },
            receitas_fixas: { quantidade: receitasFixas.length, items: receitasFixas },
            despesas_fixas: { quantidade: despesasFixas.length, items: despesasFixas },
            metas: { quantidade: metas.data?.length || 0, items: metas.data },
            orcamentos: { quantidade: orcamentos.data?.length || 0 },
            perfil_financeiro: { campos_preenchidos: perfilFields.length, campos: perfilFields },
          },
        };
      }

      default:
        return { success: false, error: `Tool desconhecida: ${toolName}` };
    }
  } catch (error: any) {
    console.error(`Erro ao executar tool ${toolName}:`, error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// HELPERS
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

// =====================================================
// PROCESS CONFIRMED ACTION
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

    return data.reverse().map((m: any) => ({
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

/**
 * Filtro server-side que limpa o output do agente antes de enviar ao cliente.
 * Remove meta-instruções internas e referências desnecessárias a UI.
 */
function sanitizeOutput(text: string): string {
  if (!text) return text;

  // 1. Remove parentéticos com padrões de meta-instrução/sistema
  let cleaned = text.replace(/\([^)]{0,300}\)/g, (match) => {
    const lower = match.toLowerCase();
    const metaPatterns = [
      /observa[çc][ãa]o\s*:/,
      /note\s*:/,
      /the assistant/,
      /assistant must/,
      /instruc/,
      /must continue/,
      /per instructions/,
      /we need to/,
      /we should/,
      /i need to/,
      /i should proceed/,
      /internal note/,
      /system note/,
    ];
    if (metaPatterns.some(p => p.test(lower))) return '';
    return match;
  });

  // 2. Remove referências a cliques/botões/UI no texto
  cleaned = cleaned.replace(
    /\(?\s*(clique|selecione|escolha|aperte|toque)\s+(n[ao]s?|em|um[a]?|o|a|abaixo|acima|aqui)[^)]*\)?\s*/gi,
    ''
  );

  // 3. Limpa espaços duplicados e trailing
  cleaned = cleaned.replace(/  +/g, ' ').trim();

  return cleaned;
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
  isInterviewMode: boolean = false,
): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OPENAI_API_KEY nao configurada');

  const workingMessages: ChatMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];
  console.log(`Agent loop: ${history.length} mensagens de historico + mensagem atual (interview=${isInterviewMode})`);

  // No interview mode, nenhuma tool requer confirmacao
  const confirmationTools = isInterviewMode ? [] : CONFIRMATION_REQUIRED_TOOLS;

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
        const clean = sanitizeOutput(token);
        if (clean) writer.write(sseEvent({ type: 'token', content: clean }));
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

      const previewMessage = generateActionPreview(tc.function.name, args);
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
      const textToShow = content || questionText;

      // Emitir texto como tokens (pode ter sido suprimido pelo processOpenAIStream quando hasToolCalls=true)
      const cleanText = sanitizeOutput(textToShow);
      if (cleanText) {
        writer.write(sseEvent({ type: 'token', content: cleanText }));
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
    const { messages, sessionId, confirmationToken, confirmed, userData, mode } = body;
    const isInterviewMode = mode === 'interview';

    // === FLUXO 1: Confirmacao de acao pendente ===
    if (confirmationToken) {
      const result = await processConfirmedAction(supabase, confirmationToken, confirmed, userId);
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

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === 'user');
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
      const titulo = isInterviewMode ? 'Entrevista Inicial' : (userContent.substring(0, 50) || 'Nova conversa');
      const { data: newSession, error } = await supabase
        .from('app_chat_sessoes')
        .insert({ user_id: userId, titulo, metadata: isInterviewMode ? { type: 'interview' } : {} })
        .select()
        .single();
      if (error) throw error;
      activeSessionId = newSession.id;
    }

    // Salvar mensagem do usuario
    const userMsgId = await saveMessage(supabase, activeSessionId, 'user', userContent);

    // === BUILD CONTEXT ===
    const userProfile = await loadUserProfile(supabase, userId);
    let systemPrompt: string;
    let selectedTools: Tool[];

    if (isInterviewMode) {
      // Interview mode: carregar progresso + prompt especifico + tools reduzidas
      const progressResult = await executeTool(supabase, userId, 'get_interview_progress', {});
      const progressData = progressResult.success ? progressResult.data : null;
      systemPrompt = buildInterviewSystemPrompt(userProfile, progressData);
      // Apenas tools essenciais para a entrevista (~14 em vez de 30)
      const INTERVIEW_QUERY_TOOLS = ALL_TOOLS.filter(t =>
        ['query_categorias', 'query_contas', 'query_cartoes', 'save_memory', 'update_user_profile'].includes(t.function.name)
      );
      selectedTools = [...INTERVIEW_QUERY_TOOLS, ...INTERVIEW_TOOLS];
      console.log(`INTERVIEW MODE: ${selectedTools.length} tools disponiveis`);
    } else {
      // Normal mode: pipeline RAG completo
      const [knowledgeBlock, queryEmbedding] = await Promise.all([
        loadKnowledgeBase(supabase),
        generateEmbedding(userContent),
      ]);

      let memoryResults: RAGResult[] = [];
      if (queryEmbedding) {
        memoryResults = await ragSearchMemories(supabase, queryEmbedding, userId);
      }

      systemPrompt = buildSystemPrompt(userProfile, knowledgeBlock, memoryResults);
      selectedTools = ALL_TOOLS;
      console.log(`NORMAL MODE: ${selectedTools.length} tools, knowledge=${knowledgeBlock.length}chars, memories=${memoryResults.length}`);
    }

    // Load session history (both modes)
    const history = await loadSessionHistory(supabase, activeSessionId, isInterviewMode ? 20 : 5);
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
          selectedTools,
          systemPrompt,
          filteredHistory,
          isInterviewMode ? 12 : 8, // More iterations for interview (multiple tools per turn)
          isInterviewMode,
        );

        if (assistantContent) {
          const assistantMsgId = await saveMessage(supabase, activeSessionId, 'assistant', assistantContent);
          if (assistantMsgId) embedMessageAsync(assistantMsgId, assistantContent);
        }

        const sanitizedContent = sanitizeOutput(assistantContent || '');
        writer.write(sseEvent({ type: 'done', sessionId: activeSessionId, content: sanitizedContent }));
      } catch (error: any) {
        console.error('Streaming error:', error);
        writer.write(sseEvent({ type: 'error', error: error.message || 'Erro interno' }));
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

  } catch (error: any) {
    console.error('Error in central-ia:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
