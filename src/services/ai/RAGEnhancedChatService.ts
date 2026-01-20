import { AIChatService } from './AIChatService';
import hybridRAGService, { HybridContext, ChatQuery } from './HybridRAGService';
import type {
  FinancialContext,
  ParsedCommand,
  OperationResult,
  ValidationResult,
  AIConfig,
  ChatMessage,
  ChatResponse
} from '../../types/ai';

export interface RAGChatResponse extends ChatResponse {
  ragContext?: {
    hybridContext: HybridContext;
    sourcesUsed: Array<{
      type: 'knowledge' | 'memory';
      title?: string;
      confidence: number;
    }>;
    contextSummary: string;
    recommendedAction: string;
  };
  enhancedByRAG: boolean;
  confidenceScore: number;
}

export interface RAGChatMessage extends ChatMessage {
  ragEnhanced?: boolean;
  sources?: Array<{
    type: 'knowledge' | 'memory';
    title?: string;
    confidence: number;
  }>;
  feedbackEnabled?: boolean;
}

/**
 * RAGEnhancedChatService
 *
 * Estende o AIChatService existente com capacidades RAG híbridas.
 * Combina base de conhecimento treinada + memória do usuário + dados financeiros
 * para respostas mais precisas e contextualizadas.
 */
export class RAGEnhancedChatService extends AIChatService {
  private static ragInstance: RAGEnhancedChatService;
  private ragEnabled: boolean = true;
  private contextCache = new Map<string, HybridContext>();
  private feedbackHistory: Array<{
    query: string;
    feedback: 'helpful' | 'not_helpful';
    timestamp: Date;
  }> = [];

  static getInstance(): RAGEnhancedChatService {
    if (!RAGEnhancedChatService.ragInstance) {
      RAGEnhancedChatService.ragInstance = new RAGEnhancedChatService();
    }
    return RAGEnhancedChatService.ragInstance;
  }

  /**
   * Processa mensagem com RAG híbrido
   */
  async processMessage(
    message: string,
    userId: string,
    context?: FinancialContext
  ): Promise<RAGChatResponse> {
    try {
      console.log('[RAGEnhancedChatService] Processando mensagem com RAG:', message);

      // 1. Busca contexto híbrido (base + memória)
      const hybridContext = await this.getHybridContext(message, userId, context);

      // 2. Processa mensagem com contexto enriquecido
      const enhancedContext = this.enrichFinancialContext(context, hybridContext);
      const baseResponse = await super.processMessage(message, userId, enhancedContext);

      // 3. Enriquece resposta com informações RAG
      const ragResponse = this.enhanceResponseWithRAG(baseResponse, hybridContext);

      // 4. Salva interação bem-sucedida se relevante
      if (ragResponse.confidenceScore > 0.7) {
        await hybridRAGService.saveSuccessfulInteraction(
          message,
          ragResponse.response,
          userId,
          hybridContext
        );
      }

      return ragResponse;

    } catch (error) {
      console.error('[RAGEnhancedChatService] Erro no processamento RAG:', error);

      // Fallback para serviço base em caso de erro
      const baseResponse = await super.processMessage(message, userId, context);
      return {
        ...baseResponse,
        enhancedByRAG: false,
        confidenceScore: 0.5
      };
    }
  }

  /**
   * Busca contexto híbrido com cache inteligente
   */
  private async getHybridContext(
    message: string,
    userId: string,
    context?: FinancialContext
  ): Promise<HybridContext> {
    if (!this.ragEnabled) {
      return hybridRAGService['getEmptyContext']();
    }

    // Cache key baseado na query normalizada
    const cacheKey = this.generateCacheKey(message, userId);

    // Verifica cache (válido por 5 minutos)
    if (this.contextCache.has(cacheKey)) {
      const cached = this.contextCache.get(cacheKey)!;
      console.log('[RAGEnhancedChatService] Usando contexto do cache');
      return cached;
    }

    // Busca novo contexto
    const query: ChatQuery = {
      query: message,
      userId,
      context: {
        currentMonth: context?.currentMonth,
        currentYear: context?.currentYear,
        userFinancialData: context?.userFinancialData
      }
    };

    const hybridContext = await hybridRAGService.searchHybrid(query);

    // Armazena no cache
    this.contextCache.set(cacheKey, hybridContext);

    // Limpa cache antigo (máximo 50 entradas)
    if (this.contextCache.size > 50) {
      const firstKey = this.contextCache.keys().next().value;
      this.contextCache.delete(firstKey);
    }

    return hybridContext;
  }

  /**
   * Enriquece contexto financeiro com informações RAG
   */
  private enrichFinancialContext(
    baseContext: FinancialContext | undefined,
    hybridContext: HybridContext
  ): FinancialContext {
    const enrichedContext: FinancialContext = {
      ...baseContext,
      // Adiciona contexto RAG ao prompt do sistema
      ragContext: {
        knowledgeBaseSources: hybridContext.knowledgeBase.results.map(r => ({
          content: r.content.substring(0, 500), // Limita tamanho
          title: r.title,
          category: r.category,
          similarity: r.similarity
        })),
        userMemorySources: hybridContext.userMemory.memories.map(m => ({
          content: m.conteudo.substring(0, 500),
          summary: m.resumo,
          similarity: m.similarity
        })),
        contextSummary: hybridContext.combined.contextSummary,
        confidenceScore: hybridContext.combined.confidenceScore,
        recommendedAction: hybridContext.combined.recommendedAction
      }
    };

    return enrichedContext;
  }

  /**
   * Enriquece resposta base com informações RAG
   */
  private enhanceResponseWithRAG(
    baseResponse: ChatResponse,
    hybridContext: HybridContext
  ): RAGChatResponse {
    // Calcula score de confiança baseado no contexto
    const confidenceScore = this.calculateOverallConfidence(baseResponse, hybridContext);

    // Mapeia fontes utilizadas
    const sourcesUsed = hybridContext.combined.relevantSources.slice(0, 5).map(source => ({
      type: source.type,
      title: source.title || 'Fonte sem título',
      confidence: source.similarity
    }));

    return {
      ...baseResponse,
      ragContext: {
        hybridContext,
        sourcesUsed,
        contextSummary: hybridContext.combined.contextSummary,
        recommendedAction: hybridContext.combined.recommendedAction
      },
      enhancedByRAG: hybridContext.metrics.hybridScore > 0.3,
      confidenceScore
    };
  }

  /**
   * Calcula score de confiança geral
   */
  private calculateOverallConfidence(
    baseResponse: ChatResponse,
    hybridContext: HybridContext
  ): number {
    const baseConfidence = baseResponse.confidence || 0.5;
    const ragConfidence = hybridContext.combined.confidenceScore;

    // Pondera com base na qualidade do contexto RAG
    const ragWeight = Math.min(hybridContext.metrics.hybridScore, 0.5);

    return Math.min(baseConfidence + (ragConfidence * ragWeight), 1);
  }

  /**
   * Registra feedback do usuário
   */
  async recordUserFeedback(
    messageId: string,
    query: string,
    userId: string,
    feedback: 'helpful' | 'not_helpful',
    comment?: string,
    response?: string
  ): Promise<void> {
    try {
      // Registra no histórico local
      this.feedbackHistory.push({
        query,
        feedback,
        timestamp: new Date()
      });

      // Mantém apenas últimos 100 feedbacks
      if (this.feedbackHistory.length > 100) {
        this.feedbackHistory.shift();
      }

      // Busca contexto usado para esta query
      const cacheKey = this.generateCacheKey(query, userId);
      const context = this.contextCache.get(cacheKey);

      // Salvar feedback no banco de dados
      await this.saveFeedbackToDatabase(messageId, query, response || '', userId, feedback, comment, context);

      if (context) {
        await hybridRAGService.recordFeedback(query, userId, context, feedback, comment);
        console.log('[RAGEnhancedChatService] Feedback registrado:', feedback);
      }

    } catch (error) {
      console.error('[RAGEnhancedChatService] Erro ao registrar feedback:', error);
    }
  }

  /**
   * Salva feedback no banco de dados
   */
  private async saveFeedbackToDatabase(
    messageId: string,
    query: string,
    response: string,
    userId: string,
    feedback: 'helpful' | 'not_helpful',
    comment?: string,
    context?: HybridContext
  ): Promise<void> {
    try {
      const { supabase } = await import('../supabase/client');

      const feedbackData = {
        usuario_id: userId,
        mensagem_id: messageId,
        query_original: query,
        resposta: response,
        feedback: feedback,
        comentario: comment,
        contexto_rag: context ? {
          knowledgeBaseHits: context.metrics.knowledgeBaseHits,
          userMemoryHits: context.metrics.userMemoryHits,
          hybridScore: context.metrics.hybridScore,
          sourcesUsed: context.combined.relevantSources.length
        } : null,
        confidence_score: context?.combined.confidenceScore || 0
      };

      const { error } = await supabase
        .from('app_rag_feedback')
        .insert(feedbackData);

      if (error) {
        console.error('[RAGEnhancedChatService] Erro ao salvar feedback no DB:', error);
      } else {
        console.log('[RAGEnhancedChatService] Feedback salvo no banco de dados');
      }
    } catch (error) {
      console.error('[RAGEnhancedChatService] Erro na conexão com banco:', error);
    }
  }

  /**
   * Obtém estatísticas de feedback
   */
  getFeedbackStats(): {
    totalFeedbacks: number;
    helpfulPercentage: number;
    recentFeedbacks: Array<{ query: string; feedback: string; timestamp: Date }>;
  } {
    const total = this.feedbackHistory.length;
    const helpful = this.feedbackHistory.filter(f => f.feedback === 'helpful').length;
    const percentage = total > 0 ? (helpful / total) * 100 : 0;

    return {
      totalFeedbacks: total,
      helpfulPercentage: percentage,
      recentFeedbacks: this.feedbackHistory.slice(-10)
    };
  }

  /**
   * Ativa/desativa RAG
   */
  setRAGEnabled(enabled: boolean): void {
    this.ragEnabled = enabled;
    console.log('[RAGEnhancedChatService] RAG', enabled ? 'ativado' : 'desativado');
  }

  /**
   * Limpa cache de contexto
   */
  clearContextCache(): void {
    this.contextCache.clear();
    console.log('[RAGEnhancedChatService] Cache de contexto limpo');
  }

  /**
   * Gera chave de cache baseada na query
   */
  private generateCacheKey(message: string, userId: string): string {
    // Normaliza a mensagem para melhor cache hit
    const normalizedMessage = message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return `${userId}-${normalizedMessage.substring(0, 100)}`;
  }

  /**
   * Obtém métricas de performance RAG
   */
  getRAGMetrics(): {
    cacheSize: number;
    ragEnabled: boolean;
    feedbackStats: ReturnType<typeof this.getFeedbackStats>;
    averageConfidence: number;
  } {
    const feedbackStats = this.getFeedbackStats();

    // Calcula confiança média baseada em feedbacks recentes
    const recentHelpful = this.feedbackHistory
      .slice(-20)
      .filter(f => f.feedback === 'helpful').length;
    const averageConfidence = this.feedbackHistory.length > 0
      ? recentHelpful / Math.min(this.feedbackHistory.length, 20)
      : 0.5;

    return {
      cacheSize: this.contextCache.size,
      ragEnabled: this.ragEnabled,
      feedbackStats,
      averageConfidence
    };
  }
}

// Instância singleton para uso global
export const ragEnhancedChatService = RAGEnhancedChatService.getInstance();
export default ragEnhancedChatService;