import { supabase } from '../supabase/client';
import embeddingService from './EmbeddingService';

export interface SearchResult {
  id: string;
  content: string;
  title?: string;
  category: string;
  source: string;
  similarity: number;
  metadata: Record<string, any>;
  chunkIndex?: number;
  fileName?: string;
}

export interface SearchFilters {
  categories?: string[];
  sources?: string[];
  minSimilarity?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface RAGContext {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  categories: string[];
}

export interface RAGResponse {
  answer: string;
  context: RAGContext;
  confidence: number;
  sources: Array<{
    title?: string;
    content: string;
    similarity: number;
  }>;
}

class VectorSearchService {
  private readonly DEFAULT_SIMILARITY_THRESHOLD = 0.7;
  private readonly DEFAULT_RESULT_COUNT = 5;

  /**
   * Busca vetorial básica por similaridade
   */
  async searchSimilar(
    query: string,
    options: {
      limit?: number;
      threshold?: number;
      filters?: SearchFilters;
    } = {}
  ): Promise<SearchResult[]> {
    try {
      const {
        limit = this.DEFAULT_RESULT_COUNT,
        threshold = this.DEFAULT_SIMILARITY_THRESHOLD,
        filters = {}
      } = options;

      // Gera embedding da query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Constrói query base
      let searchQuery = supabase.rpc('search_knowledge_base', {
        query_embedding: JSON.stringify(queryEmbedding.embedding),
        match_threshold: threshold,
        match_count: limit
      });

      // Aplica filtros se fornecidos
      if (filters.categories?.length) {
        searchQuery = searchQuery.in('category', filters.categories);
      }

      const { data, error } = await searchQuery;

      if (error) {
        throw error;
      }

      return (data || []).map(this.formatSearchResult);

    } catch (error) {
      console.error('[VectorSearchService] Erro na busca similar:', error);
      throw error;
    }
  }

  /**
   * Busca avançada com múltiplos filtros
   */
  async advancedSearch(
    query: string,
    filters: SearchFilters,
    limit: number = 10
  ): Promise<{
    results: SearchResult[];
    totalFound: number;
    categories: string[];
  }> {
    try {
      const results = await this.searchSimilar(query, {
        limit,
        threshold: filters.minSimilarity || this.DEFAULT_SIMILARITY_THRESHOLD,
        filters
      });

      // Extrai categorias únicas dos resultados
      const categories = [...new Set(results.map(r => r.category))];

      return {
        results,
        totalFound: results.length,
        categories
      };

    } catch (error) {
      console.error('[VectorSearchService] Erro na busca avançada:', error);
      throw error;
    }
  }

  /**
   * Busca com contexto para RAG - retorna contexto estruturado
   */
  async searchForRAG(
    query: string,
    options: {
      maxResults?: number;
      categories?: string[];
      includeMetadata?: boolean;
    } = {}
  ): Promise<RAGContext> {
    const startTime = Date.now();

    try {
      const {
        maxResults = 5,
        categories,
        includeMetadata = true
      } = options;

      const results = await this.searchSimilar(query, {
        limit: maxResults,
        filters: { categories }
      });

      const searchTime = Date.now() - startTime;
      const uniqueCategories = [...new Set(results.map(r => r.category))];

      return {
        query,
        results,
        totalResults: results.length,
        searchTime,
        categories: uniqueCategories
      };

    } catch (error) {
      console.error('[VectorSearchService] Erro na busca RAG:', error);
      throw error;
    }
  }

  /**
   * Busca por categoria específica
   */
  async searchByCategory(
    query: string,
    category: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    return this.searchSimilar(query, {
      limit,
      filters: { categories: [category] }
    });
  }

  /**
   * Busca por múltiplas queries (para expandir contexto)
   */
  async multiQuerySearch(
    queries: string[],
    limit: number = 3
  ): Promise<SearchResult[]> {
    try {
      const allResults: SearchResult[] = [];
      const seenIds = new Set<string>();

      for (const query of queries) {
        const results = await this.searchSimilar(query, { limit });

        // Remove duplicatas
        for (const result of results) {
          if (!seenIds.has(result.id)) {
            seenIds.add(result.id);
            allResults.push(result);
          }
        }
      }

      // Ordena por similaridade e limita
      return allResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit * queries.length);

    } catch (error) {
      console.error('[VectorSearchService] Erro na busca multi-query:', error);
      throw error;
    }
  }

  /**
   * Obtém sugestões de busca baseadas no conteúdo
   */
  async getSuggestions(
    partialQuery: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      if (partialQuery.length < 3) {
        return [];
      }

      // Busca por títulos e conteúdo que contenham o texto
      const { data, error } = await supabase
        .from('app_knowledge_base')
        .select('title, content')
        .or(`title.ilike.%${partialQuery}%,content.ilike.%${partialQuery}%`)
        .eq('status', 'approved')
        .limit(limit);

      if (error) {
        throw error;
      }

      // Extrai frases relevantes
      const suggestions = new Set<string>();

      data?.forEach(item => {
        if (item.title && item.title.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(item.title);
        }

        // Extrai frases do conteúdo
        const sentences = item.content.split(/[.!?]+/);
        sentences.forEach(sentence => {
          const trimmed = sentence.trim();
          if (trimmed.toLowerCase().includes(partialQuery.toLowerCase()) &&
              trimmed.length > 10 && trimmed.length < 100) {
            suggestions.add(trimmed);
          }
        });
      });

      return Array.from(suggestions).slice(0, limit);

    } catch (error) {
      console.error('[VectorSearchService] Erro ao obter sugestões:', error);
      return [];
    }
  }

  /**
   * Registra métricas de busca
   */
  async recordSearchMetrics(
    query: string,
    results: SearchResult[],
    sessionId?: string
  ): Promise<void> {
    try {
      const avgRelevance = results.length > 0
        ? results.reduce((sum, r) => sum + r.similarity, 0) / results.length
        : 0;

      await supabase
        .from('app_rag_metrics')
        .insert({
          query_text: query,
          retrieved_chunks: results.length,
          relevance_score: avgRelevance,
          session_id: sessionId || null
        });

    } catch (error) {
      console.error('[VectorSearchService] Erro ao registrar métricas:', error);
      // Não propagar erro de métricas
    }
  }

  /**
   * Obtém estatísticas de performance da busca
   */
  async getSearchStats(
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    totalSearches: number;
    avgRelevanceScore: number;
    topQueries: Array<{ query: string; count: number }>;
    avgResultsPerSearch: number;
  }> {
    try {
      const daysBack = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('app_rag_metrics')
        .select('*')
        .gte('created_at', cutoffDate.toISOString());

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalSearches: 0,
          avgRelevanceScore: 0,
          topQueries: [],
          avgResultsPerSearch: 0
        };
      }

      // Calcula estatísticas
      const totalSearches = data.length;
      const avgRelevanceScore = data.reduce((sum, m) => sum + (m.relevance_score || 0), 0) / totalSearches;
      const avgResultsPerSearch = data.reduce((sum, m) => sum + (m.retrieved_chunks || 0), 0) / totalSearches;

      // Top queries
      const queryCount: Record<string, number> = {};
      data.forEach(m => {
        const query = m.query_text?.toLowerCase().trim();
        if (query) {
          queryCount[query] = (queryCount[query] || 0) + 1;
        }
      });

      const topQueries = Object.entries(queryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      return {
        totalSearches,
        avgRelevanceScore,
        topQueries,
        avgResultsPerSearch
      };

    } catch (error) {
      console.error('[VectorSearchService] Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Formata resultado da busca
   */
  private formatSearchResult(raw: any): SearchResult {
    return {
      id: raw.id,
      content: raw.content,
      title: raw.title,
      category: raw.category,
      source: raw.source || 'unknown',
      similarity: raw.similarity,
      metadata: raw.metadata || {},
      chunkIndex: raw.chunk_index,
      fileName: raw.file_name
    };
  }

  /**
   * Expande query com sinônimos e termos relacionados
   */
  private expandQuery(query: string): string[] {
    const expansions: Record<string, string[]> = {
      'dinheiro': ['capital', 'recursos', 'verba', 'quantia'],
      'gasto': ['despesa', 'custo', 'dispêndio'],
      'renda': ['receita', 'ganho', 'rendimento'],
      'poupança': ['economia', 'reserva', 'poupador'],
      'investimento': ['aplicação', 'investir', 'rentabilidade'],
      'cartão': ['cartão de crédito', 'cartão de débito', 'fatura'],
      'conta': ['conta bancária', 'conta corrente', 'saldo']
    };

    const expanded = [query];
    const queryLower = query.toLowerCase();

    Object.entries(expansions).forEach(([key, synonyms]) => {
      if (queryLower.includes(key)) {
        expanded.push(...synonyms);
      }
    });

    return expanded;
  }
}

// Instância singleton
export const vectorSearchService = new VectorSearchService();
export default vectorSearchService;