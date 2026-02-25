// =====================================================
// TOOL DEFINITIONS - ENTREVISTA
// =====================================================

import type { Tool } from '../_shared/types.ts';
import { SHARED_TOOLS } from '../_shared/tools-shared.ts';

const INTERVIEW_ONLY_TOOLS: Tool[] = [
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
      name: 'update_conta',
      description: 'Atualiza dados de uma conta bancária existente. Use quando o usuário fornecer informações adicionais sobre uma conta já criada (ex: corrigir saldo, mudar tipo). Consulte query_contas para obter o ID.',
      parameters: {
        type: 'object',
        properties: {
          conta_id: { type: 'number', description: 'ID da conta a atualizar (use query_contas para obter)' },
          nome: { type: 'string' },
          tipo: { type: 'string', enum: ['conta_corrente', 'conta_poupanca', 'carteira', 'investimento'] },
          saldo_atual: { type: 'number' },
          instituicao: { type: 'string' },
          cor: { type: 'string' }
        },
        required: ['conta_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_cartao',
      description: 'Atualiza dados de um cartão de crédito existente. Use quando o usuário fornecer informações adicionais sobre um cartão já criado (ex: últimos 4 dígitos, corrigir limite). Consulte query_cartoes para obter o ID.',
      parameters: {
        type: 'object',
        properties: {
          cartao_id: { type: 'number', description: 'ID do cartão a atualizar (use query_cartoes para obter)' },
          ultimos_quatro_digitos: { type: 'string' },
          limite: { type: 'number' },
          dia_fechamento: { type: 'number' },
          dia_vencimento: { type: 'number' }
        },
        required: ['cartao_id']
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
  },
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

// Toolset completo para a entrevista: 5 shared + 11 interview-only
export const INTERVIEW_TOOLSET: Tool[] = [...SHARED_TOOLS, ...INTERVIEW_ONLY_TOOLS];
