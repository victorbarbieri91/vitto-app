import type { FinancialContext } from '../../types/ai';

/**
 * AISentimentAnalyzer
 * 
 * Sistema de análise de sentimento para mensagens dos usuários
 * Detecta emoções e adapta respostas da IA
 */

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'frustrated' | 'anxious' | 'confident';
  confidence: number; // 0-1
  emotions: {
    frustration: number;
    anxiety: number;
    happiness: number;
    confidence: number;
    concern: number;
  };
  financialStress: number; // 0-1
  recommendations: string[];
}

export class AISentimentAnalyzer {
  private static instance: AISentimentAnalyzer;

  static getInstance(): AISentimentAnalyzer {
    if (!AISentimentAnalyzer.instance) {
      AISentimentAnalyzer.instance = new AISentimentAnalyzer();
    }
    return AISentimentAnalyzer.instance;
  }

  /**
   * Analisa sentimento de uma mensagem usando padrões locais + OpenAI
   */
  async analyzeSentiment(
    message: string, 
    context?: FinancialContext,
    useOpenAI: boolean = true
  ): Promise<SentimentResult> {
    // Primeiro, análise local rápida
    const localAnalysis = this.performLocalAnalysis(message, context);

    // Se OpenAI disponível, combinar com análise avançada
    if (useOpenAI && this.hasOpenAI()) {
      try {
        const openaiAnalysis = await this.performOpenAIAnalysis(message, context);
        return this.combineAnalyses(localAnalysis, openaiAnalysis);
      } catch (error) {
        console.warn('Erro na análise OpenAI, usando análise local:', error);
        return localAnalysis;
      }
    }

    return localAnalysis;
  }

  /**
   * Análise local baseada em padrões
   */
  private performLocalAnalysis(message: string, context?: FinancialContext): SentimentResult {
    const lowerMessage = message.toLowerCase();
    
    // Padrões de emoção
    const patterns = {
      frustration: [
        'não consigo', 'impossível', 'irritado', 'chato', 'difícil',
        'complicado', 'não entendo', 'confuso', 'problema'
      ],
      anxiety: [
        'preocupado', 'nervoso', 'ansioso', 'medo', 'inseguro',
        'dúvida', 'incerto', 'perdido', 'vai dar ruim'
      ],
      happiness: [
        'feliz', 'ótimo', 'excelente', 'maravilhoso', 'perfeito',
        'adorei', 'incrível', 'fantástico', 'consegui'
      ],
      confidence: [
        'confiante', 'certeza', 'conseguir', 'vou conseguir',
        'tenho certeza', 'positivo', 'otimista', 'vai dar certo'
      ],
      concern: [
        'preocupação', 'cuidado', 'atenção', 'risco', 'perigo',
        'problemas financeiros', 'dívidas', 'dificuldades'
      ]
    };

    // Calcular scores para cada emoção
    const emotions = {
      frustration: this.calculateEmotionScore(lowerMessage, patterns.frustration),
      anxiety: this.calculateEmotionScore(lowerMessage, patterns.anxiety),
      happiness: this.calculateEmotionScore(lowerMessage, patterns.happiness),
      confidence: this.calculateEmotionScore(lowerMessage, patterns.confidence),
      concern: this.calculateEmotionScore(lowerMessage, patterns.concern)
    };

    // Determinar sentimento principal
    const maxEmotion = Object.entries(emotions).reduce((a, b) => 
      emotions[a[0] as keyof typeof emotions] > emotions[b[0] as keyof typeof emotions] ? a : b
    );

    let sentiment: SentimentResult['sentiment'] = 'neutral';
    let confidence = maxEmotion[1];

    if (emotions.frustration > 0.6) sentiment = 'frustrated';
    else if (emotions.anxiety > 0.6) sentiment = 'anxious';
    else if (emotions.happiness > 0.6) sentiment = 'positive';
    else if (emotions.confidence > 0.6) sentiment = 'confident';
    else if (emotions.concern > 0.4) sentiment = 'negative';

    // Calcular stress financeiro baseado no contexto
    const financialStress = this.calculateFinancialStress(message, context);

    // Gerar recomendações
    const recommendations = this.generateRecommendations(sentiment, emotions, financialStress);

    return {
      sentiment,
      confidence: Math.max(confidence, 0.3), // Mínimo 30% de confiança
      emotions,
      financialStress,
      recommendations
    };
  }

  /**
   * Análise avançada usando OpenAI
   */
  private async performOpenAIAnalysis(
    message: string, 
    context?: FinancialContext
  ): Promise<SentimentResult> {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    const prompt = `Analise o sentimento desta mensagem sobre finanças pessoais:

MENSAGEM: "${message}"

${context ? `CONTEXTO FINANCEIRO:
- Saldo: R$ ${context.patrimonio.saldo_total}
- Saúde Financeira: ${context.indicadores.saude_financeira.score}/100
` : ''}

Retorne JSON com:
{
  "sentiment": "positive|negative|neutral|frustrated|anxious|confident",
  "confidence": 0.0-1.0,
  "emotions": {
    "frustration": 0.0-1.0,
    "anxiety": 0.0-1.0,
    "happiness": 0.0-1.0,
    "confidence": 0.0-1.0,
    "concern": 0.0-1.0
  },
  "financialStress": 0.0-1.0,
  "recommendations": ["sugestão1", "sugestão2"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0]?.message?.content || '{}');
    
    return result;
  }

  /**
   * Combina análises local e OpenAI
   */
  private combineAnalyses(local: SentimentResult, openai: SentimentResult): SentimentResult {
    // Usar OpenAI como principal, local como backup/validação
    return {
      sentiment: openai.sentiment || local.sentiment,
      confidence: Math.max(local.confidence, openai.confidence || 0),
      emotions: {
        frustration: (local.emotions.frustration + (openai.emotions?.frustration || 0)) / 2,
        anxiety: (local.emotions.anxiety + (openai.emotions?.anxiety || 0)) / 2,
        happiness: (local.emotions.happiness + (openai.emotions?.happiness || 0)) / 2,
        confidence: (local.emotions.confidence + (openai.emotions?.confidence || 0)) / 2,
        concern: (local.emotions.concern + (openai.emotions?.concern || 0)) / 2,
      },
      financialStress: Math.max(local.financialStress, openai.financialStress || 0),
      recommendations: [
        ...local.recommendations,
        ...(openai.recommendations || [])
      ].slice(0, 3) // Máximo 3 recomendações
    };
  }

  /**
   * Calcula score de emoção baseado em padrões
   */
  private calculateEmotionScore(message: string, patterns: string[]): number {
    let score = 0;
    let totalMatches = 0;

    patterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = message.match(regex);
      if (matches) {
        score += matches.length * 0.2;
        totalMatches++;
      }
    });

    // Normalizar score baseado no tamanho da mensagem
    const messageLength = message.split(' ').length;
    return Math.min(score / Math.max(messageLength * 0.1, 1), 1.0);
  }

  /**
   * Calcula stress financeiro baseado na mensagem e contexto
   */
  private calculateFinancialStress(message: string, context?: FinancialContext): number {
    let stress = 0;

    // Padrões que indicam stress financeiro
    const stressPatterns = [
      'dívida', 'devendo', 'apertado', 'sem dinheiro', 'quebrado',
      'desempregado', 'conta no vermelho', 'limite estourado',
      'não consigo pagar', 'endividado', 'financeiramente difícil'
    ];

    const lowerMessage = message.toLowerCase();
    stressPatterns.forEach(pattern => {
      if (lowerMessage.includes(pattern)) {
        stress += 0.3;
      }
    });

    // Considerar contexto financeiro se disponível
    if (context) {
      const { patrimonio, indicadores } = context;
      
      if (patrimonio.saldo_total < 0) stress += 0.4;
      else if (patrimonio.saldo_total < 500) stress += 0.2;
      
      if (indicadores.saude_financeira.score < 30) stress += 0.3;
      else if (indicadores.saude_financeira.score < 50) stress += 0.1;
    }

    return Math.min(stress, 1.0);
  }

  /**
   * Gera recomendações baseadas no sentimento
   */
  private generateRecommendations(
    sentiment: SentimentResult['sentiment'],
    emotions: SentimentResult['emotions'],
    financialStress: number
  ): string[] {
    const recommendations: string[] = [];

    if (sentiment === 'frustrated') {
      recommendations.push('Vamos resolver isso juntos passo a passo.');
      recommendations.push('Que tal começarmos com algo simples?');
    }

    if (sentiment === 'anxious' || emotions.anxiety > 0.5) {
      recommendations.push('Respire fundo. Vamos analisar sua situação calmamente.');
      recommendations.push('Lembre-se: você tem controle sobre suas finanças.');
    }

    if (financialStress > 0.6) {
      recommendations.push('Vamos focar em estabilizar sua situação financeira primeiro.');
      recommendations.push('Posso ajudar a criar um plano de recuperação?');
    }

    if (sentiment === 'confident') {
      recommendations.push('Ótima atitude! Vamos potencializar seus resultados.');
      recommendations.push('Que tal definir metas ainda mais ambiciosas?');
    }

    if (recommendations.length === 0) {
      recommendations.push('Estou aqui para ajudar com suas finanças!');
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Verifica se OpenAI está disponível
   */
  private hasOpenAI(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }

  /**
   * Adapta tom de resposta baseado no sentimento
   */
  adaptResponseTone(sentiment: SentimentResult): {
    tone: string;
    prefixes: string[];
    approach: 'supportive' | 'encouraging' | 'solution-focused' | 'celebratory';
  } {
    switch (sentiment.sentiment) {
      case 'frustrated':
        return {
          tone: 'empático e solucionador',
          prefixes: ['Entendo sua frustração.', 'Vamos resolver isso juntos.'],
          approach: 'solution-focused'
        };

      case 'anxious':
        return {
          tone: 'calmo e tranquilizador',
          prefixes: ['Fique tranquilo.', 'Vamos com calma.'],
          approach: 'supportive'
        };

      case 'positive':
        return {
          tone: 'celebrativo e motivador',
          prefixes: ['Que ótimo!', 'Fantástico!'],
          approach: 'celebratory'
        };

      case 'confident':
        return {
          tone: 'encorajador e ambicioso',
          prefixes: ['Essa é a atitude!', 'Perfeito!'],
          approach: 'encouraging'
        };

      default:
        return {
          tone: 'amigável e profissional',
          prefixes: ['Claro!', 'Vamos lá!'],
          approach: 'solution-focused'
        };
    }
  }
}

export const aiSentimentAnalyzer = AISentimentAnalyzer.getInstance(); 