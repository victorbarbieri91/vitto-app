import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessDocumentRequest {
  textContent?: string;  // Texto extraido do documento
  imageBase64?: string;  // Imagem em base64 (para futuro suporte OCR)
  mimeType?: string;
  userId: string;
}

interface ExtractedFinancialData {
  tipo_documento: 'extrato_bancario' | 'cupom_fiscal' | 'comprovante_pix' | 'fatura_cartao' | 'outro';
  confianca: number;
  dados_extraidos: {
    banco?: string;
    conta?: string;
    agencia?: string;
    saldo_anterior?: number;
    saldo_atual?: number;
    transacoes?: Array<{
      data: string;
      descricao: string;
      valor: number;
      tipo: 'credito' | 'debito';
      categoria_sugerida?: string;
    }>;
    estabelecimento?: string;
    cnpj?: string;
    data_transacao?: string;
    total?: number;
    itens?: Array<{
      descricao: string;
      quantidade?: number;
      valor_unitario?: number;
      valor_total: number;
    }>;
    valor_pix?: number;
    destinatario?: string;
    chave_pix?: string;
    data_pix?: string;
    moeda?: string;
    periodo?: {
      data_inicio: string;
      data_fim: string;
    };
  };
  observacoes: string[];
  sugestoes_acao: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { textContent, userId }: ProcessDocumentRequest = await req.json()

    if (!textContent) {
      throw new Error('textContent is required')
    }

    // Get DeepSeek API key (same as ai-chat function)
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured')
    }

    console.log('Processing document for user:', userId)
    console.log('Text length:', textContent.length)
    // Log primeiros 500 caracteres para debug
    console.log('Text preview:', textContent.substring(0, 500))

    // Build analysis prompt with the document text
    const analysisPrompt = buildTextAnalysisPrompt(textContent)

    // Call DeepSeek Chat API
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Voce e um extrator de dados preciso. NUNCA invente dados. Extraia SOMENTE o que esta escrito no documento. Se nao houver dados claros, retorne arrays vazios.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API error:', response.status, errorText)
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response from DeepSeek API')
    }

    console.log('DeepSeek response received, parsing...')

    // Parse the response
    let extractedData: ExtractedFinancialData

    try {
      // Extract JSON from response (may be wrapped in markdown code block)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      const jsonContent = jsonMatch ? jsonMatch[1] : content

      extractedData = JSON.parse(jsonContent)

      // Validate basic structure
      if (!extractedData.tipo_documento || extractedData.confianca === undefined) {
        throw new Error('Invalid data structure')
      }
    } catch (parseError) {
      console.error('Error parsing DeepSeek response:', parseError)
      console.log('Raw response:', content)

      // Fallback response
      extractedData = {
        tipo_documento: 'outro',
        confianca: 0.3,
        dados_extraidos: {},
        observacoes: ['Erro ao parsear dados estruturados do documento'],
        sugestoes_acao: ['Tente anexar um documento com texto mais claro']
      }
    }

    console.log('Document processed successfully:', extractedData.tipo_documento)

    return new Response(JSON.stringify({
      success: true,
      data: extractedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in process-document function:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function buildTextAnalysisPrompt(documentText: string): string {
  return `Voce e um extrator de dados de documentos financeiros brasileiros. Sua tarefa e EXTRAIR APENAS os dados que REALMENTE EXISTEM no texto abaixo.

REGRA CRITICA - LEIA COM ATENCAO:
- NUNCA invente, crie ou fabrique dados
- NUNCA use exemplos ou dados de demonstracao
- SOMENTE extraia informacoes que estao LITERALMENTE escritas no texto
- Se nao encontrar transacoes claras, retorne array vazio
- E melhor retornar vazio do que inventar dados

TEXTO DO DOCUMENTO PARA EXTRAIR:
===INICIO DO DOCUMENTO===
${documentText}
===FIM DO DOCUMENTO===

TAREFA:
Extraia SOMENTE as transacoes que voce consegue identificar CLARAMENTE no texto acima.
Cada transacao deve ter: data (se presente), descricao EXATA como aparece no documento, e valor.

FORMATO DE RESPOSTA (JSON):

\`\`\`json
{
  "tipo_documento": "fatura_cartao",
  "confianca": 0.8,
  "dados_extraidos": {
    "banco": "nome se encontrado no texto",
    "transacoes": [
      {
        "data": "2024-01-15",
        "descricao": "DESCRICAO EXATA DO DOCUMENTO",
        "valor": 123.45,
        "tipo": "debito",
        "categoria_sugerida": "alimentacao"
      }
    ]
  },
  "observacoes": ["X transacoes encontradas no documento"],
  "sugestoes_acao": ["Revisar transacoes antes de importar"]
}
\`\`\`

REGRAS DE EXTRACAO:
- Descricao: copie EXATAMENTE como aparece (ex: "IFOOD *IFOOD", "PAG*JoseMaria")
- Valor: numero positivo em float (ex: 45.90)
- Data: formato YYYY-MM-DD (se nao tiver ano, use 2024)
- tipo: sempre "debito" para compras/gastos
- Categorias: alimentacao, transporte, saude, lazer, casa, compras, outros
- Se o texto estiver ilegivel ou nao conter transacoes, retorne transacoes: []

EXTRAIA AGORA os dados REAIS do documento acima:`
}
