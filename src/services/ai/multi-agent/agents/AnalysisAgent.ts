/**
 * AnalysisAgent - Especialista em Análise Financeira
 *
 * 📊 O "Analista Financeiro" da equipe - foca exclusivamente em:
 * - Análise de padrões de gastos e receitas
 * - Detecção de anomalias e tendências
 * - Insights financeiros inteligentes
 * - Comparações temporais e benchmarking
 * - Projeções e previsões
 */

import { aiContextManager } from '../../AIContextManager';
import { aiInsightGenerator } from '../../AIInsightGenerator';
import { financialMemoryManager } from '../../FinancialMemoryManager';
import type { FinancialContext, Insight } from '../../../../types/ai';

export interface AnalysisTask {
  userMessage: string;
  context: FinancialContext;
  focus: 'expenses' | 'income' | 'balances' | 'patterns' | 'trends' | 'general';
  timeframe?: {
    start: string;
    end: string;
  };
  specificCategories?: number[];
  comparisonType?: 'month_over_month' | 'year_over_year' | 'budget_vs_actual';
  previousResults?: Record<string, any>;
}

export interface AnalysisResult {
  success: boolean;
  analysisType: string;
  insights: Insight[];
  patterns: {
    spending_patterns: Array<{
      category: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      change_percentage: number;
      confidence: number;
    }>;
    temporal_patterns: Array<{
      period: string;
      observation: string;
      significance: 'high' | 'medium' | 'low';
    }>;
    anomalies: Array<{
      type: 'spending_spike' | 'unusual_category' | 'missing_income' | 'pattern_break';
      description: string;
      severity: 'critical' | 'warning' | 'info';
      suggested_action: string;
    }>;
  };
  projections: {
    next_month: {
      estimated_expenses: number;
      estimated_income: number;
      estimated_balance: number;
      confidence_level: number;
    };
    trends: Array<{
      metric: string;
      direction: 'up' | 'down' | 'stable';
      predicted_value: number;
      timeframe: string;
    }>;
  };
  recommendations: Array<{
    type: 'cost_reduction' | 'income_optimization' | 'budget_adjustment' | 'goal_setting';
    priority: 'high' | 'medium' | 'low';
    action: string;
    expected_impact: string;
  }>;
  contextualInsights: string[];
  metadata: {
    analysisTimeMs: number;
    dataPointsAnalyzed: number;
    memoryContextUsed: boolean;
    confidenceScore: number;
  };
}

export class AnalysisAgent {
  private analysisHistory: AnalysisResult[] = [];
  private specializations = {
    pattern_detection: 0.95,      // Detecção de padrões
    anomaly_detection: 0.92,      // Detecção de anomalias
    trend_analysis: 0.90,         // Análise de tendências
    projection_modeling: 0.88,    // Modelagem de projeções
    behavioral_analysis: 0.85     // Análise comportamental
  };

  /**
   * Executa análise financeira abrangente
   */
  async analyzeData(task: AnalysisTask, userId: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    console.log('📊 AnalysisAgent: Iniciando análise especializada...');

    try {
      // 1. Buscar contexto histórico relevante via RAG
      const memoryContext = await this.getRelevantMemoryContext(task.userMessage, userId);

      // 2. Análise específica baseada no foco
      const coreAnalysis = await this.performCoreAnalysis(task, userId);

      // 3. Detecção de padrões avançados
      const patterns = await this.detectAdvancedPatterns(task.context, task.focus);

      // 4. Análise de anomalias
      const anomalies = await this.detectAnomalies(task.context, userId);

      // 5. Projeções financeiras
      const projections = await this.generateProjections(task.context, patterns);

      // 6. Recomendações inteligentes
      const recommendations = await this.generateSmartRecommendations(
        patterns,
        anomalies,
        projections,
        task.context
      );

      // 7. Insights contextuais
      const contextualInsights = await this.generateContextualInsights(
        task,
        memoryContext,
        coreAnalysis
      );

      const result: AnalysisResult = {
        success: true,
        analysisType: task.focus,
        insights: coreAnalysis.insights,
        patterns,
        projections,
        recommendations,
        contextualInsights,
        metadata: {
          analysisTimeMs: Date.now() - startTime,
          dataPointsAnalyzed: this.countDataPoints(task.context),
          memoryContextUsed: memoryContext.memorias_relevantes.length > 0,
          confidenceScore: this.calculateConfidenceScore(patterns, anomalies)
        }
      };

      this.analysisHistory.push(result);
      console.log(`✅ AnalysisAgent: Análise completa em ${result.metadata.analysisTimeMs}ms`);

      return result;

    } catch (error) {
      console.error('❌ AnalysisAgent: Erro na análise:', error);

      return {
        success: false,
        analysisType: task.focus,
        insights: [],
        patterns: {
          spending_patterns: [],
          temporal_patterns: [],
          anomalies: []
        },
        projections: {
          next_month: {
            estimated_expenses: 0,
            estimated_income: 0,
            estimated_balance: 0,
            confidence_level: 0
          },
          trends: []
        },
        recommendations: [],
        contextualInsights: [`Erro na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`],
        metadata: {
          analysisTimeMs: Date.now() - startTime,
          dataPointsAnalyzed: 0,
          memoryContextUsed: false,
          confidenceScore: 0
        }
      };
    }
  }

  /**
   * Busca contexto histórico relevante
   */
  private async getRelevantMemoryContext(query: string, userId: string) {
    try {
      return await financialMemoryManager.buscarContextoRelevante(
        `Análise financeira: ${query}`,
        userId,
        3, // Top 3 memórias relevantes
        0.6 // Threshold mais baixo para análises
      );
    } catch (error) {
      console.warn('Erro ao buscar contexto de memória:', error);
      return { memorias_relevantes: [], contexto_resumido: '', confidence_score: 0, sugestoes: [] };
    }
  }

  /**
   * Executa análise principal baseada no foco
   */
  private async performCoreAnalysis(task: AnalysisTask, userId: string): Promise<{ insights: Insight[] }> {
    try {
      // Usar os insights generators existentes
      const insights = await aiInsightGenerator.generateInsights(task.context);

      // Filtrar insights baseado no foco
      const filteredInsights = this.filterInsightsByFocus(insights, task.focus);

      return { insights: filteredInsights };
    } catch (error) {
      console.warn('Erro na análise principal:', error);
      return { insights: [] };
    }
  }

  /**
   * Detecta padrões financeiros avançados
   */
  private async detectAdvancedPatterns(
    context: FinancialContext,
    focus: string
  ): Promise<AnalysisResult['patterns']> {
    const patterns: AnalysisResult['patterns'] = {
      spending_patterns: [],
      temporal_patterns: [],
      anomalies: []
    };

    try {
      // Análise de padrões de gastos por categoria
      if (context.tendencias?.categorias) {
        patterns.spending_patterns = Object.entries(context.tendencias.categorias).map(([categoria, dados]: [string, any]) => {
          const trend = dados.variacao_percentual > 10 ? 'increasing' :
                       dados.variacao_percentual < -10 ? 'decreasing' : 'stable';

          return {
            category: categoria,
            trend,
            change_percentage: dados.variacao_percentual || 0,
            confidence: Math.min(Math.abs(dados.variacao_percentual || 0) / 50, 1)
          };
        });
      }

      // Padrões temporais
      patterns.temporal_patterns = this.detectTemporalPatterns(context);

      // Anomalias básicas (delegamos detecção avançada para o método específico)
      patterns.anomalies = await this.detectBasicAnomalies(context);

    } catch (error) {
      console.warn('Erro na detecção de padrões:', error);
    }

    return patterns;
  }

  /**
   * Detecta padrões temporais
   */
  private detectTemporalPatterns(context: FinancialContext): AnalysisResult['patterns']['temporal_patterns'] {
    const patterns: AnalysisResult['patterns']['temporal_patterns'] = [];

    try {
      // Análise de sazonalidade
      const currentMonth = new Date().getMonth();
      const isEndOfYear = currentMonth >= 10; // Nov/Dez
      const isBeginningOfYear = currentMonth <= 2; // Jan/Fev/Mar

      if (isEndOfYear) {
        patterns.push({
          period: 'Fim de ano',
          observation: 'Período típico de maior consumo devido às festividades',
          significance: 'high'
        });
      }

      if (isBeginningOfYear) {
        patterns.push({
          period: 'Início de ano',
          observation: 'Período comum para novos objetivos financeiros e controle de gastos',
          significance: 'medium'
        });
      }

      // Análise do fluxo atual
      const fluxo = context.indicadores?.mes_atual?.fluxo_liquido || 0;
      if (fluxo < 0) {
        patterns.push({
          period: 'Mês atual',
          observation: 'Gastos superiores às receitas - atenção ao controle financeiro',
          significance: 'high'
        });
      } else if (fluxo > context.indicadores?.mes_atual?.receitas_mes * 0.2) {
        patterns.push({
          period: 'Mês atual',
          observation: 'Excelente capacidade de poupança - acima de 20% das receitas',
          significance: 'high'
        });
      }

    } catch (error) {
      console.warn('Erro na análise temporal:', error);
    }

    return patterns;
  }

  /**
   * Detecta anomalias básicas
   */
  private async detectBasicAnomalies(context: FinancialContext): Promise<AnalysisResult['patterns']['anomalies']> {
    const anomalies: AnalysisResult['patterns']['anomalies'] = [];

    try {
      // Detecção de gastos muito altos
      const gastoMedio = context.indicadores?.mes_atual?.despesas_mes || 0;
      const receitaTotal = context.indicadores?.mes_atual?.receitas_mes || 0;

      if (gastoMedio > receitaTotal * 1.1) {
        anomalies.push({
          type: 'spending_spike',
          description: 'Gastos 10% acima das receitas do mês',
          severity: 'critical',
          suggested_action: 'Revisar gastos urgentemente e identificar cortes possíveis'
        });
      }

      // Detecção de falta de receita
      if (receitaTotal < gastoMedio * 0.8) {
        anomalies.push({
          type: 'missing_income',
          description: 'Receitas muito baixas comparadas aos gastos',
          severity: 'warning',
          suggested_action: 'Buscar fontes adicionais de renda ou reduzir despesas'
        });
      }

      // Detecção de saldo muito baixo
      const saldoTotal = context.patrimonio?.saldo_total || 0;
      if (saldoTotal < gastoMedio * 0.5) {
        anomalies.push({
          type: 'pattern_break',
          description: 'Saldo total inferior a meio mês de gastos',
          severity: 'warning',
          suggested_action: 'Construir reserva de emergência urgentemente'
        });
      }

    } catch (error) {
      console.warn('Erro na detecção de anomalias:', error);
    }

    return anomalies;
  }

  /**
   * Detecta anomalias avançadas usando IA
   */
  private async detectAnomalies(context: FinancialContext, userId: string): Promise<void> {
    try {
      // Usar o AIInsightGenerator existente para detecção de anomalias
      await aiInsightGenerator.detectGastoAnomalies(context, userId);
      await aiInsightGenerator.detectPadraoAnomalies(context, userId);
    } catch (error) {
      console.warn('Erro na detecção avançada de anomalias:', error);
    }
  }

  /**
   * Gera projeções financeiras
   */
  private async generateProjections(
    context: FinancialContext,
    patterns: AnalysisResult['patterns']
  ): Promise<AnalysisResult['projections']> {
    try {
      const receitas = context.indicadores?.mes_atual?.receitas_mes || 0;
      const despesas = context.indicadores?.mes_atual?.despesas_mes || 0;

      // Calcular tendência baseada nos padrões
      let tendenciaGastos = 0;
      patterns.spending_patterns.forEach(pattern => {
        if (pattern.trend === 'increasing') tendenciaGastos += pattern.change_percentage;
        else if (pattern.trend === 'decreasing') tendenciaGastos -= pattern.change_percentage;
      });

      const fatorTendencia = 1 + (tendenciaGastos / 100);
      const despesasProjetadas = despesas * fatorTendencia;
      const receitasProjetadas = receitas; // Assumir receitas estáveis

      return {
        next_month: {
          estimated_expenses: Math.round(despesasProjetadas),
          estimated_income: Math.round(receitasProjetadas),
          estimated_balance: Math.round(receitasProjetadas - despesasProjetadas),
          confidence_level: Math.max(0.6, 1 - Math.abs(tendenciaGastos) / 100)
        },
        trends: [
          {
            metric: 'Gastos Mensais',
            direction: tendenciaGastos > 5 ? 'up' : tendenciaGastos < -5 ? 'down' : 'stable',
            predicted_value: despesasProjetadas,
            timeframe: 'próximo_mês'
          },
          {
            metric: 'Economia Mensal',
            direction: (receitasProjetadas - despesasProjetadas) > (receitas - despesas) ? 'up' : 'down',
            predicted_value: receitasProjetadas - despesasProjetadas,
            timeframe: 'próximo_mês'
          }
        ]
      };
    } catch (error) {
      console.warn('Erro na geração de projeções:', error);
      return {
        next_month: {
          estimated_expenses: 0,
          estimated_income: 0,
          estimated_balance: 0,
          confidence_level: 0
        },
        trends: []
      };
    }
  }

  /**
   * Gera recomendações inteligentes
   */
  private async generateSmartRecommendations(
    patterns: AnalysisResult['patterns'],
    anomalies: AnalysisResult['patterns']['anomalies'],
    projections: AnalysisResult['projections'],
    context: FinancialContext
  ): Promise<AnalysisResult['recommendations']> {
    const recommendations: AnalysisResult['recommendations'] = [];

    try {
      // Recomendações baseadas em anomalias críticas
      anomalies.forEach(anomaly => {
        if (anomaly.severity === 'critical') {
          recommendations.push({
            type: 'cost_reduction',
            priority: 'high',
            action: anomaly.suggested_action,
            expected_impact: 'Estabilização financeira imediata'
          });
        }
      });

      // Recomendações baseadas em padrões de crescimento
      const gastosEmAlta = patterns.spending_patterns.filter(p => p.trend === 'increasing' && p.change_percentage > 20);
      if (gastosEmAlta.length > 0) {
        recommendations.push({
          type: 'budget_adjustment',
          priority: 'medium',
          action: `Revisar orçamento das categorias: ${gastosEmAlta.map(g => g.category).join(', ')}`,
          expected_impact: 'Controle de gastos em categorias problemáticas'
        });
      }

      // Recomendações baseadas em projeções
      if (projections.next_month.estimated_balance < 0) {
        recommendations.push({
          type: 'income_optimization',
          priority: 'high',
          action: 'Buscar fontes adicionais de renda ou reduzir gastos significativamente',
          expected_impact: 'Evitar saldo negativo no próximo mês'
        });
      } else if (projections.next_month.estimated_balance > context.indicadores?.mes_atual?.receitas_mes * 0.3) {
        recommendations.push({
          type: 'goal_setting',
          priority: 'low',
          action: 'Considerar investir o excesso ou definir uma meta financeira',
          expected_impact: 'Maximizar retorno da boa capacidade de poupança'
        });
      }

    } catch (error) {
      console.warn('Erro na geração de recomendações:', error);
    }

    return recommendations;
  }

  /**
   * Gera insights contextuais baseados na análise
   */
  private async generateContextualInsights(
    task: AnalysisTask,
    memoryContext: any,
    coreAnalysis: any
  ): Promise<string[]> {
    const insights: string[] = [];

    try {
      // Insights baseados no contexto de memória
      if (memoryContext.memorias_relevantes.length > 0) {
        insights.push(`Encontrei ${memoryContext.memorias_relevantes.length} padrões similares no seu histórico`);
      }

      // Insights baseados no foco da análise
      switch (task.focus) {
        case 'expenses':
          insights.push('Análise focada em despesas - identificando oportunidades de economia');
          break;
        case 'income':
          insights.push('Análise focada em receitas - avaliando estabilidade e crescimento');
          break;
        case 'patterns':
          insights.push('Análise de padrões - detectando tendências comportamentais');
          break;
      }

      // Insights sobre qualidade dos dados
      const dataQuality = this.assessDataQuality(task.context);
      if (dataQuality < 0.8) {
        insights.push('Dados limitados detectados - consider anexar mais extratos para análise mais precisa');
      }

    } catch (error) {
      console.warn('Erro na geração de insights contextuais:', error);
    }

    return insights;
  }

  /**
   * Filtra insights baseado no foco da análise
   */
  private filterInsightsByFocus(insights: Insight[], focus: string): Insight[] {
    return insights.filter(insight => {
      switch (focus) {
        case 'expenses':
          return insight.categoria === 'gastos' || insight.tipo === 'alerta';
        case 'income':
          return insight.categoria === 'receitas' || insight.categoria === 'economia';
        case 'balances':
          return insight.categoria === 'saldo' || insight.categoria === 'patrimonio';
        default:
          return true; // Incluir todos para análise geral
      }
    });
  }

  /**
   * Conta pontos de dados analisados
   */
  private countDataPoints(context: FinancialContext): number {
    let count = 0;
    if (context.transacoes) count += context.transacoes.length;
    if (context.contas) count += context.contas.length;
    if (context.indicadores) count += 10; // Indicadores são múltiplos pontos
    return count;
  }

  /**
   * Avalia qualidade dos dados
   */
  private assessDataQuality(context: FinancialContext): number {
    let score = 0.5; // Base

    if (context.transacoes && context.transacoes.length > 0) score += 0.2;
    if (context.contas && context.contas.length > 0) score += 0.1;
    if (context.indicadores) score += 0.2;

    return Math.min(score, 1);
  }

  /**
   * Calcula score de confiança da análise
   */
  private calculateConfidenceScore(
    patterns: AnalysisResult['patterns'],
    anomalies: AnalysisResult['patterns']['anomalies']
  ): number {
    let score = 0.7; // Base

    // Mais padrões = mais confiança
    score += Math.min(patterns.spending_patterns.length * 0.05, 0.2);

    // Anomalias críticas reduzem confiança
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
    score -= criticalAnomalies * 0.1;

    return Math.max(Math.min(score, 1), 0);
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
      canAnalyzeData: true,        // ✅ Especialidade principal
      canExecuteOperations: false, // ❌ Não é responsabilidade
      canValidateResults: false,   // ❌ Não é responsabilidade
      canCommunicate: false,       // ❌ Não é responsabilidade
      isAvailable: true,
      currentLoad: Math.min(this.analysisHistory.length * 15, 100)
    };
  }

  /**
   * Obtém estatísticas do agente
   */
  getStats(): {
    totalAnalysesPerformed: number;
    averageConfidenceScore: number;
    averageAnalysisTime: number;
    specializations: Record<string, number>;
    successRate: number;
  } {
    const successful = this.analysisHistory.filter(h => h.success);

    return {
      totalAnalysesPerformed: this.analysisHistory.length,
      averageConfidenceScore: successful.length > 0
        ? successful.reduce((sum, h) => sum + h.metadata.confidenceScore, 0) / successful.length
        : 0,
      averageAnalysisTime: this.analysisHistory.length > 0
        ? this.analysisHistory.reduce((sum, h) => sum + h.metadata.analysisTimeMs, 0) / this.analysisHistory.length
        : 0,
      specializations: this.specializations,
      successRate: this.analysisHistory.length > 0
        ? successful.length / this.analysisHistory.length
        : 1
    };
  }
}