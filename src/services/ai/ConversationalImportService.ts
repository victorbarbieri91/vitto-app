/**
 * ConversationalImportService - Serviço para fluxo de importação conversacional com IA Real
 *
 * Este serviço orquestra o fluxo de importação através de mensagens interativas no chat,
 * usando IA real (OpenAI/DeepSeek) para analisar e sugerir automaticamente o destino dos dados.
 */

import { smartImportService } from './SmartImportService';
import type { FileAnalysis, ImportTarget, ColumnMapping, PreparedImportData, ImportWizardConfig } from '../../types/smart-import';
import type {
  ChatMessage,
  InteractiveContent,
  ButtonsElement,
  FileAnalysisElement,
  ColumnMappingElement,
  PreviewTableElement,
  ImportResultElement,
  ConversationalImportState,
} from '../../types/central-ia';
import { FIELD_LABELS, REQUIRED_FIELDS } from '../../types/smart-import';

// Tipos para análise com IA
interface AIAnalysisResult {
  success: boolean;
  suggestions: AIDataSuggestion[];
  summary: string;
  observations: string[];
  confidence: number;
}

interface AIDataSuggestion {
  type: ImportTarget;
  rows: number[];
  confidence: number;
  description: string;
  fields: {
    detected: string[];
    missing: string[];
  };
}

// Gera ID único para importação
const generateImportId = () => `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

class ConversationalImportService {
  private currentImport: ConversationalImportState | null = null;
  private aiAnalysisResult: AIAnalysisResult | null = null;

  /**
   * Analisa os dados da planilha usando IA real (OpenAI/DeepSeek)
   */
  private async analyzeWithAI(analysis: FileAnalysis): Promise<AIAnalysisResult> {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const model = import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini';

    // Se não tem chave de API, usa análise heurística avançada
    if (!openaiKey) {
      console.log('⚠️ Sem chave OpenAI, usando análise heurística avançada');
      return this.analyzeWithHeuristics(analysis);
    }

    try {
      // Prepara dados de amostra para enviar à IA (primeiras 5 linhas)
      const sampleData = analysis.sampleRows.slice(0, 5);
      const columnsInfo = analysis.columns.map(col => ({
        name: col.originalName,
        type: col.detectedType,
        samples: col.sampleValues.slice(0, 3),
      }));

      const systemPrompt = `Você é um especialista em análise de dados financeiros. Analise a planilha fornecida e identifique:

1. TRANSAÇÕES: Dados de despesas/receitas com data, descrição e valor (gastos diários, compras, pagamentos)
2. TRANSAÇÕES FIXAS: Despesas/receitas recorrentes mensais (salário, aluguel, assinaturas) - geralmente tem dia do mês fixo
3. PATRIMÔNIO: Investimentos e ativos (ações, fundos, imóveis, CDBs, etc.)

Uma planilha pode conter MÚLTIPLOS tipos de dados. Identifique todos eles.

Responda APENAS em JSON válido no formato:
{
  "summary": "Resumo do que encontrei na planilha",
  "suggestions": [
    {
      "type": "transacoes|transacoes_fixas|patrimonio",
      "confidence": 0.0-1.0,
      "description": "Descrição do que foi identificado",
      "rowRange": "todas|1-50|etc",
      "detectedFields": ["data", "descricao", "valor", ...],
      "missingFields": ["categoria", ...]
    }
  ],
  "observations": ["observação 1", "observação 2"]
}`;

      const userPrompt = `Analise esta planilha "${analysis.fileName}":

COLUNAS DETECTADAS:
${columnsInfo.map(c => `- "${c.name}" (tipo: ${c.type}) - exemplos: ${c.samples.join(', ')}`).join('\n')}

AMOSTRA DE DADOS (${analysis.rowCount} linhas no total):
${JSON.stringify(sampleData, null, 2)}

Identifique o tipo de dados e para onde devem ser importados.`;

      console.log('🤖 Enviando dados para análise com IA...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';

      // Parseia a resposta JSON da IA
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta da IA não contém JSON válido');
      }

      const aiResult = JSON.parse(jsonMatch[0]);

      console.log('✅ Análise da IA concluída:', aiResult);

      // Converte para o formato interno
      const suggestions: AIDataSuggestion[] = (aiResult.suggestions || []).map((s: any) => ({
        type: s.type as ImportTarget,
        rows: s.rowRange === 'todas' ? [] : this.parseRowRange(s.rowRange, analysis.rowCount),
        confidence: s.confidence || 0.8,
        description: s.description || '',
        fields: {
          detected: s.detectedFields || [],
          missing: s.missingFields || [],
        },
      }));

      return {
        success: true,
        suggestions,
        summary: aiResult.summary || 'Análise concluída',
        observations: aiResult.observations || [],
        confidence: suggestions.length > 0 ? Math.max(...suggestions.map(s => s.confidence)) : 0.5,
      };

    } catch (error) {
      console.error('❌ Erro na análise com IA:', error);
      // Fallback para análise heurística
      return this.analyzeWithHeuristics(analysis);
    }
  }

  /**
   * Análise heurística avançada (fallback quando não tem API)
   */
  private analyzeWithHeuristics(analysis: FileAnalysis): AIAnalysisResult {
    const suggestions: AIDataSuggestion[] = [];
    const observations: string[] = [];

    const columns = analysis.columns;
    const hasDate = columns.some(c => c.detectedType === 'date' || /data|date/i.test(c.originalName));
    const hasValue = columns.some(c => c.detectedType === 'number' || /valor|value|preco|price/i.test(c.originalName));
    const hasDescription = columns.some(c => /desc|nome|name|titulo/i.test(c.originalName));

    // Detecta padrões de transações fixas
    const hasDayOfMonth = columns.some(c => /dia|day|vencimento/i.test(c.originalName));
    const hasRecurring = columns.some(c => /recorr|fixo|mensal|monthly/i.test(c.originalName));

    // Detecta padrões de patrimônio/investimentos
    const hasAssetIndicators = columns.some(c =>
      /ativo|asset|ticker|codigo|fundo|acao|cdb|tesouro|cripto|bitcoin|instituicao|corretora/i.test(c.originalName)
    );
    const hasAcquisitionValue = columns.some(c => /aquisicao|compra|custo|pm/i.test(c.originalName));
    const hasCurrentValue = columns.some(c => /atual|mercado|cotacao/i.test(c.originalName));

    // Analisa amostras de dados para melhor detecção
    const sampleValues = analysis.sampleRows.slice(0, 10);
    const hasTypicalTransactionPatterns = sampleValues.some(row => {
      const values = Object.values(row).map(v => String(v).toLowerCase());
      return values.some(v =>
        /supermercado|farmacia|restaurante|uber|ifood|pix|ted|doc|boleto|compra/i.test(v)
      );
    });

    const hasInvestmentPatterns = sampleValues.some(row => {
      const values = Object.values(row).map(v => String(v).toLowerCase());
      return values.some(v =>
        /cdb|lci|lca|tesouro|fundo|acao|fii|etf|bitcoin|ethereum|nubank|inter|xp|clear/i.test(v)
      );
    });

    // Decide o tipo baseado nas evidências
    if (hasAssetIndicators || hasInvestmentPatterns || (hasCurrentValue && hasAcquisitionValue)) {
      suggestions.push({
        type: 'patrimonio',
        rows: [],
        confidence: 0.85,
        description: `Identifiquei dados de **investimentos/patrimônio** com ${analysis.rowCount} ativos`,
        fields: {
          detected: columns.filter(c => c.suggestedField !== 'ignorar').map(c => c.suggestedField),
          missing: this.getMissingFields('patrimonio', columns),
        },
      });
      observations.push('Detectei colunas típicas de carteira de investimentos');
    }

    if (hasDayOfMonth || hasRecurring) {
      suggestions.push({
        type: 'transacoes_fixas',
        rows: [],
        confidence: 0.80,
        description: `Identifiquei **${analysis.rowCount} transações recorrentes** (despesas/receitas fixas mensais)`,
        fields: {
          detected: columns.filter(c => c.suggestedField !== 'ignorar').map(c => c.suggestedField),
          missing: this.getMissingFields('transacoes_fixas', columns),
        },
      });
      observations.push('Detectei padrão de transações fixas/recorrentes');
    }

    if ((hasDate && hasValue && hasDescription) || hasTypicalTransactionPatterns) {
      suggestions.push({
        type: 'transacoes',
        rows: [],
        confidence: 0.85,
        description: `Identifiquei **${analysis.rowCount} transações** (despesas e receitas)`,
        fields: {
          detected: columns.filter(c => c.suggestedField !== 'ignorar').map(c => c.suggestedField),
          missing: this.getMissingFields('transacoes', columns),
        },
      });
      observations.push('Detectei padrão de transações financeiras');
    }

    // Se não detectou nada específico, sugere transações como padrão
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'transacoes',
        rows: [],
        confidence: 0.6,
        description: `Encontrei **${analysis.rowCount} linhas** de dados que podem ser transações`,
        fields: {
          detected: columns.filter(c => c.suggestedField !== 'ignorar').map(c => c.suggestedField),
          missing: this.getMissingFields('transacoes', columns),
        },
      });
      observations.push('Não consegui identificar o tipo com certeza, mas parece ser transações');
    }

    return {
      success: true,
      suggestions,
      summary: this.buildAnalysisSummary(suggestions, analysis),
      observations,
      confidence: Math.max(...suggestions.map(s => s.confidence)),
    };
  }

  /**
   * Constrói resumo da análise
   */
  private buildAnalysisSummary(suggestions: AIDataSuggestion[], analysis: FileAnalysis): string {
    if (suggestions.length === 0) {
      return `Analisei o arquivo ${analysis.fileName} mas não consegui identificar o tipo de dados.`;
    }

    if (suggestions.length === 1) {
      return suggestions[0].description;
    }

    return `Analisei o arquivo e encontrei múltiplos tipos de dados: ${suggestions.map(s => {
      const typeLabel = s.type === 'transacoes' ? 'transações' :
                       s.type === 'transacoes_fixas' ? 'transações fixas' : 'patrimônio';
      return typeLabel;
    }).join(', ')}.`;
  }

  /**
   * Retorna campos faltantes para um tipo de importação
   */
  private getMissingFields(type: ImportTarget, columns: FileAnalysis['columns']): string[] {
    const required = REQUIRED_FIELDS[type];
    const detected = new Set(columns.map(c => c.suggestedField));
    return required.filter(f => !detected.has(f as any));
  }

  /**
   * Parseia range de linhas (ex: "1-50" -> [1,2,3...50])
   */
  private parseRowRange(range: string, totalRows: number): number[] {
    if (!range || range === 'todas') return [];
    const match = range.match(/(\d+)-(\d+)/);
    if (!match) return [];
    const start = parseInt(match[1]);
    const end = Math.min(parseInt(match[2]), totalRows);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  /**
   * Constrói um ImportWizardConfig a partir do estado atual de importação
   */
  private buildWizardConfig(): ImportWizardConfig | null {
    if (!this.currentImport || !this.currentImport.importType) return null;

    const mappings: ColumnMapping[] = (this.currentImport.mappings || []).map(m => ({
      columnIndex: m.columnIndex,
      columnName: m.columnName,
      targetField: m.targetField as any,
      sampleValues: [],
    }));

    return {
      step1: {
        importType: this.currentImport.importType,
      },
      step2: {
        mappings,
      },
      step3: {
        transactionType: this.currentImport.destination?.transactionType || 'auto',
        destinationType: 'auto',
        contaId: this.currentImport.destination?.contaId,
        cartaoId: this.currentImport.destination?.cartaoId,
        categoriaDefault: this.currentImport.destination?.categoriaDefault,
      },
      step4: {
        selectedIds: new Set(
          (this.currentImport.preparedItems || [])
            .filter(item => item.selected)
            .map(item => item.id)
        ),
      },
    };
  }

  /**
   * Inicia o fluxo de importação com um arquivo
   */
  async startImport(file: File): Promise<ChatMessage> {
    // Cria novo estado de importação
    this.currentImport = {
      id: generateImportId(),
      status: 'analyzing',
      file,
      fileName: file.name,
      fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
    };

    // Mensagem inicial mais conversacional
    const analyzingMessage: ChatMessage = {
      role: 'assistant',
      content: `Recebi o arquivo **${file.name}**! Vou analisar o conteúdo para entender os dados...

🔍 *Lendo estrutura do arquivo...*`,
    };

    return analyzingMessage;
  }

  /**
   * Simula delay de processamento para parecer mais natural
   */
  private async simulateProcessingDelay(minMs: number = 800, maxMs: number = 1500): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Analisa o arquivo e retorna mensagem com resultados usando IA real
   * Inclui delay para parecer processamento natural
   */
  async analyzeFile(): Promise<ChatMessage> {
    if (!this.currentImport?.file) {
      return this.createErrorMessage('Nenhum arquivo selecionado para análise.');
    }

    try {
      // Simula tempo de leitura do arquivo
      await this.simulateProcessingDelay(1000, 2000);

      // Passo 1: Análise técnica do arquivo (estrutura, colunas, tipos)
      const analysis = await smartImportService.analyzeFile(this.currentImport.file);

      if (!analysis.success) {
        this.currentImport.status = 'error';
        this.currentImport.error = analysis.error;
        return this.createErrorMessage(analysis.error || 'Erro ao analisar arquivo.');
      }

      // Simula tempo de análise das colunas
      await this.simulateProcessingDelay(800, 1500);

      // Passo 2: Análise inteligente com IA para entender o conteúdo
      console.log('🧠 Iniciando análise inteligente com IA...');
      this.aiAnalysisResult = await this.analyzeWithAI(analysis);

      // Atualiza estado com análise
      this.currentImport.status = 'awaiting_column_confirmation';
      this.currentImport.analysis = {
        rowCount: analysis.rowCount,
        columns: analysis.columns.map(col => ({
          index: col.index,
          name: col.originalName,
          type: col.detectedType,
          samples: col.sampleValues,
          suggestedField: col.suggestedField,
          confidence: col.confidence,
        })),
        suggestedImportType: analysis.suggestedImportType,
        observations: analysis.observations,
      };

      // Usa a sugestão principal da IA
      if (this.aiAnalysisResult.suggestions.length > 0) {
        const mainSuggestion = this.aiAnalysisResult.suggestions[0];
        this.currentImport.importType = mainSuggestion.type;
      }

      // Cria mensagem conversacional pedindo confirmação das colunas
      return this.createColumnConfirmationMessage(analysis, this.aiAnalysisResult);
    } catch (error) {
      this.currentImport.status = 'error';
      this.currentImport.error = error instanceof Error ? error.message : 'Erro desconhecido';
      return this.createErrorMessage('Ocorreu um erro ao analisar o arquivo. Tente novamente.');
    }
  }

  /**
   * Processa a seleção do tipo de importação
   */
  async handleTypeSelection(type: ImportTarget): Promise<ChatMessage> {
    if (!this.currentImport) {
      return this.createErrorMessage('Nenhuma importação em andamento.');
    }

    this.currentImport.importType = type;
    this.currentImport.status = 'awaiting_mapping';

    // Prepara os mapeamentos sugeridos
    const requiredFields = REQUIRED_FIELDS[type];
    const fieldLabels = FIELD_LABELS[type];

    const mappings = this.currentImport.analysis?.columns.map(col => ({
      columnIndex: col.index,
      columnName: col.name,
      targetField: col.suggestedField || 'ignorar',
      sampleValues: col.samples,
    })) || [];

    this.currentImport.mappings = mappings.map(m => ({
      columnIndex: m.columnIndex,
      columnName: m.columnName,
      targetField: m.targetField,
    }));

    // Verifica campos obrigatórios não mapeados
    const mappedFields = new Set(mappings.map(m => m.targetField));
    const missingRequired = requiredFields.filter(f => !mappedFields.has(f));

    return this.createMappingMessage(type, mappings, missingRequired);
  }

  /**
   * Confirma o mapeamento e prepara os dados
   */
  async confirmMapping(): Promise<ChatMessage> {
    if (!this.currentImport || !this.currentImport.importType || !this.currentImport.mappings) {
      return this.createErrorMessage('Configuração de importação incompleta.');
    }

    this.currentImport.status = 'awaiting_confirmation';

    try {
      // Constrói config para o serviço de importação
      const config = this.buildWizardConfig();
      if (!config) {
        return this.createErrorMessage('Erro ao construir configuração de importação.');
      }

      const preparedData = await smartImportService.prepareImportData(
        this.currentImport.file!,
        config
      );

      // Atualiza estado
      this.currentImport.preparedItems = preparedData.items.map(item => ({
        id: item.id,
        data: item.data || item.dataInicio,
        descricao: item.descricao || item.nome || '',
        valor: item.valor || item.valorAtual || 0,
        tipo: item.tipo,
        categoria: item.categoria || item.categoriaPatrimonio,
        valid: item.valid,
        errors: item.validationErrors,
        selected: item.valid, // Seleciona apenas válidos por padrão
      }));

      return this.createPreviewMessage(preparedData);
    } catch (error) {
      return this.createErrorMessage('Erro ao preparar dados para importação.');
    }
  }

  /**
   * Executa a importação
   */
  async executeImport(userId: string): Promise<ChatMessage> {
    if (!this.currentImport || !this.currentImport.preparedItems || !this.currentImport.importType) {
      return this.createErrorMessage('Dados de importação não preparados.');
    }

    this.currentImport.status = 'importing';

    try {
      // Constrói config para o serviço de importação
      const config = this.buildWizardConfig();
      if (!config) {
        return this.createErrorMessage('Erro ao construir configuração de importação.');
      }

      // Filtra apenas itens selecionados
      const selectedIds = new Set(
        this.currentImport.preparedItems
          .filter(item => item.selected && item.valid)
          .map(item => item.id)
      );

      // Prepara os dados novamente para executar importação
      const preparedData = await smartImportService.prepareImportData(
        this.currentImport.file!,
        config
      );

      // Executa importação com os IDs selecionados
      const result = await smartImportService.executeImport(
        preparedData,
        config,
        selectedIds
      );

      this.currentImport.status = 'completed';
      this.currentImport.result = {
        imported: result.imported,
        failed: result.failed,
        skipped: result.skipped,
        totalValue: result.summary.totalValue,
        errors: result.errors.map(e => ({ description: e.itemDescription, error: e.error })),
      };

      // Limpa importação atual
      const resultMessage = this.createResultMessage(result);
      this.currentImport = null;

      return resultMessage;
    } catch (error) {
      this.currentImport.status = 'error';
      return this.createErrorMessage('Erro ao executar importação. Tente novamente.');
    }
  }

  /**
   * Cancela a importação atual
   */
  cancelImport(): ChatMessage {
    this.currentImport = null;
    return {
      role: 'assistant',
      content: 'Importação cancelada. Se precisar importar outro arquivo, é só me enviar!',
    };
  }

  /**
   * Retorna o estado atual da importação
   */
  getCurrentImport(): ConversationalImportState | null {
    return this.currentImport;
  }

  /**
   * Atualiza um mapeamento específico
   */
  updateMapping(columnIndex: number, newField: string): void {
    if (!this.currentImport?.mappings) return;

    const mapping = this.currentImport.mappings.find(m => m.columnIndex === columnIndex);
    if (mapping) {
      mapping.targetField = newField;
    }
  }

  // ============================================
  // Métodos privados para criação de mensagens
  // ============================================

  private createErrorMessage(error: string): ChatMessage {
    return {
      role: 'assistant',
      content: `Ops! ${error}`,
    };
  }

  /**
   * Cria mensagem conversacional pedindo confirmação das colunas detectadas
   * Esta é a primeira etapa - mostrar o que foi encontrado e pedir confirmação
   */
  private createColumnConfirmationMessage(analysis: FileAnalysis, aiResult: AIAnalysisResult): ChatMessage {
    const suggestions = aiResult.suggestions;
    const mainSuggestion = suggestions[0];

    if (!mainSuggestion) {
      return this.createErrorMessage('Não consegui identificar o tipo de dados neste arquivo.');
    }

    const typeLabel = mainSuggestion.type === 'transacoes' ? 'transações financeiras' :
                     mainSuggestion.type === 'transacoes_fixas' ? 'despesas/receitas fixas mensais' :
                     'investimentos e patrimônio';

    // Construir mensagem mostrando o que foi encontrado
    let content = `Pronto! Analisei o arquivo e encontrei **${analysis.rowCount} linhas** de dados.\n\n`;
    content += `📊 **O que identifiquei:**\n`;
    content += `Parece ser uma planilha de **${typeLabel}**.\n\n`;

    // Mostra as colunas detectadas de forma conversacional
    content += `📋 **Colunas encontradas:**\n`;
    const importantColumns = analysis.columns.filter(col => col.suggestedField !== 'ignorar');
    importantColumns.forEach(col => {
      const fieldLabel = FIELD_LABELS[mainSuggestion.type]?.[col.suggestedField];
      const label = fieldLabel?.label || col.suggestedField;
      const samples = col.sampleValues.slice(0, 2).join(', ');
      content += `• **${col.originalName}** → ${label} _(ex: ${samples})_\n`;
    });

    // Colunas ignoradas
    const ignoredColumns = analysis.columns.filter(col => col.suggestedField === 'ignorar');
    if (ignoredColumns.length > 0) {
      content += `\n_${ignoredColumns.length} coluna(s) serão ignoradas_\n`;
    }

    content += `\n**Esse mapeamento está correto?** Se algo estiver errado, me avise!`;

    const interactive: InteractiveContent = {
      contextId: this.currentImport?.id,
      elements: [
        // Card visual mostrando a análise
        {
          type: 'file_analysis',
          fileName: analysis.fileName,
          fileType: analysis.fileType,
          rowCount: analysis.rowCount,
          columns: analysis.columns.map(col => ({
            name: col.originalName,
            type: col.detectedType,
            samples: col.sampleValues,
            suggestedField: col.suggestedField,
            confidence: col.confidence,
          })),
          suggestedImportType: mainSuggestion.type,
          observations: aiResult.observations,
        } as FileAnalysisElement,
        // Botões para confirmar ou ajustar
        {
          type: 'buttons',
          question: 'O mapeamento está correto?',
          buttons: [
            {
              id: 'confirm_columns',
              label: 'Sim, está correto!',
              value: 'confirm_columns',
              icon: 'check',
              variant: 'primary',
            },
            {
              id: 'adjust_columns',
              label: 'Preciso ajustar',
              value: 'adjust_columns',
              icon: 'edit',
              variant: 'secondary',
            },
            {
              id: 'cancel',
              label: 'Cancelar',
              value: 'cancel',
              variant: 'outline',
            },
          ],
        } as ButtonsElement,
      ],
    };

    return {
      role: 'assistant',
      content,
      interactive,
    };
  }

  /**
   * Processa confirmação das colunas e avança para preview
   */
  async handleColumnConfirmation(confirmed: boolean): Promise<ChatMessage> {
    if (!this.currentImport || !this.currentImport.importType) {
      return this.createErrorMessage('Nenhuma importação em andamento.');
    }

    if (!confirmed) {
      // Usuário quer ajustar - mostra interface de mapeamento
      return this.createMappingAdjustmentMessage();
    }

    // Colunas confirmadas - avança para preview
    this.currentImport.status = 'awaiting_preview_confirmation';

    // Simula processamento
    await this.simulateProcessingDelay(500, 1000);

    // Prepara dados para preview
    try {
      const config = this.buildWizardConfig();
      if (!config) {
        return this.createErrorMessage('Erro ao construir configuração.');
      }

      const preparedData = await smartImportService.prepareImportData(
        this.currentImport.file!,
        config
      );

      // Atualiza estado
      this.currentImport.preparedItems = preparedData.items.map(item => ({
        id: item.id,
        data: item.data || item.dataInicio,
        descricao: item.descricao || item.nome || '',
        valor: item.valor || item.valorAtual || 0,
        tipo: item.tipo,
        categoria: item.categoria || item.categoriaPatrimonio,
        valid: item.valid,
        errors: item.validationErrors,
        selected: item.valid,
      }));

      // Cria mensagem de preview
      return this.createPreviewConfirmationMessage(preparedData);
    } catch (error) {
      return this.createErrorMessage('Erro ao preparar dados para preview.');
    }
  }

  /**
   * Cria mensagem para ajuste de mapeamento
   */
  private createMappingAdjustmentMessage(): ChatMessage {
    if (!this.currentImport?.analysis || !this.currentImport.importType) {
      return this.createErrorMessage('Dados de análise não disponíveis.');
    }

    const importType = this.currentImport.importType;
    const fieldLabels = FIELD_LABELS[importType];
    const availableFields = Object.entries(fieldLabels).map(([field, info]) => ({
      field,
      label: info.label,
      required: info.required,
    }));

    const mappings = this.currentImport.analysis.columns.map(col => ({
      columnName: col.name,
      columnIndex: col.index,
      suggestedField: col.suggestedField,
      confidence: col.confidence,
      samples: col.samples,
    }));

    const content = `Sem problemas! Ajuste o mapeamento das colunas abaixo.\n\nArraste ou selecione o campo correto para cada coluna:`;

    const interactive: InteractiveContent = {
      contextId: this.currentImport?.id,
      elements: [
        {
          type: 'column_mapping',
          importType,
          mappings,
          missingRequired: [],
          availableFields,
        } as ColumnMappingElement,
        {
          type: 'buttons',
          buttons: [
            {
              id: 'save_mapping',
              label: 'Salvar mapeamento',
              value: 'confirm_columns',
              icon: 'save',
              variant: 'primary',
            },
            {
              id: 'cancel',
              label: 'Cancelar',
              value: 'cancel',
              variant: 'outline',
            },
          ],
        } as ButtonsElement,
      ],
    };

    return {
      role: 'assistant',
      content,
      interactive,
    };
  }

  /**
   * Cria mensagem de preview com dados formatados
   */
  private createPreviewConfirmationMessage(preparedData: PreparedImportData): ChatMessage {
    const validCount = preparedData.validItems;
    const invalidCount = preparedData.invalidItems;
    const importType = this.currentImport?.importType;

    const typeLabel = importType === 'transacoes' ? 'transações' :
                     importType === 'transacoes_fixas' ? 'transações fixas' :
                     'itens de patrimônio';

    let content = `Perfeito! Processei os dados e preparei **${validCount} ${typeLabel}** para importação.\n\n`;

    if (invalidCount > 0) {
      content += `⚠️ ${invalidCount} item(s) com problemas serão ignorados.\n\n`;
    }

    // Resumo do período (se for transações)
    if (preparedData.dateRange && importType === 'transacoes') {
      const startDate = new Date(preparedData.dateRange.start + 'T00:00:00').toLocaleDateString('pt-BR');
      const endDate = new Date(preparedData.dateRange.end + 'T00:00:00').toLocaleDateString('pt-BR');
      content += `📅 **Período:** ${startDate} a ${endDate}\n`;
    }

    // Valor total
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(preparedData.totalValue);
    content += `💰 **Valor total:** ${formattedValue}\n\n`;

    content += `**Veja abaixo como ficará a importação:**`;

    const interactive: InteractiveContent = {
      contextId: this.currentImport?.id,
      elements: [
        // Tabela de preview
        {
          type: 'preview_table',
          items: preparedData.items.slice(0, 10).map(item => ({
            id: item.id,
            data: item.data || item.dataInicio,
            descricao: item.descricao || item.nome || '',
            valor: item.valor || item.valorAtual || 0,
            tipo: item.tipo,
            categoria: item.categoria || item.categoriaPatrimonio,
            valid: item.valid,
            errors: item.validationErrors,
          })),
          summary: {
            total: preparedData.totalItems,
            valid: preparedData.validItems,
            invalid: preparedData.invalidItems,
            totalValue: preparedData.totalValue,
          },
        } as PreviewTableElement,
        // Botões de confirmação final
        {
          type: 'buttons',
          question: 'Confirma a importação?',
          buttons: [
            {
              id: 'execute_import',
              label: `Importar ${validCount} ${typeLabel}`,
              value: 'execute_import',
              icon: 'import',
              variant: 'primary',
            },
            {
              id: 'back_to_mapping',
              label: 'Voltar e ajustar',
              value: 'adjust_columns',
              icon: 'back',
              variant: 'secondary',
            },
            {
              id: 'cancel',
              label: 'Cancelar',
              value: 'cancel',
              variant: 'outline',
            },
          ],
        } as ButtonsElement,
      ],
    };

    return {
      role: 'assistant',
      content,
      interactive,
    };
  }

  /**
   * Cria mensagem com análise inteligente da IA - mostra sugestão automática
   * (Mantido para compatibilidade, mas createColumnConfirmationMessage é preferido)
   */
  private createAIAnalysisMessage(analysis: FileAnalysis, aiResult: AIAnalysisResult): ChatMessage {
    const suggestions = aiResult.suggestions;

    if (suggestions.length === 0) {
      return this.createErrorMessage('Não consegui identificar o tipo de dados neste arquivo.');
    }

    // Sugestão principal
    const mainSuggestion = suggestions[0];
    const typeLabel = mainSuggestion.type === 'transacoes' ? 'transações' :
                     mainSuggestion.type === 'transacoes_fixas' ? 'transações fixas/recorrentes' :
                     'investimentos/patrimônio';

    const confidenceText = mainSuggestion.confidence > 0.8 ? 'tenho certeza' :
                          mainSuggestion.confidence > 0.6 ? 'parece ser' : 'pode ser';

    // Construir mensagem conversacional
    let content = `Analisei o arquivo **${analysis.fileName}** e encontrei **${analysis.rowCount} linhas** de dados.\n\n`;
    content += `${mainSuggestion.description}\n\n`;

    // Se tem múltiplas sugestões
    if (suggestions.length > 1) {
      content += `Também identifiquei outros dados:\n`;
      suggestions.slice(1).forEach(s => {
        const label = s.type === 'transacoes' ? 'Transações' :
                     s.type === 'transacoes_fixas' ? 'Transações fixas' : 'Patrimônio';
        content += `• ${label}: ${s.description}\n`;
      });
      content += '\n';
    }

    // Campos detectados e faltantes
    if (mainSuggestion.fields.detected.length > 0) {
      const fieldLabels = FIELD_LABELS[mainSuggestion.type];
      const detectedLabels = mainSuggestion.fields.detected
        .filter(f => fieldLabels[f])
        .map(f => fieldLabels[f].label)
        .slice(0, 5);
      content += `✅ Campos identificados: ${detectedLabels.join(', ')}\n`;
    }

    if (mainSuggestion.fields.missing.length > 0) {
      const fieldLabels = FIELD_LABELS[mainSuggestion.type];
      const missingLabels = mainSuggestion.fields.missing
        .filter(f => fieldLabels[f])
        .map(f => fieldLabels[f].label);
      content += `⚠️ Campos não encontrados: ${missingLabels.join(', ')}\n`;
    }

    // Observações da IA
    if (aiResult.observations.length > 0) {
      content += `\n💡 ${aiResult.observations[0]}`;
    }

    content += '\n\n**Posso importar como ${typeLabel}. Confirma?**'.replace('${typeLabel}', typeLabel);

    const interactive: InteractiveContent = {
      contextId: this.currentImport?.id,
      elements: [
        // Card de análise do arquivo
        {
          type: 'file_analysis',
          fileName: analysis.fileName,
          fileType: analysis.fileType,
          rowCount: analysis.rowCount,
          columns: analysis.columns.map(col => ({
            name: col.originalName,
            type: col.detectedType,
            samples: col.sampleValues,
            suggestedField: col.suggestedField,
            confidence: col.confidence,
          })),
          suggestedImportType: mainSuggestion.type,
          observations: aiResult.observations,
        } as FileAnalysisElement,
        // Botões de confirmação - não são opções de módulo, mas confirmação da sugestão
        {
          type: 'buttons',
          buttons: [
            {
              id: 'confirm_suggestion',
              label: `Sim, importar como ${typeLabel}`,
              value: mainSuggestion.type,
              icon: 'confirm',
              variant: 'primary',
            },
            // Se tem outras sugestões, oferecer como alternativa
            ...(suggestions.length > 1 ? [{
              id: 'alt_suggestion',
              label: `Importar como ${suggestions[1].type === 'transacoes' ? 'transações' : suggestions[1].type === 'transacoes_fixas' ? 'transações fixas' : 'patrimônio'}`,
              value: suggestions[1].type,
              icon: suggestions[1].type,
              variant: 'secondary' as const,
            }] : []),
            {
              id: 'cancel',
              label: 'Cancelar',
              value: 'cancel',
              variant: 'outline',
            },
          ],
        } as ButtonsElement,
      ],
    };

    return {
      role: 'assistant',
      content,
      interactive,
    };
  }

  // Mantido para compatibilidade, mas não é mais usado
  private createAnalysisMessage(analysis: FileAnalysis): ChatMessage {
    const typeLabel = analysis.suggestedImportType === 'transacoes'
      ? 'transações'
      : analysis.suggestedImportType === 'transacoes_fixas'
      ? 'transações fixas/recorrentes'
      : 'investimentos/patrimônio';

    const content = `Analisei o arquivo **${analysis.fileName}** e encontrei **${analysis.rowCount}** linhas de dados.

Pelo que entendi, parece ser uma planilha de **${typeLabel}**. Detectei ${analysis.columns.length} colunas e consegui mapear a maioria delas automaticamente.`;

    const interactive: InteractiveContent = {
      contextId: this.currentImport?.id,
      elements: [
        // Card de análise do arquivo
        {
          type: 'file_analysis',
          fileName: analysis.fileName,
          fileType: analysis.fileType,
          rowCount: analysis.rowCount,
          columns: analysis.columns.map(col => ({
            name: col.originalName,
            type: col.detectedType,
            samples: col.sampleValues,
            suggestedField: col.suggestedField,
            confidence: col.confidence,
          })),
          suggestedImportType: analysis.suggestedImportType,
          observations: analysis.observations,
        } as FileAnalysisElement,
        // Botões para escolha do tipo
        {
          type: 'buttons',
          question: 'Para onde você quer importar esses dados?',
          buttons: [
            {
              id: 'type_transacoes',
              label: 'Transações',
              value: 'transacoes',
              icon: 'transacoes',
              variant: analysis.suggestedImportType === 'transacoes' ? 'primary' : 'secondary',
            },
            {
              id: 'type_fixas',
              label: 'Transações Fixas',
              value: 'transacoes_fixas',
              icon: 'transacoes_fixas',
              variant: analysis.suggestedImportType === 'transacoes_fixas' ? 'primary' : 'secondary',
            },
            {
              id: 'type_patrimonio',
              label: 'Patrimônio',
              value: 'patrimonio',
              icon: 'patrimonio',
              variant: analysis.suggestedImportType === 'patrimonio' ? 'primary' : 'secondary',
            },
            {
              id: 'cancel',
              label: 'Cancelar',
              value: 'cancel',
              variant: 'outline',
            },
          ],
        } as ButtonsElement,
      ],
    };

    return {
      role: 'assistant',
      content,
      interactive,
    };
  }

  private createMappingMessage(
    importType: ImportTarget,
    mappings: Array<{ columnIndex: number; columnName: string; targetField: string; sampleValues: string[] }>,
    missingRequired: string[]
  ): ChatMessage {
    const typeLabel = importType === 'transacoes'
      ? 'transações'
      : importType === 'transacoes_fixas'
      ? 'transações fixas'
      : 'patrimônio';

    const fieldLabels = FIELD_LABELS[importType];
    const availableFields = Object.entries(fieldLabels).map(([field, info]) => ({
      field,
      label: info.label,
      required: info.required,
    }));

    let content = `Ótimo! Vou importar como **${typeLabel}**.`;

    if (missingRequired.length > 0) {
      const missingLabels = missingRequired.map(f => fieldLabels[f]?.label || f).join(', ');
      content += `\n\n⚠️ Não consegui identificar automaticamente: **${missingLabels}**. Por favor, verifique o mapeamento abaixo e ajuste se necessário.`;
    } else {
      content += `\n\nConsegui mapear todas as colunas necessárias. Verifique se está correto:`;
    }

    const interactive: InteractiveContent = {
      contextId: this.currentImport?.id,
      elements: [
        {
          type: 'column_mapping',
          importType,
          mappings: mappings.map(m => ({
            columnName: m.columnName,
            columnIndex: m.columnIndex,
            suggestedField: m.targetField,
            confidence: 0.8, // Simplificado
            samples: m.sampleValues,
          })),
          missingRequired,
          availableFields,
        } as ColumnMappingElement,
        {
          type: 'buttons',
          buttons: missingRequired.length > 0
            ? [
                {
                  id: 'mapping_confirm',
                  label: 'Continuar mesmo assim',
                  value: 'confirm_mapping',
                  variant: 'secondary',
                },
                {
                  id: 'cancel',
                  label: 'Cancelar',
                  value: 'cancel',
                  variant: 'outline',
                },
              ]
            : [
                {
                  id: 'mapping_confirm',
                  label: 'Está correto, continuar',
                  value: 'confirm_mapping',
                  icon: 'continue',
                  variant: 'primary',
                },
                {
                  id: 'cancel',
                  label: 'Cancelar',
                  value: 'cancel',
                  variant: 'outline',
                },
              ],
        } as ButtonsElement,
      ],
    };

    return {
      role: 'assistant',
      content,
      interactive,
    };
  }

  private createPreviewMessage(preparedData: PreparedImportData): ChatMessage {
    const validCount = preparedData.validItems;
    const invalidCount = preparedData.invalidItems;

    let content = `Preparei **${validCount}** itens para importação`;
    if (invalidCount > 0) {
      content += ` (${invalidCount} itens com problemas serão ignorados)`;
    }
    content += '.';

    if (preparedData.dateRange) {
      const startDate = new Date(preparedData.dateRange.start + 'T00:00:00').toLocaleDateString('pt-BR');
      const endDate = new Date(preparedData.dateRange.end + 'T00:00:00').toLocaleDateString('pt-BR');
      content += `\n\nPeríodo: **${startDate}** a **${endDate}**`;
    }

    content += '\n\nConfira os dados antes de importar:';

    const interactive: InteractiveContent = {
      contextId: this.currentImport?.id,
      elements: [
        {
          type: 'preview_table',
          items: preparedData.items.slice(0, 20).map(item => ({
            id: item.id,
            data: item.data || item.dataInicio,
            descricao: item.descricao || item.nome || '',
            valor: item.valor || item.valorAtual || 0,
            tipo: item.tipo,
            categoria: item.categoria || item.categoriaPatrimonio,
            valid: item.valid,
            errors: item.validationErrors,
          })),
          summary: {
            total: preparedData.totalItems,
            valid: preparedData.validItems,
            invalid: preparedData.invalidItems,
            totalValue: preparedData.totalValue,
          },
        } as PreviewTableElement,
        {
          type: 'buttons',
          buttons: [
            {
              id: 'import_confirm',
              label: `Importar ${validCount} itens`,
              value: 'execute_import',
              icon: 'confirm',
              variant: 'primary',
            },
            {
              id: 'cancel',
              label: 'Cancelar',
              value: 'cancel',
              variant: 'outline',
            },
          ],
        } as ButtonsElement,
      ],
    };

    return {
      role: 'assistant',
      content,
      interactive,
    };
  }

  private createResultMessage(result: {
    imported: number;
    failed: number;
    skipped: number;
    summary: { totalValue: number };
    errors: Array<{ itemDescription: string; error: string }>;
  }): ChatMessage {
    const success = result.imported > 0;
    const content = success
      ? `Pronto! Importei **${result.imported}** itens com sucesso!`
      : 'Não foi possível importar nenhum item.';

    const interactive: InteractiveContent = {
      elements: [
        {
          type: 'import_result',
          success,
          imported: result.imported,
          failed: result.failed,
          skipped: result.skipped,
          totalValue: result.summary.totalValue,
          errors: result.errors.map(e => ({
            description: e.itemDescription,
            error: e.error,
          })),
        } as ImportResultElement,
      ],
    };

    return {
      role: 'assistant',
      content,
      interactive,
    };
  }
}

export const conversationalImportService = new ConversationalImportService();
