import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ==================== TIPOS ====================

interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

interface ToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

// ==================== TOOLS DEFINITIONS ====================

const TOOLS: ToolDefinition[] = [
  // === IDENTIFICAÇÃO ===
  {
    name: 'identificar_usuario',
    description: 'Identifica o usuário pelo número de telefone (WhatsApp). Retorna o user_id para usar nas demais operações.',
    inputSchema: {
      type: 'object',
      properties: {
        telefone: {
          type: 'string',
          description: 'Número de telefone no formato internacional (ex: +5511999999999)'
        }
      },
      required: ['telefone']
    }
  },
  {
    name: 'get_perfil',
    description: 'Retorna os dados do perfil do usuário.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' }
      },
      required: ['user_id']
    }
  },

  // === CONTAS ===
  {
    name: 'listar_contas',
    description: 'Lista todas as contas bancárias do usuário (corrente, poupança, carteira, investimento).',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        apenas_ativas: { type: 'boolean', description: 'Filtrar apenas contas ativas (padrão: true)' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'get_saldo_total',
    description: 'Retorna o saldo total consolidado de todas as contas do usuário.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'criar_conta',
    description: 'Cria uma nova conta bancária para o usuário.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        nome: { type: 'string', description: 'Nome da conta (ex: Nubank, Itaú)' },
        tipo: { type: 'string', enum: ['corrente', 'poupanca', 'carteira', 'investimento'], description: 'Tipo da conta' },
        saldo_inicial: { type: 'number', description: 'Saldo inicial (padrão: 0)' },
        cor: { type: 'string', description: 'Cor em hexadecimal (ex: #8B5CF6)' },
        icone: { type: 'string', description: 'Nome do ícone' }
      },
      required: ['user_id', 'nome', 'tipo']
    }
  },

  // === TRANSAÇÕES ===
  {
    name: 'listar_transacoes',
    description: 'Lista transações do usuário com filtros opcionais por período, tipo, categoria ou conta.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        data_inicio: { type: 'string', description: 'Data inicial (YYYY-MM-DD)' },
        data_fim: { type: 'string', description: 'Data final (YYYY-MM-DD)' },
        tipo: { type: 'string', enum: ['receita', 'despesa', 'despesa_cartao'], description: 'Filtrar por tipo' },
        categoria_id: { type: 'number', description: 'Filtrar por categoria' },
        conta_id: { type: 'number', description: 'Filtrar por conta' },
        limite: { type: 'number', description: 'Quantidade máxima de resultados (padrão: 50)' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'criar_transacao',
    description: 'Cria uma nova transação financeira (receita ou despesa). Para despesas de cartão de crédito, use criar_despesa_cartao.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        descricao: { type: 'string', description: 'Descrição da transação' },
        valor: { type: 'number', description: 'Valor da transação (sempre positivo)' },
        tipo: { type: 'string', enum: ['receita', 'despesa'], description: 'Tipo: receita ou despesa' },
        categoria_id: { type: 'number', description: 'ID da categoria' },
        conta_id: { type: 'number', description: 'ID da conta' },
        data: { type: 'string', description: 'Data da transação (YYYY-MM-DD, padrão: hoje)' },
        observacao: { type: 'string', description: 'Observação adicional' }
      },
      required: ['user_id', 'descricao', 'valor', 'tipo', 'categoria_id', 'conta_id']
    }
  },
  {
    name: 'editar_transacao',
    description: 'Edita uma transação existente.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        transacao_id: { type: 'number', description: 'ID da transação a editar' },
        descricao: { type: 'string', description: 'Nova descrição' },
        valor: { type: 'number', description: 'Novo valor' },
        categoria_id: { type: 'number', description: 'Nova categoria' },
        data: { type: 'string', description: 'Nova data (YYYY-MM-DD)' },
        observacao: { type: 'string', description: 'Nova observação' }
      },
      required: ['user_id', 'transacao_id']
    }
  },
  {
    name: 'excluir_transacao',
    description: 'Exclui uma transação. Ação irreversível.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        transacao_id: { type: 'number', description: 'ID da transação a excluir' }
      },
      required: ['user_id', 'transacao_id']
    }
  },

  // === TRANSAÇÕES FIXAS ===
  {
    name: 'listar_transacoes_fixas',
    description: 'Lista transações fixas/recorrentes do usuário (salário, aluguel, assinaturas).',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        tipo: { type: 'string', enum: ['receita', 'despesa'], description: 'Filtrar por tipo' },
        apenas_ativas: { type: 'boolean', description: 'Apenas transações ativas (padrão: true)' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'criar_transacao_fixa',
    description: 'Cria uma nova transação fixa/recorrente.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        descricao: { type: 'string', description: 'Descrição (ex: Salário, Aluguel)' },
        valor: { type: 'number', description: 'Valor mensal' },
        tipo: { type: 'string', enum: ['receita', 'despesa'], description: 'Tipo' },
        categoria_id: { type: 'number', description: 'ID da categoria' },
        conta_id: { type: 'number', description: 'ID da conta' },
        dia_vencimento: { type: 'number', description: 'Dia do mês do vencimento (1-31)' },
        recorrencia: { type: 'string', enum: ['mensal', 'semanal', 'anual'], description: 'Frequência (padrão: mensal)' }
      },
      required: ['user_id', 'descricao', 'valor', 'tipo', 'categoria_id', 'conta_id', 'dia_vencimento']
    }
  },

  // === CARTÕES DE CRÉDITO ===
  {
    name: 'listar_cartoes',
    description: 'Lista os cartões de crédito do usuário.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'get_fatura_atual',
    description: 'Retorna detalhes da fatura atual ou de um mês específico de um cartão.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        cartao_id: { type: 'number', description: 'ID do cartão de crédito' },
        mes: { type: 'number', description: 'Mês da fatura (1-12, padrão: atual)' },
        ano: { type: 'number', description: 'Ano da fatura (padrão: atual)' }
      },
      required: ['user_id', 'cartao_id']
    }
  },
  {
    name: 'criar_despesa_cartao',
    description: 'Registra uma despesa no cartão de crédito. Pode ser parcelada.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        cartao_id: { type: 'number', description: 'ID do cartão' },
        descricao: { type: 'string', description: 'Descrição da compra' },
        valor_total: { type: 'number', description: 'Valor total da compra' },
        categoria_id: { type: 'number', description: 'ID da categoria' },
        data: { type: 'string', description: 'Data da compra (YYYY-MM-DD)' },
        parcelas: { type: 'number', description: 'Número de parcelas (padrão: 1)' }
      },
      required: ['user_id', 'cartao_id', 'descricao', 'valor_total', 'categoria_id']
    }
  },

  // === CATEGORIAS ===
  {
    name: 'listar_categorias',
    description: 'Lista todas as categorias disponíveis para transações.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        tipo: { type: 'string', enum: ['receita', 'despesa'], description: 'Filtrar por tipo' }
      },
      required: ['user_id']
    }
  },

  // === ORÇAMENTO ===
  {
    name: 'get_orcamento_mes',
    description: 'Retorna o orçamento do mês com valores planejados vs gastos por categoria.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        mes: { type: 'number', description: 'Mês (1-12, padrão: atual)' },
        ano: { type: 'number', description: 'Ano (padrão: atual)' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'definir_orcamento',
    description: 'Define ou atualiza o orçamento de uma categoria para um mês.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        categoria_id: { type: 'number', description: 'ID da categoria' },
        valor_planejado: { type: 'number', description: 'Valor orçado para a categoria' },
        mes: { type: 'number', description: 'Mês (1-12)' },
        ano: { type: 'number', description: 'Ano' }
      },
      required: ['user_id', 'categoria_id', 'valor_planejado', 'mes', 'ano']
    }
  },

  // === INDICADORES E RESUMO ===
  {
    name: 'get_resumo_financeiro',
    description: 'Retorna um resumo financeiro completo do mês: receitas, despesas, saldo, economia.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        mes: { type: 'number', description: 'Mês (1-12, padrão: atual)' },
        ano: { type: 'number', description: 'Ano (padrão: atual)' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'get_saude_financeira',
    description: 'Retorna indicadores de saúde financeira: score, índice de economia, status geral.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' }
      },
      required: ['user_id']
    }
  },

  // === METAS ===
  {
    name: 'listar_metas',
    description: 'Lista as metas financeiras do usuário.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        status: { type: 'string', enum: ['ativa', 'concluida', 'cancelada'], description: 'Filtrar por status' }
      },
      required: ['user_id']
    }
  },
  {
    name: 'criar_meta',
    description: 'Cria uma nova meta financeira.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        titulo: { type: 'string', description: 'Título da meta (ex: Viagem para Europa)' },
        valor_alvo: { type: 'number', description: 'Valor objetivo' },
        data_limite: { type: 'string', description: 'Data limite (YYYY-MM-DD)' },
        valor_atual: { type: 'number', description: 'Valor já acumulado (padrão: 0)' },
        icone: { type: 'string', description: 'Ícone da meta' },
        cor: { type: 'string', description: 'Cor em hexadecimal' }
      },
      required: ['user_id', 'titulo', 'valor_alvo']
    }
  },
  {
    name: 'atualizar_progresso_meta',
    description: 'Atualiza o valor atual de uma meta financeira.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'ID do usuário' },
        meta_id: { type: 'number', description: 'ID da meta' },
        valor_adicional: { type: 'number', description: 'Valor a adicionar ao progresso' }
      },
      required: ['user_id', 'meta_id', 'valor_adicional']
    }
  }
]

// ==================== TOOL EXECUTORS ====================

async function executeTool(
  toolName: string,
  params: any,
  supabase: SupabaseClient
): Promise<any> {

  switch (toolName) {
    case 'identificar_usuario':
      return await identificarUsuario(params, supabase)
    case 'get_perfil':
      return await getPerfil(params, supabase)
    case 'listar_contas':
      return await listarContas(params, supabase)
    case 'get_saldo_total':
      return await getSaldoTotal(params, supabase)
    case 'criar_conta':
      return await criarConta(params, supabase)
    case 'listar_transacoes':
      return await listarTransacoes(params, supabase)
    case 'criar_transacao':
      return await criarTransacao(params, supabase)
    case 'editar_transacao':
      return await editarTransacao(params, supabase)
    case 'excluir_transacao':
      return await excluirTransacao(params, supabase)
    case 'listar_transacoes_fixas':
      return await listarTransacoesFixas(params, supabase)
    case 'criar_transacao_fixa':
      return await criarTransacaoFixa(params, supabase)
    case 'listar_cartoes':
      return await listarCartoes(params, supabase)
    case 'get_fatura_atual':
      return await getFaturaAtual(params, supabase)
    case 'criar_despesa_cartao':
      return await criarDespesaCartao(params, supabase)
    case 'listar_categorias':
      return await listarCategorias(params, supabase)
    case 'get_orcamento_mes':
      return await getOrcamentoMes(params, supabase)
    case 'definir_orcamento':
      return await definirOrcamento(params, supabase)
    case 'get_resumo_financeiro':
      return await getResumoFinanceiro(params, supabase)
    case 'get_saude_financeira':
      return await getSaudeFinanceira(params, supabase)
    case 'listar_metas':
      return await listarMetas(params, supabase)
    case 'criar_meta':
      return await criarMeta(params, supabase)
    case 'atualizar_progresso_meta':
      return await atualizarProgressoMeta(params, supabase)
    default:
      throw new Error(`Tool não encontrada: ${toolName}`)
  }
}

// ==================== IMPLEMENTAÇÕES ====================

async function identificarUsuario(params: { telefone: string }, supabase: SupabaseClient) {
  const { telefone } = params
  let telefoneNormalizado = telefone.replace(/\s/g, '')
  if (!telefoneNormalizado.startsWith('+')) {
    telefoneNormalizado = '+' + telefoneNormalizado
  }

  const { data, error } = await supabase
    .from('app_perfil')
    .select('id, nome, email')
    .eq('telefone', telefoneNormalizado)
    .single()

  if (error || !data) {
    return {
      success: false,
      error: 'Usuário não encontrado com este telefone. Verifique se o número está cadastrado no sistema.'
    }
  }

  return {
    success: true,
    user_id: data.id,
    nome: data.nome,
    email: data.email
  }
}

async function getPerfil(params: { user_id: string }, supabase: SupabaseClient) {
  const { user_id } = params
  const { data, error } = await supabase
    .from('app_perfil')
    .select('*')
    .eq('id', user_id)
    .single()

  if (error) throw new Error(`Erro ao buscar perfil: ${error.message}`)
  return { success: true, perfil: data }
}

async function listarContas(params: { user_id: string, apenas_ativas?: boolean }, supabase: SupabaseClient) {
  const { user_id, apenas_ativas = true } = params
  let query = supabase
    .from('app_conta')
    .select('id, nome, tipo, saldo_atual, saldo_inicial, cor, icone, instituicao, status')
    .eq('user_id', user_id)
    .order('nome')

  if (apenas_ativas) {
    query = query.eq('status', 'ativo')
  }

  const { data, error } = await query
  if (error) throw new Error(`Erro ao listar contas: ${error.message}`)

  return {
    success: true,
    contas: data,
    total: data?.length || 0
  }
}

async function getSaldoTotal(params: { user_id: string }, supabase: SupabaseClient) {
  const { user_id } = params
  const { data, error } = await supabase
    .from('app_conta')
    .select('saldo_atual, nome')
    .eq('user_id', user_id)
    .eq('status', 'ativo')

  if (error) throw new Error(`Erro ao buscar saldos: ${error.message}`)

  const saldoTotal = data?.reduce((sum, conta) => sum + parseFloat(conta.saldo_atual || '0'), 0) || 0

  return {
    success: true,
    saldo_total: saldoTotal,
    detalhes: data?.map(c => ({ nome: c.nome, saldo: parseFloat(c.saldo_atual || '0') }))
  }
}

async function criarConta(params: any, supabase: SupabaseClient) {
  const { user_id, nome, tipo, saldo_inicial = 0, cor, icone } = params
  const { data, error } = await supabase
    .from('app_conta')
    .insert({
      user_id,
      nome,
      tipo,
      saldo_inicial,
      saldo_atual: saldo_inicial,
      cor: cor || '#6B7280',
      icone: icone || 'wallet',
      status: 'ativo'
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar conta: ${error.message}`)
  return { success: true, conta: data, mensagem: `Conta "${nome}" criada com sucesso!` }
}

async function listarTransacoes(params: any, supabase: SupabaseClient) {
  const { user_id, data_inicio, data_fim, tipo, categoria_id, conta_id, limite = 50 } = params

  let query = supabase
    .from('app_transacoes')
    .select('id, descricao, valor, data, tipo, status, observacoes, app_categoria(id, nome, cor, icone), app_conta(id, nome), app_cartao_credito(id, nome)')
    .eq('user_id', user_id)
    .order('data', { ascending: false })
    .limit(limite)

  if (data_inicio) query = query.gte('data', data_inicio)
  if (data_fim) query = query.lte('data', data_fim)
  if (tipo) query = query.eq('tipo', tipo)
  if (categoria_id) query = query.eq('categoria_id', categoria_id)
  if (conta_id) query = query.eq('conta_id', conta_id)

  const { data, error } = await query
  if (error) throw new Error(`Erro ao listar transações: ${error.message}`)

  const receitas = data?.filter(t => t.tipo === 'receita').reduce((s, t) => s + parseFloat(t.valor), 0) || 0
  const despesas = data?.filter(t => t.tipo !== 'receita').reduce((s, t) => s + parseFloat(t.valor), 0) || 0

  return {
    success: true,
    transacoes: data,
    total: data?.length || 0,
    resumo: { receitas, despesas, saldo: receitas - despesas }
  }
}

async function criarTransacao(params: any, supabase: SupabaseClient) {
  const { user_id, descricao, valor, tipo, categoria_id, conta_id, data, observacao } = params
  const dataTransacao = data || new Date().toISOString().split('T')[0]

  const { data: transacao, error } = await supabase
    .from('app_transacoes')
    .insert({
      user_id,
      descricao,
      valor,
      tipo,
      categoria_id,
      conta_id,
      data: dataTransacao,
      observacoes: observacao || null,
      status: 'confirmado',
      origem: 'manual'
    })
    .select('*, app_categoria(nome), app_conta(nome)')
    .single()

  if (error) throw new Error(`Erro ao criar transação: ${error.message}`)

  // NOTA: O saldo é atualizado automaticamente pelo trigger 'trigger_atualizar_saldo_conta'
  // NÃO chamar ajustar_saldo_conta manualmente para evitar duplicação

  return {
    success: true,
    transacao,
    mensagem: `${tipo === 'receita' ? 'Receita' : 'Despesa'} de R$ ${valor.toFixed(2)} registrada!`
  }
}

async function editarTransacao(params: any, supabase: SupabaseClient) {
  const { user_id, transacao_id, ...updates } = params

  const { data: existing } = await supabase
    .from('app_transacoes')
    .select('id')
    .eq('id', transacao_id)
    .eq('user_id', user_id)
    .single()

  if (!existing) {
    return { success: false, error: 'Transação não encontrada ou não pertence ao usuário' }
  }

  const { data, error } = await supabase
    .from('app_transacoes')
    .update(updates)
    .eq('id', transacao_id)
    .select()
    .single()

  if (error) throw new Error(`Erro ao editar transação: ${error.message}`)
  return { success: true, transacao: data, mensagem: 'Transação atualizada!' }
}

async function excluirTransacao(params: any, supabase: SupabaseClient) {
  const { user_id, transacao_id } = params

  const { data: transacao } = await supabase
    .from('app_transacoes')
    .select('valor, tipo, conta_id')
    .eq('id', transacao_id)
    .eq('user_id', user_id)
    .single()

  if (!transacao) {
    return { success: false, error: 'Transação não encontrada' }
  }

  const { error } = await supabase
    .from('app_transacoes')
    .delete()
    .eq('id', transacao_id)

  if (error) throw new Error(`Erro ao excluir transação: ${error.message}`)

  if (transacao.conta_id) {
    const ajuste = transacao.tipo === 'receita' ? -transacao.valor : transacao.valor
    await supabase.rpc('ajustar_saldo_conta', { p_conta_id: transacao.conta_id, p_valor: ajuste })
  }

  return { success: true, mensagem: 'Transação excluída com sucesso!' }
}

async function listarTransacoesFixas(params: any, supabase: SupabaseClient) {
  const { user_id, tipo, apenas_ativas = true } = params

  let query = supabase
    .from('app_transacoes_fixas')
    .select('id, descricao, valor, tipo, dia_mes, ativo, app_categoria(id, nome, cor), app_conta(id, nome)')
    .eq('user_id', user_id)
    .order('dia_mes')

  if (tipo) query = query.eq('tipo', tipo)
  if (apenas_ativas) query = query.eq('ativo', true)

  const { data, error } = await query
  if (error) throw new Error(`Erro ao listar transações fixas: ${error.message}`)

  const totalReceitas = data?.filter(t => t.tipo === 'receita').reduce((s, t) => s + parseFloat(t.valor), 0) || 0
  const totalDespesas = data?.filter(t => t.tipo === 'despesa').reduce((s, t) => s + parseFloat(t.valor), 0) || 0

  return {
    success: true,
    transacoes_fixas: data,
    resumo: {
      total_receitas_fixas: totalReceitas,
      total_despesas_fixas: totalDespesas,
      saldo_fixo_mensal: totalReceitas - totalDespesas
    }
  }
}

async function criarTransacaoFixa(params: any, supabase: SupabaseClient) {
  const { user_id, descricao, valor, tipo, categoria_id, conta_id, dia_vencimento } = params

  const { data, error } = await supabase
    .from('app_transacoes_fixas')
    .insert({
      user_id,
      descricao,
      valor,
      tipo,
      categoria_id,
      conta_id,
      dia_mes: dia_vencimento,
      data_inicio: new Date().toISOString().split('T')[0],
      ativo: true
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar transação fixa: ${error.message}`)
  return { success: true, transacao_fixa: data, mensagem: `Transação fixa "${descricao}" criada!` }
}

async function listarCartoes(params: { user_id: string }, supabase: SupabaseClient) {
  const { user_id } = params
  const { data, error } = await supabase
    .from('app_cartao_credito')
    .select('id, nome, limite, dia_fechamento, dia_vencimento, cor, icone, ultimos_quatro_digitos')
    .eq('user_id', user_id)
    .order('nome')

  if (error) throw new Error(`Erro ao listar cartões: ${error.message}`)
  return { success: true, cartoes: data, total: data?.length || 0 }
}

async function getFaturaAtual(params: any, supabase: SupabaseClient) {
  const { user_id, cartao_id, mes, ano } = params
  const now = new Date()
  const mesAtual = mes || now.getMonth() + 1
  const anoAtual = ano || now.getFullYear()

  const { data: fatura } = await supabase
    .from('app_fatura')
    .select('*')
    .eq('cartao_id', cartao_id)
    .eq('mes', mesAtual)
    .eq('ano', anoAtual)
    .single()

  const { data: transacoes } = await supabase
    .from('app_transacoes')
    .select('id, descricao, valor, data, parcela_atual, total_parcelas, app_categoria(nome, cor)')
    .eq('user_id', user_id)
    .eq('cartao_id', cartao_id)
    .eq('tipo', 'despesa_cartao')
    .gte('data', `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`)
    .lte('data', `${anoAtual}-${String(mesAtual).padStart(2, '0')}-31`)
    .order('data', { ascending: false })

  const valorTotal = transacoes?.reduce((s, t) => s + parseFloat(t.valor), 0) || 0

  return {
    success: true,
    fatura: fatura || { mes: mesAtual, ano: anoAtual },
    transacoes,
    valor_total: valorTotal,
    quantidade_transacoes: transacoes?.length || 0
  }
}

async function criarDespesaCartao(params: any, supabase: SupabaseClient) {
  const { user_id, cartao_id, descricao, valor_total, categoria_id, data, parcelas = 1 } = params
  const dataCompra = data || new Date().toISOString().split('T')[0]
  const valorParcela = valor_total / parcelas

  // Buscar dia_fechamento do cartao para informar fatura
  const { data: cartaoInfo } = await supabase
    .from('app_cartao_credito')
    .select('nome, dia_fechamento')
    .eq('id', cartao_id)
    .single()

  const grupoParcelamento = parcelas > 1 ? crypto.randomUUID() : null

  const transacoes = []
  for (let i = 1; i <= parcelas; i++) {
    const dataParcela = new Date(dataCompra)
    dataParcela.setMonth(dataParcela.getMonth() + (i - 1))

    transacoes.push({
      user_id,
      descricao: parcelas > 1 ? `${descricao} (${i}/${parcelas})` : descricao,
      valor: valorParcela,
      tipo: 'despesa_cartao',
      categoria_id,
      cartao_id,
      data: dataParcela.toISOString().split('T')[0],
      parcela_atual: i,
      total_parcelas: parcelas,
      grupo_parcelamento: grupoParcelamento,
      status: 'confirmado',
      origem: 'whatsapp'
    })
  }

  const { data: resultado, error } = await supabase
    .from('app_transacoes')
    .insert(transacoes)
    .select()

  if (error) throw new Error(`Erro ao registrar despesa: ${error.message}`)

  // Determinar fatura (espelha calcular_periodo_fatura do banco)
  const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  let faturaLabel = ''
  if (cartaoInfo?.dia_fechamento) {
    const dataRef = new Date(dataCompra + 'T12:00:00')
    const diaTransacao = dataRef.getDate()
    let mesFatura = dataRef.getMonth() + 1
    let anoFatura = dataRef.getFullYear()
    if (diaTransacao >= cartaoInfo.dia_fechamento) {
      if (mesFatura === 12) { mesFatura = 1; anoFatura++ } else { mesFatura++ }
    }
    faturaLabel = `\nFatura de ${mesesNomes[mesFatura - 1]} ${anoFatura}`
  }

  return {
    success: true,
    transacoes: resultado,
    mensagem: parcelas > 1
      ? `Compra de R$ ${valor_total.toFixed(2)} em ${parcelas}x de R$ ${valorParcela.toFixed(2)} registrada no ${cartaoInfo?.nome || 'cartao'}!${faturaLabel}`
      : `Despesa de R$ ${valor_total.toFixed(2)} no ${cartaoInfo?.nome || 'cartao'} registrada!${faturaLabel}`
  }
}

async function listarCategorias(params: any, supabase: SupabaseClient) {
  const { user_id, tipo } = params
  let query = supabase
    .from('app_categoria')
    .select('id, nome, tipo, cor, icone, is_default')
    .or(`user_id.eq.${user_id},is_default.eq.true`)
    .order('nome')

  if (tipo) query = query.eq('tipo', tipo)

  const { data, error } = await query
  if (error) throw new Error(`Erro ao listar categorias: ${error.message}`)
  return { success: true, categorias: data, total: data?.length || 0 }
}

async function getOrcamentoMes(params: any, supabase: SupabaseClient) {
  const { user_id, mes, ano } = params
  const now = new Date()
  const mesAtual = mes || now.getMonth() + 1
  const anoAtual = ano || now.getFullYear()

  const { data: orcamentos } = await supabase
    .from('app_orcamento')
    .select('id, valor, app_categoria(id, nome, cor, icone)')
    .eq('user_id', user_id)
    .eq('mes', mesAtual)
    .eq('ano', anoAtual)

  const { data: gastos } = await supabase
    .from('app_transacoes')
    .select('categoria_id, valor')
    .eq('user_id', user_id)
    .in('tipo', ['despesa', 'despesa_cartao'])
    .gte('data', `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`)
    .lte('data', `${anoAtual}-${String(mesAtual).padStart(2, '0')}-31`)

  const gastosPorCategoria: Record<number, number> = {}
  gastos?.forEach(g => {
    gastosPorCategoria[g.categoria_id] = (gastosPorCategoria[g.categoria_id] || 0) + parseFloat(g.valor)
  })

  const resultado = orcamentos?.map(o => ({
    categoria: o.app_categoria,
    valor_planejado: parseFloat(o.valor),
    valor_gasto: gastosPorCategoria[o.app_categoria.id] || 0,
    percentual: ((gastosPorCategoria[o.app_categoria.id] || 0) / parseFloat(o.valor)) * 100
  })) || []

  const totalPlanejado = resultado.reduce((s, o) => s + o.valor_planejado, 0)
  const totalGasto = resultado.reduce((s, o) => s + o.valor_gasto, 0)

  return {
    success: true,
    mes: mesAtual,
    ano: anoAtual,
    orcamentos: resultado,
    resumo: {
      total_planejado: totalPlanejado,
      total_gasto: totalGasto,
      saldo_disponivel: totalPlanejado - totalGasto,
      percentual_utilizado: totalPlanejado > 0 ? (totalGasto / totalPlanejado) * 100 : 0
    }
  }
}

async function definirOrcamento(params: any, supabase: SupabaseClient) {
  const { user_id, categoria_id, valor_planejado, mes, ano } = params

  // Primeiro tenta atualizar, se não existir, insere
  const { data: existing } = await supabase
    .from('app_orcamento')
    .select('id')
    .eq('user_id', user_id)
    .eq('categoria_id', categoria_id)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  let data, error
  if (existing) {
    const result = await supabase
      .from('app_orcamento')
      .update({ valor: valor_planejado })
      .eq('id', existing.id)
      .select()
      .single()
    data = result.data
    error = result.error
  } else {
    const result = await supabase
      .from('app_orcamento')
      .insert({
        user_id,
        categoria_id,
        valor: valor_planejado,
        mes,
        ano
      })
      .select()
      .single()
    data = result.data
    error = result.error
  }

  if (error) throw new Error(`Erro ao definir orçamento: ${error.message}`)
  return { success: true, orcamento: data, mensagem: `Orçamento de R$ ${valor_planejado.toFixed(2)} definido!` }
}

async function getResumoFinanceiro(params: any, supabase: SupabaseClient) {
  const { user_id, mes, ano } = params
  const now = new Date()
  const mesAtual = mes || now.getMonth() + 1
  const anoAtual = ano || now.getFullYear()

  const dataInicio = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`
  const dataFim = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-31`

  const { data: transacoes } = await supabase
    .from('app_transacoes')
    .select('tipo, valor, status')
    .eq('user_id', user_id)
    .gte('data', dataInicio)
    .lte('data', dataFim)

  const receitas = transacoes?.filter(t => t.tipo === 'receita').reduce((s, t) => s + parseFloat(t.valor), 0) || 0
  const despesas = transacoes?.filter(t => t.tipo === 'despesa').reduce((s, t) => s + parseFloat(t.valor), 0) || 0
  const despesasCartao = transacoes?.filter(t => t.tipo === 'despesa_cartao').reduce((s, t) => s + parseFloat(t.valor), 0) || 0

  const { data: contas } = await supabase
    .from('app_conta')
    .select('saldo_atual')
    .eq('user_id', user_id)
    .eq('status', 'ativo')

  const saldoTotal = contas?.reduce((s, c) => s + parseFloat(c.saldo_atual || '0'), 0) || 0

  const totalDespesas = despesas + despesasCartao
  const economia = receitas - totalDespesas
  const taxaEconomia = receitas > 0 ? (economia / receitas) * 100 : 0

  return {
    success: true,
    periodo: { mes: mesAtual, ano: anoAtual },
    resumo: {
      receitas,
      despesas,
      despesas_cartao: despesasCartao,
      total_despesas: totalDespesas,
      economia,
      taxa_economia: taxaEconomia.toFixed(1),
      saldo_contas: saldoTotal
    },
    analise: economia >= 0
      ? `Você economizou R$ ${economia.toFixed(2)} este mês (${taxaEconomia.toFixed(0)}% da renda)`
      : `Atenção: gastos excedem receitas em R$ ${Math.abs(economia).toFixed(2)}`
  }
}

async function getSaudeFinanceira(params: { user_id: string }, supabase: SupabaseClient) {
  const { user_id } = params

  const { data: indicadores } = await supabase
    .from('app_indicadores')
    .select('*')
    .eq('user_id', user_id)
    .order('ultima_atualizacao', { ascending: false })
    .limit(1)
    .single()

  const now = new Date()
  const mes = now.getMonth() + 1
  const ano = now.getFullYear()

  const resumo = await getResumoFinanceiro({ user_id, mes, ano }, supabase)

  let score = 50
  const taxaEconomia = parseFloat(resumo.resumo.taxa_economia)

  if (taxaEconomia >= 20) score += 30
  else if (taxaEconomia >= 10) score += 20
  else if (taxaEconomia >= 0) score += 10
  else score -= 20

  if (resumo.resumo.saldo_contas > 0) score += 10
  if (resumo.resumo.saldo_contas > resumo.resumo.total_despesas * 3) score += 10

  score = Math.max(0, Math.min(100, score))

  let status: string
  if (score >= 80) status = 'Excelente'
  else if (score >= 60) status = 'Bom'
  else if (score >= 40) status = 'Regular'
  else status = 'Atenção'

  return {
    success: true,
    saude_financeira: {
      score,
      status,
      taxa_economia: taxaEconomia,
      saldo_total: resumo.resumo.saldo_contas,
      indicadores: indicadores || null
    },
    dicas: score < 60 ? [
      'Tente economizar pelo menos 10% da sua renda',
      'Revise seus gastos recorrentes',
      'Monte uma reserva de emergência'
    ] : [
      'Continue mantendo seus hábitos financeiros',
      'Considere investir suas economias'
    ]
  }
}

async function listarMetas(params: any, supabase: SupabaseClient) {
  const { user_id } = params
  let query = supabase
    .from('app_meta_financeira')
    .select('*')
    .eq('user_id', user_id)
    .order('data_fim')

  const { data, error } = await query
  if (error) throw new Error(`Erro ao listar metas: ${error.message}`)

  const metas = data?.map(m => ({
    ...m,
    valor_alvo: m.valor_meta, // alias para compatibilidade
    progresso: m.valor_meta > 0 ? (m.valor_atual / m.valor_meta) * 100 : 0,
    falta: m.valor_meta - m.valor_atual
  }))

  return { success: true, metas, total: data?.length || 0 }
}

async function criarMeta(params: any, supabase: SupabaseClient) {
  const { user_id, titulo, valor_alvo, data_limite, valor_atual = 0, cor } = params

  const hoje = new Date().toISOString().split('T')[0]

  // data_fim é obrigatória - se não informada, define 1 ano a partir de hoje
  let dataFim = data_limite
  if (!dataFim) {
    const umAnoDepois = new Date()
    umAnoDepois.setFullYear(umAnoDepois.getFullYear() + 1)
    dataFim = umAnoDepois.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('app_meta_financeira')
    .insert({
      user_id,
      titulo,
      valor_meta: valor_alvo,
      valor_atual,
      data_inicio: hoje,
      data_fim: dataFim,
      cor: cor || '#10B981'
    })
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar meta: ${error.message}`)
  return { success: true, meta: data, mensagem: `Meta "${titulo}" criada! Objetivo: R$ ${valor_alvo.toFixed(2)}` }
}

async function atualizarProgressoMeta(params: any, supabase: SupabaseClient) {
  const { user_id, meta_id, valor_adicional } = params

  const { data: meta } = await supabase
    .from('app_meta_financeira')
    .select('valor_atual, valor_meta, titulo')
    .eq('id', meta_id)
    .eq('user_id', user_id)
    .single()

  if (!meta) {
    return { success: false, error: 'Meta não encontrada' }
  }

  const novoValor = parseFloat(meta.valor_atual) + valor_adicional
  const concluida = novoValor >= meta.valor_meta

  const { data, error } = await supabase
    .from('app_meta_financeira')
    .update({ valor_atual: novoValor })
    .eq('id', meta_id)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar meta: ${error.message}`)

  const progresso = (novoValor / meta.valor_meta) * 100

  return {
    success: true,
    meta: data,
    mensagem: concluida
      ? `Parabéns! Você atingiu a meta "${meta.titulo}"!`
      : `Meta atualizada: R$ ${novoValor.toFixed(2)} de R$ ${meta.valor_meta.toFixed(2)} (${progresso.toFixed(0)}%)`
  }
}

// ==================== MCP HANDLER ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const request: MCPRequest = await req.json()
    console.log('MCP Request:', request.method, request.params)

    let response: MCPResponse

    switch (request.method) {
      // === PROTOCOLO MCP - HANDSHAKE ===
      case 'initialize':
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: { listChanged: false } },
            serverInfo: { name: 'vitto-mcp-server', version: '1.0.0' }
          }
        }
        break

      case 'notifications/initialized':
        response = { jsonrpc: '2.0', id: request.id, result: {} }
        break

      // === TOOLS ===
      case 'tools/list':
        response = {
          jsonrpc: '2.0',
          id: request.id,
          result: { tools: TOOLS }
        }
        break

      case 'tools/call':
        const { name, arguments: args } = request.params
        try {
          const result = await executeTool(name, args || {}, supabase)
          response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }]
            }
          }
        } catch (toolError) {
          response = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: toolError.message
            }
          }
        }
        break

      default:
        response = {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Método não suportado: ${request.method}`
          }
        }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('MCP Server Error:', error)

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error',
        data: error.message
      }
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
