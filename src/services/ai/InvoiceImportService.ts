import { documentProcessor, ExtractedFinancialData, ProcessingResult } from './DocumentProcessor';
import { transactionService, CreateTransactionRequest } from '../api/TransactionService';
import { creditCardService, CreditCard } from '../api/CreditCardService';
import { supabase } from '../supabase/client';

/**
 * Interface para transacao extraida pronta para importacao
 */
export interface ExtractedTransaction {
  id: string; // ID temporario para tracking no UI
  data: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  categoria_sugerida: string;
  categoria_id?: number;
  selected: boolean; // Para UI de selecao
}

/**
 * Resultado do processamento de documento
 */
export interface DocumentProcessingResult {
  success: boolean;
  transactions: ExtractedTransaction[];
  confianca: number;
  tipoDocumento: string;
  observacoes: string[];
  sugestoes: string[];
  error?: string;
}

/**
 * Resultado da importacao de transacoes
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

/**
 * InvoiceImportService - Servico para importacao de faturas de cartao
 *
 * Processa documentos (PDF, XLSX, imagens) e importa transacoes
 * para o cartao de credito selecionado.
 */
export class InvoiceImportService {
  private categoriesCache: Map<string, number> | null = null;

  /**
   * Processa documento e extrai transacoes
   */
  async processDocument(file: File): Promise<DocumentProcessingResult> {
    try {
      // Processar documento com DocumentProcessor
      const result: ProcessingResult = await documentProcessor.processDocument(file);

      if (!result.success || !result.data) {
        return {
          success: false,
          transactions: [],
          confianca: 0,
          tipoDocumento: 'unknown',
          observacoes: [],
          sugestoes: [],
          error: result.error || 'Erro ao processar documento'
        };
      }

      // Extrair transacoes do resultado
      const transactions = this.extractTransactions(result.data);

      // Mapear categorias
      await this.mapCategoriesToTransactions(transactions);

      return {
        success: true,
        transactions,
        confianca: result.data.confianca,
        tipoDocumento: result.data.tipo_documento,
        observacoes: result.data.observacoes,
        sugestoes: result.data.sugestoes_acao
      };
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      return {
        success: false,
        transactions: [],
        confianca: 0,
        tipoDocumento: 'unknown',
        observacoes: [],
        sugestoes: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Extrai transacoes do resultado do DocumentProcessor
   */
  private extractTransactions(data: ExtractedFinancialData): ExtractedTransaction[] {
    const transacoes = data.dados_extraidos.transacoes || [];

    return transacoes.map((t, index) => ({
      id: `temp-${Date.now()}-${index}`,
      data: t.data,
      descricao: t.descricao,
      valor: Math.abs(t.valor),
      tipo: t.tipo,
      categoria_sugerida: t.categoria_sugerida || 'outros',
      selected: true // Todas selecionadas por padrao
    }));
  }

  /**
   * Mapeia categorias sugeridas para IDs do sistema
   */
  private async mapCategoriesToTransactions(transactions: ExtractedTransaction[]): Promise<void> {
    // Carregar cache de categorias se necessario
    if (!this.categoriesCache) {
      await this.loadCategoriesCache();
    }

    for (const transaction of transactions) {
      const categoryId = this.categoriesCache?.get(transaction.categoria_sugerida.toLowerCase());
      if (categoryId) {
        transaction.categoria_id = categoryId;
      }
    }
  }

  /**
   * Carrega cache de categorias do banco
   */
  private async loadCategoriesCache(): Promise<void> {
    try {
      const { data: categories, error } = await supabase
        .from('app_categoria')
        .select('id, nome');

      if (error) throw error;

      this.categoriesCache = new Map();

      // Mapear nomes normalizados para IDs
      for (const cat of categories || []) {
        const normalizedName = cat.nome.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        this.categoriesCache.set(normalizedName, cat.id);

        // Adicionar aliases comuns
        if (normalizedName.includes('alimenta')) {
          this.categoriesCache.set('alimentacao', cat.id);
          this.categoriesCache.set('comida', cat.id);
        }
        if (normalizedName.includes('transport')) {
          this.categoriesCache.set('transporte', cat.id);
          this.categoriesCache.set('uber', cat.id);
        }
        if (normalizedName.includes('saude') || normalizedName.includes('saude')) {
          this.categoriesCache.set('saude', cat.id);
          this.categoriesCache.set('farmacia', cat.id);
        }
        if (normalizedName.includes('lazer') || normalizedName.includes('entretenimento')) {
          this.categoriesCache.set('lazer', cat.id);
          this.categoriesCache.set('entretenimento', cat.id);
        }
        if (normalizedName.includes('casa') || normalizedName.includes('moradia')) {
          this.categoriesCache.set('casa', cat.id);
          this.categoriesCache.set('moradia', cat.id);
        }
        if (normalizedName.includes('compra') || normalizedName.includes('shopping')) {
          this.categoriesCache.set('compras', cat.id);
          this.categoriesCache.set('shopping', cat.id);
        }
        if (normalizedName.includes('outro')) {
          this.categoriesCache.set('outros', cat.id);
          this.categoriesCache.set('geral', cat.id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      this.categoriesCache = new Map();
    }
  }

  /**
   * Importa transacoes selecionadas para o cartao
   */
  async importTransactions(
    transactions: ExtractedTransaction[],
    cardId: number
  ): Promise<ImportResult> {
    const selectedTransactions = transactions.filter(t => t.selected);

    if (selectedTransactions.length === 0) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: ['Nenhuma transacao selecionada']
      };
    }

    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    // Obter categoria padrao se necessario
    const defaultCategoryId = await this.getDefaultCategoryId();

    for (const transaction of selectedTransactions) {
      try {
        const request: CreateTransactionRequest = {
          descricao: transaction.descricao,
          valor: transaction.valor,
          data: transaction.data,
          tipo: 'despesa_cartao',
          categoria_id: transaction.categoria_id || defaultCategoryId,
          cartao_id: cardId,
          status: 'confirmado'
        };

        const { error } = await transactionService.create(request);

        if (error) {
          failed++;
          errors.push(`Erro em "${transaction.descricao}": ${error.message}`);
        } else {
          imported++;
        }
      } catch (error) {
        failed++;
        errors.push(`Erro em "${transaction.descricao}": ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    return {
      success: failed === 0,
      imported,
      failed,
      errors
    };
  }

  /**
   * Obtem ID da categoria padrao (Outros)
   */
  private async getDefaultCategoryId(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('app_categoria')
        .select('id')
        .or('nome.ilike.%outro%,nome.ilike.%geral%')
        .limit(1)
        .single();

      if (error || !data) {
        // Buscar primeira categoria disponivel
        const { data: firstCat } = await supabase
          .from('app_categoria')
          .select('id')
          .limit(1)
          .single();

        return firstCat?.id || 1;
      }

      return data.id;
    } catch {
      return 1;
    }
  }

  /**
   * Lista cartoes disponiveis para importacao
   */
  async getAvailableCards(): Promise<CreditCard[]> {
    try {
      return await creditCardService.list();
    } catch (error) {
      console.error('Erro ao listar cartoes:', error);
      return [];
    }
  }

  /**
   * Valida se o arquivo e suportado
   */
  isFileSupported(file: File): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    // Verificar por extensao tambem
    const fileName = file.name.toLowerCase();
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.xlsx', '.xls', '.csv'];

    return supportedTypes.includes(file.type) ||
           supportedExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Obtem descricao do tipo de arquivo
   */
  getFileTypeDescription(file: File): string {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
      return 'PDF';
    }
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel')) {
      return 'Planilha';
    }
    if (fileName.endsWith('.csv') || file.type === 'text/csv') {
      return 'CSV';
    }
    if (file.type.startsWith('image/')) {
      return 'Imagem';
    }

    return 'Documento';
  }
}

// Instancia singleton
export const invoiceImportService = new InvoiceImportService();
export default invoiceImportService;
