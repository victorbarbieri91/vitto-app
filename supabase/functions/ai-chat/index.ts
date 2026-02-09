import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  id?: string
}

interface ChatRequest {
  messages: ChatMessage[]
  userId: string
  documentAnalysis?: string
}

interface QueryClassification {
  type: 'direct_query' | 'financial_action' | 'complex_analysis' | 'report_request' | 'document_processing'
  confidence: number
  extractedData?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  let activeAgent = 'communication' // Default agent
  let conversationData = ''

  try {
    const { messages, userId, documentAnalysis }: ChatRequest = await req.json()

    if (!messages || !userId) {
      throw new Error('Messages and userId are required')
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    if (!lastUserMessage) {
      throw new Error('No user message found')
    }

    // Initialize Supabase client for MCP operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get DeepSeek API key
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured')
    }

    console.log('Processing message:', lastUserMessage.content)
    console.log('User ID:', userId)

    // Step 1: Classify the query type
    const classification = await classifyQuery(lastUserMessage.content, deepseekApiKey)
    console.log('Query classification:', classification)

    // Determine active agent based on classification
    activeAgent = getActiveAgentForQuery(classification.type)

    // Step 2: Build context and tools based on classification
    const contextualMessages = await buildContextualMessages(messages, userId, classification, supabase, documentAnalysis)
    const tools = getToolsForQueryType(classification.type)

    // Step 3: Call DeepSeek API with streaming
    const deepSeekResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: contextualMessages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        stream: true,
        temperature: 0.1,
        max_tokens: 2000
      })
    })

    if (!deepSeekResponse.ok) {
      throw new Error(`DeepSeek API error: ${deepSeekResponse.status}`)
    }

    // Step 4: Create a ReadableStream to handle the response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = deepSeekResponse.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              controller.close()
              break
            }

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)

                if (data === '[DONE]') {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)

                  // Handle tool calls
                  if (parsed.choices?.[0]?.delta?.tool_calls) {
                    const toolCall = parsed.choices[0].delta.tool_calls[0]
                    if (toolCall?.function?.name) {
                      console.log('Tool call detected:', toolCall.function.name)

                      // Execute the tool call
                      const toolResult = await executeTool(toolCall.function, userId, supabase)

                      // Send tool result back to stream
                      const toolResponse = `data: ${JSON.stringify({
                        choices: [{
                          delta: {
                            content: toolResult.message || JSON.stringify(toolResult)
                          }
                        }]
                      })}\n\n`

                      controller.enqueue(new TextEncoder().encode(toolResponse))
                    }
                  }

                  // Handle regular content
                  if (parsed.choices?.[0]?.delta?.content) {
                    conversationData += parsed.choices[0].delta.content
                    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
                  }

                  // Handle conversation completion
                  if (parsed.choices?.[0]?.finish_reason === 'stop') {
                    // Log conversation and metrics
                    await logConversationAndMetrics(
                      supabase,
                      userId,
                      activeAgent,
                      lastUserMessage.content,
                      conversationData,
                      startTime
                    )
                  }

                } catch (parseError) {
                  console.warn('Error parsing streaming data:', parseError)
                }
              }
            }
          }
        } catch (error) {
          console.error('Error in stream processing:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Error in ai-chat function:', error)

    return new Response(JSON.stringify({
      error: error.message,
      details: 'AI chat processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Query classification function
async function classifyQuery(message: string, apiKey: string): Promise<QueryClassification> {
  const patterns = {
    direct_query: /^(qual|quanto|listar|mostrar|ver|consultar).*(saldo|valor|transaç|conta|receita|despesa)/i,
    financial_action: /^(gastei|paguei|recebi|criar|deletar|transferir|comprei|vendi|coloquei|coloca|cartao|cartão|credito|crédito|parcela)/i,
    complex_analysis: /^(por que|como|analise|compare|padrão|tendência|insight|comportamento)/i,
    report_request: /^(resumo|relatório|situação|saúde financeira|balanço|análise geral)/i,
    document_processing: /(pdf|fatura|comprovante|anexo|documento|arquivo)/i
  }

  // First try pattern matching
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(message)) {
      return {
        type: type as QueryClassification['type'],
        confidence: 0.9
      }
    }
  }

  // Fallback to DeepSeek classification
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'system',
          content: `Classifique esta mensagem financeira em uma das categorias:
          - direct_query: pergunta direta sobre dados (saldo, transações, valores)
          - financial_action: ação financeira (criar, editar, deletar transações)
          - complex_analysis: análise complexa (padrões, tendências, insights)
          - report_request: solicitação de relatório
          - document_processing: processamento de documento

          Responda apenas com a categoria.`
        }, {
          role: 'user',
          content: message
        }],
        temperature: 0,
        max_tokens: 50
      })
    })

    const result = await response.json()
    const classification = result.choices?.[0]?.message?.content?.trim().toLowerCase()

    const validTypes = ['direct_query', 'financial_action', 'complex_analysis', 'report_request', 'document_processing']

    return {
      type: validTypes.includes(classification) ? classification as QueryClassification['type'] : 'direct_query',
      confidence: 0.7
    }
  } catch (error) {
    console.warn('Classification fallback failed, using direct_query:', error)
    return {
      type: 'direct_query',
      confidence: 0.5
    }
  }
}

// Build contextual messages based on query type
async function buildContextualMessages(
  messages: ChatMessage[],
  userId: string,
  classification: QueryClassification,
  supabase: any,
  documentAnalysis?: string
): Promise<ChatMessage[]> {

  const systemPrompt = await buildSystemPrompt(userId, classification, supabase, documentAnalysis)

  const contextualMessages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...messages.slice(-5) // Keep last 5 messages for context
  ]

  return contextualMessages
}

// Get agent configurations from database
async function getAgentConfigs(supabase: any): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase
      .from('app_agente_config')
      .select('tipo, prompt_system, parametros')
      .eq('ativo', true)

    if (error) {
      console.warn('Error fetching agent configs:', error)
      return {}
    }

    return data.reduce((acc: Record<string, any>, config: any) => {
      acc[config.tipo] = config
      return acc
    }, {})
  } catch (error) {
    console.warn('Exception fetching agent configs:', error)
    return {}
  }
}

// Build system prompt based on user and query type
async function buildSystemPrompt(userId: string, classification: QueryClassification, supabase: any, documentAnalysis?: string): Promise<string> {
  // Get dynamic prompts from database
  const agentConfigs = await getAgentConfigs(supabase)

  // Use dynamic prompt for communication agent or fallback to default
  let basePrompt = agentConfigs?.communication?.prompt_system || `Você é o Vitto, o assistente financeiro pessoal inteligente e empático do usuário.

PERSONALIDADE:
- Seja natural, amigável e profissional
- Use linguagem brasileira e informal quando apropriado
- Seja proativo em oferecer insights valiosos
- Sempre confirme ações destrutivas antes de executar

CAPACIDADES:
- Consultar dados financeiros reais do usuário
- Criar, editar e excluir transações
- Analisar padrões e tendências
- Processar documentos financeiros
- Gerar relatórios personalizados

REGRAS IMPORTANTES:
1. NUNCA invente dados - use apenas informações reais do banco de dados
2. SEMPRE confirme antes de executar ações (criar/editar/deletar)
3. Seja específico e útil nas respostas
4. Use emojis apropriados para tornar a conversa mais amigável`

  // Add knowledge base rules
  try {
    const { data: knowledgeRules } = await supabase
      .from('app_knowledge_base')
      .select('titulo, conteudo, categoria')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(15)

    if (knowledgeRules?.length) {
      basePrompt += '\n\nREGRAS DO SISTEMA (base de conhecimento):\n'
      knowledgeRules.forEach((rule: any) => {
        basePrompt += `\n### ${rule.titulo}\n${rule.conteudo}\n`
      })
    }
  } catch (error) {
    console.warn('Error fetching knowledge base:', error)
  }

  // Add specific context based on classification
  try {
    // Get basic user financial summary
    const { data: accounts } = await supabase
      .from('app_conta')
      .select('id, nome, saldo_atual')
      .eq('user_id', userId)
      .eq('status', 'ativa')

    const totalBalance = accounts?.reduce((sum: number, acc: any) =>
      sum + parseFloat(acc.saldo_atual || 0), 0) || 0

    basePrompt += `\n\nCONTEXTO FINANCEIRO ATUAL:
- Saldo total das contas: R$ ${totalBalance.toFixed(2)}
- Contas: ${accounts?.map((a: any) => `${a.nome} (R$ ${parseFloat(a.saldo_atual || 0).toFixed(2)})`).join(', ') || 'nenhuma'}
- Dados atualizados em tempo real`

    // Get user's credit cards
    const { data: cards } = await supabase
      .from('app_cartao_credito')
      .select('id, nome, limite, dia_fechamento')
      .eq('user_id', userId)

    if (cards?.length) {
      basePrompt += `\n\nCARTÕES DE CRÉDITO DO USUÁRIO:\n${cards.map((c: any) =>
        `- ${c.nome} (ID: ${c.id}, limite: R$ ${parseFloat(c.limite || 0).toFixed(2)}, fechamento dia ${c.dia_fechamento})`
      ).join('\n')}`
      basePrompt += `\n\nIMPORTANTE CARTÃO: Quando o usuário mencionar "cartão", "crédito", "cartao" ou o nome de um cartão, use a tool createCreditCardTransaction. O tipo deve ser 'despesa_cartao'. Use o nome do cartão para buscar o correto.`
    }
  } catch (error) {
    console.warn('Error building user context:', error)
  }

  // Add document analysis if available
  if (documentAnalysis) {
    basePrompt += `\n\nDOCUMENTO ANALISADO:
${documentAnalysis}

INSTRUÇÕES PARA DOCUMENTO:
- O usuário anexou um documento financeiro que foi analisado
- Use as informações extraídas para contextualizar sua resposta
- Se o documento contém transações, ofereça para importá-las
- Se há discrepâncias nos dados, aponte e ofereça correções
- Seja específico sobre os dados encontrados`
  }

  return basePrompt
}

// Get tools based on query classification
function getToolsForQueryType(queryType: QueryClassification['type']): any[] {
  const allTools = {
    getCurrentBalance: {
      type: 'function',
      function: {
        name: 'getCurrentBalance',
        description: 'Obter o saldo atual total de todas as contas do usuário',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    getRecentTransactions: {
      type: 'function',
      function: {
        name: 'getRecentTransactions',
        description: 'Listar transações recentes do usuário',
        parameters: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Número de transações a retornar (padrão: 10)'
            },
            days: {
              type: 'number',
              description: 'Número de dias para buscar (padrão: 30)'
            }
          }
        }
      }
    },
    createTransaction: {
      type: 'function',
      function: {
        name: 'createTransaction',
        description: 'Criar uma nova transação financeira (receita ou despesa em conta bancária). NÃO use para cartão de crédito.',
        parameters: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Descrição da transação'
            },
            amount: {
              type: 'number',
              description: 'Valor da transação (sempre positivo)'
            },
            type: {
              type: 'string',
              enum: ['receita', 'despesa'],
              description: 'Tipo da transação'
            },
            category: {
              type: 'string',
              description: 'Nome da categoria'
            },
            date: {
              type: 'string',
              description: 'Data da transação (YYYY-MM-DD)'
            }
          },
          required: ['description', 'amount', 'type', 'category']
        }
      }
    },
    createCreditCardTransaction: {
      type: 'function',
      function: {
        name: 'createCreditCardTransaction',
        description: 'Criar uma despesa no cartão de crédito. Use quando o usuário mencionar cartão, crédito, ou nome de um cartão. A transação será atribuída à fatura correta automaticamente.',
        parameters: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Descrição da compra'
            },
            amount: {
              type: 'number',
              description: 'Valor da compra (sempre positivo)'
            },
            card_name: {
              type: 'string',
              description: 'Nome do cartão de crédito (ex: C6, Nubank, Inter). Se não informado, usa o primeiro cartão.'
            },
            category: {
              type: 'string',
              description: 'Nome da categoria (ex: Alimentação, Transporte, Lazer)'
            },
            date: {
              type: 'string',
              description: 'Data da compra (YYYY-MM-DD). Se não informada, usa hoje.'
            },
            installments: {
              type: 'number',
              description: 'Número de parcelas. Se não informado, é compra à vista (1x).'
            }
          },
          required: ['description', 'amount']
        }
      }
    }
  }

  switch (queryType) {
    case 'direct_query':
      return [allTools.getCurrentBalance, allTools.getRecentTransactions]

    case 'financial_action':
      return [allTools.createTransaction, allTools.createCreditCardTransaction, allTools.getCurrentBalance]

    case 'report_request':
      return [allTools.getCurrentBalance, allTools.getRecentTransactions]

    default:
      return [allTools.getCurrentBalance]
  }
}

// Execute tool calls
async function executeTool(functionCall: any, userId: string, supabase: any): Promise<any> {
  const { name, arguments: args } = functionCall

  let parsedArgs: any = {}
  try {
    parsedArgs = args ? JSON.parse(args) : {}
  } catch (error) {
    console.warn('Error parsing tool arguments:', error)
  }

  console.log(`Executing tool: ${name} with args:`, parsedArgs)

  try {
    switch (name) {
      case 'getCurrentBalance':
        return await executeGetCurrentBalance(userId, supabase)

      case 'getRecentTransactions':
        return await executeGetRecentTransactions(userId, parsedArgs, supabase)

      case 'createTransaction':
        return await executeCreateTransaction(userId, parsedArgs, supabase)

      case 'createCreditCardTransaction':
        return await executeCreateCreditCardTransaction(userId, parsedArgs, supabase)

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error)
    return {
      success: false,
      error: error.message,
      message: `Erro ao executar ${name}: ${error.message}`
    }
  }
}

// Tool implementations
async function executeGetCurrentBalance(userId: string, supabase: any) {
  const { data, error } = await supabase
    .from('app_conta')
    .select('id, nome, saldo_atual')
    .eq('user_id', userId)
    .eq('status', 'ativa')

  if (error) throw error

  const accounts = data || []
  const totalBalance = accounts.reduce((sum: number, account: any) =>
    sum + parseFloat(account.saldo_atual || 0), 0)

  return {
    success: true,
    totalBalance,
    accounts: accounts.map((acc: any) => ({
      name: acc.nome,
      balance: parseFloat(acc.saldo_atual || 0)
    })),
    message: `Saldo total: R$ ${totalBalance.toFixed(2)}\n\nDetalhes por conta:\n${accounts.map((acc: any) =>
      `• ${acc.nome}: R$ ${parseFloat(acc.saldo_atual || 0).toFixed(2)}`).join('\n')}`
  }
}

async function executeGetRecentTransactions(userId: string, args: any, supabase: any) {
  const limit = args.limit || 10
  const days = args.days || 30

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('app_transacoes')
    .select(`
      id,
      descricao,
      valor,
      data,
      tipo,
      status,
      app_categoria(nome, cor),
      app_conta(nome)
    `)
    .eq('user_id', userId)
    .gte('data', startDate.toISOString().split('T')[0])
    .order('data', { ascending: false })
    .limit(limit)

  if (error) throw error

  const transactions = data || []

  return {
    success: true,
    transactions,
    count: transactions.length,
    message: `Últimas ${transactions.length} transações:\n\n${transactions.map((t: any) =>
      `${t.data} • ${t.tipo === 'receita' ? '+' : '-'}R$ ${t.valor.toFixed(2)}\n${t.descricao} (${t.app_categoria?.nome || 'Sem categoria'})`
    ).join('\n\n')}`
  }
}

async function executeCreateTransaction(userId: string, args: any, supabase: any) {
  const { description, amount, type, category, date } = args

  // Find or create category
  let { data: categoryData, error: categoryError } = await supabase
    .from('app_categoria')
    .select('id')
    .ilike('nome', `%${category}%`)
    .limit(1)

  if (categoryError) throw categoryError

  let categoryId = categoryData?.[0]?.id

  if (!categoryId) {
    // Create category if not found
    const { data: newCategory, error: createCategoryError } = await supabase
      .from('app_categoria')
      .insert({
        nome: category,
        tipo: type,
        cor: '#6B7280',
        icone: 'tag',
        is_default: false
      })
      .select('id')
      .single()

    if (createCategoryError) throw createCategoryError
    categoryId = newCategory.id
  }

  // Get user's primary account (first active account)
  const { data: accounts, error: accountError } = await supabase
    .from('app_conta')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'ativa')
    .limit(1)

  if (accountError) throw accountError
  if (!accounts?.length) {
    throw new Error('Nenhuma conta ativa encontrada')
  }

  const accountId = accounts[0].id

  // Create transaction
  const transactionDate = date || new Date().toISOString().split('T')[0]

  const { data: transaction, error: transactionError } = await supabase
    .from('app_transacoes')
    .insert({
      user_id: userId,
      descricao: description,
      valor: amount,
      data: transactionDate,
      tipo: type,
      categoria_id: categoryId,
      conta_id: accountId,
      status: 'pendente',
      origem: 'ai_chat'
    })
    .select()
    .single()

  if (transactionError) throw transactionError

  return {
    success: true,
    transaction,
    message: `✅ Transação criada com sucesso!\n\n${type === 'receita' ? 'Receita' : 'Despesa'} de R$ ${amount.toFixed(2)}\nDescrição: ${description}\nCategoria: ${category}\nData: ${transactionDate}\n\n⚠️ Status: Pendente (confirme no dashboard para finalizar)`
  }
}

async function executeCreateCreditCardTransaction(userId: string, args: any, supabase: any) {
  const { description, amount, card_name, category, date, installments } = args

  // Find credit card by name or get first one
  let cardQuery = supabase
    .from('app_cartao_credito')
    .select('id, nome, dia_fechamento')
    .eq('user_id', userId)

  if (card_name) {
    cardQuery = cardQuery.ilike('nome', `%${card_name}%`)
  }

  const { data: cards, error: cardError } = await cardQuery.limit(1)

  if (cardError) throw cardError
  if (!cards?.length) {
    throw new Error('Nenhum cartão de crédito encontrado. Cadastre um cartão primeiro.')
  }

  const card = cards[0]

  // Find or create category
  let categoryId: number | null = null
  const categoryName = category || 'Outros'

  const { data: categoryData } = await supabase
    .from('app_categoria')
    .select('id')
    .ilike('nome', `%${categoryName}%`)
    .limit(1)

  if (categoryData?.[0]) {
    categoryId = categoryData[0].id
  } else {
    const { data: newCategory, error: createCatError } = await supabase
      .from('app_categoria')
      .insert({
        nome: categoryName,
        tipo: 'ambos',
        cor: '#6B7280',
        icone: 'tag',
        is_default: false
      })
      .select('id')
      .single()

    if (createCatError) throw createCatError
    categoryId = newCategory.id
  }

  const transactionDate = date || new Date().toISOString().split('T')[0]
  const totalParcelas = installments || 1
  const valorParcela = totalParcelas > 1 ? Math.round((amount / totalParcelas) * 100) / 100 : amount

  const grupoParcelamento = totalParcelas > 1 ? crypto.randomUUID() : null

  const transacoes = []

  for (let parcela = 1; parcela <= totalParcelas; parcela++) {
    const dataParcela = new Date(transactionDate)
    dataParcela.setMonth(dataParcela.getMonth() + (parcela - 1))
    const dataStr = dataParcela.toISOString().split('T')[0]

    const descParcela = totalParcelas > 1
      ? `${description} (${parcela}/${totalParcelas})`
      : description

    transacoes.push({
      user_id: userId,
      descricao: descParcela,
      valor: valorParcela,
      data: dataStr,
      tipo: 'despesa_cartao',
      categoria_id: categoryId,
      cartao_id: card.id,
      conta_id: null,
      status: 'confirmado',
      origem: 'ai_chat',
      parcela_atual: totalParcelas > 1 ? parcela : null,
      total_parcelas: totalParcelas > 1 ? totalParcelas : null,
      grupo_parcelamento: grupoParcelamento,
    })
  }

  const { data: created, error: insertError } = await supabase
    .from('app_transacoes')
    .insert(transacoes)
    .select()

  if (insertError) throw insertError

  // Determine which fatura the expense was assigned to (mirrors calcular_periodo_fatura DB logic)
  const mesesNomes = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const dataRef = new Date(transactionDate + 'T12:00:00')
  const diaTransacao = dataRef.getDate()
  let mesFatura = dataRef.getMonth() + 1
  let anoFatura = dataRef.getFullYear()
  if (diaTransacao >= card.dia_fechamento) {
    if (mesFatura === 12) { mesFatura = 1; anoFatura++ } else { mesFatura++ }
  }
  const faturaLabel = `Fatura de ${mesesNomes[mesFatura - 1]} ${anoFatura}`

  const parcelaInfo = totalParcelas > 1
    ? `\nParcelado em ${totalParcelas}x de R$ ${valorParcela.toFixed(2)}`
    : ''

  return {
    success: true,
    transactions: created,
    message: `✅ Compra registrada no cartão ${card.nome}!\n\nDescrição: ${description}\nValor: R$ ${amount.toFixed(2)}${parcelaInfo}\nData: ${transactionDate}\nCartão: ${card.nome} (fechamento dia ${card.dia_fechamento})\n📋 ${faturaLabel}`
  }
}

// Function to determine active agent based on query type
function getActiveAgentForQuery(queryType: string): string {
  const agentMapping: Record<string, string> = {
    'direct_query': 'communication',
    'financial_action': 'execution',
    'complex_analysis': 'analysis',
    'report_request': 'analysis',
    'document_processing': 'document',
    'anomaly_detection': 'validation'
  }

  return agentMapping[queryType] || 'communication'
}

// Function to log conversation and update metrics
async function logConversationAndMetrics(
  supabase: any,
  userId: string,
  agentType: string,
  userMessage: string,
  agentResponse: string,
  startTime: number
): Promise<void> {
  try {
    const responseTime = Date.now() - startTime
    const success = !agentResponse.toLowerCase().includes('erro') &&
                   !agentResponse.toLowerCase().includes('desculpe') &&
                   agentResponse.trim().length > 10

    // Get agent config for prompt
    const { data: agentConfig } = await supabase
      .from('app_agente_config')
      .select('prompt_system')
      .eq('tipo', agentType)
      .eq('ativo', true)
      .single()

    // Log conversation
    const { error: logError } = await supabase
      .from('app_conversas_log')
      .insert({
        usuario_id: userId,
        agente_tipo: agentType,
        mensagem_usuario: userMessage,
        resposta_agente: agentResponse,
        prompt_usado: agentConfig?.prompt_system?.substring(0, 500) || '',
        tokens_entrada: Math.ceil(userMessage.length / 4), // Aproximação
        tokens_saida: Math.ceil(agentResponse.length / 4), // Aproximação
        tempo_resposta_ms: responseTime,
        contexto_usado: JSON.stringify({
          query_classified: true,
          agent_used: agentType,
          response_time: responseTime
        })
      })

    if (logError) {
      console.warn('Error logging conversation:', logError)
    }

    // Update metrics
    const today = new Date().toISOString().split('T')[0]
    const { error: metricsError } = await supabase.rpc('update_agent_metrics', {
      p_agente_tipo: agentType,
      p_data_metricas: today,
      p_sucesso: success,
      p_tempo_resposta_ms: responseTime,
      p_feedback: null
    })

    if (metricsError) {
      console.warn('Error updating metrics:', metricsError)
    }

    console.log(`Metrics logged: Agent=${agentType}, Success=${success}, Time=${responseTime}ms`)

  } catch (error) {
    console.warn('Exception in logConversationAndMetrics:', error)
  }
}