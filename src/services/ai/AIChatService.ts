import type {
  FinancialContext,
  ParsedCommand,
  OperationResult,
  ValidationResult,
  Insight,
  AIConfig
} from '../../types/ai';
import { aiContextManager } from './AIContextManager';
import { aiCommandInterpreter } from './AICommandInterpreter';
import { aiActionExecutor } from './AIActionExecutor';
import { aiInsightGenerator } from './AIInsightGenerator';
import { aiRateLimiter } from './AIRateLimiter';
import { aiSentimentAnalyzer } from './AISentimentAnalyzer';
import { aiReportGenerator } from './AIReportGenerator';
import { aiPredictiveAlerts } from './AIPredictiveAlerts';
import { financialMemoryManager } from './FinancialMemoryManager';
import { AgentConfigService } from '../api/agentConfig';
import type { SentimentResult } from './AISentimentAnalyzer';
import type { FinancialReport } from './AIReportGenerator';
import type { PredictiveAlert } from './AIPredictiveAlerts';
import type { ContextoRAG } from './FinancialMemoryManager';

/**
 * AIChatService (Enhanced)
 *
 * Serviço principal de chat com IA que integra todos os componentes avançados.
 * Orquestra o fluxo completo: rate limiting → sentiment analysis → RAG → contexto → interpretação → execução → resposta.
 *
 * ✨ NOVA FUNCIONALIDADE - Etapa 3.2:
 * - Rate limiting para controle de custos
 * - Análise de sentimento para respostas adaptadas
 * - Relatórios narrativos inteligentes
 * - Alertas preditivos baseados em ML
 *
 * ✨ NOVA FUNCIONALIDADE - Sistema RAG:
 * - Memória vetorial com embeddings
 * - Busca semântica de contexto histórico
 * - Aprendizado contínuo de padrões do usuário
 * - Respostas contextualizadas com histórico
 */
export class AIChatService {
  private static instance: AIChatService;
  private config: AIConfig;
  private isProcessing: boolean = false;

  static getInstance(): AIChatService {
    if (!AIChatService.instance) {
      AIChatService.instance = new AIChatService();
    }
    return AIChatService.instance;
  }

  constructor() {
    this.config = {
      model: import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini',
      max_tokens: 1000,
      temperature: 0.3,
      context_window_size: 4000,
      confidence_threshold: 0.7,
      enable_learning: true,
      enable_insights: true
    };
  }

  /**
   * 🚀 ENHANCED: Processa uma mensagem do usuário com análise avançada e RAG
   */
  async processMessage(
    userMessage: string,
    userId: string,
    context?: FinancialContext,
    sessionId: string = 'default'
  ): Promise<{
    response: string;
    confidence?: number;
    insights?: Insight[];
    sentiment?: SentimentResult;
    predictiveAlerts?: PredictiveAlert[];
    ragContext?: ContextoRAG;
    success: boolean;
    metadata?: any;
  }> {
    console.log('🤖 AIChatService (Enhanced): Processando mensagem:', userMessage);

    // 1. 🛡️ RATE LIMITING - Verificar se pode fazer requisição
    const rateLimitCheck = await aiRateLimiter.canMakeRequest(userId);
    if (!rateLimitCheck.allowed) {
      return {
        response: `⏳ ${rateLimitCheck.reason}`,
        confidence: 0,
        success: false,
        metadata: { rateLimited: true, waitTime: rateLimitCheck.waitTime }
      };
    }

    // Registrar requisição no rate limiter
    aiRateLimiter.recordRequest(userId);

    // Prevenir processamento simultâneo
    if (this.isProcessing) {
      return {
        response: 'Aguarde, ainda estou processando sua mensagem anterior...',
        confidence: 0,
        success: false
      };
    }

    this.isProcessing = true;

    try {
      // 2. 📊 Construir contexto financeiro (usar passado ou construir novo)
      console.log('📊 Construindo contexto...');
      const financialContext = context || await aiContextManager.buildContext(userId);

      // 3. 🧠 ANÁLISE DE SENTIMENTO - Nova funcionalidade!
      console.log('🧠 Analisando sentimento...');
      const sentiment = await aiSentimentAnalyzer.analyzeSentiment(
        userMessage,
        financialContext,
        this.hasOpenAI()
      );

      // 4. 🔍 SISTEMA RAG - Buscar contexto relevante na memória
      console.log('🔍 Buscando contexto RAG...');
      const ragContext = await financialMemoryManager.buscarContextoRelevante(
        userMessage,
        userId,
        5, // Top 5 memórias relevantes
        0.7 // Threshold de similaridade
      );

      // 5. 🔮 ALERTAS PREDITIVOS - Gerar antes de processar comando
      console.log('🔮 Gerando alertas preditivos...');
      const predictiveAlerts = await aiPredictiveAlerts.generatePredictiveAlerts(financialContext);

      // 6. Verificar se é comando financeiro ou conversa geral
      const isCommand = this.isFinancialCommand(userMessage);

      let response: string;
      let insights: Insight[] = [];
      let metadata: any = {
        sentiment,
        predictiveAlerts: predictiveAlerts.slice(0, 3),
        ragContext: {
          memorias_encontradas: ragContext.memorias_relevantes.length,
          confidence_score: ragContext.confidence_score,
          sugestoes: ragContext.sugestoes
        }
      };

      if (isCommand) {
        // Fluxo de comando financeiro com RAG
        const result = await this.processFinancialCommand(userMessage, financialContext, userId, sentiment, ragContext);
        response = result.message;
        insights = result.insights || [];
        metadata = { ...metadata, ...result.metadata };
      } else {
        // Fluxo de conversa geral com IA e RAG
        const result = await this.processGeneralConversation(userMessage, financialContext, sentiment, ragContext);
        response = result.message;
        insights = result.insights || [];
      }

      // 6. Gerar insights adicionais se habilitado
      if (this.config.enable_insights && insights.length === 0) {
        console.log('💡 Gerando insights adicionais...');
        const additionalInsights = await aiInsightGenerator.generateInsights(financialContext);
        insights = additionalInsights.slice(0, 3);
      }

      // 7. 💾 Salvar interação na memória RAG
      await this.saveInteractionToMemory(userId, userMessage, response, sentiment, financialContext, ragContext);

      // 8. Salvar mensagem no histórico
      await this.saveMessageToHistory(userId, sessionId, userMessage, response, sentiment);

      // 9. Registrar métrica do agente de comunicação
      const processingTime = Date.now() - new Date().getTime();
      await AgentConfigService.logAgentUsage(
        'communication',
        true,
        Math.max(100, processingTime), // Mínimo de 100ms para ser realista
        sentiment?.overall_score
      );

      console.log('✅ Mensagem processada com sucesso');
      return {
        response: response,
        confidence: 0.8, // Default confidence score
        insights,
        sentiment,
        predictiveAlerts: predictiveAlerts.slice(0, 5), // Top 5 alertas
        ragContext,
        success: true,
        metadata
      };

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      
      return {
        response: 'Desculpe, houve um erro ao processar sua mensagem. Pode tentar novamente?',
        confidence: 0,
        success: false
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 🆕 Gerar relatório financeiro inteligente
   */
  async generateFinancialReport(
    userId: string,
    type: 'monthly' | 'quarterly' | 'goal_analysis' | 'budget_review' = 'monthly',
    options?: any
  ): Promise<FinancialReport> {
    console.log('📊 Gerando relatório financeiro...');

    const context = await aiContextManager.buildContext(userId);
    
    switch (type) {
      case 'monthly':
        const now = new Date();
        return await aiReportGenerator.generateMonthlyReport(context, now.getMonth() + 1, now.getFullYear());
      
      case 'goal_analysis':
        return await aiReportGenerator.generateGoalAnalysisReport(context, options?.goalId);
      
      case 'budget_review':
        return await aiReportGenerator.generateBudgetReviewReport(context, options?.period);
      
      default:
        return await aiReportGenerator.generateMonthlyReport(context, new Date().getMonth() + 1, new Date().getFullYear());
    }
  }

  /**
   * 🆕 Obter estatísticas de uso da IA
   */
  getUsageStats(userId: string) {
    return aiRateLimiter.getUsageStats(userId);
  }

  /**
   * 🔄 ENHANCED: Processa comandos financeiros com análise de sentimento e RAG
   */
  private async processFinancialCommand(
    userMessage: string,
    context: FinancialContext,
    userId: string,
    sentiment: SentimentResult,
    ragContext?: ContextoRAG
  ): Promise<{
    message: string;
    insights?: Insight[];
    metadata?: any;
  }> {
    console.log('💰 Processando comando financeiro (Enhanced)...');

    try {
      // 1. Interpretar comando
      const parsedCommand = await aiCommandInterpreter.parseCommand(userMessage, context);
      console.log('🎯 Comando interpretado:', parsedCommand.intent.tipo);

      // 2. Validar comando
      const validation = await aiCommandInterpreter.validateCommand(parsedCommand);

      // 3. Adaptar resposta baseada no sentimento
      const tonalAdaptation = aiSentimentAnalyzer.adaptResponseTone(sentiment);

      // 4. Se não é válido, pedir esclarecimentos (com tom adaptado)
      if (!validation.isValid) {
        const adaptedPrefix = tonalAdaptation.prefixes[0] || '';
        return {
          message: `${adaptedPrefix} ${this.formatValidationResponse(validation)}`,
          metadata: { needsClarification: true, validation, sentiment }
        };
      }

      // 5. Se tem warnings, perguntar se pode prosseguir
      if (validation.warnings && validation.warnings.length > 0) {
        const warningMessage = validation.clarificationMessage || 'Há alguns avisos sobre seu comando.';
        const adaptedPrefix = sentiment.financialStress > 0.6 ? 'Fique tranquilo. ' : '';
        return {
          message: `${adaptedPrefix}${warningMessage}\n\nPosso prosseguir mesmo assim? Responda "sim" para confirmar.`,
          metadata: { 
            needsConfirmation: true, 
            validation,
            pendingCommand: parsedCommand,
            sentiment 
          }
        };
      }

      // 6. Executar operação
      const operationResult = await aiActionExecutor.executeFinancialOperation(
        parsedCommand,
        context,
        userId
      );

      // 7. Formatar resposta baseada no sentimento e resultado
      return this.formatOperationResponse(operationResult, parsedCommand, sentiment);

    } catch (error) {
      console.error('❌ Erro ao processar comando financeiro:', error);
      
      // Resposta de erro adaptada ao sentimento
      if (sentiment.sentiment === 'frustrated') {
        return {
          message: 'Entendo sua frustração. Vamos tentar resolver isso de outra forma. Pode reformular seu pedido?'
        };
      } else {
        return {
          message: 'Houve um erro ao processar seu comando financeiro. Pode reformular?'
        };
      }
    }
  }

  /**
   * 🔄 ENHANCED: Processa conversas gerais com análise de sentimento e RAG
   */
  private async processGeneralConversation(
    userMessage: string,
    context: FinancialContext,
    sentiment: SentimentResult,
    ragContext?: ContextoRAG
  ): Promise<{
    message: string;
    insights?: Insight[];
  }> {
    console.log('💬 Processando conversa geral (Enhanced)...');

    try {
      // Verificar se OpenAI está configurada
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!openaiKey) {
        return {
          message: this.getDefaultResponse(userMessage, context, sentiment)
        };
      }

      // Preparar contexto para OpenAI com análise de sentimento e RAG
      const systemPrompt = this.buildEnhancedSystemPrompt(context, sentiment, ragContext);
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      // Fazer chamada para OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: this.config.max_tokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.';

      return {
        message: aiResponse
      };

    } catch (error) {
      console.error('❌ Erro na conversa geral:', error);
      
      // Fallback para resposta padrão adaptada ao sentimento
      return {
        message: this.getDefaultResponse(userMessage, context, sentiment)
      };
    }
  }

  /**
   * 🆕 Constrói prompt do sistema aprimorado com análise de sentimento e RAG
   */
  private buildEnhancedSystemPrompt(context: FinancialContext, sentiment: SentimentResult, ragContext?: ContextoRAG): string {
    const { usuario, patrimonio, indicadores } = context;
    const tonalGuidance = aiSentimentAnalyzer.adaptResponseTone(sentiment);

    return `Você é o Vitto, assistente financeiro pessoal inteligente e empático. Adapte sua resposta ao estado emocional do usuário.

CONTEXTO DO USUÁRIO:
- Nome: ${usuario.nome}
- Saldo Total: ${this.formatCurrency(patrimonio.saldo_total)}
- Receitas do Mês: ${this.formatCurrency(indicadores.mes_atual.receitas_mes)}
- Despesas do Mês: ${this.formatCurrency(indicadores.mes_atual.despesas_mes)}
- Saúde Financeira: ${indicadores.saude_financeira.nivel} (${indicadores.saude_financeira.score}/100)

ANÁLISE DE SENTIMENTO:
- Sentimento detectado: ${sentiment.sentiment}
- Stress financeiro: ${(sentiment.financialStress * 100).toFixed(0)}%
- Nível de confiança: ${sentiment.confidence.toFixed(2)}
- Abordagem recomendada: ${tonalGuidance.approach}

DIRETRIZES DE RESPOSTA:
- Tom: ${tonalGuidance.tone}
- Use prefixos como: ${tonalGuidance.prefixes.join(' ou ')}
- Seja ${tonalGuidance.approach === 'supportive' ? 'tranquilizador e apoiador' : 
                 tonalGuidance.approach === 'encouraging' ? 'motivador e encorajador' :
                 tonalGuidance.approach === 'celebratory' ? 'celebrativo e positivo' : 'focado em soluções'}

${sentiment.financialStress > 0.6 ? 
  '⚠️ ATENÇÃO: Usuário com alto stress financeiro. Seja especialmente cuidadoso e oferece apoio prático.' : 
  ''}

${sentiment.recommendations.length > 0 ?
  `RECOMENDAÇÕES CONTEXTUAIS: ${sentiment.recommendations.join('; ')}` :
  ''}

${ragContext && ragContext.memorias_relevantes.length > 0 ?
  `CONTEXTO HISTÓRICO RELEVANTE (${ragContext.memorias_relevantes.length} memórias encontradas):
${ragContext.memorias_relevantes.slice(0, 3).map(m =>
  `- ${m.tipo_conteudo}: ${(m.resumo || m.conteudo).substring(0, 150)}...`
).join('\n')}

CONFIDENCE SCORE: ${ragContext.confidence_score.toFixed(2)} (quanto maior, mais relevante)
${ragContext.sugestoes.length > 0 ? `SUGESTÕES BASEADAS NO HISTÓRICO: ${ragContext.sugestoes.join('; ')}` : ''}
` : ''}

SUAS CAPACIDADES:
- Analisar situação financeira considerando o estado emocional
- Dar conselhos personalizados e empáticos
- Responder perguntas sobre finanças
- Interpretar comandos como "gastei X em Y"
- Gerar insights e alertas preditivos

Responda de forma natural, empática e adaptada ao estado emocional detectado. Use emojis apropriados e mantenha tom ${tonalGuidance.tone}.`;
  }

  /**
   * 🔄 ENHANCED: Gera resposta padrão adaptada ao sentimento
   */
  private getDefaultResponse(userMessage: string, context: FinancialContext, sentiment?: SentimentResult): string {
    const lowerMessage = userMessage.toLowerCase();
    const tonalAdaptation = sentiment ? aiSentimentAnalyzer.adaptResponseTone(sentiment) : null;
    const prefix = tonalAdaptation?.prefixes[0] || '';

    // Respostas baseadas em palavras-chave adaptadas ao sentimento
    if (lowerMessage.includes('saldo')) {
      const insight = this.getSaldoInsight(context.patrimonio.saldo_total);
      return `${prefix} 💰 Seu saldo total atual é ${this.formatCurrency(context.patrimonio.saldo_total)}. ${insight}`;
    }

    if (lowerMessage.includes('gastos') || lowerMessage.includes('despesas')) {
      const fluxo = context.indicadores.mes_atual.fluxo_liquido;
      const insight = this.getFluxoInsight(fluxo);
      return `${prefix} 📊 Este mês você gastou ${this.formatCurrency(context.indicadores.mes_atual.despesas_mes)} e recebeu ${this.formatCurrency(context.indicadores.mes_atual.receitas_mes)}. ${insight}`;
    }

    if (lowerMessage.includes('ajuda') || lowerMessage.includes('help')) {
      return `${prefix} 🤖 Olá! Sou o Vitto, seu assistente financeiro inteligente! Posso ajudar você com:

📝 **Registrar transações**: "gastei 50 reais no supermercado"
💰 **Consultar saldo**: "qual meu saldo atual?"
📊 **Analisar gastos**: "quanto gastei este mês?"
🎯 **Criar metas**: "quero juntar 5000 para viagem"
📈 **Orçamentos**: "orçamento de 400 para alimentação"
📋 **Relatórios**: "gere um relatório mensal"

Fale naturalmente comigo!`;
    }

    if (lowerMessage.includes('obrigad') || lowerMessage.includes('valeu')) {
      return `${prefix} 😊 Fico feliz em ajudar! Continue cuidando bem das suas finanças. Se precisar de algo, é só chamar!`;
    }

    // Resposta genérica adaptada ao sentimento
    let genericResponse = `${prefix} 👋 Olá! Sou o Vitto, seu assistente financeiro inteligente. `;
    
    if (sentiment && sentiment.financialStress > 0.6) {
      genericResponse += `Vejo que você pode estar passando por um momento financeiro desafiador. Estou aqui para ajudar! `;
    } else if (sentiment && sentiment.sentiment === 'confident') {
      genericResponse += `Que bom ver sua confiança! Vamos potencializar seus resultados! `;
    }

    genericResponse += `Para comandos específicos como registrar gastos, fale naturalmente: "gastei 80 reais no supermercado". Para outras dúvidas sobre finanças, estou aqui para ajudar!

💡 **Dica**: Você pode perguntar sobre seu saldo, gastos do mês, criar metas, orçamentos ou pedir relatórios detalhados.`;

    return genericResponse;
  }

  /**
   * 🔄 ENHANCED: Formata resposta de operação com sentimento
   */
  private formatOperationResponse(
    result: OperationResult,
    command: ParsedCommand,
    sentiment: SentimentResult
  ): {
    message: string;
    insights?: Insight[];
    metadata?: any;
  } {
    const tonalAdaptation = aiSentimentAnalyzer.adaptResponseTone(sentiment);
    const prefix = tonalAdaptation.prefixes[0] || '';
    
    let message = `${prefix} ${result.message}`;

    if (result.impact) {
      message += `\n\n📈 **Impacto**: ${result.impact}`;
    }

    if (result.suggestions && result.suggestions.length > 0) {
      message += `\n\n💡 **Sugestões:**\n`;
      result.suggestions.forEach(suggestion => {
        message += `• ${suggestion}\n`;
      });
    }

    // Adicionar recomendações do sentiment se houver stress financeiro
    if (sentiment.financialStress > 0.6 && sentiment.recommendations.length > 0) {
      message += `\n\n🤝 **Apoio adicional:**\n`;
      sentiment.recommendations.forEach(rec => {
        message += `• ${rec}\n`;
      });
    }

    return {
      message: message.trim(),
      insights: result.insights || [],
      metadata: {
        operationType: command.intent.tipo,
        operationData: result.data,
        sentiment
      }
    };
  }

  /**
   * 💾 Salva interação na memória RAG para aprendizado contínuo
   */
  private async saveInteractionToMemory(
    userId: string,
    userMessage: string,
    aiResponse: string,
    sentiment: SentimentResult,
    context: FinancialContext,
    ragContext?: ContextoRAG
  ): Promise<void> {
    try {
      // Determinar tipo de conteúdo baseado na interação
      const isCommand = this.isFinancialCommand(userMessage);
      const tipoConteudo = isCommand ? 'transacao' : 'conversa';

      // Criar resumo da interação
      const resumo = `Usuário: ${userMessage.substring(0, 100)}... | AI: ${aiResponse.substring(0, 100)}...`;

      // Contexto financeiro relevante
      const contextoFinanceiro = {
        saldo_total: context.patrimonio.saldo_total,
        receitas_mes: context.indicadores.mes_atual.receitas_mes,
        despesas_mes: context.indicadores.mes_atual.despesas_mes,
        saude_financeira: context.indicadores.saude_financeira.nivel,
        sentiment: sentiment.sentiment,
        financial_stress: sentiment.financialStress
      };

      // Metadados da interação
      const metadata = {
        tipo_comando: isCommand,
        confidence_score: ragContext?.confidence_score || 0,
        sentiment_detected: sentiment.sentiment,
        stress_level: sentiment.financialStress,
        sugestoes_rag: ragContext?.sugestoes || [],
        timestamp: new Date().toISOString()
      };

      // Salvar na memória vetorial
      await financialMemoryManager.armazenarInteracao({
        userId,
        tipo: tipoConteudo,
        conteudo: `${userMessage}\n\n${aiResponse}`,
        resumo,
        metadata,
        contextoFinanceiro
      });

      console.log('💾 Interação salva na memória RAG:', {
        userId,
        tipo: tipoConteudo,
        resumo: resumo.substring(0, 50) + '...'
      });
    } catch (error) {
      console.warn('⚠️ Não foi possível salvar interação na memória RAG:', error);
    }
  }

  /**
   * 🔄 ENHANCED: Salva mensagem no histórico com sentimento
   */
  private async saveMessageToHistory(
    userId: string,
    sessionId: string,
    userMessage: string,
    aiResponse: string,
    sentiment?: SentimentResult
  ): Promise<void> {
    try {
      // TODO: Implementar salvamento no banco de dados com sentimento
      console.log('💾 Salvando no histórico (Enhanced):', {
        userId,
        sessionId,
        userMessage: userMessage.substring(0, 50),
        sentiment: sentiment?.sentiment,
        financialStress: sentiment?.financialStress
      });
    } catch (error) {
      console.warn('Não foi possível salvar mensagem no histórico:', error);
    }
  }

  /**
   * Verifica se a mensagem é um comando financeiro
   */
  private isFinancialCommand(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    const commandPatterns = [
      /(?:gastei|comprei|paguei).+(?:reais?|r\$)/i,
      /(?:recebi|ganhei).+(?:reais?|r\$)/i,
      /transferi.+(?:para|da|de)/i,
      /(?:parcel|dividir|financ).+(?:vezes|x)/i,
      /(?:criar|quero|meta).+(?:juntar|guardar|poupar)/i,
      /(?:orçamento|limite|máximo).+(?:categoria|mês)/i,
    ];

    return commandPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Formata resposta de validação
   */
  private formatValidationResponse(validation: ValidationResult): string {
    let response = '';

    if (validation.errors.length > 0) {
      response += `❌ **Problemas encontrados:**\n`;
      validation.errors.forEach(error => {
        response += `• ${error}\n`;
      });
    }

    if (validation.suggestions && validation.suggestions.length > 0) {
      response += `\n💡 **Sugestões:**\n`;
      validation.suggestions.forEach(suggestion => {
        response += `• ${suggestion}\n`;
      });
    }

    return response.trim();
  }

  /**
   * Gera insight sobre saldo
   */
  private getSaldoInsight(saldo: number): string {
    if (saldo > 10000) {
      return 'Excelente reserva! 🎉';
    } else if (saldo > 5000) {
      return 'Boa reserva de emergência! 👍';
    } else if (saldo > 1000) {
      return 'Continue construindo sua reserva. 📈';
    } else if (saldo > 0) {
      return 'Foque em aumentar sua reserva de emergência. ⚠️';
    } else {
      return 'Atenção! Saldo negativo. Procure ajuda para reorganizar suas finanças. 🚨';
    }
  }

  /**
   * Gera insight sobre fluxo
   */
  private getFluxoInsight(fluxo: number): string {
    if (fluxo > 1000) {
      return 'Ótima economia mensal! 🎯';
    } else if (fluxo > 0) {
      return 'Parabéns por economizar! 💪';
    } else if (fluxo === 0) {
      return 'Receitas e gastos equilibrados. ⚖️';
    } else {
      return 'Gastou mais que recebeu. Revise seus gastos. ⚠️';
    }
  }

  /**
   * Formata valores monetários
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Verifica se OpenAI está configurada
   */
  private hasOpenAI(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }

  /**
   * Atualizar configuração da IA
   */
  updateConfig(newConfig: Partial<AIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obter configuração atual
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * Status da IA
   */
  isEnabled(): boolean {
    return !!import.meta.env.VITE_AI_ENABLED && import.meta.env.VITE_AI_ENABLED !== 'false';
  }
}

// Instância única exportada
export const aiChatService = AIChatService.getInstance(); 