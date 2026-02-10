/**
 * SmartImportService - Servico de Importacao Inteligente
 *
 * Analisa arquivos (PDF, Excel, CSV) e importa para:
 * - app_transacoes (transacoes normais)
 * - app_transacoes_fixas (recorrentes)
 * - app_patrimonio_ativo (investimentos/patrimonio)
 */

import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../supabase/client';
import { transactionService, CreateTransactionRequest } from '../api/TransactionService';
import { documentProcessor } from './DocumentProcessor';
import type {
  ImportTarget,
  FileType,
  FileAnalysis,
  ColumnInfo,
  ColumnMapping,
  MappableField,
  ImportWizardConfig,
  PreparedImportItem,
  PreparedImportData,
  ImportResult,
  TransactionType,
} from '../../types/smart-import';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

class SmartImportService {
  private categoriesCache: Map<string, number> | null = null;
  private accountsCache: Array<{ id: number; nome: string; tipo: string }> | null = null;
  private cardsCache: Array<{ id: number; nome: string; ultimos_quatro_digitos?: string }> | null = null;

  /**
   * Analisa um arquivo e retorna informacoes sobre sua estrutura
   */
  async analyzeFile(file: File): Promise<FileAnalysis> {
    const fileType = this.detectFileType(file);

    if (!fileType) {
      return {
        success: false,
        error: 'Tipo de arquivo nao suportado. Use PDF, XLSX, XLS, CSV ou imagem (PNG, JPG).',
        fileName: file.name,
        fileType: 'csv',
        fileSize: file.size,
        rowCount: 0,
        columns: [],
        sampleRows: [],
        suggestedImportType: 'transacoes',
        suggestedMappings: [],
        confidence: 0,
        observations: [],
      };
    }

    try {
      let rawData: any[][] = [];
      let headers: string[] = [];

      // Para imagens, usar Vision API via DocumentProcessor
      if (fileType === 'image') {
        return await this.analyzeImageWithVision(file);
      }

      if (fileType === 'pdf') {
        // Para PDFs, extrair texto e tentar parsear como tabela
        const textData = await this.extractDataFromPDF(file);
        if (textData.length === 0) {
          return {
            success: false,
            error: 'Nao foi possivel extrair dados do PDF. Tente usar uma planilha.',
            fileName: file.name,
            fileType,
            fileSize: file.size,
            rowCount: 0,
            columns: [],
            sampleRows: [],
            suggestedImportType: 'transacoes',
            suggestedMappings: [],
            confidence: 0,
            observations: ['O PDF pode ser uma imagem escaneada ou nao conter tabelas'],
          };
        }
        headers = textData[0].map((h, i) => String(h || `Coluna ${i + 1}`));
        rawData = textData;
      } else {
        // Para planilhas (XLSX, XLS, CSV)
        const workbook = await this.readSpreadsheet(file);

        // Tentar encontrar a melhor aba com dados
        let bestSheet = workbook.SheetNames[0];
        let maxRows = 0;

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          if (sheetData.length > maxRows) {
            maxRows = sheetData.length;
            bestSheet = sheetName;
          }
        }

        const sheet = workbook.Sheets[bestSheet];
        rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        if (rawData.length === 0) {
          return {
            success: false,
            error: 'Arquivo vazio ou sem dados validos.',
            fileName: file.name,
            fileType,
            fileSize: file.size,
            rowCount: 0,
            columns: [],
            sampleRows: [],
            suggestedImportType: 'transacoes',
            suggestedMappings: [],
            confidence: 0,
            observations: [],
          };
        }

        // Encontrar a primeira linha com dados válidos (header)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const row = rawData[i];
          if (row && row.length > 0) {
            // Contar células não vazias
            const nonEmpty = row.filter((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '').length;
            if (nonEmpty >= 2) { // Pelo menos 2 colunas com dados
              headerRowIndex = i;
              break;
            }
          }
        }

        // Remover linhas antes do header
        if (headerRowIndex > 0) {
          rawData = rawData.slice(headerRowIndex);
        }

        // Encontrar o número máximo de colunas entre as primeiras linhas
        const maxCols = Math.max(...rawData.slice(0, 10).map((row: any[]) => (row || []).length));

        // Gerar headers - usar a primeira linha se tiver dados, senão gerar genéricos
        const firstRow = rawData[0] || [];
        headers = [];
        for (let i = 0; i < maxCols; i++) {
          const headerValue = firstRow[i];
          if (headerValue !== undefined && headerValue !== null && String(headerValue).trim() !== '') {
            headers.push(String(headerValue).trim());
          } else {
            headers.push(`Coluna ${i + 1}`);
          }
        }
      }

      // Analisar colunas
      const columns = this.analyzeColumns(headers, rawData);

      // Detectar tipo de importacao sugerido
      const suggestedType = this.detectImportType(columns);

      // Gerar mapeamentos sugeridos
      const suggestedMappings = this.generateSuggestedMappings(columns, suggestedType);

      // Preparar amostra de dados
      const sampleRows = rawData.slice(1, 6).map((row) => {
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      });

      // Calcular confianca
      const confidence = this.calculateConfidence(columns, suggestedMappings);

      return {
        success: true,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        rowCount: rawData.length - 1, // Excluindo header
        columns,
        sampleRows,
        suggestedImportType: suggestedType,
        suggestedMappings,
        confidence,
        observations: this.generateObservations(columns, rawData.length - 1),
      };
    } catch (error) {
      console.error('Erro ao analisar arquivo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao analisar arquivo',
        fileName: file.name,
        fileType,
        fileSize: file.size,
        rowCount: 0,
        columns: [],
        sampleRows: [],
        suggestedImportType: 'transacoes',
        suggestedMappings: [],
        confidence: 0,
        observations: [],
      };
    }
  }

  /**
   * Detecta o tipo do arquivo
   */
  private detectFileType(file: File): FileType | null {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type;

    if (fileName.endsWith('.pdf') || mimeType === 'application/pdf') return 'pdf';
    if (fileName.endsWith('.xlsx') || mimeType.includes('spreadsheetml')) return 'xlsx';
    if (fileName.endsWith('.xls') || mimeType.includes('ms-excel')) return 'xls';
    if (fileName.endsWith('.csv') || mimeType === 'text/csv') return 'csv';

    // Imagens (processadas via GPT Vision API)
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const imageMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (imageExtensions.some(ext => fileName.endsWith(ext)) || imageMimeTypes.includes(mimeType)) {
      return 'image';
    }

    return null;
  }

  /**
   * Le planilha e retorna workbook
   */
  private async readSpreadsheet(file: File): Promise<XLSX.WorkBook> {
    const arrayBuffer = await file.arrayBuffer();
    return XLSX.read(arrayBuffer, { type: 'array' });
  }

  /**
   * Analisa imagem usando GPT Vision API via DocumentProcessor
   * Converte os dados extraidos para o formato FileAnalysis
   */
  private async analyzeImageWithVision(file: File): Promise<FileAnalysis> {
    console.log('🖼️ Processando imagem com Vision API...');

    const result = await documentProcessor.processDocument(file);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Erro ao processar imagem com Vision API.',
        fileName: file.name,
        fileType: 'image',
        fileSize: file.size,
        rowCount: 0,
        columns: [],
        sampleRows: [],
        suggestedImportType: 'transacoes',
        suggestedMappings: [],
        confidence: 0,
        observations: ['A imagem pode estar ilegivel ou nao conter dados financeiros'],
      };
    }

    const extractedData = result.data;
    const transacoes = extractedData.dados_extraidos.transacoes || [];

    if (transacoes.length === 0) {
      return {
        success: false,
        error: 'Nenhuma transacao encontrada na imagem.',
        fileName: file.name,
        fileType: 'image',
        fileSize: file.size,
        rowCount: 0,
        columns: [],
        sampleRows: [],
        suggestedImportType: 'transacoes',
        suggestedMappings: [],
        confidence: extractedData.confianca,
        observations: extractedData.observacoes,
      };
    }

    // rawData/headers construction removed - was unused (TS6133)

    // Criar informacoes de colunas
    const columns: ColumnInfo[] = [
      {
        index: 0,
        originalName: 'data',
        detectedType: 'date',
        suggestedField: 'data' as MappableField,
        confidence: 0.95,
        sampleValues: transacoes.slice(0, 3).map(t => t.data),
      },
      {
        index: 1,
        originalName: 'descricao',
        detectedType: 'text',
        suggestedField: 'descricao' as MappableField,
        confidence: 0.95,
        sampleValues: transacoes.slice(0, 3).map(t => t.descricao),
      },
      {
        index: 2,
        originalName: 'valor',
        detectedType: 'number',
        suggestedField: 'valor' as MappableField,
        confidence: 0.95,
        sampleValues: transacoes.slice(0, 3).map(t => String(t.valor)),
      },
      {
        index: 3,
        originalName: 'tipo',
        detectedType: 'text',
        suggestedField: 'tipo' as MappableField,
        confidence: 0.90,
        sampleValues: transacoes.slice(0, 3).map(t => t.tipo),
      },
      {
        index: 4,
        originalName: 'categoria',
        detectedType: 'text',
        suggestedField: 'categoria' as MappableField,
        confidence: 0.85,
        sampleValues: transacoes.slice(0, 3).map(t => t.categoria_sugerida || 'outros'),
      },
    ];

    // Criar sample rows
    const sampleRows = transacoes.slice(0, 5).map(t => ({
      data: t.data,
      descricao: t.descricao,
      valor: t.valor,
      tipo: t.tipo,
      categoria: t.categoria_sugerida || 'outros',
    }));

    console.log(`✅ Vision API extraiu ${transacoes.length} transacoes da imagem`);

    return {
      success: true,
      fileName: file.name,
      fileType: 'image',
      fileSize: file.size,
      rowCount: transacoes.length,
      columns,
      sampleRows,
      suggestedImportType: 'transacoes',
      suggestedMappings: columns.map(c => ({
        columnIndex: c.index,
        columnName: c.originalName,
        targetField: c.suggestedField,
        sampleValues: c.sampleValues,
      })),
      confidence: extractedData.confianca,
      observations: [
        `Tipo de documento: ${extractedData.tipo_documento}`,
        `${transacoes.length} transacoes extraidas via Vision API`,
        ...extractedData.observacoes,
      ],
      // Dados extras da Vision API para uso posterior
      visionData: extractedData,
    };
  }

  /**
   * Extrai dados de PDF
   */
  private async extractDataFromPDF(file: File): Promise<any[][]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const allText: string[] = [];

      // Extrair texto de todas as paginas (max 10)
      const maxPages = Math.min(pdf.numPages, 10);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        allText.push(pageText);
      }

      // Tentar parsear como tabela (simplificado)
      // TODO: Melhorar com IA para PDFs complexos
      const lines = allText.join('\n').split('\n').filter((l) => l.trim());

      if (lines.length < 2) return [];

      // Detectar delimitador (tab, |, multiplos espacos)
      const firstLine = lines[0];
      let delimiter: string | RegExp = '\t';
      if (firstLine.includes('|')) delimiter = '|';
      else if (firstLine.includes('  ')) delimiter = /\s{2,}/;

      const data = lines.map((line) =>
        line.split(delimiter).map((c) => c.trim())
      );

      return data;
    } catch (error) {
      console.error('Erro ao extrair dados do PDF:', error);
      return [];
    }
  }

  /**
   * Analisa as colunas e detecta tipos
   */
  private analyzeColumns(headers: string[], data: any[][]): ColumnInfo[] {
    const columns: ColumnInfo[] = [];

    headers.forEach((header, index) => {
      // Coletar valores da coluna (excluindo header)
      const values = data.slice(1, 20).map((row) => row[index]).filter((v) => v !== undefined && v !== null && v !== '');
      const sampleValues = values.slice(0, 5).map(String);

      // Detectar tipo de dados
      const detectedType = this.detectColumnType(values);

      // Sugerir campo
      const suggestedField = this.suggestFieldForColumn(header, detectedType, sampleValues);

      // Calcular confianca do mapeamento
      const confidence = this.calculateFieldConfidence(header, detectedType, suggestedField);

      columns.push({
        index,
        originalName: header,
        normalizedName: this.normalizeString(header),
        sampleValues,
        detectedType,
        suggestedField,
        confidence,
      });
    });

    return columns;
  }

  /**
   * Detecta o tipo de dados de uma coluna
   */
  private detectColumnType(values: any[]): 'date' | 'number' | 'text' | 'category' | 'unknown' {
    if (values.length === 0) return 'unknown';

    let dateCount = 0;
    let numberCount = 0;
    let categoryCount = 0;

    const uniqueValues = new Set(values.map(String));
    const uniqueRatio = uniqueValues.size / values.length;

    for (const value of values) {
      // Verificar se e data
      if (this.isDateValue(value)) {
        dateCount++;
        continue;
      }

      // Verificar se e numero
      if (this.isNumericValue(value)) {
        numberCount++;
        continue;
      }
    }

    // Se poucos valores unicos, provavelmente e categoria
    if (uniqueRatio < 0.3 && values.length > 5) {
      categoryCount = values.length;
    }

    // Determinar tipo predominante
    const total = values.length;
    if (dateCount / total > 0.7) return 'date';
    if (numberCount / total > 0.7) return 'number';
    if (categoryCount / total > 0.7) return 'category';

    return 'text';
  }

  /**
   * Verifica se valor parece ser data
   */
  private isDateValue(value: any): boolean {
    if (typeof value === 'number' && value > 25000 && value < 50000) {
      // Excel serial date
      return true;
    }

    const str = String(value);
    // Padroes comuns de data
    const datePatterns = [
      /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/, // DD/MM/YYYY ou MM/DD/YYYY
      /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/, // YYYY-MM-DD
      /^\d{1,2}\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)/i, // DD mes
    ];

    return datePatterns.some((p) => p.test(str));
  }

  /**
   * Verifica se valor parece ser numero
   */
  private isNumericValue(value: any): boolean {
    if (typeof value === 'number') return true;

    const str = String(value).replace(/[R$\s.]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return !isNaN(num);
  }

  /**
   * Sugere campo para uma coluna
   */
  private suggestFieldForColumn(
    header: string,
    type: string,
    sampleValues: string[]
  ): MappableField {
    const normalized = this.normalizeString(header);

    // Mapeamentos por nome de coluna
    const namePatterns: [RegExp, MappableField][] = [
      // Data
      [/^(data|date|dt|dia|when|quando)$/i, 'data'],
      [/(data|date).*?(compra|transacao|lancamento|pagamento)/i, 'data'],

      // Descricao
      [/^(descri|desc|description|nome|name|estabelecimento|merchant|historico|lancamento)$/i, 'descricao'],
      [/(o\s*que|what|comprei|gastei)/i, 'descricao'],

      // Valor
      [/^(valor|value|amount|quantia|total|preco|price|quanto)$/i, 'valor'],
      [/(valor|value|amount|gastei|paguei)/i, 'valor'],

      // Categoria
      [/^(categoria|category|cat|tipo|type|classificacao)$/i, 'categoria'],

      // Conta
      [/^(conta|account|banco|bank)$/i, 'conta'],

      // Cartao
      [/^(cartao|card|credito|credit)$/i, 'cartao'],

      // Dia do mes (para fixas)
      [/^(dia|day|vencimento|due)$/i, 'dia_mes'],

      // Observacoes
      [/^(obs|observa|nota|note|comment)$/i, 'observacoes'],

      // Patrimonio
      [/^(ativo|asset|investimento|investment)$/i, 'nome'],
      [/^(instituicao|corretora|broker|banco)$/i, 'instituicao'],
      [/(valor\s*(atual|corrente|current))/i, 'valor_atual'],
      [/(valor|custo|preco).*(aquisicao|compra|purchase)/i, 'valor_aquisicao'],
    ];

    // Verificar padroes de nome
    for (const [pattern, field] of namePatterns) {
      if (pattern.test(normalized) || pattern.test(header)) {
        return field;
      }
    }

    // Inferir pelo tipo de dados
    if (type === 'date') return 'data';
    if (type === 'number') return 'valor';
    if (type === 'category') return 'categoria';
    if (type === 'text') {
      // Se textos longos, provavelmente descricao
      const avgLength = sampleValues.reduce((sum, v) => sum + v.length, 0) / sampleValues.length;
      if (avgLength > 10) return 'descricao';
    }

    return 'ignorar';
  }

  /**
   * Calcula confianca do mapeamento de campo
   */
  private calculateFieldConfidence(header: string, type: string, field: MappableField): number {
    const normalized = this.normalizeString(header);
    let confidence = 0.5;

    // Bonus por match direto de nome
    const directMatches: Record<string, string[]> = {
      data: ['data', 'date', 'dia'],
      descricao: ['descricao', 'descricao', 'nome', 'estabelecimento'],
      valor: ['valor', 'value', 'total', 'preco'],
      categoria: ['categoria', 'category', 'tipo'],
    };

    for (const [f, patterns] of Object.entries(directMatches)) {
      if (f === field && patterns.some((p) => normalized.includes(p))) {
        confidence += 0.3;
        break;
      }
    }

    // Bonus por tipo compativel
    const typeFieldMap: Record<string, string[]> = {
      date: ['data', 'data_inicio', 'data_fim', 'data_aquisicao'],
      number: ['valor', 'valor_atual', 'valor_aquisicao', 'dia_mes'],
      category: ['categoria', 'tipo'],
      text: ['descricao', 'nome', 'observacoes', 'instituicao'],
    };

    if (typeFieldMap[type]?.includes(field)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 0.95);
  }

  /**
   * Detecta tipo de importacao sugerido
   */
  private detectImportType(columns: ColumnInfo[]): ImportTarget {
    const fieldNames = columns.map((c) => c.suggestedField);

    // Se tem campos de patrimonio
    const patrimonioFields = ['nome', 'valor_atual', 'instituicao', 'valor_aquisicao'];
    const patrimonioMatches = patrimonioFields.filter((f) => fieldNames.includes(f as any));
    if (patrimonioMatches.length >= 2) return 'patrimonio';

    // Se tem dia_mes, provavelmente fixas
    if (fieldNames.includes('dia_mes')) return 'transacoes_fixas';

    // Se nao tem data mas tem descricao/valor, pode ser fixas
    if (!fieldNames.includes('data') && fieldNames.includes('descricao') && fieldNames.includes('valor')) {
      return 'transacoes_fixas';
    }

    // Default: transacoes
    return 'transacoes';
  }

  /**
   * Gera mapeamentos sugeridos
   */
  private generateSuggestedMappings(columns: ColumnInfo[], _importType: ImportTarget): ColumnMapping[] {
    return columns.map((col) => ({
      columnIndex: col.index,
      columnName: col.originalName,
      targetField: col.suggestedField,
      sampleValues: col.sampleValues,
    }));
  }

  /**
   * Calcula confianca geral da analise
   */
  private calculateConfidence(columns: ColumnInfo[], mappings: ColumnMapping[]): number {
    if (columns.length === 0) return 0;

    const avgConfidence = columns.reduce((sum, c) => sum + c.confidence, 0) / columns.length;
    const mappedFields = mappings.filter((m) => m.targetField !== 'ignorar').length;
    const mappingRatio = mappedFields / columns.length;

    return Math.round((avgConfidence * 0.6 + mappingRatio * 0.4) * 100) / 100;
  }

  /**
   * Gera observacoes sobre os dados
   */
  private generateObservations(columns: ColumnInfo[], rowCount: number): string[] {
    const observations: string[] = [];

    observations.push(`${rowCount} linhas de dados encontradas`);

    const mappedCount = columns.filter((c) => c.suggestedField !== 'ignorar').length;
    observations.push(`${mappedCount} de ${columns.length} colunas mapeadas automaticamente`);

    const dateCol = columns.find((c) => c.suggestedField === 'data');
    if (dateCol) {
      observations.push(`Coluna de data: "${dateCol.originalName}"`);
    }

    const valueCol = columns.find((c) => c.suggestedField === 'valor');
    if (valueCol) {
      observations.push(`Coluna de valor: "${valueCol.originalName}"`);
    }

    return observations;
  }

  /**
   * Normaliza string removendo acentos e convertendo para minusculo
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Prepara dados para importacao
   */
  async prepareImportData(
    file: File,
    config: ImportWizardConfig
  ): Promise<PreparedImportData> {
    // Carregar caches necessarios
    await this.loadCaches();

    // Ler dados do arquivo
    const fileType = this.detectFileType(file);
    let rawData: any[][] = [];

    // Para imagens, processar com Vision API e converter para formato padrao
    if (fileType === 'image') {
      const visionResult = await documentProcessor.processDocument(file);
      if (visionResult.success && visionResult.data?.dados_extraidos?.transacoes) {
        const transacoes = visionResult.data.dados_extraidos.transacoes;
        const headers = ['data', 'descricao', 'valor', 'tipo', 'categoria'];
        rawData = [
          headers,
          ...transacoes.map(t => [
            t.data,
            t.descricao,
            t.valor,
            t.tipo,
            t.categoria_sugerida || 'outros'
          ])
        ];
      } else {
        // Se nao conseguiu extrair, retorna vazio
        rawData = [['data', 'descricao', 'valor', 'tipo', 'categoria']];
      }
    } else if (fileType === 'pdf') {
      rawData = await this.extractDataFromPDF(file);
    } else {
      const workbook = await this.readSpreadsheet(file);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    }

    const headers = rawData[0] as string[];
    const dataRows = rawData.slice(1);

    const items: PreparedImportItem[] = [];
    let totalValue = 0;
    const categoriesSet = new Set<string>();
    let minDate: string | undefined;
    let maxDate: string | undefined;

    // Processar cada linha
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row || row.length === 0) continue;

      const rawData: Record<string, any> = {};
      headers.forEach((h, idx) => {
        rawData[h] = row[idx];
      });

      const item = this.processRow(i, row, config, headers);
      items.push(item);

      if (item.valid && item.valor) {
        totalValue += item.valor;
      }

      if (item.categoria) {
        categoriesSet.add(item.categoria);
      }

      if (item.data) {
        if (!minDate || item.data < minDate) minDate = item.data;
        if (!maxDate || item.data > maxDate) maxDate = item.data;
      }
    }

    const validItems = items.filter((i) => i.valid).length;

    return {
      items,
      totalItems: items.length,
      validItems,
      invalidItems: items.length - validItems,
      totalValue,
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : undefined,
      categoriesFound: Array.from(categoriesSet),
    };
  }

  /**
   * Processa uma linha de dados
   */
  private processRow(
    index: number,
    row: any[],
    config: ImportWizardConfig,
    headers: string[]
  ): PreparedImportItem {
    const rawData: Record<string, any> = {};
    headers.forEach((h, idx) => {
      rawData[h] = row[idx];
    });

    const errors: string[] = [];
    const item: PreparedImportItem = {
      id: index,
      selected: true,
      valid: true,
      validationErrors: [],
      rawData,
    };

    // Extrair valores baseado no mapeamento
    for (const mapping of config.step2.mappings) {
      const value = row[mapping.columnIndex];
      const field = mapping.targetField;

      if (field === 'ignorar') continue;

      switch (field) {
        case 'data':
          item.data = this.parseDate(value);
          if (!item.data && value) errors.push('Data invalida');
          break;

        case 'descricao':
        case 'nome':
          item.descricao = String(value || '').trim();
          item.nome = item.descricao;
          break;

        case 'valor':
        case 'valor_atual':
          item.valor = this.parseNumber(value);
          item.valorAtual = item.valor;
          if (item.valor === undefined && value) errors.push('Valor invalido');
          break;

        case 'valor_aquisicao':
          item.valorAquisicao = this.parseNumber(value);
          break;

        case 'categoria':
          item.categoria = String(value || '').trim();
          item.categoriaId = this.getCategoryId(item.categoria);
          break;

        case 'tipo': {
          const tipoStr = String(value || '').toLowerCase();
          if (tipoStr.includes('receita') || tipoStr.includes('entrada') || tipoStr === '+') {
            item.tipo = 'receita';
          } else {
            item.tipo = 'despesa';
          }
          break;
        }

        case 'dia_mes':
          item.diaMes = parseInt(String(value), 10);
          if (isNaN(item.diaMes!) || item.diaMes! < 1 || item.diaMes! > 31) {
            errors.push('Dia do mes invalido');
          }
          break;

        case 'data_inicio':
          item.dataInicio = this.parseDate(value);
          break;

        case 'data_fim':
          item.dataFim = this.parseDate(value);
          break;

        case 'data_aquisicao':
          item.dataAquisicao = this.parseDate(value);
          break;

        case 'instituicao':
          item.instituicao = String(value || '').trim();
          break;

        case 'observacoes':
          item.observacoes = String(value || '').trim();
          break;
      }
    }

    // Aplicar configuracoes do step 3
    if (config.step3.transactionType !== 'auto') {
      item.tipo = config.step3.transactionType as TransactionType;
    } else if (!item.tipo) {
      // Auto-detectar pelo valor (negativo = despesa)
      if (item.valor !== undefined) {
        item.tipo = item.valor < 0 ? 'receita' : 'despesa';
        item.valor = Math.abs(item.valor);
      }
    }

    // Definir conta/cartao
    if (config.step3.destinationType === 'cartao' && config.step3.cartaoId) {
      item.cartaoId = config.step3.cartaoId;
      item.tipo = 'despesa_cartao';
    } else if (config.step3.destinationType === 'conta' && config.step3.contaId) {
      item.contaId = config.step3.contaId;
    }

    // Categoria default
    if (!item.categoriaId && config.step3.categoriaDefault) {
      item.categoriaId = config.step3.categoriaDefault;
    }

    // Validar campos obrigatorios
    if (config.step1.importType === 'transacoes') {
      if (!item.data) errors.push('Data obrigatoria');
      if (!item.descricao) errors.push('Descricao obrigatoria');
      if (item.valor === undefined) errors.push('Valor obrigatorio');
    } else if (config.step1.importType === 'transacoes_fixas') {
      if (!item.descricao) errors.push('Descricao obrigatoria');
      if (item.valor === undefined) errors.push('Valor obrigatorio');
      if (!item.diaMes) errors.push('Dia do mes obrigatorio');
    } else if (config.step1.importType === 'patrimonio') {
      if (!item.nome) errors.push('Nome obrigatorio');
      if (item.valorAtual === undefined) errors.push('Valor atual obrigatorio');
    }

    item.validationErrors = errors;
    item.valid = errors.length === 0;

    return item;
  }

  /**
   * Parse de data
   */
  private parseDate(value: any): string | undefined {
    if (!value) return undefined;

    try {
      // Excel serial date
      if (typeof value === 'number' && value > 25000 && value < 50000) {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        return date.toISOString().split('T')[0];
      }

      const str = String(value).trim();

      // DD/MM/YYYY ou DD-MM-YYYY
      const brMatch = str.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
      if (brMatch) {
        const day = brMatch[1].padStart(2, '0');
        const month = brMatch[2].padStart(2, '0');
        let year = brMatch[3];
        if (year.length === 2) year = '20' + year;
        return `${year}-${month}-${day}`;
      }

      // YYYY-MM-DD
      const isoMatch = str.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
      }

      // Tentar Date.parse
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Parse de numero
   */
  private parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;

    if (typeof value === 'number') return value;

    try {
      // Remover R$, espacos, pontos de milhar
      const str = String(value)
        .replace(/[R$\s]/g, '')
        .replace(/\.(?=\d{3})/g, '') // Remove pontos de milhar
        .replace(',', '.'); // Virgula para ponto

      const num = parseFloat(str);
      return isNaN(num) ? undefined : num;
    } catch {
      return undefined;
    }
  }

  /**
   * Carrega caches de categorias, contas e cartoes
   */
  private async loadCaches(): Promise<void> {
    if (!this.categoriesCache) {
      const { data: categories } = await supabase.from('app_categoria').select('id, nome');
      this.categoriesCache = new Map();
      for (const cat of categories || []) {
        const normalized = this.normalizeString(cat.nome);
        this.categoriesCache.set(normalized, cat.id);
        this.categoriesCache.set(cat.nome.toLowerCase(), cat.id);
      }
    }

    if (!this.accountsCache) {
      const { data: accounts } = await supabase.from('app_conta').select('id, nome, tipo');
      this.accountsCache = accounts || [];
    }

    if (!this.cardsCache) {
      const { data: cards } = await supabase.from('app_cartao_credito').select('id, nome, ultimos_quatro_digitos');
      this.cardsCache = cards || [];
    }
  }

  /**
   * Busca ID da categoria pelo nome
   */
  private getCategoryId(categoryName: string): number | undefined {
    if (!this.categoriesCache || !categoryName) return undefined;

    const normalized = this.normalizeString(categoryName);
    return this.categoriesCache.get(normalized) || this.categoriesCache.get(categoryName.toLowerCase());
  }

  /**
   * Retorna lista de contas
   */
  async getAccounts(): Promise<Array<{ id: number; nome: string; tipo: string }>> {
    await this.loadCaches();
    return this.accountsCache || [];
  }

  /**
   * Retorna lista de cartoes
   */
  async getCards(): Promise<Array<{ id: number; nome: string; ultimos_quatro_digitos?: string }>> {
    await this.loadCaches();
    return this.cardsCache || [];
  }

  /**
   * Retorna lista de categorias
   */
  async getCategories(): Promise<Array<{ id: number; nome: string }>> {
    const { data } = await supabase.from('app_categoria').select('id, nome');
    return data || [];
  }

  /**
   * Executa a importacao
   */
  async executeImport(
    preparedData: PreparedImportData,
    config: ImportWizardConfig,
    selectedIds: Set<number>
  ): Promise<ImportResult> {
    const itemsToImport = preparedData.items.filter((item) => selectedIds.has(item.id) && item.valid);

    let imported = 0;
    let failed = 0;
    const errors: Array<{ itemIndex: number; itemDescription: string; error: string }> = [];
    const summary = {
      totalValue: 0,
      byCategory: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    for (const item of itemsToImport) {
      try {
        if (config.step1.importType === 'transacoes') {
          await this.importTransaction(item, config);
        } else if (config.step1.importType === 'transacoes_fixas') {
          await this.importRecurringTransaction(item, config);
        } else if (config.step1.importType === 'patrimonio') {
          await this.importAsset(item, config);
        }

        imported++;
        summary.totalValue += item.valor || 0;

        const cat = item.categoria || 'Outros';
        summary.byCategory[cat] = (summary.byCategory[cat] || 0) + (item.valor || 0);

        const tipo = item.tipo || 'despesa';
        summary.byType[tipo] = (summary.byType[tipo] || 0) + (item.valor || 0);
      } catch (error) {
        failed++;
        errors.push({
          itemIndex: item.id,
          itemDescription: item.descricao || item.nome || `Linha ${item.id + 1}`,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    return {
      success: failed === 0,
      imported,
      failed,
      skipped: preparedData.totalItems - itemsToImport.length,
      errors,
      summary,
    };
  }

  /**
   * Importa uma transacao
   */
  private async importTransaction(item: PreparedImportItem, config: ImportWizardConfig): Promise<void> {
    const request: CreateTransactionRequest = {
      descricao: item.descricao!,
      valor: Math.abs(item.valor!),
      data: item.data!,
      tipo: item.tipo || 'despesa',
      categoria_id: item.categoriaId || config.step3.categoriaDefault || 1,
      conta_id: item.contaId,
      cartao_id: item.cartaoId,
      status: 'confirmado',
      observacoes: item.observacoes ? `${item.observacoes} [importado]` : '[importado]',
    };

    const { error } = await transactionService.create(request);
    if (error) throw new Error(error.message);
  }

  /**
   * Importa uma transacao fixa/recorrente
   */
  private async importRecurringTransaction(item: PreparedImportItem, config: ImportWizardConfig): Promise<void> {
    // Obter usuario atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario nao autenticado');

    const { error } = await supabase.from('app_transacoes_fixas').insert({
      user_id: user.id,
      descricao: item.descricao,
      valor: Math.abs(item.valor!),
      tipo: item.tipo || 'despesa',
      categoria_id: item.categoriaId || config.step3.categoriaDefault || 1,
      conta_id: item.contaId,
      cartao_id: item.cartaoId,
      dia_mes: item.diaMes || 1,
      data_inicio: item.dataInicio || new Date().toISOString().split('T')[0],
      data_fim: item.dataFim,
      observacoes: item.observacoes,
      ativo: true,
    });

    if (error) throw new Error(error.message);
  }

  /**
   * Importa um ativo patrimonial
   */
  private async importAsset(item: PreparedImportItem, _config: ImportWizardConfig): Promise<void> {
    // Obter usuario atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario nao autenticado');

    const { error } = await supabase.from('app_patrimonio_ativo').insert({
      user_id: user.id,
      nome: item.nome,
      categoria: item.categoriaPatrimonio || 'outros',
      valor_atual: item.valorAtual,
      valor_aquisicao: item.valorAquisicao,
      data_aquisicao: item.dataAquisicao,
      instituicao: item.instituicao,
      observacoes: item.observacoes,
      ativo: true,
    });

    if (error) throw new Error(error.message);
  }
}

// Instancia singleton
export const smartImportService = new SmartImportService();
export default smartImportService;
