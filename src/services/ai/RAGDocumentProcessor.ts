import { supabase } from '../supabase/client';
import embeddingService, { KnowledgeChunk } from './EmbeddingService';

export interface DocumentUpload {
  id?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadPath?: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  chunksCreated?: number;
  errorMessage?: string;
  uploadedBy?: string;
}

export interface ProcessingResult {
  success: boolean;
  uploadId: string;
  chunksCreated: number;
  error?: string;
}

export interface ProcessingProgress {
  uploadId: string;
  totalChunks: number;
  processedChunks: number;
  status: string;
  error?: string;
}

class RAGDocumentProcessor {
  private readonly SUPPORTED_TYPES = [
    'text/plain',
    'text/csv',
    'application/json',
    'text/markdown'
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Valida arquivo antes do upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.SUPPORTED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Tipo de arquivo não suportado. Tipos aceitos: ${this.SUPPORTED_TYPES.join(', ')}`
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Arquivo muito grande. Tamanho máximo: ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    return { valid: true };
  }

  /**
   * Registra upload no banco de dados
   */
  async registerUpload(
    file: File,
    uploadedBy: string,
    category: string
  ): Promise<string> {
    try {
      const upload: Omit<DocumentUpload, 'id'> = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        processingStatus: 'pending',
        uploadedBy
      };

      const { data, error } = await supabase
        .from('app_document_uploads')
        .insert(upload)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('[RAGDocumentProcessor] Erro ao registrar upload:', error);
      throw error;
    }
  }

  /**
   * Processa arquivo e cria embeddings
   */
  async processFile(
    file: File,
    uploadId: string,
    category: string,
    title?: string
  ): Promise<ProcessingResult> {
    try {
      // Atualiza status para processing
      await this.updateUploadStatus(uploadId, 'processing');

      // Extrai texto do arquivo
      const text = await this.extractText(file);

      if (!text.trim()) {
        throw new Error('Arquivo vazio ou não foi possível extrair texto');
      }

      // Prepara metadata do chunk
      const metadata: Omit<KnowledgeChunk, 'content'> = {
        title: title || file.name,
        category,
        source: 'upload',
        fileName: file.name,
        createdBy: uploadId // Temporário, será atualizado
      };

      // Processa texto em chunks e gera embeddings
      const chunkIds = await embeddingService.processLongText(text, metadata);

      // Atualiza status para completed
      await this.updateUploadStatus(uploadId, 'completed', chunkIds.length);

      return {
        success: true,
        uploadId,
        chunksCreated: chunkIds.length
      };

    } catch (error) {
      console.error('[RAGDocumentProcessor] Erro ao processar arquivo:', error);

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await this.updateUploadStatus(uploadId, 'failed', 0, errorMessage);

      return {
        success: false,
        uploadId,
        chunksCreated: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Processa arquivo completo (upload + processamento)
   */
  async uploadAndProcess(
    file: File,
    uploadedBy: string,
    category: string,
    title?: string
  ): Promise<ProcessingResult> {
    try {
      // Valida arquivo
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Registra upload
      const uploadId = await this.registerUpload(file, uploadedBy, category);

      // Processa arquivo
      return await this.processFile(file, uploadId, category, title);

    } catch (error) {
      console.error('[RAGDocumentProcessor] Erro no upload e processamento:', error);
      throw error;
    }
  }

  /**
   * Processa conversas de treinamento em formato JSON/CSV
   */
  async processTrainingConversations(
    file: File,
    uploadedBy: string
  ): Promise<ProcessingResult> {
    try {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const uploadId = await this.registerUpload(file, uploadedBy, 'training');
      await this.updateUploadStatus(uploadId, 'processing');

      const text = await this.extractText(file);
      let conversations: Array<{
        question: string;
        ideal_answer: string;
        context?: string;
        category?: string;
      }> = [];

      // Parse do arquivo
      if (file.type === 'application/json') {
        conversations = JSON.parse(text);
      } else if (file.type === 'text/csv') {
        conversations = this.parseCSV(text);
      } else {
        throw new Error('Formato não suportado para conversas de treinamento');
      }

      // Salva conversas no banco
      const { data, error } = await supabase
        .from('app_training_conversations')
        .insert(
          conversations.map(conv => ({
            ...conv,
            created_by: uploadedBy,
            status: 'pending'
          }))
        );

      if (error) {
        throw error;
      }

      await this.updateUploadStatus(uploadId, 'completed', conversations.length);

      return {
        success: true,
        uploadId,
        chunksCreated: conversations.length
      };

    } catch (error) {
      console.error('[RAGDocumentProcessor] Erro ao processar conversas:', error);
      throw error;
    }
  }

  /**
   * Obtém progresso do processamento
   */
  async getProcessingProgress(uploadId: string): Promise<ProcessingProgress | null> {
    try {
      const { data, error } = await supabase
        .from('app_document_uploads')
        .select('*')
        .eq('id', uploadId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        uploadId: data.id,
        totalChunks: data.chunks_created || 0,
        processedChunks: data.chunks_created || 0,
        status: data.processing_status,
        error: data.error_message || undefined
      };

    } catch (error) {
      console.error('[RAGDocumentProcessor] Erro ao obter progresso:', error);
      return null;
    }
  }

  /**
   * Lista uploads do usuário
   */
  async listUserUploads(
    uploadedBy: string,
    limit: number = 20
  ): Promise<DocumentUpload[]> {
    try {
      const { data, error } = await supabase
        .from('app_document_uploads')
        .select('*')
        .eq('uploaded_by', uploadedBy)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('[RAGDocumentProcessor] Erro ao listar uploads:', error);
      throw error;
    }
  }

  /**
   * Extrai texto do arquivo
   */
  private async extractText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Falha ao ler arquivo como texto'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };

      reader.readAsText(file, 'UTF-8');
    });
  }

  /**
   * Parse simples de CSV para conversas
   */
  private parseCSV(csvText: string): Array<{
    question: string;
    ideal_answer: string;
    context?: string;
    category?: string;
  }> {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    const conversations = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const conversation: any = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          conversation[header] = values[index].replace(/^["']|["']$/g, ''); // Remove quotes
        }
      });

      if (conversation.question && conversation.ideal_answer) {
        conversations.push(conversation);
      }
    }

    return conversations;
  }

  /**
   * Atualiza status do upload
   */
  private async updateUploadStatus(
    uploadId: string,
    status: DocumentUpload['processingStatus'],
    chunksCreated?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updates: any = {
        processing_status: status,
        updated_at: new Date().toISOString()
      };

      if (chunksCreated !== undefined) {
        updates.chunks_created = chunksCreated;
      }

      if (errorMessage) {
        updates.error_message = errorMessage;
      }

      if (status === 'completed' || status === 'failed') {
        updates.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('app_document_uploads')
        .update(updates)
        .eq('id', uploadId);

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('[RAGDocumentProcessor] Erro ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Remove upload e chunks associados
   */
  async deleteUpload(uploadId: string): Promise<void> {
    try {
      // Remove chunks associados
      await supabase
        .from('app_knowledge_base')
        .delete()
        .eq('created_by', uploadId);

      // Remove registro de upload
      const { error } = await supabase
        .from('app_document_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) {
        throw error;
      }

    } catch (error) {
      console.error('[RAGDocumentProcessor] Erro ao deletar upload:', error);
      throw error;
    }
  }
}

// Instância singleton
export const ragDocumentProcessor = new RAGDocumentProcessor();
export default ragDocumentProcessor;