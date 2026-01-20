import { supabase } from '../supabase/client';
import { OpenAI } from 'openai';

/**
 * FinancialMemoryManager - Sistema RAG para Memória Financeira
 *
 * Gerencia embeddings e busca semântica para criar contexto inteligente
 * para a IA financeira baseado em conversas e padrões históricos.
 */

export interface MemoriaFinanceira {
  id: string;
  usuario_id: string;
  tipo_conteudo: 'conversa' | 'insight' | 'transacao' | 'padrao';
  conteudo: string;
  resumo?: string;
  embedding: number[];
  metadata: Record<string, any>;
  contexto_financeiro: Record<string, any>;
  relevancia_score: number;
  data_criacao: string;
  data_atualizacao: string;
  ativo: boolean;
}

export interface BuscaMemoriaResult {
  id: string;
  tipo_conteudo: string;
  conteudo: string;
  resumo?: string;
  metadata: Record<string, any>;
  contexto_financeiro: Record<string, any>;
  similarity: number;
  data_criacao: string;
}

export interface InteracaoUsuario {
  userId: string;
  tipo: 'conversa' | 'insight' | 'transacao' | 'padrao';
  conteudo: string;
  resumo?: string;
  metadata?: Record<string, any>;
  contextoFinanceiro?: Record<string, any>;
}

export interface ContextoRAG {
  memorias_relevantes: BuscaMemoriaResult[];
  contexto_resumido: string;
  confidence_score: number;
  sugestoes: string[];
}

export class FinancialMemoryManager {
  private openai: OpenAI | null = null;

  constructor() {
    // Inicializar OpenAI apenas se a chave estiver disponível
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  /**
   * Armazena uma nova interação na memória vetorial
   */
  async armazenarInteracao(interacao: InteracaoUsuario): Promise<string | null> {
    try {
      if (!this.openai) {
        console.warn('OpenAI não configurado - não é possível gerar embeddings');
        return null;
      }

      // Gerar embedding do conteúdo
      const embedding = await this.gerarEmbedding(interacao.conteudo);
      if (!embedding) {
        throw new Error('Falha ao gerar embedding');
      }

      // Inserir na tabela app_memoria_ia
      const { data, error } = await supabase
        .from('app_memoria_ia')
        .insert({
          usuario_id: interacao.userId,
          tipo_conteudo: interacao.tipo,
          conteudo: interacao.conteudo,
          resumo: interacao.resumo,
          embedding,
          metadata: interacao.metadata || {},
          contexto_financeiro: interacao.contextoFinanceiro || {},
          relevancia_score: this.calcularRelevancia(interacao)
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erro ao armazenar memória:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Erro ao armazenar interação:', error);
      return null;
    }
  }

  /**
   * Busca contexto relevante baseado em uma consulta
   */
  async buscarContextoRelevante(
    consulta: string,
    userId: string,
    limite: number = 5,
    threshold: number = 0.7
  ): Promise<ContextoRAG> {
    try {
      if (!this.openai) {
        return {
          memorias_relevantes: [],
          contexto_resumido: '',
          confidence_score: 0,
          sugestoes: []
        };
      }

      // Gerar embedding da consulta
      const consultaEmbedding = await this.gerarEmbedding(consulta);
      if (!consultaEmbedding) {
        throw new Error('Falha ao gerar embedding da consulta');
      }

      // Buscar memórias similares usando a função do Supabase
      const { data: memorias, error } = await supabase.rpc('buscar_memoria_financeira', {
        query_embedding: consultaEmbedding,
        usuario_id: userId,
        match_count: limite,
        match_threshold: threshold
      });

      if (error) {
        console.error('Erro na busca semântica:', error);
        return {
          memorias_relevantes: [],
          contexto_resumido: '',
          confidence_score: 0,
          sugestoes: []
        };
      }

      // Processar resultados e gerar contexto
      const memoriasRelevantes = memorias || [];
      const contextoResumido = await this.gerarResumoContexto(memoriasRelevantes, consulta);
      const confidenceScore = this.calcularConfidenceScore(memoriasRelevantes);
      const sugestoes = await this.gerarSugestoes(memoriasRelevantes, consulta);

      return {
        memorias_relevantes: memoriasRelevantes,
        contexto_resumido: contextoResumido,
        confidence_score: confidenceScore,
        sugestoes
      };
    } catch (error) {
      console.error('Erro ao buscar contexto relevante:', error);
      return {
        memorias_relevantes: [],
        contexto_resumido: '',
        confidence_score: 0,
        sugestoes: []
      };
    }
  }

  /**
   * Busca memórias por tipo específico
   */
  async buscarPorTipo(
    userId: string,
    tipo: 'conversa' | 'insight' | 'transacao' | 'padrao',
    limite: number = 10
  ): Promise<BuscaMemoriaResult[]> {
    try {
      const { data, error } = await supabase.rpc('buscar_contexto_por_tipo', {
        usuario_id: userId,
        tipo_conteudo: tipo,
        limit_count: limite
      });

      if (error) {
        console.error('Erro ao buscar por tipo:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar memórias por tipo:', error);
      return [];
    }
  }

  /**
   * Gera embedding usando OpenAI
   */
  private async gerarEmbedding(texto: string): Promise<number[] | null> {
    try {
      if (!this.openai) {
        return null;
      }

      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texto.replace(/\n/g, ' ').substring(0, 8000), // Limitar tamanho
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      return null;
    }
  }

  /**
   * Calcula score de relevância baseado no tipo e conteúdo
   */
  private calcularRelevancia(interacao: InteracaoUsuario): number {
    let score = 0.5; // Base score

    // Ajustar baseado no tipo
    switch (interacao.tipo) {
      case 'insight':
        score += 0.3;
        break;
      case 'transacao':
        score += 0.2;
        break;
      case 'padrao':
        score += 0.25;
        break;
      case 'conversa':
        score += 0.1;
        break;
    }

    // Ajustar baseado na presença de contexto financeiro
    if (interacao.contextoFinanceiro && Object.keys(interacao.contextoFinanceiro).length > 0) {
      score += 0.2;
    }

    // Ajustar baseado no tamanho do conteúdo (mais conteúdo = mais informativo)
    if (interacao.conteudo.length > 200) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Gera resumo do contexto encontrado
   */
  private async gerarResumoContexto(
    memorias: BuscaMemoriaResult[],
    consulta: string
  ): Promise<string> {
    if (memorias.length === 0) {
      return '';
    }

    // Resumo simples baseado nos conteúdos mais relevantes
    const resumos = memorias
      .slice(0, 3) // Top 3
      .map(m => m.resumo || m.conteudo.substring(0, 100))
      .join('. ');

    return `Contexto relevante: ${resumos}`;
  }

  /**
   * Calcula confidence score baseado na similaridade das memórias
   */
  private calcularConfidenceScore(memorias: BuscaMemoriaResult[]): number {
    if (memorias.length === 0) {
      return 0;
    }

    const avgSimilarity = memorias.reduce((sum, m) => sum + m.similarity, 0) / memorias.length;
    return Math.round(avgSimilarity * 100) / 100;
  }

  /**
   * Gera sugestões baseadas no contexto
   */
  private async gerarSugestoes(
    memorias: BuscaMemoriaResult[],
    consulta: string
  ): Promise<string[]> {
    if (memorias.length === 0) {
      return [];
    }

    // Sugestões simples baseadas nos tipos de conteúdo encontrados
    const tipos = [...new Set(memorias.map(m => m.tipo_conteudo))];
    const sugestoes: string[] = [];

    if (tipos.includes('transacao')) {
      sugestoes.push('Ver mais detalhes sobre transações similares');
    }
    if (tipos.includes('insight')) {
      sugestoes.push('Consultar insights relacionados');
    }
    if (tipos.includes('padrao')) {
      sugestoes.push('Analisar padrões de comportamento');
    }

    return sugestoes.slice(0, 3);
  }

  /**
   * Limpa memórias antigas para housekeeping
   */
  async limparMemoriasAntigas(userId: string, diasRetencao: number = 90): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('limpar_memorias_antigas', {
        usuario_id: userId,
        dias_retencao: diasRetencao
      });

      if (error) {
        console.error('Erro ao limpar memórias antigas:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Erro ao limpar memórias antigas:', error);
      return 0;
    }
  }

  /**
   * Obtém estatísticas da memória do usuário
   */
  async obterEstatisticas(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('estatisticas_memoria_ia', {
        usuario_id: userId
      });

      if (error) {
        console.error('Erro ao obter estatísticas:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return null;
    }
  }

  /**
   * Atualiza relevância de uma memória
   */
  async atualizarRelevancia(memoriaId: string, novaRelevancia: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_memoria_ia')
        .update({
          relevancia_score: novaRelevancia,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', memoriaId);

      if (error) {
        console.error('Erro ao atualizar relevância:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar relevância:', error);
      return false;
    }
  }

  /**
   * Desativa uma memória (soft delete)
   */
  async desativarMemoria(memoriaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_memoria_ia')
        .update({
          ativo: false,
          data_atualizacao: new Date().toISOString()
        })
        .eq('id', memoriaId);

      if (error) {
        console.error('Erro ao desativar memória:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao desativar memória:', error);
      return false;
    }
  }
}

// Instância singleton
export const financialMemoryManager = new FinancialMemoryManager();