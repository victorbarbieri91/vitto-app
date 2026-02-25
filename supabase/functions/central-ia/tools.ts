// =====================================================
// TOOL DEFINITIONS - MODO NORMAL (21 tools)
// =====================================================

import type { Tool } from '../_shared/types.ts';

export const ALL_TOOLS: Tool[] = [
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

export const CONFIRMATION_REQUIRED_TOOLS = [
  'create_transaction', 'create_transaction_cartao', 'update_transaction',
  'delete_transaction', 'pagar_fatura'
];
