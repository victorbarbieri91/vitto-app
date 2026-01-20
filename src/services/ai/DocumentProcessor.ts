import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { supabase } from '../supabase/client';

// Configurar worker do PDF.js usando new URL (compativel com Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * DocumentProcessor - Processamento de Documentos com Vision API
 *
 * Processa imagens, PDFs e planilhas de extratos bancários, cupons fiscais e comprovantes
 * usando OpenAI Vision API (via Edge Function) para extrair dados financeiros estruturados.
 */

export interface ExtractedFinancialData {
  tipo_documento: 'extrato_bancario' | 'cupom_fiscal' | 'comprovante_pix' | 'fatura_cartao' | 'outro';
  confianca: number; // 0-1
  dados_extraidos: {
    // Dados bancários
    banco?: string;
    conta?: string;
    agencia?: string;
    saldo_anterior?: number;
    saldo_atual?: number;

    // Transações
    transacoes?: Array<{
      data: string;
      descricao: string;
      valor: number;
      tipo: 'credito' | 'debito';
      categoria_sugerida?: string;
    }>;

    // Dados do estabelecimento (cupom fiscal)
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

    // Comprovante PIX
    valor_pix?: number;
    destinatario?: string;
    chave_pix?: string;
    data_pix?: string;

    // Informações gerais
    moeda?: string;
    periodo?: {
      data_inicio: string;
      data_fim: string;
    };
  };
  observacoes: string[];
  sugestoes_acao: string[];
}

export interface ProcessingResult {
  success: boolean;
  data?: ExtractedFinancialData;
  error?: string;
  processing_time_ms: number;
}

export class DocumentProcessor {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  }

  /**
   * Processa um arquivo de documento financeiro
   */
  async processDocument(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      if (!this.supabaseUrl) {
        return {
          success: false,
          error: 'Supabase URL não configurado. Verifique VITE_SUPABASE_URL',
          processing_time_ms: Date.now() - startTime
        };
      }

      // Verificar tipo de arquivo
      if (!this.isSupportedFileType(file)) {
        return {
          success: false,
          error: 'Tipo de arquivo não suportado. Use: PDF ou planilha (XLSX, CSV)',
          processing_time_ms: Date.now() - startTime
        };
      }

      // Verificar tamanho do arquivo (máximo 20MB)
      if (file.size > 20 * 1024 * 1024) {
        return {
          success: false,
          error: 'Arquivo muito grande. Máximo 20MB permitido',
          processing_time_ms: Date.now() - startTime
        };
      }

      // Verificar se é planilha - processar diretamente sem Vision API
      if (this.isSpreadsheet(file)) {
        const extractedData = await this.processSpreadsheet(file);
        return {
          success: true,
          data: extractedData,
          processing_time_ms: Date.now() - startTime
        };
      }

      // Para PDFs, extrair texto e analisar com DeepSeek
      if (file.type === 'application/pdf') {
        const pdfText = await this.extractTextFromPDF(file);
        if (!pdfText || pdfText.trim().length < 50) {
          return {
            success: false,
            error: 'Não foi possível extrair texto do PDF. O documento pode ser uma imagem escaneada.',
            processing_time_ms: Date.now() - startTime
          };
        }

        // Processar texto com DeepSeek
        const extractedData = await this.extractDataFromText(pdfText);
        return {
          success: true,
          data: extractedData,
          processing_time_ms: Date.now() - startTime
        };
      }

      // Para imagens, informar que precisa de OCR
      if (file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'Processamento de imagens não está disponível no momento. Por favor, use PDF com texto selecionável ou planilha (XLSX/CSV).',
          processing_time_ms: Date.now() - startTime
        };
      }

      // Fallback para outros tipos
      return {
        success: false,
        error: 'Tipo de arquivo não suportado para processamento automático.',
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error('Erro no processamento do documento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no processamento',
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Extrai texto de PDF usando pdf.js
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const textParts: string[] = [];

      // Extrair texto de cada pagina (max 5 paginas)
      const maxPages = Math.min(pdf.numPages, 5);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        textParts.push(pageText);
      }

      return textParts.join('\n\n');
    } catch (error) {
      console.error('Erro ao extrair texto do PDF:', error);
      return '';
    }
  }

  /**
   * Extrai dados financeiros de texto usando DeepSeek via Edge Function
   */
  private async extractDataFromText(text: string): Promise<ExtractedFinancialData> {
    // Obter usuario atual para autenticacao
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';

    // Chamar Edge Function com texto
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: {
        textContent: text,
        userId: userId
      }
    });

    if (error) {
      console.error('Erro ao chamar Edge Function:', error);
      throw new Error(`Erro ao processar documento: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Erro desconhecido ao processar documento');
    }

    return data.data as ExtractedFinancialData;
  }

  /**
   * Converte arquivo para base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo "data:image/jpeg;base64," etc
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Converte PDF para imagens usando pdf.js
   */
  private async pdfToImages(file: File): Promise<string[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: string[] = [];

      // Processar apenas as primeiras 3 páginas para evitar uso excessivo de API
      const maxPages = Math.min(pdf.numPages, 3);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Escala alta para melhor OCR

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        if (!context) continue;

        await page.render({
          canvasContext: context as unknown as CanvasRenderingContext2D,
          viewport
        } as any).promise;

        // Converter para base64 (sem prefixo)
        const dataUrl = canvas.toDataURL('image/png');
        images.push(dataUrl.split(',')[1]);
      }

      return images;
    } catch (error) {
      console.error('Erro ao converter PDF para imagens:', error);
      return [];
    }
  }

  /**
   * Processa planilha XLSX/XLS/CSV diretamente
   */
  private async processSpreadsheet(file: File): Promise<ExtractedFinancialData> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Pegar primeira planilha
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Converter para JSON
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (data.length === 0) {
        return {
          tipo_documento: 'outro',
          confianca: 0.1,
          dados_extraidos: {},
          observacoes: ['Planilha vazia'],
          sugestoes_acao: ['Verifique se o arquivo contém dados']
        };
      }

      // Detectar colunas automaticamente
      const headerRow = data[0] as string[];
      const columnMapping = this.detectSpreadsheetColumns(headerRow);

      // Extrair transações
      const transacoes = this.extractTransactionsFromSpreadsheet(data, columnMapping);

      // Calcular confiança baseada na qualidade da detecção
      const confianca = this.calculateSpreadsheetConfidence(columnMapping, transacoes);

      return {
        tipo_documento: 'fatura_cartao',
        confianca,
        dados_extraidos: {
          transacoes
        },
        observacoes: [
          `${transacoes.length} transações encontradas`,
          `Colunas detectadas: ${Object.keys(columnMapping).filter(k => columnMapping[k] !== -1).join(', ')}`
        ],
        sugestoes_acao: [
          'Revisar as transações antes de importar',
          'Verificar se as categorias sugeridas estão corretas'
        ]
      };
    } catch (error) {
      console.error('Erro ao processar planilha:', error);
      return {
        tipo_documento: 'outro',
        confianca: 0.1,
        dados_extraidos: {},
        observacoes: ['Erro ao processar planilha'],
        sugestoes_acao: ['Verifique se o formato do arquivo está correto']
      };
    }
  }

  /**
   * Detecta colunas da planilha baseado em padrões comuns
   */
  private detectSpreadsheetColumns(headers: string[]): {
    data: number;
    descricao: number;
    valor: number;
    categoria: number;
  } {
    const mapping = {
      data: -1,
      descricao: -1,
      valor: -1,
      categoria: -1
    };

    const normalizedHeaders = headers.map(h =>
      String(h || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );

    // Padrões para data
    const dataPatterns = ['data', 'date', 'dt', 'dia', 'data transacao', 'data compra'];
    // Padrões para descrição
    const descPatterns = ['descricao', 'description', 'desc', 'estabelecimento', 'nome', 'lancamento', 'historico'];
    // Padrões para valor
    const valorPatterns = ['valor', 'value', 'amount', 'quantia', 'total', 'preco'];
    // Padrões para categoria
    const catPatterns = ['categoria', 'category', 'cat', 'tipo', 'type'];

    normalizedHeaders.forEach((header, index) => {
      if (mapping.data === -1 && dataPatterns.some(p => header.includes(p))) {
        mapping.data = index;
      }
      if (mapping.descricao === -1 && descPatterns.some(p => header.includes(p))) {
        mapping.descricao = index;
      }
      if (mapping.valor === -1 && valorPatterns.some(p => header.includes(p))) {
        mapping.valor = index;
      }
      if (mapping.categoria === -1 && catPatterns.some(p => header.includes(p))) {
        mapping.categoria = index;
      }
    });

    // Fallback: se não encontrou, assumir ordem padrão
    if (mapping.data === -1 && headers.length >= 1) mapping.data = 0;
    if (mapping.descricao === -1 && headers.length >= 2) mapping.descricao = 1;
    if (mapping.valor === -1 && headers.length >= 3) mapping.valor = 2;

    return mapping;
  }

  /**
   * Extrai transações da planilha
   */
  private extractTransactionsFromSpreadsheet(
    data: any[][],
    columns: { data: number; descricao: number; valor: number; categoria: number }
  ): Array<{
    data: string;
    descricao: string;
    valor: number;
    tipo: 'credito' | 'debito';
    categoria_sugerida?: string;
  }> {
    const transacoes: Array<{
      data: string;
      descricao: string;
      valor: number;
      tipo: 'credito' | 'debito';
      categoria_sugerida?: string;
    }> = [];

    // Pular header
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Extrair valores
      let rawData = columns.data >= 0 ? row[columns.data] : null;
      const descricao = columns.descricao >= 0 ? String(row[columns.descricao] || '') : '';
      let valor = columns.valor >= 0 ? row[columns.valor] : 0;
      const categoria = columns.categoria >= 0 ? String(row[columns.categoria] || '') : '';

      // Validar dados mínimos
      if (!descricao || descricao.trim() === '') continue;

      // Processar data
      let dataFormatada = '';
      if (rawData) {
        dataFormatada = this.parseSpreadsheetDate(rawData);
      }
      if (!dataFormatada) {
        dataFormatada = new Date().toISOString().split('T')[0];
      }

      // Processar valor
      if (typeof valor === 'string') {
        valor = parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.'));
      }
      if (isNaN(valor)) valor = 0;

      // Determinar tipo (crédito ou débito)
      const tipo: 'credito' | 'debito' = valor >= 0 ? 'debito' : 'credito';

      transacoes.push({
        data: dataFormatada,
        descricao: descricao.trim(),
        valor: Math.abs(valor),
        tipo,
        categoria_sugerida: categoria || this.suggestCategory(descricao)
      });
    }

    return transacoes;
  }

  /**
   * Parse de data da planilha
   */
  private parseSpreadsheetDate(rawDate: any): string {
    try {
      // Se for número (Excel serial date)
      if (typeof rawDate === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + rawDate * 86400000);
        return date.toISOString().split('T')[0];
      }

      // Se for string
      const dateStr = String(rawDate);

      // Tentar formato DD/MM/YYYY ou DD-MM-YYYY
      const brMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (brMatch) {
        const day = brMatch[1].padStart(2, '0');
        const month = brMatch[2].padStart(2, '0');
        let year = brMatch[3];
        if (year.length === 2) year = '20' + year;
        return `${year}-${month}-${day}`;
      }

      // Tentar formato YYYY-MM-DD
      const isoMatch = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
      }

      // Tentar Date.parse
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }

      return '';
    } catch {
      return '';
    }
  }

  /**
   * Sugere categoria baseada na descrição
   */
  private suggestCategory(descricao: string): string {
    const desc = descricao.toLowerCase();

    // Alimentação
    if (/ifood|uber\s*eats|rappi|restaurante|lanchonete|pizzaria|padaria|mercado|supermercado|atacado/i.test(desc)) {
      return 'alimentacao';
    }

    // Transporte
    if (/uber|99|cabify|taxi|posto|gasolina|estacionamento|onibus|metro|bilhete/i.test(desc)) {
      return 'transporte';
    }

    // Saúde
    if (/farmacia|drogaria|hospital|clinica|medico|laboratorio|dentista/i.test(desc)) {
      return 'saude';
    }

    // Lazer
    if (/netflix|spotify|amazon\s*prime|disney|hbo|cinema|teatro|show|ingresso/i.test(desc)) {
      return 'lazer';
    }

    // Casa
    if (/energia|luz|agua|gas|internet|telefone|aluguel|condominio/i.test(desc)) {
      return 'casa';
    }

    // Compras
    if (/amazon|mercado\s*livre|shopee|aliexpress|magazine|americanas|casas\s*bahia/i.test(desc)) {
      return 'compras';
    }

    return 'outros';
  }

  /**
   * Calcula confiança do processamento da planilha
   */
  private calculateSpreadsheetConfidence(
    columns: { data: number; descricao: number; valor: number; categoria: number },
    transacoes: any[]
  ): number {
    let score = 0.5; // Base

    // Colunas detectadas corretamente
    if (columns.data >= 0) score += 0.15;
    if (columns.descricao >= 0) score += 0.15;
    if (columns.valor >= 0) score += 0.15;

    // Quantidade de transações válidas
    if (transacoes.length > 0) score += 0.05;
    if (transacoes.length > 5) score += 0.05;
    if (transacoes.length > 10) score += 0.05;

    return Math.min(score, 0.95);
  }

  /**
   * Verifica se o tipo de arquivo é suportado
   */
  private isSupportedFileType(file: File): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv'
    ];
    return supportedTypes.includes(file.type);
  }

  /**
   * Verifica se é uma planilha
   */
  private isSpreadsheet(file: File): boolean {
    const spreadsheetTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    return spreadsheetTypes.includes(file.type);
  }

  /**
   * Valida se o documento extraído tem dados suficientes
   */
  validateExtractedData(data: ExtractedFinancialData): boolean {
    // Validações básicas
    if (data.confianca < 0.3) {
      return false;
    }

    if (data.tipo_documento === 'outro' && data.confianca < 0.7) {
      return false;
    }

    // Para extratos, verificar se tem pelo menos uma transação ou saldo
    if (data.tipo_documento === 'extrato_bancario') {
      return !!(data.dados_extraidos.transacoes?.length ||
               data.dados_extraidos.saldo_atual !== undefined);
    }

    // Para cupons, verificar se tem valor total
    if (data.tipo_documento === 'cupom_fiscal') {
      return !!(data.dados_extraidos.total || data.dados_extraidos.itens?.length);
    }

    // Para PIX, verificar se tem valor
    if (data.tipo_documento === 'comprovante_pix') {
      return !!data.dados_extraidos.valor_pix;
    }

    return true;
  }

  /**
   * Formata dados extraídos para apresentação
   */
  formatExtractedDataForUser(data: ExtractedFinancialData): string {
    let formatted = `📄 **${this.getDocumentTypeLabel(data.tipo_documento)}**\n`;
    formatted += `🎯 **Confiança**: ${(data.confianca * 100).toFixed(0)}%\n\n`;

    const { dados_extraidos } = data;

    // Informações bancárias
    if (dados_extraidos.banco) {
      formatted += `🏦 **Banco**: ${dados_extraidos.banco}\n`;
    }
    if (dados_extraidos.conta) {
      formatted += `💳 **Conta**: ${dados_extraidos.conta}\n`;
    }
    if (dados_extraidos.saldo_atual !== undefined) {
      formatted += `💰 **Saldo**: ${this.formatCurrency(dados_extraidos.saldo_atual)}\n`;
    }

    // Transações
    if (dados_extraidos.transacoes?.length) {
      formatted += `\n📋 **Transações encontradas**: ${dados_extraidos.transacoes.length}\n`;
      dados_extraidos.transacoes.slice(0, 3).forEach((t, i) => {
        const valor = t.tipo === 'debito' ? `-${Math.abs(t.valor)}` : `+${t.valor}`;
        formatted += `${i + 1}. ${t.data} - ${t.descricao} - ${this.formatCurrency(parseFloat(valor))}\n`;
      });
      if (dados_extraidos.transacoes.length > 3) {
        formatted += `... e mais ${dados_extraidos.transacoes.length - 3} transações\n`;
      }
    }

    // Informações específicas por tipo
    if (data.tipo_documento === 'cupom_fiscal' && dados_extraidos.estabelecimento) {
      formatted += `\n🏪 **Estabelecimento**: ${dados_extraidos.estabelecimento}\n`;
      if (dados_extraidos.total) {
        formatted += `💵 **Total**: ${this.formatCurrency(dados_extraidos.total)}\n`;
      }
    }

    if (data.tipo_documento === 'comprovante_pix' && dados_extraidos.valor_pix) {
      formatted += `\n💸 **Valor PIX**: ${this.formatCurrency(dados_extraidos.valor_pix)}\n`;
      if (dados_extraidos.destinatario) {
        formatted += `👤 **Destinatário**: ${dados_extraidos.destinatario}\n`;
      }
    }

    // Sugestões
    if (data.sugestoes_acao.length > 0) {
      formatted += `\n✨ **Sugestões**:\n`;
      data.sugestoes_acao.forEach(sugestao => {
        formatted += `• ${sugestao}\n`;
      });
    }

    return formatted;
  }

  /**
   * Obtém label amigável para tipo de documento
   */
  private getDocumentTypeLabel(tipo: string): string {
    const labels = {
      'extrato_bancario': 'Extrato Bancário',
      'cupom_fiscal': 'Cupom Fiscal',
      'comprovante_pix': 'Comprovante PIX',
      'fatura_cartao': 'Fatura Cartão',
      'outro': 'Documento Financeiro'
    };
    return labels[tipo as keyof typeof labels] || 'Documento';
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
   * Verifica se o processamento de documentos está disponível
   */
  isAvailable(): boolean {
    return !!this.supabaseUrl;
  }
}

// Instância singleton
export const documentProcessor = new DocumentProcessor();