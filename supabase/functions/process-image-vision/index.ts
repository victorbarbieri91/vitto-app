import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessImageRequest {
  imageBase64: string;
  mimeType: string;
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
    const { imageBase64, mimeType, userId }: ProcessImageRequest = await req.json()

    if (!imageBase64) {
      throw new Error('imageBase64 is required')
    }

    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured in Supabase secrets')
    }

    // Get vision model from env or use default
    const visionModel = Deno.env.get('VISION_MODEL') || 'gpt-4o-mini'

    console.log('Processing image for user:', userId)
    console.log('Image size:', imageBase64.length, 'chars')
    console.log('Using vision model:', visionModel)

    // Build analysis prompt for GPT Vision
    const systemPrompt = buildVisionSystemPrompt()
    const userPrompt = buildVisionUserPrompt()

    // Call OpenAI GPT Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType || 'image/png'};base64,${imageBase64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI Vision API')
    }

    console.log('OpenAI Vision response received, parsing...')

    // Parse the response
    let extractedData: ExtractedFinancialData

    try {
      // Extract JSON from response (may be wrapped in markdown code block)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
      const jsonContent = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content

      extractedData = JSON.parse(jsonContent)

      // Validate basic structure
      if (!extractedData.tipo_documento || extractedData.confianca === undefined) {
        throw new Error('Invalid data structure')
      }

      // Normalize transactions
      if (extractedData.dados_extraidos?.transacoes) {
        extractedData.dados_extraidos.transacoes = extractedData.dados_extraidos.transacoes.map(t => ({
          data: normalizeDate(t.data),
          descricao: String(t.descricao || '').trim(),
          valor: Math.abs(parseFloat(String(t.valor)) || 0),
          tipo: t.tipo === 'credito' ? 'credito' : 'debito',
          categoria_sugerida: t.categoria_sugerida || 'outros'
        }))
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI Vision response:', parseError)
      console.log('Raw response:', content)

      // Fallback response
      extractedData = {
        tipo_documento: 'outro',
        confianca: 0.3,
        dados_extraidos: {},
        observacoes: ['Erro ao extrair dados estruturados da imagem'],
        sugestoes_acao: ['Tente uma imagem com melhor qualidade ou iluminacao']
      }
    }

    console.log('Image processed successfully:', extractedData.tipo_documento)
    console.log('Transactions found:', extractedData.dados_extraidos?.transacoes?.length || 0)

    return new Response(JSON.stringify({
      success: true,
      data: extractedData,
      model_used: visionModel
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in process-image-vision function:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function buildVisionSystemPrompt(): string {
  return `Voce e um especialista em leitura de documentos financeiros brasileiros usando OCR e visao computacional.
Sua tarefa e extrair TODOS os dados financeiros visiveis na imagem fornecida.

TIPOS DE DOCUMENTO QUE VOCE PODE ENCONTRAR:
1. FATURA DE CARTAO - Extraia: transacoes (data, descricao, valor), total, vencimento, banco
2. EXTRATO BANCARIO - Extraia: transacoes, saldos, banco, conta, agencia
3. COMPROVANTE PIX - Extraia: valor, destinatario, data, chave pix
4. CUPOM FISCAL - Extraia: itens, valores, estabelecimento, CNPJ, total
5. PRINT DE APP BANCARIO - Extraia: saldo, transacoes visiveis, banco

REGRAS CRITICAS:
- Valores em reais (R$) devem ser convertidos para numeros float (ex: R$ 150,00 -> 150.00)
- Datas em formato YYYY-MM-DD (se nao tiver ano, assuma o ano atual)
- Transacoes de SAIDA/COMPRA sao "debito", de ENTRADA/DEPOSITO sao "credito"
- NUNCA invente dados - extraia SOMENTE o que esta visivel na imagem
- Se algo estiver ilegivel, indique nas observacoes
- Seja preciso com valores e descricoes

CATEGORIAS PARA TRANSACOES:
- alimentacao: restaurantes, supermercados, ifood, padarias
- transporte: uber, 99, combustivel, estacionamento
- saude: farmacias, clinicas, hospitais
- lazer: netflix, spotify, cinema, jogos
- casa: energia, agua, internet, aluguel
- compras: lojas, amazon, mercado livre
- outros: quando nao se encaixar em nenhuma

Responda SEMPRE em JSON valido.`
}

function buildVisionUserPrompt(): string {
  return `Analise esta imagem de documento financeiro brasileiro e extraia TODOS os dados estruturados.

Se for uma fatura de cartao, extraia TODAS as transacoes visiveis com data, descricao exata e valor.
Se for um extrato bancario, extraia movimentacoes e saldos.
Se for um comprovante, extraia os dados da transacao.

FORMATO DE RESPOSTA (JSON):

\`\`\`json
{
  "tipo_documento": "fatura_cartao|extrato_bancario|comprovante_pix|cupom_fiscal|outro",
  "confianca": 0.0-1.0,
  "dados_extraidos": {
    "banco": "nome do banco se visivel",
    "conta": "numero da conta se visivel",
    "saldo_atual": numero ou null,
    "transacoes": [
      {
        "data": "YYYY-MM-DD",
        "descricao": "DESCRICAO EXATA COMO APARECE",
        "valor": numero_positivo,
        "tipo": "credito|debito",
        "categoria_sugerida": "categoria"
      }
    ],
    "total": numero ou null,
    "valor_pix": numero ou null,
    "destinatario": "nome se visivel",
    "estabelecimento": "nome se visivel"
  },
  "observacoes": ["observacao 1", "observacao 2"],
  "sugestoes_acao": ["Revisar transacoes antes de importar"]
}
\`\`\`

EXTRAIA AGORA todos os dados visiveis na imagem:`
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]

  try {
    // DD/MM/YYYY or DD-MM-YYYY
    const brMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
    if (brMatch) {
      const day = brMatch[1].padStart(2, '0')
      const month = brMatch[2].padStart(2, '0')
      let year = brMatch[3]
      if (year.length === 2) year = '20' + year
      return `${year}-${month}-${day}`
    }

    // YYYY-MM-DD (already correct)
    const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (isoMatch) {
      return dateStr
    }

    // Try standard parse
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  } catch {
    // Ignore parse errors
  }

  return new Date().toISOString().split('T')[0]
}
