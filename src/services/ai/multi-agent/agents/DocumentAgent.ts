/**
 * DocumentAgent - Especialista em Processamento de Documentos
 *
 * 👁️ O "Expert em Documentos" da equipe - foca exclusivamente em:
 * - OCR inteligente de extratos, cupons, comprovantes
 * - Extração estruturada de dados financeiros
 * - Validação de qualidade de documentos
 * - Otimização específica para documentos brasileiros
 */

import { documentProcessor } from '../../DocumentProcessor';
import type { ExtractedFinancialData, ProcessingResult } from '../../DocumentProcessor';

export interface DocumentProcessingTask {
  file?: File;
  analysis?: string; // Análise já feita (do frontend)
  requiredAccuracy?: number; // Mínimo de confiança requerida
  expectedDocumentType?: string;
  extractionFocus?: 'transactions' | 'balances' | 'metadata' | 'all';
}

export interface DocumentAgentResult {
  success: boolean;
  extractedData?: ExtractedFinancialData;
  qualityScore: number; // 0-1
  documentType: string;
  extractionSummary: string;
  recommendations: string[];
  processedTransactions?: Array<{
    id: string;
    data: string;
    descricao: string;
    valor: number;
    tipo: 'credito' | 'debito';
    categoria_sugerida: string;
    confianca: number;
  }>;
  metadata: {
    processingTimeMs: number;
    ocrEngine: 'openai_vision';
    documentQuality: 'excellent' | 'good' | 'fair' | 'poor';
    extractionMethod: 'full_ocr' | 'structured_parsing' | 'hybrid';
  };
}

export class DocumentAgent {
  private processingHistory: DocumentAgentResult[] = [];
  private specializations = {
    extratos_bancarios: 0.95, // Especialização em extratos
    cupons_fiscais: 0.90,     // Especialização em cupons
    comprovantes_pix: 0.92,   // Especialização em PIX
    faturas_cartao: 0.88      // Especialização em faturas
  };

  /**
   * Processa documento com foco total em qualidade e velocidade
   */
  async processDocument(task: DocumentProcessingTask, userId: string): Promise<DocumentAgentResult> {
    const startTime = Date.now();
    console.log('👁️ DocumentAgent: Iniciando processamento especializado...');

    try {
      // Se já temos análise, usar ela como base
      if (task.analysis) {
        return await this.processExistingAnalysis(task, startTime);
      }

      // Se temos arquivo, processar com OCR otimizado
      if (task.file) {
        return await this.processFileWithOCR(task, userId, startTime);
      }

      throw new Error('DocumentAgent requer arquivo ou análise pré-existente');

    } catch (error) {
      console.error('❌ DocumentAgent: Erro no processamento:', error);

      return {
        success: false,
        qualityScore: 0,
        documentType: 'unknown',
        extractionSummary: `Erro no processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        recommendations: [
          'Tente novamente com uma imagem mais clara',
          'Verifique se o formato do arquivo é suportado',
          'Certifique-se de que o documento está legível'
        ],
        metadata: {
          processingTimeMs: Date.now() - startTime,
          ocrEngine: 'openai_vision',
          documentQuality: 'poor',
          extractionMethod: 'full_ocr'
        }
      };
    }
  }

  /**
   * Processa análise já existente (do frontend)
   */
  private async processExistingAnalysis(
    task: DocumentProcessingTask,
    startTime: number
  ): Promise<DocumentAgentResult> {
    // Parse da análise existente para extrair dados estruturados
    const extractedData = this.parseAnalysisText(task.analysis!);
    const qualityScore = this.calculateQualityScore(extractedData);

    const result: DocumentAgentResult = {
      success: qualityScore > 0.3,
      extractedData,
      qualityScore,
      documentType: extractedData?.tipo_documento || 'unknown',
      extractionSummary: this.generateExtractionSummary(extractedData),
      recommendations: this.generateRecommendations(extractedData, qualityScore),
      processedTransactions: this.extractTransactionsForProcessing(extractedData),
      metadata: {
        processingTimeMs: Date.now() - startTime,
        ocrEngine: 'openai_vision',
        documentQuality: this.assessDocumentQuality(qualityScore),
        extractionMethod: 'structured_parsing'
      }
    };

    this.processingHistory.push(result);
    return result;
  }

  /**
   * Processa arquivo novo com OCR otimizado
   */
  private async processFileWithOCR(
    task: DocumentProcessingTask,
    userId: string,
    startTime: number
  ): Promise<DocumentAgentResult> {
    // Otimizar parâmetros baseado no tipo esperado
    const optimizedParams = this.optimizeForDocumentType(task.expectedDocumentType);

    // Processar com DocumentProcessor existente
    const processingResult: ProcessingResult = await documentProcessor.processDocument(task.file!);

    if (!processingResult.success || !processingResult.data) {
      throw new Error(processingResult.error || 'Falha no processamento OCR');
    }

    const extractedData = processingResult.data;
    const qualityScore = this.calculateQualityScore(extractedData);

    // Validar se atende requisitos mínimos
    if (task.requiredAccuracy && qualityScore < task.requiredAccuracy) {
      throw new Error(`Qualidade insuficiente: ${qualityScore.toFixed(2)} < ${task.requiredAccuracy}`);
    }

    const result: DocumentAgentResult = {
      success: true,
      extractedData,
      qualityScore,
      documentType: extractedData.tipo_documento,
      extractionSummary: this.generateExtractionSummary(extractedData),
      recommendations: this.generateRecommendations(extractedData, qualityScore),
      processedTransactions: this.extractTransactionsForProcessing(extractedData),
      metadata: {
        processingTimeMs: Date.now() - startTime,
        ocrEngine: 'openai_vision',
        documentQuality: this.assessDocumentQuality(qualityScore),
        extractionMethod: 'full_ocr'
      }
    };

    this.processingHistory.push(result);
    return result;
  }

  /**
   * Parse análise de texto em dados estruturados
   */
  private parseAnalysisText(analysisText: string): ExtractedFinancialData | undefined {
    try {
      // Tentar encontrar JSON na análise
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) ||
                       analysisText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonText = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonText);
      }

      // Fallback: extrair informações básicas do texto
      return this.extractBasicDataFromText(analysisText);
    } catch (error) {
      console.warn('Erro ao parsear análise:', error);
      return undefined;
    }
  }

  /**
   * Extrai dados básicos de texto não estruturado
   */
  private extractBasicDataFromText(text: string): ExtractedFinancialData {
    const lines = text.split('\n');

    // Detectar tipo de documento
    let tipo_documento: ExtractedFinancialData['tipo_documento'] = 'outro';
    if (text.toLowerCase().includes('extrato')) tipo_documento = 'extrato_bancario';
    else if (text.toLowerCase().includes('cupom')) tipo_documento = 'cupom_fiscal';
    else if (text.toLowerCase().includes('pix')) tipo_documento = 'comprovante_pix';
    else if (text.toLowerCase().includes('fatura')) tipo_documento = 'fatura_cartao';

    // Extrair valores monetários
    const valorRegex = /R\$\s*([0-9,.]+)/g;
    const valores = [...text.matchAll(valorRegex)].map(match =>
      parseFloat(match[1].replace(/[.,]/g, match[1].includes(',') ? '.' : ''))
    );

    return {
      tipo_documento,
      confianca: 0.6, // Confiança baixa para dados extraídos de texto
      dados_extraidos: {
        saldo_atual: valores[0] || undefined,
        total: valores.reduce((sum, val) => sum + val, 0) || undefined
      },
      observacoes: ['Dados extraídos de análise de texto'],
      sugestoes_acao: ['Revisar dados extraídos', 'Confirmar valores identificados']
    };
  }

  /**
   * Calcula score de qualidade baseado nos dados extraídos
   */
  private calculateQualityScore(data?: ExtractedFinancialData): number {
    if (!data) return 0;

    let score = data.confianca || 0;

    // Bonificações por dados estruturados encontrados
    if (data.dados_extraidos.transacoes?.length) score += 0.1;
    if (data.dados_extraidos.saldo_atual !== undefined) score += 0.05;
    if (data.dados_extraidos.banco) score += 0.05;
    if (data.tipo_documento !== 'outro') score += 0.1;

    // Penalidades
    if (data.observacoes.some(obs => obs.includes('erro'))) score -= 0.2;
    if (data.confianca < 0.5) score -= 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Gera resumo da extração
   */
  private generateExtractionSummary(data?: ExtractedFinancialData): string {
    if (!data) return 'Nenhum dado extraído do documento';

    const parts: string[] = [];

    parts.push(`Documento identificado: ${this.getDocumentTypeLabel(data.tipo_documento)}`);
    parts.push(`Confiança: ${(data.confianca * 100).toFixed(0)}%`);

    if (data.dados_extraidos.transacoes?.length) {
      parts.push(`${data.dados_extraidos.transacoes.length} transações encontradas`);
    }

    if (data.dados_extraidos.saldo_atual !== undefined) {
      parts.push(`Saldo: ${this.formatCurrency(data.dados_extraidos.saldo_atual)}`);
    }

    if (data.dados_extraidos.total !== undefined) {
      parts.push(`Total: ${this.formatCurrency(data.dados_extraidos.total)}`);
    }

    return parts.join(' | ');
  }

  /**
   * Gera recomendações baseadas na qualidade
   */
  private generateRecommendations(data?: ExtractedFinancialData, qualityScore?: number): string[] {
    const recommendations: string[] = [];

    if (!data || qualityScore === undefined) {
      return ['Não foi possível processar o documento'];
    }

    if (qualityScore < 0.7) {
      recommendations.push('Considere usar uma imagem de maior qualidade');
    }

    if (data.dados_extraidos.transacoes?.length) {
      recommendations.push(`Revisar categorização das ${data.dados_extraidos.transacoes.length} transações`);
    }

    if (data.tipo_documento === 'extrato_bancario' && !data.dados_extraidos.saldo_atual) {
      recommendations.push('Saldo não identificado - confirmar valores manualmente');
    }

    if (data.confianca < 0.5) {
      recommendations.push('Baixa confiança - validar todos os dados extraídos');
    }

    return recommendations.length > 0 ? recommendations : ['Dados extraídos com sucesso'];
  }

  /**
   * Extrai transações em formato padronizado para processamento
   */
  private extractTransactionsForProcessing(data?: ExtractedFinancialData): Array<any> {
    if (!data?.dados_extraidos.transacoes) return [];

    return data.dados_extraidos.transacoes.map((t, index) => ({
      id: `ext_${Date.now()}_${index}`,
      data: t.data,
      descricao: t.descricao,
      valor: t.valor,
      tipo: t.tipo,
      categoria_sugerida: t.categoria_sugerida || 'outros',
      confianca: data.confianca
    }));
  }

  /**
   * Otimiza parâmetros baseado no tipo de documento
   */
  private optimizeForDocumentType(expectedType?: string): any {
    // Retorna parâmetros específicos para cada tipo
    const optimizations = {
      extrato_bancario: {
        focus: ['transacoes', 'saldos'],
        accuracy_threshold: 0.8
      },
      cupom_fiscal: {
        focus: ['itens', 'total'],
        accuracy_threshold: 0.7
      },
      comprovante_pix: {
        focus: ['valor', 'destinatario'],
        accuracy_threshold: 0.9
      }
    };

    return optimizations[expectedType as keyof typeof optimizations] || {
      focus: ['all'],
      accuracy_threshold: 0.7
    };
  }

  /**
   * Avalia qualidade do documento
   */
  private assessDocumentQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'fair';
    return 'poor';
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
   * Obtém capacidades do agente
   */
  getCapabilities(): {
    canProcessDocuments: boolean;
    canAnalyzeData: boolean;
    canExecuteOperations: boolean;
    canValidateResults: boolean;
    canCommunicate: boolean;
    isAvailable: boolean;
    currentLoad: number;
  } {
    return {
      canProcessDocuments: true,   // ✅ Especialidade principal
      canAnalyzeData: false,       // ❌ Não é responsabilidade
      canExecuteOperations: false, // ❌ Não é responsabilidade
      canValidateResults: false,   // ❌ Não é responsabilidade
      canCommunicate: false,       // ❌ Não é responsabilidade
      isAvailable: true,
      currentLoad: Math.min(this.processingHistory.length * 10, 100)
    };
  }

  /**
   * Obtém estatísticas do agente
   */
  getStats(): {
    totalDocumentsProcessed: number;
    averageQualityScore: number;
    averageProcessingTime: number;
    specializations: Record<string, number>;
    successRate: number;
  } {
    const successful = this.processingHistory.filter(h => h.success);

    return {
      totalDocumentsProcessed: this.processingHistory.length,
      averageQualityScore: successful.length > 0
        ? successful.reduce((sum, h) => sum + h.qualityScore, 0) / successful.length
        : 0,
      averageProcessingTime: this.processingHistory.length > 0
        ? this.processingHistory.reduce((sum, h) => sum + h.metadata.processingTimeMs, 0) / this.processingHistory.length
        : 0,
      specializations: this.specializations,
      successRate: this.processingHistory.length > 0
        ? successful.length / this.processingHistory.length
        : 1
    };
  }
}