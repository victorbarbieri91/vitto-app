import type { FinancialContext, Insight } from '../../types/ai';

/**
 * AIReportGenerator
 * 
 * Sistema de geração de relatórios financeiros narrativos usando IA
 * Cria análises personalizadas e insights detalhados
 */

export interface FinancialReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'custom' | 'goal_analysis' | 'budget_review';
  title: string;
  summary: string;
  narrative: string;
  insights: Insight[];
  recommendations: string[];
  visualData?: {
    charts: any[];
    metrics: any[];
  };
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
}

export class AIReportGenerator {
  private static instance: AIReportGenerator;

  static getInstance(): AIReportGenerator {
    if (!AIReportGenerator.instance) {
      AIReportGenerator.instance = new AIReportGenerator();
    }
    return AIReportGenerator.instance;
  }

  /**
   * Gera relatório mensal completo
   */
  async generateMonthlyReport(
    context: FinancialContext,
    month: number,
    year: number
  ): Promise<FinancialReport> {
    console.log('📊 Gerando relatório mensal...');

    const period = {
      start: new Date(year, month - 1, 1),
      end: new Date(year, month, 0)
    };

    // Usar OpenAI para gerar narrativa personalizada
    const narrative = await this.generateNarrativeWithAI(context, 'monthly', period);
    
    // Gerar insights específicos do período
    const insights = await this.generatePeriodInsights(context, period);
    
    // Criar recomendações baseadas na análise
    const recommendations = await this.generateSmartRecommendations(context, insights);

    return {
      id: `monthly_${year}_${month}_${Date.now()}`,
      type: 'monthly',
      title: `Relatório Financeiro - ${this.formatMonthYear(month, year)}`,
      summary: this.generateSummary(context, 'monthly'),
      narrative,
      insights,
      recommendations,
      generatedAt: new Date(),
      period
    };
  }

  /**
   * Gera relatório de análise de metas
   */
  async generateGoalAnalysisReport(
    context: FinancialContext,
    goalId?: string
  ): Promise<FinancialReport> {
    console.log('🎯 Gerando relatório de análise de metas...');

    const period = {
      start: new Date(new Date().getFullYear(), 0, 1), // Início do ano
      end: new Date()
    };

    const narrative = await this.generateGoalNarrativeWithAI(context, goalId);
    const insights = await this.generateGoalInsights(context, goalId);
    const recommendations = await this.generateGoalRecommendations(context, goalId);

    return {
      id: `goal_analysis_${goalId || 'all'}_${Date.now()}`,
      type: 'goal_analysis',
      title: goalId ? 'Análise da Meta Específica' : 'Análise Completa de Metas',
      summary: this.generateGoalSummary(context, goalId),
      narrative,
      insights,
      recommendations,
      generatedAt: new Date(),
      period
    };
  }

  /**
   * Gera relatório de revisão de orçamentos
   */
  async generateBudgetReviewReport(
    context: FinancialContext,
    period: { start: Date; end: Date }
  ): Promise<FinancialReport> {
    console.log('📈 Gerando relatório de revisão de orçamentos...');

    const narrative = await this.generateBudgetNarrativeWithAI(context, period);
    const insights = await this.generateBudgetInsights(context, period);
    const recommendations = await this.generateBudgetRecommendations(context);

    return {
      id: `budget_review_${Date.now()}`,
      type: 'budget_review',
      title: 'Revisão de Orçamentos',
      summary: this.generateBudgetSummary(context),
      narrative,
      insights,
      recommendations,
      generatedAt: new Date(),
      period
    };
  }

  /**
   * Gera narrativa usando OpenAI
   */
  private async generateNarrativeWithAI(
    context: FinancialContext,
    reportType: string,
    period: { start: Date; end: Date }
  ): Promise<string> {
    if (!this.hasOpenAI()) {
      return this.generateFallbackNarrative(context, reportType);
    }

    try {
      const prompt = this.buildNarrativePrompt(context, reportType, period);
      
      const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || this.generateFallbackNarrative(context, reportType);

    } catch (error) {
      console.warn('Erro ao gerar narrativa com IA, usando fallback:', error);
      return this.generateFallbackNarrative(context, reportType);
    }
  }

  /**
   * Constrói prompt para narrativa
   */
  private buildNarrativePrompt(
    context: FinancialContext,
    reportType: string,
    period: { start: Date; end: Date }
  ): string {
    const { usuario, patrimonio, indicadores } = context;

    return `Você é um consultor financeiro experiente. Crie uma análise narrativa personalizada para ${usuario.nome}.

DADOS FINANCEIROS ATUAIS:
- Saldo Total: ${this.formatCurrency(patrimonio.saldo_total)}
- Receitas do Mês: ${this.formatCurrency(indicadores.mes_atual.receitas_mes)}
- Despesas do Mês: ${this.formatCurrency(indicadores.mes_atual.despesas_mes)}
- Fluxo Líquido: ${this.formatCurrency(indicadores.mes_atual.fluxo_liquido)}
- Score de Saúde: ${indicadores.saude_financeira.score}/100

PERÍODO DE ANÁLISE: ${this.formatDate(period.start)} a ${this.formatDate(period.end)}

INSTRUÇÕES:
1. Escreva em tom profissional mas amigável
2. Use linguagem brasileira natural
3. Destaque pontos positivos e áreas de melhoria
4. Inclua dados específicos nas observações
5. Mantenha entre 3-4 parágrafos
6. Seja motivador e construtivo

Crie uma análise ${reportType === 'monthly' ? 'mensal' : 'geral'} completa focando nos aspectos mais importantes da situação financeira de ${usuario.nome}.`;
  }

  /**
   * Gera narrativa de fallback
   */
  private generateFallbackNarrative(context: FinancialContext, reportType: string): string {
    const { usuario, patrimonio, indicadores } = context;
    const fluxo = indicadores.mes_atual.fluxo_liquido;
    const score = indicadores.saude_financeira.score;

    let narrative = `Olá ${usuario.nome}! Aqui está sua análise financeira ${reportType === 'monthly' ? 'mensal' : 'geral'}.\n\n`;

    // Análise do saldo
    if (patrimonio.saldo_total > 5000) {
      narrative += `🎉 Excelente! Você mantém um patrimônio sólido de ${this.formatCurrency(patrimonio.saldo_total)}, demonstrando boa disciplina financeira. `;
    } else if (patrimonio.saldo_total > 1000) {
      narrative += `👍 Você possui um saldo positivo de ${this.formatCurrency(patrimonio.saldo_total)}, o que é um bom início para construir sua reserva. `;
    } else {
      narrative += `⚠️ Seu saldo atual de ${this.formatCurrency(patrimonio.saldo_total)} indica a necessidade de focar na construção de uma reserva de emergência. `;
    }

    // Análise do fluxo
    if (fluxo > 0) {
      narrative += `Este mês você conseguiu economizar ${this.formatCurrency(fluxo)}, mantendo suas despesas sob controle.\n\n`;
    } else if (fluxo < 0) {
      narrative += `Este mês você gastou ${this.formatCurrency(Math.abs(fluxo))} a mais do que recebeu, indicando a necessidade de revisar seus gastos.\n\n`;
    } else {
      narrative += `Suas receitas e despesas estão equilibradas este mês.\n\n`;
    }

    // Análise do score de saúde
    if (score >= 80) {
      narrative += `💪 Seu score de saúde financeira de ${score}/100 demonstra excelente gestão. Continue assim!`;
    } else if (score >= 60) {
      narrative += `📈 Com score de ${score}/100, você está no caminho certo, mas há espaço para melhorias.`;
    } else {
      narrative += `🎯 Seu score de ${score}/100 indica que é hora de focar em melhorar sua saúde financeira.`;
    }

    return narrative;
  }

  /**
   * Gera narrativa específica para metas
   */
  private async generateGoalNarrativeWithAI(context: FinancialContext, goalId?: string): Promise<string> {
    // TODO: Implementar busca de dados específicos de metas
    return `Análise detalhada do progresso das suas metas financeiras será implementada aqui.`;
  }

  /**
   * Gera narrativa específica para orçamentos
   */
  private async generateBudgetNarrativeWithAI(
    context: FinancialContext, 
    period: { start: Date; end: Date }
  ): Promise<string> {
    // TODO: Implementar busca de dados específicos de orçamentos
    return `Análise detalhada do desempenho dos seus orçamentos será implementada aqui.`;
  }

  /**
   * Gera insights do período
   */
  private async generatePeriodInsights(
    context: FinancialContext,
    period: { start: Date; end: Date }
  ): Promise<Insight[]> {
    const insights: Insight[] = [];
    const { indicadores, patrimonio } = context;

    // Insight sobre fluxo de caixa
    if (indicadores.mes_atual.fluxo_liquido > 0) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        tipo: 'economia',
        titulo: 'Fluxo Positivo',
        descricao: `Você economizou ${this.formatCurrency(indicadores.mes_atual.fluxo_liquido)} neste período.`,
        prioridade: 'alta',
        acao: 'Continue mantendo esse padrão',
        categoria: 'fluxo_caixa',
        confianca: 0.9
      });
    }

    // Insight sobre saúde financeira
    if (indicadores.saude_financeira.score >= 80) {
      insights.push({
        id: `insight_${Date.now()}_2`,
        tipo: 'parabens',
        titulo: 'Excelente Saúde Financeira',
        descricao: `Seu score de ${indicadores.saude_financeira.score}/100 está excelente!`,
        prioridade: 'media',
        acao: null,
        categoria: 'saude_financeira',
        confianca: 0.95
      });
    }

    return insights;
  }

  /**
   * Gera recomendações inteligentes
   */
  private async generateSmartRecommendations(
    context: FinancialContext,
    insights: Insight[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    const { patrimonio, indicadores } = context;

    // Recomendações baseadas no saldo
    if (patrimonio.saldo_total < 1000) {
      recommendations.push('Priorize a criação de uma reserva de emergência de pelo menos R$ 1.000');
    }

    // Recomendações baseadas no fluxo
    if (indicadores.mes_atual.fluxo_liquido > 500) {
      recommendations.push('Com sua sobra mensal, considere investir em renda fixa para fazer o dinheiro render');
    }

    // Recomendações baseadas nos insights
    insights.forEach(insight => {
      if (insight.categoria === 'gastos' && insight.tipo === 'alerta') {
        recommendations.push('Revise seus gastos na categoria que mais impacta seu orçamento');
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Continue mantendo o controle das suas finanças e acompanhando seus indicadores');
    }

    return recommendations.slice(0, 5); // Máximo 5 recomendações
  }

  // Métodos auxiliares

  private generateSummary(context: FinancialContext, type: string): string {
    const { patrimonio, indicadores } = context;
    return `Saldo: ${this.formatCurrency(patrimonio.saldo_total)} | Fluxo: ${this.formatCurrency(indicadores.mes_atual.fluxo_liquido)} | Score: ${indicadores.saude_financeira.score}/100`;
  }

  private generateGoalSummary(context: FinancialContext, goalId?: string): string {
    return 'Resumo das metas em desenvolvimento...';
  }

  private generateBudgetSummary(context: FinancialContext): string {
    return 'Resumo dos orçamentos em desenvolvimento...';
  }

  private async generateGoalInsights(context: FinancialContext, goalId?: string): Promise<Insight[]> {
    return []; // TODO: Implementar
  }

  private async generateGoalRecommendations(context: FinancialContext, goalId?: string): Promise<string[]> {
    return ['Análise de metas será implementada em breve'];
  }

  private async generateBudgetInsights(context: FinancialContext, period: { start: Date; end: Date }): Promise<Insight[]> {
    return []; // TODO: Implementar
  }

  private async generateBudgetRecommendations(context: FinancialContext): Promise<string[]> {
    return ['Análise de orçamentos será implementada em breve'];
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  private formatMonthYear(month: number, year: number): string {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[month - 1]} ${year}`;
  }

  private hasOpenAI(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }
}

export const aiReportGenerator = AIReportGenerator.getInstance(); 