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

  try {
    const { messages, userId }: ChatRequest = await req.json()

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

    // Step 2: Build context and tools based on classification
    const contextualMessages = await buildContextualMessages(messages, userId, classification, supabase)
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
                    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
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
    financial_action: /^(gastei|paguei|recebi|criar|deletar|transferir|comprei|vendi)/i,
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
  supabase: any
): Promise<ChatMessage[]> {

  const systemPrompt = await buildSystemPrompt(userId, classification, supabase)

  const contextualMessages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...messages.slice(-5) // Keep last 5 messages for context
  ]

  return contextualMessages
}

// Build system prompt based on user and query type
async function buildSystemPrompt(userId: string, classification: QueryClassification, supabase: any): Promise<string> {
  let basePrompt = `Você é o Vitto, o assistente financeiro pessoal inteligente e empático do usuário.

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

  // Add specific context based on classification
  try {
    if (classification.type === 'direct_query' || classification.type === 'report_request') {
      // Get basic user financial summary
      const { data: accounts } = await supabase
        .from('app_conta')
        .select('saldo_atual')
        .eq('user_id', userId)

      const totalBalance = accounts?.reduce((sum: number, acc: any) =>
        sum + parseFloat(acc.saldo_atual || 0), 0) || 0

      basePrompt += `\n\nCONTEXTO FINANCEIRO ATUAL:
- Saldo total das contas: R$ ${totalBalance.toFixed(2)}
- Dados atualizados em tempo real`
    }
  } catch (error) {
    console.warn('Error building user context:', error)
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
        description: 'Criar uma nova transação financeira',
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
    }
  }

  switch (queryType) {
    case 'direct_query':
      return [allTools.getCurrentBalance, allTools.getRecentTransactions]

    case 'financial_action':
      return [allTools.createTransaction, allTools.getCurrentBalance]

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