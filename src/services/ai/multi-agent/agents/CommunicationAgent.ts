/**
 * CommunicationAgent - Especialista em Comunicação e Interface com Usuário
 *
 * 💬 O "Porta-voz" da equipe - foca exclusivamente em:
 * - Geração de respostas naturais e contextualizadas
 * - Formatação de dados para apresentação ao usuário
 * - Adaptação de linguagem técnica para linguagem amigável
 * - Criação de insights e recomendações personalizadas
 * - Gerenciamento de tom e estilo da comunicação
 */

import { financialMemoryManager } from '../../FinancialMemoryManager';
import type { FinancialContext } from '../../../../types/ai';

export interface CommunicationTask {
  originalMessage: string;
  responseType: 'analysis_report' | 'action_result' | 'error_explanation' | 'guidance' | 'summary';
  previousResults: Record<string, any>;
  context: FinancialContext;
  userPreferences?: {
    language_style?: 'formal' | 'casual' | 'technical';
    detail_level?: 'brief' | 'detailed' | 'comprehensive';
    include_suggestions?: boolean;
    include_examples?: boolean;
  };
  tone?: 'helpful' | 'professional' | 'encouraging' | 'cautious' | 'celebratory';
}

export interface CommunicationResult {
  success: boolean;
  message: string;
  formatted_data?: {
    summary_cards?: Array<{
      title: string;
      value: string;
      change?: string;
      trend?: 'up' | 'down' | 'stable';
    }>;
    detailed_breakdown?: Record<string, any>;
    charts_data?: Array<{
      type: 'line' | 'bar' | 'pie' | 'doughnut';
      title: string;
      data: any;
    }>;
    action_buttons?: Array<{
      label: string;
      action: string;
      type: 'primary' | 'secondary' | 'warning';
    }>;
  };
  insights?: string[];
  suggestions?: string[];
  next_steps?: Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  metadata: {
    response_type: string;
    tone_used: string;
    word_count: number;
    readability_score: number;
    personalization_level: number;
    generationTimeMs: number;
  };
}

export class CommunicationAgent {
  private communicationHistory: CommunicationResult[] = [];
  private specializations = {
    natural_language: 0.98,        // Linguagem natural
    data_presentation: 0.95,       // Apresentação de dados
    insight_generation: 0.92,      // Geração de insights
    personalization: 0.90,         // Personalização
    financial_explanation: 0.88    // Explicação financeira
  };

  private responseTemplates = {
    analysis_report: {
      opening: [
        "Analisei seus dados financeiros e encontrei algumas informações importantes:",
        "Com base na análise dos seus dados, aqui está o que descobri:",
        "Seus dados financeiros revelam alguns padrões interessantes:"
      ],
      closing: [
        "Espero que essas informações sejam úteis para suas decisões financeiras.",
        "Se precisar de mais detalhes sobre algum ponto, é só perguntar!",
        "Que tal implementar algumas dessas sugestões?"
      ]
    },
    action_result: {
      success: [
        "✅ Operação realizada com sucesso!",
        "✅ Pronto! Executei a operação conforme solicitado.",
        "✅ Tudo certo! A operação foi concluída."
      ],
      failure: [
        "❌ Ops! Não consegui completar a operação.",
        "❌ Houve um problema ao executar sua solicitação.",
        "❌ Infelizmente, a operação falhou."
      ]
    }
  };

  private personalityTraits = {
    helpful: {
      adjectives: ['útil', 'prático', 'direto'],
      phrases: ['Vou te ajudar', 'É simples', 'Aqui está o que você precisa']
    },
    encouraging: {
      adjectives: ['positivo', 'motivador', 'otimista'],
      phrases: ['Você está no caminho certo', 'Ótimo progresso', 'Continue assim']
    },
    professional: {
      adjectives: ['técnico', 'preciso', 'detalhado'],
      phrases: ['De acordo com a análise', 'Os dados indicam', 'Recomenda-se']
    }
  };

  /**
   * Gera resposta final consolidada e amigável
   */
  async generateResponse(task: CommunicationTask, userId: string): Promise<CommunicationResult> {
    const startTime = Date.now();
    console.log('💬 CommunicationAgent: Gerando resposta personalizada...');

    try {
      // 1. Analisar contexto e resultados para determinar tom
      const optimalTone = task.tone || this.determineBestTone(task.previousResults, task.context);

      // 2. Buscar contexto personalizado da memória
      const personalContext = await this.retrievePersonalContext(task.originalMessage, userId);

      // 3. Estruturar dados para apresentação
      const formattedData = this.formatDataForUser(task.previousResults, task.responseType);

      // 4. Gerar insights contextualizados
      const insights = await this.generateContextualInsights(task.previousResults, task.context, personalContext);

      // 5. Criar sugestões personalizadas
      const suggestions = this.createPersonalizedSuggestions(task.previousResults, task.context, personalContext);

      // 6. Gerar mensagem principal
      const message = await this.craftMainMessage(task, optimalTone, insights, suggestions);

      // 7. Definir próximos passos
      const nextSteps = this.generateNextSteps(task.previousResults, task.responseType);

      // 8. Compilar resultado final
      const result: CommunicationResult = {
        success: true,
        message,
        formatted_data: formattedData,
        insights,
        suggestions,
        next_steps: nextSteps,
        metadata: {
          response_type: task.responseType,
          tone_used: optimalTone,
          word_count: message.split(' ').length,
          readability_score: this.calculateReadabilityScore(message),
          personalization_level: personalContext ? 0.8 : 0.4,
          generationTimeMs: Date.now() - startTime
        }
      };

      // 9. Salvar na memória para personalização futura
      await this.saveInteractionToMemory(task, result, userId);

      this.communicationHistory.push(result);
      console.log(`✅ CommunicationAgent: Resposta gerada (${result.metadata.word_count} palavras, tom: ${optimalTone})`);

      return result;

    } catch (error) {
      console.error('❌ CommunicationAgent: Erro na geração:', error);

      return {
        success: false,
        message: "Desculpe, tive um problema ao processar sua solicitação. Pode tentar novamente?",
        insights: [],
        suggestions: ['Tentar novamente com uma pergunta mais específica'],
        next_steps: [{
          action: 'retry',
          description: 'Reformular a pergunta e tentar novamente',
          priority: 'medium' as const
        }],
        metadata: {
          response_type: 'error_explanation',
          tone_used: 'helpful',
          word_count: 15,
          readability_score: 0.8,
          personalization_level: 0,
          generationTimeMs: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Determina o tom ideal baseado no contexto
   */
  private determineBestTone(results: Record<string, any>, context: FinancialContext): string {
    // Analisar se há problemas ou sucessos
    const hasErrors = Object.values(results).some(result =>
      result && result.success === false ||
      (result.operations_failed && result.operations_failed > 0)
    );

    const hasGoodNews = Object.values(results).some(result =>
      result && result.success === true &&
      (result.operations_completed > 0 || result.summary?.transactions_created > 0)
    );

    // Analisar situação financeira
    const hasPositiveBalance = context.patrimonio?.saldo_total && context.patrimonio.saldo_total > 0;
    const hasRecentGrowth = context.insights?.some(insight =>
      insight.toLowerCase().includes('crescimento') || insight.toLowerCase().includes('aumento')
    );

    if (hasErrors) return 'helpful';
    if (hasGoodNews && hasPositiveBalance) return 'celebratory';
    if (hasRecentGrowth) return 'encouraging';
    if (hasPositiveBalance) return 'professional';
    return 'cautious';
  }

  /**
   * Busca contexto pessoal da memória RAG
   */
  private async retrievePersonalContext(message: string, userId: string): Promise<any> {
    try {
      const memories = await financialMemoryManager.buscarSimilares(message, userId, { limit: 3 });

      return memories.length > 0 ? {
        previous_interactions: memories.map(m => m.resumo),
        preferences: memories[0]?.metadata?.user_preferences,
        patterns: memories.filter(m => m.tipo_conteudo === 'padrao').map(m => m.resumo)
      } : null;
    } catch (error) {
      console.warn('Erro ao buscar contexto pessoal:', error);
      return null;
    }
  }

  /**
   * Formata dados para apresentação visual
   */
  private formatDataForUser(results: Record<string, any>, responseType: string): CommunicationResult['formatted_data'] {
    const formattedData: CommunicationResult['formatted_data'] = {};

    // Processar resultados de análise
    if (results.data_analysis && responseType === 'analysis_report') {
      formattedData.summary_cards = this.createSummaryCards(results.data_analysis);
      formattedData.charts_data = this.createChartsData(results.data_analysis);
    }

    // Processar resultados de operações
    if (results.financial_ops && responseType === 'action_result') {
      formattedData.summary_cards = this.createOperationSummaryCards(results.financial_ops);
      formattedData.action_buttons = this.createActionButtons(results.financial_ops);
    }

    // Processar resultados de documentos
    if (results.doc_processing) {
      formattedData.detailed_breakdown = {
        document_type: results.doc_processing.documentType,
        quality_score: results.doc_processing.qualityScore,
        transactions_found: results.doc_processing.processedTransactions?.length || 0
      };
    }

    return formattedData;
  }

  /**
   * Cria cards de resumo
   */
  private createSummaryCards(analysisResult: any): Array<any> {
    const cards = [];

    if (analysisResult.financial_summary) {
      const summary = analysisResult.financial_summary;

      if (summary.total_receitas !== undefined) {
        cards.push({
          title: 'Total de Receitas',
          value: this.formatCurrency(summary.total_receitas),
          trend: summary.trend_receitas || 'stable',
          change: summary.variacao_receitas ? `${summary.variacao_receitas > 0 ? '+' : ''}${summary.variacao_receitas.toFixed(1)}%` : undefined
        });
      }

      if (summary.total_despesas !== undefined) {
        cards.push({
          title: 'Total de Despesas',
          value: this.formatCurrency(Math.abs(summary.total_despesas)),
          trend: summary.trend_despesas || 'stable',
          change: summary.variacao_despesas ? `${summary.variacao_despesas > 0 ? '+' : ''}${summary.variacao_despesas.toFixed(1)}%` : undefined
        });
      }

      if (summary.saldo_liquido !== undefined) {
        cards.push({
          title: 'Saldo Líquido',
          value: this.formatCurrency(summary.saldo_liquido),
          trend: summary.saldo_liquido > 0 ? 'up' : summary.saldo_liquido < 0 ? 'down' : 'stable'
        });
      }
    }

    return cards;
  }

  /**
   * Cria cards de resumo para operações
   */
  private createOperationSummaryCards(operationsResult: any): Array<any> {
    const cards = [];

    if (operationsResult.summary) {
      const summary = operationsResult.summary;

      cards.push({
        title: 'Operações Completadas',
        value: operationsResult.operations_completed?.toString() || '0',
        trend: operationsResult.operations_completed > 0 ? 'up' : 'stable'
      });

      if (summary.transactions_created > 0) {
        cards.push({
          title: 'Transações Criadas',
          value: summary.transactions_created.toString(),
          trend: 'up'
        });
      }

      if (summary.total_amount_processed > 0) {
        cards.push({
          title: 'Valor Processado',
          value: this.formatCurrency(summary.total_amount_processed),
          trend: 'up'
        });
      }
    }

    return cards;
  }

  /**
   * Cria dados para gráficos
   */
  private createChartsData(analysisResult: any): Array<any> {
    const charts = [];

    if (analysisResult.spending_by_category) {
      charts.push({
        type: 'pie',
        title: 'Gastos por Categoria',
        data: analysisResult.spending_by_category
      });
    }

    if (analysisResult.monthly_trend) {
      charts.push({
        type: 'line',
        title: 'Tendência Mensal',
        data: analysisResult.monthly_trend
      });
    }

    return charts;
  }

  /**
   * Cria botões de ação
   */
  private createActionButtons(operationsResult: any): Array<any> {
    const buttons = [];

    if (operationsResult.operations_completed > 0) {
      buttons.push({
        label: 'Ver Transações Criadas',
        action: 'view_transactions',
        type: 'primary'
      });
    }

    if (operationsResult.operations_failed > 0) {
      buttons.push({
        label: 'Revisar Erros',
        action: 'review_errors',
        type: 'warning'
      });
    }

    buttons.push({
      label: 'Nova Operação',
      action: 'new_operation',
      type: 'secondary'
    });

    return buttons;
  }

  /**
   * Gera insights contextualizados
   */
  private async generateContextualInsights(
    results: Record<string, any>,
    context: FinancialContext,
    personalContext: any
  ): Promise<string[]> {
    const insights: string[] = [];

    // Insights de análise de dados
    if (results.data_analysis?.insights) {
      insights.push(...results.data_analysis.insights);
    }

    // Insights de operações
    if (results.financial_ops?.summary) {
      const summary = results.financial_ops.summary;

      if (summary.transactions_created > 5) {
        insights.push(`Você criou ${summary.transactions_created} transações - isso vai ajudar muito no controle financeiro!`);
      }

      if (summary.categories_assigned > 0) {
        insights.push(`${summary.categories_assigned} transações foram categorizadas automaticamente.`);
      }
    }

    // Insights de documentos
    if (results.doc_processing?.qualityScore > 0.8) {
      insights.push('O documento foi processado com alta qualidade - os dados extraídos são confiáveis.');
    }

    // Insights personalizados baseados no histórico
    if (personalContext?.patterns?.length) {
      insights.push('Com base no seu histórico, identifiquei alguns padrões nos seus gastos.');
    }

    // Insights do contexto financeiro atual
    if (context.patrimonio?.saldo_total > 0) {
      insights.push(`Seu patrimônio atual é positivo: ${this.formatCurrency(context.patrimonio.saldo_total)}`);
    }

    return insights.slice(0, 5); // Máximo 5 insights para não sobrecarregar
  }

  /**
   * Cria sugestões personalizadas
   */
  private createPersonalizedSuggestions(
    results: Record<string, any>,
    context: FinancialContext,
    personalContext: any
  ): string[] {
    const suggestions: string[] = [];

    // Sugestões baseadas nos resultados
    if (results.validation?.recommendations) {
      suggestions.push(...results.validation.recommendations);
    }

    if (results.financial_ops?.recommendations) {
      suggestions.push(...results.financial_ops.recommendations);
    }

    // Sugestões baseadas no contexto atual
    if (context.transacoes_recentes?.length === 0) {
      suggestions.push('Que tal adicionar algumas transações para começar a acompanhar seus gastos?');
    }

    if (context.contas?.length === 1) {
      suggestions.push('Considere adicionar mais contas para ter um controle mais completo.');
    }

    // Sugestões personalizadas
    if (personalContext?.preferences?.detail_level === 'comprehensive') {
      suggestions.push('Posso gerar um relatório mais detalhado se você quiser.');
    }

    return suggestions.slice(0, 4); // Máximo 4 sugestões
  }

  /**
   * Crafta a mensagem principal
   */
  private async craftMainMessage(
    task: CommunicationTask,
    tone: string,
    insights: string[],
    suggestions: string[]
  ): Promise<string> {
    const personality = this.personalityTraits[tone as keyof typeof this.personalityTraits] || this.personalityTraits.helpful;

    let message = '';

    // Saudação baseada no tipo de resposta
    if (task.responseType === 'analysis_report') {
      const opening = this.responseTemplates.analysis_report.opening[
        Math.floor(Math.random() * this.responseTemplates.analysis_report.opening.length)
      ];
      message += opening + '\n\n';
    } else if (task.responseType === 'action_result') {
      const hasSuccess = Object.values(task.previousResults).some(r => r && r.success === true);
      const templates = hasSuccess ?
        this.responseTemplates.action_result.success :
        this.responseTemplates.action_result.failure;

      message += templates[Math.floor(Math.random() * templates.length)] + '\n\n';
    }

    // Destacar principais descobertas
    if (insights.length > 0) {
      message += '📊 **Principais descobertas:**\n';
      insights.forEach(insight => {
        message += `• ${insight}\n`;
      });
      message += '\n';
    }

    // Adicionar contexto específico dos resultados
    message += this.formatSpecificResults(task.previousResults);

    // Adicionar sugestões se houver
    if (suggestions.length > 0) {
      message += '\n💡 **Sugestões:**\n';
      suggestions.forEach(suggestion => {
        message += `• ${suggestion}\n`;
      });
    }

    // Fechamento personalizado
    const closing = this.responseTemplates.analysis_report.closing[
      Math.floor(Math.random() * this.responseTemplates.analysis_report.closing.length)
    ];
    message += `\n${closing}`;

    return message;
  }

  /**
   * Formata resultados específicos por tipo
   */
  private formatSpecificResults(results: Record<string, any>): string {
    let formatted = '';

    // Resultados de processamento de documentos
    if (results.doc_processing) {
      const doc = results.doc_processing;
      formatted += `📄 **Documento processado:**\n`;
      formatted += `• Tipo: ${doc.documentType}\n`;
      formatted += `• Confiança: ${(doc.qualityScore * 100).toFixed(0)}%\n`;

      if (doc.processedTransactions?.length) {
        formatted += `• ${doc.processedTransactions.length} transações encontradas\n`;
      }
      formatted += '\n';
    }

    // Resultados de operações financeiras
    if (results.financial_ops) {
      const ops = results.financial_ops;
      formatted += `⚡ **Operações executadas:**\n`;
      formatted += `• ${ops.operations_completed} operações completadas\n`;

      if (ops.operations_failed > 0) {
        formatted += `• ${ops.operations_failed} operações falharam\n`;
      }

      if (ops.summary?.transactions_created > 0) {
        formatted += `• ${ops.summary.transactions_created} transações criadas\n`;
      }
      formatted += '\n';
    }

    // Resultados de análise de dados
    if (results.data_analysis?.financial_summary) {
      const summary = results.data_analysis.financial_summary;
      formatted += `📈 **Resumo financeiro:**\n`;

      if (summary.total_receitas !== undefined) {
        formatted += `• Receitas: ${this.formatCurrency(summary.total_receitas)}\n`;
      }
      if (summary.total_despesas !== undefined) {
        formatted += `• Despesas: ${this.formatCurrency(Math.abs(summary.total_despesas))}\n`;
      }
      if (summary.saldo_liquido !== undefined) {
        formatted += `• Saldo: ${this.formatCurrency(summary.saldo_liquido)}\n`;
      }
      formatted += '\n';
    }

    // Resultados de validação
    if (results.validation) {
      const validation = results.validation;
      if (validation.anomalies_detected?.length > 0) {
        formatted += `🚨 **Anomalias detectadas:** ${validation.anomalies_detected.length}\n`;
      }
      if (validation.summary?.overall_health) {
        formatted += `🎯 **Status geral:** ${this.translateHealthStatus(validation.summary.overall_health)}\n`;
      }
      formatted += '\n';
    }

    return formatted;
  }

  /**
   * Traduz status de saúde para português
   */
  private translateHealthStatus(health: string): string {
    const translations = {
      'excellent': 'Excelente',
      'good': 'Bom',
      'fair': 'Regular',
      'poor': 'Precisa atenção'
    };
    return translations[health as keyof typeof translations] || health;
  }

  /**
   * Gera próximos passos
   */
  private generateNextSteps(results: Record<string, any>, responseType: string): Array<any> {
    const steps: Array<any> = [];

    if (responseType === 'action_result' && results.financial_ops?.operations_completed > 0) {
      steps.push({
        action: 'review_dashboard',
        description: 'Revisar as mudanças no dashboard principal',
        priority: 'medium'
      });
    }

    if (results.doc_processing?.processedTransactions?.length > 0) {
      steps.push({
        action: 'import_transactions',
        description: 'Importar as transações encontradas no documento',
        priority: 'high'
      });
    }

    if (results.validation?.anomalies_detected?.length > 0) {
      steps.push({
        action: 'investigate_anomalies',
        description: 'Investigar as anomalias detectadas',
        priority: 'high'
      });
    }

    // Próximo passo genérico
    if (steps.length === 0) {
      steps.push({
        action: 'continue_conversation',
        description: 'Fazer uma nova pergunta ou solicitar mais análises',
        priority: 'low'
      });
    }

    return steps;
  }

  /**
   * Calcula score de legibilidade
   */
  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(' ').length;
    const avgWordsPerSentence = words / sentences;

    // Score simples baseado no tamanho médio das frases
    if (avgWordsPerSentence <= 15) return 0.9;
    if (avgWordsPerSentence <= 20) return 0.7;
    if (avgWordsPerSentence <= 25) return 0.5;
    return 0.3;
  }

  /**
   * Salva interação na memória para personalização futura
   */
  private async saveInteractionToMemory(
    task: CommunicationTask,
    result: CommunicationResult,
    userId: string
  ): Promise<void> {
    try {
      await financialMemoryManager.armazenarInteracao({
        userId,
        tipo: 'conversa',
        conteudo: `Pergunta: ${task.originalMessage}\nResposta: ${result.message}`,
        resumo: `Conversação sobre ${task.responseType}`,
        metadata: {
          response_type: task.responseType,
          tone_used: result.metadata.tone_used,
          user_preferences: task.userPreferences,
          personalization_level: result.metadata.personalization_level,
          insights_provided: result.insights?.length || 0,
          suggestions_provided: result.suggestions?.length || 0
        },
        contextoFinanceiro: {
          saldo_total: task.context.patrimonio?.saldo_total,
          operacoes_executadas: Object.keys(task.previousResults).length
        }
      });
    } catch (error) {
      console.warn('Erro ao salvar interação na memória:', error);
    }
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
      canProcessDocuments: false,  // ❌ Não é responsabilidade
      canAnalyzeData: false,       // ❌ Não é responsabilidade
      canExecuteOperations: false, // ❌ Não é responsabilidade
      canValidateResults: false,   // ❌ Não é responsabilidade
      canCommunicate: true,        // ✅ Especialidade principal
      isAvailable: true,
      currentLoad: Math.min(this.communicationHistory.length * 3, 100)
    };
  }

  /**
   * Obtém estatísticas do agente
   */
  getStats(): {
    totalResponsesGenerated: number;
    averageResponseTime: number;
    averageWordCount: number;
    averageReadabilityScore: number;
    personalizedResponsesRate: number;
    specializations: Record<string, number>;
  } {
    const successful = this.communicationHistory.filter(h => h.success);

    return {
      totalResponsesGenerated: this.communicationHistory.length,
      averageResponseTime: successful.length > 0
        ? successful.reduce((sum, h) => sum + h.metadata.generationTimeMs, 0) / successful.length
        : 0,
      averageWordCount: successful.length > 0
        ? successful.reduce((sum, h) => sum + h.metadata.word_count, 0) / successful.length
        : 0,
      averageReadabilityScore: successful.length > 0
        ? successful.reduce((sum, h) => sum + h.metadata.readability_score, 0) / successful.length
        : 0,
      personalizedResponsesRate: successful.length > 0
        ? successful.filter(h => h.metadata.personalization_level > 0.5).length / successful.length
        : 0,
      specializations: this.specializations
    };
  }
}