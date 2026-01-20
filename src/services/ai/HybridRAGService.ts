import vectorSearchService, { SearchResult, RAGContext } from './VectorSearchService';
import { financialMemoryManager, ContextoRAG, BuscaMemoriaResult } from './FinancialMemoryManager';

export interface HybridContext {
  // Conhecimento da base treinada
  knowledgeBase: {
    results: SearchResult[];
    categories: string[];
    totalResults: number;
    searchTime: number;
  };

  // Memória pessoal do usuário
  userMemory: {
    memories: BuscaMemoriaResult[];
    contextSummary: string;
    confidenceScore: number;
    suggestions: string[];
  };

  // Contexto combinado
  combined: {
    relevantSources: Array<{
      type: 'knowledge' | 'memory';
      content: string;
      title?: string;
      similarity: number;
      metadata?: Record<string, any>;
    }>;
    confidenceScore: number;
    recommendedAction: string;
    contextSummary: string;
  };

  // Métricas
  metrics: {
    knowledgeBaseHits: number;
    userMemoryHits: number;
    totalSearchTime: number;
    hybridScore: number;
  };
}

export interface ChatQuery {
  query: string;
  userId: string;
  context?: {
    currentMonth?: number;
    currentYear?: number;
    userFinancialData?: Record<string, any>;
  };
}

class HybridRAGService {
  private readonly KNOWLEDGE_WEIGHT = 0.7; // Peso da base de conhecimento
  private readonly MEMORY_WEIGHT = 0.3;    // Peso da memória do usuário
  private readonly MIN_SIMILARITY_THRESHOLD = 0.6;

  /**
   * Busca híbrida que combina base de conhecimento + memória do usuário
   */
  async searchHybrid(query: ChatQuery): Promise<HybridContext> {
    const startTime = Date.now();

    try {
      // Busca paralela em ambas as fontes
      const [knowledgeResults, memoryResults] = await Promise.all([
        this.searchKnowledgeBase(query.query),
        this.searchUserMemory(query.query, query.userId)
      ]);

      const totalSearchTime = Date.now() - startTime;

      // Combina e pondera os resultados
      const combinedContext = this.combineResults(knowledgeResults, memoryResults);

      return {
        knowledgeBase: {
          results: knowledgeResults.results,
          categories: knowledgeResults.categories,
          totalResults: knowledgeResults.totalResults,
          searchTime: knowledgeResults.searchTime
        },
        userMemory: {
          memories: memoryResults.memorias_relevantes,
          contextSummary: memoryResults.contexto_resumido,
          confidenceScore: memoryResults.confidence_score,
          suggestions: memoryResults.sugestoes
        },
        combined: combinedContext,
        metrics: {
          knowledgeBaseHits: knowledgeResults.results.length,
          userMemoryHits: memoryResults.memorias_relevantes.length,
          totalSearchTime,
          hybridScore: combinedContext.confidenceScore
        }
      };

    } catch (error) {
      console.error('[HybridRAGService] Erro na busca híbrida:', error);
      return this.getEmptyContext();
    }
  }

  /**
   * Busca específica na base de conhecimento
   */
  private async searchKnowledgeBase(query: string): Promise<RAGContext> {
    try {
      return await vectorSearchService.searchForRAG(query, {
        maxResults: 5,
        includeMetadata: true
      });
    } catch (error) {
      console.error('[HybridRAGService] Erro na busca da base de conhecimento:', error);
      return {
        query,
        results: [],
        totalResults: 0,
        searchTime: 0,
        categories: []
      };
    }
  }

  /**
   * Busca específica na memória do usuário
   */
  private async searchUserMemory(query: string, userId: string): Promise<ContextoRAG> {
    try {
      return await financialMemoryManager.buscarContextoRelevante(
        query,
        userId,
        5, // limite
        0.6 // threshold
      );
    } catch (error) {
      console.error('[HybridRAGService] Erro na busca da memória do usuário:', error);
      return {
        memorias_relevantes: [],
        contexto_resumido: '',
        confidence_score: 0,
        sugestoes: []
      };
    }
  }

  /**
   * Combina resultados das duas fontes com ponderação inteligente
   */
  private combineResults(
    knowledge: RAGContext,
    memory: ContextoRAG
  ): HybridContext['combined'] {
    const relevantSources: HybridContext['combined']['relevantSources'] = [];

    // Adiciona resultados da base de conhecimento
    knowledge.results.forEach(result => {
      if (result.similarity >= this.MIN_SIMILARITY_THRESHOLD) {
        relevantSources.push({
          type: 'knowledge',
          content: result.content,
          title: result.title,
          similarity: result.similarity * this.KNOWLEDGE_WEIGHT,
          metadata: result.metadata
        });
      }
    });

    // Adiciona resultados da memória do usuário
    memory.memorias_relevantes.forEach(memoria => {
      if (memoria.similarity >= this.MIN_SIMILARITY_THRESHOLD) {
        relevantSources.push({
          type: 'memory',
          content: memoria.conteudo,
          title: memoria.resumo,
          similarity: memoria.similarity * this.MEMORY_WEIGHT,
          metadata: memoria.metadata
        });
      }
    });

    // Ordena por similaridade ponderada
    relevantSources.sort((a, b) => b.similarity - a.similarity);

    // Calcula score de confiança combinado
    const confidenceScore = this.calculateHybridConfidence(knowledge, memory, relevantSources);

    // Gera recomendação baseada no contexto
    const recommendedAction = this.generateRecommendation(relevantSources, knowledge, memory);

    // Gera resumo do contexto
    const contextSummary = this.generateContextSummary(relevantSources, knowledge, memory);

    return {
      relevantSources: relevantSources.slice(0, 8), // Máximo 8 fontes
      confidenceScore,
      recommendedAction,
      contextSummary
    };
  }

  /**
   * Calcula score de confiança híbrido
   */
  private calculateHybridConfidence(
    knowledge: RAGContext,
    memory: ContextoRAG,
    sources: HybridContext['combined']['relevantSources']
  ): number {
    if (sources.length === 0) return 0;

    const knowledgeScore = knowledge.results.length > 0
      ? knowledge.results[0].similarity * this.KNOWLEDGE_WEIGHT
      : 0;

    const memoryScore = memory.confidence_score * this.MEMORY_WEIGHT;

    const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length;

    // Combina scores com bonificação por diversidade de fontes
    const diversityBonus = Math.min(sources.length / 5, 1) * 0.1;

    return Math.min((knowledgeScore + memoryScore + avgSimilarity + diversityBonus) / 2, 1);
  }

  /**
   * Gera recomendação baseada no contexto
   */
  private generateRecommendation(
    sources: HybridContext['combined']['relevantSources'],
    knowledge: RAGContext,
    memory: ContextoRAG
  ): string {
    if (sources.length === 0) {
      return 'Preciso de mais informações para fornecer uma recomendação personalizada.';
    }

    const hasKnowledge = sources.some(s => s.type === 'knowledge');
    const hasMemory = sources.some(s => s.type === 'memory');

    if (hasKnowledge && hasMemory) {
      return 'Posso fornecer uma resposta completa baseada em conhecimento especializado e seu histórico pessoal.';
    } else if (hasKnowledge) {
      return 'Tenho conhecimento especializado sobre este tópico financeiro.';
    } else if (hasMemory) {
      return 'Baseando-me no seu histórico pessoal para uma resposta personalizada.';
    }

    return 'Vou responder com base nas informações disponíveis.';
  }

  /**
   * Gera resumo do contexto combinado
   */
  private generateContextSummary(
    sources: HybridContext['combined']['relevantSources'],
    knowledge: RAGContext,
    memory: ContextoRAG
  ): string {
    if (sources.length === 0) {
      return 'Contexto limitado - considerando informações gerais.';
    }

    const knowledgeSources = sources.filter(s => s.type === 'knowledge').length;
    const memorySources = sources.filter(s => s.type === 'memory').length;
    const categories = [...new Set(knowledge.categories)];

    let summary = `Contexto rico disponível: `;

    if (knowledgeSources > 0) {
      summary += `${knowledgeSources} fontes de conhecimento especializado`;
      if (categories.length > 0) {
        summary += ` (${categories.slice(0, 3).join(', ')})`;
      }
    }

    if (memorySources > 0) {
      if (knowledgeSources > 0) summary += ' + ';
      summary += `${memorySources} referências do seu histórico pessoal`;
    }

    summary += '. Resposta será contextualizada e personalizada.';

    return summary;
  }

  /**
   * Retorna contexto vazio para casos de erro
   */
  private getEmptyContext(): HybridContext {
    return {
      knowledgeBase: {
        results: [],
        categories: [],
        totalResults: 0,
        searchTime: 0
      },
      userMemory: {
        memories: [],
        contextSummary: '',
        confidenceScore: 0,
        suggestions: []
      },
      combined: {
        relevantSources: [],
        confidenceScore: 0,
        recommendedAction: 'Informações insuficientes para contexto personalizado.',
        contextSummary: 'Nenhum contexto relevante encontrado.'
      },
      metrics: {
        knowledgeBaseHits: 0,
        userMemoryHits: 0,
        totalSearchTime: 0,
        hybridScore: 0
      }
    };
  }

  /**
   * Registra feedback sobre a qualidade da resposta
   */
  async recordFeedback(
    query: string,
    userId: string,
    context: HybridContext,
    feedback: 'helpful' | 'not_helpful',
    comment?: string
  ): Promise<void> {
    try {
      // Registra métricas de feedback
      await vectorSearchService.recordSearchMetrics(
        query,
        context.knowledgeBase.results,
        `feedback-${Date.now()}`
      );

      // TODO: Implementar sistema de feedback específico
      console.log('[HybridRAGService] Feedback registrado:', {
        query,
        userId,
        feedback,
        comment,
        hybridScore: context.metrics.hybridScore
      });

    } catch (error) {
      console.error('[HybridRAGService] Erro ao registrar feedback:', error);
    }
  }

  /**
   * Salva interação bem-sucedida na memória do usuário
   */
  async saveSuccessfulInteraction(
    query: string,
    response: string,
    userId: string,
    context: HybridContext
  ): Promise<void> {
    try {
      if (context.metrics.hybridScore > 0.7) {
        await financialMemoryManager.armazenarInteracao({
          userId,
          tipo: 'conversa',
          conteudo: `Q: ${query}\nA: ${response}`,
          resumo: `Conversa sobre: ${query.substring(0, 100)}...`,
          metadata: {
            hybridScore: context.metrics.hybridScore,
            sources: context.combined.relevantSources.length,
            timestamp: new Date().toISOString()
          },
          contextoFinanceiro: {
            categories: context.knowledgeBase.categories,
            confidence: context.combined.confidenceScore
          }
        });
      }
    } catch (error) {
      console.error('[HybridRAGService] Erro ao salvar interação:', error);
    }
  }
}

// Instância singleton
export const hybridRAGService = new HybridRAGService();
export default hybridRAGService;