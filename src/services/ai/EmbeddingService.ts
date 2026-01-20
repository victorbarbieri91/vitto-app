import OpenAI from 'openai';
import { supabase } from '../supabase/client';

export interface EmbeddingResult {
  content: string;
  embedding: number[];
  tokens: number;
}

export interface KnowledgeChunk {
  id?: string;
  content: string;
  title?: string;
  category: string;
  source: string;
  fileName?: string;
  chunkIndex?: number;
  metadata?: Record<string, any>;
  createdBy?: string;
}

class EmbeddingService {
  private openai: OpenAI | null = null;

  constructor() {
    // Lazy initialization - não falha no construtor
  }

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_OPENAI_API_KEY não configurada. Configure a variável de ambiente para usar embeddings.');
      }
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }
    return this.openai;
  }

  /**
   * Verifica se o serviço está disponível
   */
  isAvailable(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }

  /**
   * Gera embedding para um texto usando OpenAI
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const cleanText = this.cleanText(text);
      const openai = this.getOpenAI();

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanText,
        encoding_format: 'float'
      });

      return {
        content: cleanText,
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens
      };
    } catch (error) {
      console.error('[EmbeddingService] Erro ao gerar embedding:', error);
      throw new Error(`Falha ao gerar embedding: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Processa texto longo dividindo em chunks e gerando embeddings
   */
  async processLongText(
    text: string,
    metadata: Omit<KnowledgeChunk, 'content'>
  ): Promise<string[]> {
    try {
      const chunks = this.splitIntoChunks(text);
      const insertedIds: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.generateEmbedding(chunk);

        const id = await this.saveKnowledgeChunk({
          ...metadata,
          content: chunk,
          chunkIndex: i
        }, embedding.embedding);

        insertedIds.push(id);

        // Pequeno delay para evitar rate limiting
        if (i < chunks.length - 1) {
          await this.delay(100);
        }
      }

      return insertedIds;
    } catch (error) {
      console.error('[EmbeddingService] Erro ao processar texto longo:', error);
      throw error;
    }
  }

  /**
   * Salva chunk de conhecimento com embedding no banco
   */
  async saveKnowledgeChunk(
    chunk: KnowledgeChunk,
    embedding: number[]
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('app_knowledge_base')
        .insert({
          content: chunk.content,
          embedding: JSON.stringify(embedding),
          title: chunk.title,
          category: chunk.category,
          source: chunk.source,
          file_name: chunk.fileName,
          chunk_index: chunk.chunkIndex || 0,
          metadata: chunk.metadata || {},
          created_by: chunk.createdBy
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('[EmbeddingService] Erro ao salvar chunk:', error);
      throw error;
    }
  }

  /**
   * Busca conhecimento por similaridade vetorial
   */
  async searchSimilar(
    query: string,
    limit: number = 5,
    category?: string
  ): Promise<Array<{
    id: string;
    content: string;
    title?: string;
    category: string;
    similarity: number;
    metadata: Record<string, any>;
  }>> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);

      // Busca por similaridade vetorial
      let queryBuilder = supabase.rpc('search_knowledge_base', {
        query_embedding: JSON.stringify(queryEmbedding.embedding),
        match_threshold: 0.7,
        match_count: limit
      });

      if (category) {
        queryBuilder = queryBuilder.eq('category', category);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[EmbeddingService] Erro na busca similar:', error);
      throw error;
    }
  }

  /**
   * Divide texto em chunks menores
   */
  private splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      const sentenceWithPunctuation = trimmedSentence + '.';

      if (currentChunk.length + sentenceWithPunctuation.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentenceWithPunctuation;
        } else {
          // Sentença muito longa, forçar divisão
          chunks.push(sentenceWithPunctuation);
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Limpa e normaliza texto
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\.\,\!\?\-\(\)\[\]\:\;]/g, '')
      .trim();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Aprova um chunk de conhecimento
   */
  async approveKnowledge(id: string, approvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_knowledge_base')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('[EmbeddingService] Erro ao aprovar conhecimento:', error);
      throw error;
    }
  }

  /**
   * Rejeita um chunk de conhecimento
   */
  async rejectKnowledge(id: string, approvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_knowledge_base')
        .update({
          status: 'rejected',
          approved_by: approvedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('[EmbeddingService] Erro ao rejeitar conhecimento:', error);
      throw error;
    }
  }

  /**
   * Lista conhecimento por status
   */
  async listKnowledge(
    status?: string,
    category?: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    content: string;
    title?: string;
    category: string;
    source: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>> {
    try {
      let query = supabase
        .from('app_knowledge_base')
        .select('id, content, title, category, source, status, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[EmbeddingService] Erro ao listar conhecimento:', error);
      throw error;
    }
  }
}

// Instância singleton
export const embeddingService = new EmbeddingService();
export default embeddingService;