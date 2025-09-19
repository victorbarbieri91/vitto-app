import type { FinancialContext } from '../../types/ai';

/**
 * AIPredictiveAlerts
 * 
 * Sistema de alertas preditivos que usa ML para antecipar problemas
 * e oportunidades financeiras
 */

export interface PredictiveAlert {
  id: string;
  type: 'warning' | 'opportunity' | 'critical' | 'info';
  category: 'budget_overflow' | 'goal_delay' | 'cash_flow' | 'anomaly' | 'opportunity';
  title: string;
  message: string;
  prediction: string;
  confidence: number; // 0-1
  timeframe: 'days' | 'weeks' | 'months';
  estimatedDays: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  suggestedActions: string[];
  data?: any;
  createdAt: Date;
}

export class AIPredictiveAlerts {
  private static instance: AIPredictiveAlerts;

  static getInstance(): AIPredictiveAlerts {
    if (!AIPredictiveAlerts.instance) {
      AIPredictiveAlerts.instance = new AIPredictiveAlerts();
    }
    return AIPredictiveAlerts.instance;
  }

  /**
   * Gera todos os alertas preditivos para um usuário
   */
  async generatePredictiveAlerts(context: FinancialContext): Promise<PredictiveAlert[]> {
    console.log('🔮 Gerando alertas preditivos...');

    const alerts: PredictiveAlert[] = [];

    // Analisar diferentes aspectos financeiros
    const cashFlowAlerts = await this.analyzeCashFlowPatterns(context);
    const budgetAlerts = await this.analyzeBudgetTrends(context);
    const goalAlerts = await this.analyzeGoalProgress(context);
    const anomalyAlerts = await this.detectAnomalies(context);
    const opportunityAlerts = await this.identifyOpportunities(context);

    alerts.push(
      ...cashFlowAlerts,
      ...budgetAlerts,
      ...goalAlerts,
      ...anomalyAlerts,
      ...opportunityAlerts
    );

    // Ordenar por prioridade e retornar top 10
    return alerts
      .sort((a, b) => this.getAlertPriority(b) - this.getAlertPriority(a))
      .slice(0, 10);
  }

  /**
   * Analisa padrões de fluxo de caixa
   */
  private async analyzeCashFlowPatterns(context: FinancialContext): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    const { patrimonio, indicadores } = context;

    // Predição de saldo negativo
    if (patrimonio.saldo_total < 1000 && indicadores.mes_atual.fluxo_liquido < 0) {
      const daysToZero = this.predictDaysToZeroBalance(patrimonio.saldo_total, indicadores.mes_atual.fluxo_liquido);
      
      if (daysToZero <= 30) {
        alerts.push({
          id: `cash_flow_${Date.now()}_1`,
          type: daysToZero <= 7 ? 'critical' : 'warning',
          category: 'cash_flow',
          title: 'Risco de Saldo Negativo',
          message: `Com o padrão atual de gastos, seu saldo pode chegar a zero em aproximadamente ${daysToZero} dias.`,
          prediction: `Saldo zero previsto para ${this.formatFutureDate(daysToZero)}`,
          confidence: 0.85,
          timeframe: 'days',
          estimatedDays: daysToZero,
          impact: daysToZero <= 7 ? 'critical' : 'high',
          actionable: true,
          suggestedActions: [
            'Reduza gastos não essenciais imediatamente',
            'Procure fontes de renda extra',
            'Negocie prazos de pagamentos pendentes'
          ],
          data: { currentBalance: patrimonio.saldo_total, dailyBurn: Math.abs(indicadores.mes_atual.fluxo_liquido) / 30 },
          createdAt: new Date()
        });
      }
    }

    // Predição de recuperação financeira
    if (patrimonio.saldo_total < 0 && indicadores.mes_atual.fluxo_liquido > 0) {
      const daysToPositive = Math.abs(patrimonio.saldo_total) / (indicadores.mes_atual.fluxo_liquido / 30);
      
      alerts.push({
        id: `cash_flow_${Date.now()}_2`,
        type: 'opportunity',
        category: 'cash_flow',
        title: 'Recuperação Financeira em Andamento',
        message: `Mantendo o ritmo atual, você sairá do vermelho em aproximadamente ${Math.ceil(daysToPositive)} dias.`,
        prediction: `Saldo positivo previsto para ${this.formatFutureDate(daysToPositive)}`,
        confidence: 0.8,
        timeframe: 'days',
        estimatedDays: Math.ceil(daysToPositive),
        impact: 'medium',
        actionable: true,
        suggestedActions: [
          'Mantenha a disciplina nos gastos',
          'Considere acelerar receitas se possível',
          'Evite gastos desnecessários neste período'
        ],
        createdAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Analisa tendências de orçamentos
   */
  private async analyzeBudgetTrends(context: FinancialContext): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    
    // TODO: Buscar dados reais de orçamentos
    // Por enquanto, simulação baseada no contexto
    
    const monthlyExpenses = context.indicadores.mes_atual.despesas_mes;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    
    // Simular orçamento total baseado nas despesas
    const estimatedMonthlyBudget = monthlyExpenses * 1.2; // Assumir que orçamento é 20% maior que gastos
    const dailyBudgetBurn = monthlyExpenses / currentDay;
    const projectedMonthEnd = dailyBudgetBurn * daysInMonth;

    if (projectedMonthEnd > estimatedMonthlyBudget) {
      const exceededAmount = projectedMonthEnd - estimatedMonthlyBudget;
      const daysToExceed = Math.floor((estimatedMonthlyBudget - monthlyExpenses) / dailyBudgetBurn);
      
      alerts.push({
        id: `budget_${Date.now()}_1`,
        type: 'warning',
        category: 'budget_overflow',
        title: 'Orçamento Mensal em Risco',
        message: `No ritmo atual, você pode exceder seu orçamento em ${this.formatCurrency(exceededAmount)} este mês.`,
        prediction: `Limite de orçamento será ultrapassado em ${daysToExceed} dias`,
        confidence: 0.75,
        timeframe: 'days',
        estimatedDays: daysToExceed,
        impact: 'medium',
        actionable: true,
        suggestedActions: [
          'Revise gastos nas categorias com maior consumo',
          'Adie compras não essenciais',
          'Monitore gastos diários mais de perto'
        ],
        data: { 
          currentSpent: monthlyExpenses, 
          budget: estimatedMonthlyBudget,
          projected: projectedMonthEnd 
        },
        createdAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Analisa progresso de metas
   */
  private async analyzeGoalProgress(context: FinancialContext): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    
    // TODO: Implementar análise real de metas quando dados estiverem disponíveis
    const savings = context.indicadores.mes_atual.fluxo_liquido;
    
    if (savings > 0) {
      // Simular meta de R$ 10.000 em 12 meses
      const goalAmount = 10000;
      const timeframeMonths = 12;
      const monthlySavingsNeeded = goalAmount / timeframeMonths;
      
      if (savings < monthlySavingsNeeded) {
        const shortfall = monthlySavingsNeeded - savings;
        const delayMonths = (goalAmount - (savings * timeframeMonths)) / savings;
        
        alerts.push({
          id: `goal_${Date.now()}_1`,
          type: 'warning',
          category: 'goal_delay',
          title: 'Meta de Poupança em Atraso',
          message: `Para atingir sua meta de ${this.formatCurrency(goalAmount)}, você precisa poupar ${this.formatCurrency(shortfall)} a mais por mês.`,
          prediction: `Meta será atingida com ${Math.ceil(delayMonths)} meses de atraso`,
          confidence: 0.7,
          timeframe: 'months',
          estimatedDays: Math.ceil(delayMonths) * 30,
          impact: 'medium',
          actionable: true,
          suggestedActions: [
            'Identifique oportunidades de economia adicional',
            'Considere fontes de renda extra',
            'Revise a meta para um valor mais realista'
          ],
          data: { 
            goalAmount, 
            currentSavings: savings, 
            neededSavings: monthlySavingsNeeded 
          },
          createdAt: new Date()
        });
      }
    }

    return alerts;
  }

  /**
   * Detecta anomalias nos padrões financeiros
   */
  private async detectAnomalies(context: FinancialContext): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    
    // Anomalia em despesas (muito acima do normal)
    const currentExpenses = context.indicadores.mes_atual.despesas_mes;
    // Simular histórico (em produção, viria do banco)
    const averageExpenses = currentExpenses * 0.8; // Assumir que está 25% acima da média
    
    if (currentExpenses > averageExpenses * 1.5) {
      alerts.push({
        id: `anomaly_${Date.now()}_1`,
        type: 'warning',
        category: 'anomaly',
        title: 'Gastos Anômalos Detectados',
        message: `Seus gastos este mês estão ${Math.round(((currentExpenses / averageExpenses) - 1) * 100)}% acima da média histórica.`,
        prediction: 'Padrão pode impactar metas de poupança',
        confidence: 0.9,
        timeframe: 'weeks',
        estimatedDays: 14,
        impact: 'medium',
        actionable: true,
        suggestedActions: [
          'Revise transações recentes em busca de gastos incomuns',
          'Identifique categorias com maior aumento',
          'Avalie se foram gastos excepcionais ou mudança de padrão'
        ],
        data: { 
          currentExpenses, 
          averageExpenses, 
          anomalyPercentage: ((currentExpenses / averageExpenses) - 1) * 100 
        },
        createdAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Identifica oportunidades financeiras
   */
  private async identifyOpportunities(context: FinancialContext): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];
    
    const surplus = context.indicadores.mes_atual.fluxo_liquido;
    
    // Oportunidade de investimento
    if (surplus > 500 && context.patrimonio.saldo_total > 2000) {
      alerts.push({
        id: `opportunity_${Date.now()}_1`,
        type: 'opportunity',
        category: 'opportunity',
        title: 'Oportunidade de Investimento',
        message: `Com sua sobra mensal de ${this.formatCurrency(surplus)}, você pode investir e fazer o dinheiro render.`,
        prediction: `Rendimento potencial de ${this.formatCurrency(surplus * 0.01)} por mês em renda fixa`,
        confidence: 0.8,
        timeframe: 'months',
        estimatedDays: 30,
        impact: 'medium',
        actionable: true,
        suggestedActions: [
          'Considere investir em CDB ou Tesouro Direto',
          'Mantenha uma reserva de emergência antes de investir',
          'Busque orientação sobre opções de investimento'
        ],
        data: { 
          surplus, 
          balance: context.patrimonio.saldo_total,
          potentialReturn: surplus * 0.01 
        },
        createdAt: new Date()
      });
    }

    // Oportunidade de otimização
    if (context.indicadores.saude_financeira.score < 70 && surplus > 0) {
      alerts.push({
        id: `opportunity_${Date.now()}_2`,
        type: 'info',
        category: 'opportunity',
        title: 'Oportunidade de Melhoria',
        message: `Seu score de ${context.indicadores.saude_financeira.score}/100 pode ser melhorado com pequenos ajustes.`,
        prediction: 'Score pode chegar a 80+ em 2-3 meses',
        confidence: 0.75,
        timeframe: 'months',
        estimatedDays: 75,
        impact: 'low',
        actionable: true,
        suggestedActions: [
          'Aumente sua reserva de emergência',
          'Diversifique suas fontes de renda',
          'Estabeleça metas financeiras claras'
        ],
        createdAt: new Date()
      });
    }

    return alerts;
  }

  // Métodos auxiliares

  private predictDaysToZeroBalance(currentBalance: number, monthlyFlow: number): number {
    if (monthlyFlow >= 0) return Infinity; // Não vai a zero se fluxo é positivo
    
    const dailyBurn = Math.abs(monthlyFlow) / 30;
    return Math.floor(currentBalance / dailyBurn);
  }

  private getAlertPriority(alert: PredictiveAlert): number {
    let priority = 0;
    
    // Tipo do alerta
    switch (alert.type) {
      case 'critical': priority += 100; break;
      case 'warning': priority += 70; break;
      case 'opportunity': priority += 50; break;
      case 'info': priority += 30; break;
    }
    
    // Impacto
    switch (alert.impact) {
      case 'critical': priority += 50; break;
      case 'high': priority += 35; break;
      case 'medium': priority += 20; break;
      case 'low': priority += 10; break;
    }
    
    // Confiança
    priority += alert.confidence * 20;
    
    // Urgência (quanto mais próximo, maior prioridade)
    if (alert.estimatedDays <= 7) priority += 30;
    else if (alert.estimatedDays <= 30) priority += 20;
    else if (alert.estimatedDays <= 90) priority += 10;
    
    return priority;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private formatFutureDate(daysFromNow: number): string {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysFromNow);
    return new Intl.DateTimeFormat('pt-BR').format(futureDate);
  }

  /**
   * Gera alerta personalizado usando OpenAI
   */
  async generateCustomAlert(
    context: FinancialContext,
    pattern: string,
    data: any
  ): Promise<PredictiveAlert | null> {
    if (!this.hasOpenAI()) {
      return null;
    }

    try {
      const prompt = `Baseado nos dados financeiros, gere um alerta preditivo personalizado:

PADRÃO DETECTADO: ${pattern}
DADOS: ${JSON.stringify(data, null, 2)}
CONTEXTO FINANCEIRO: 
- Saldo: ${this.formatCurrency(context.patrimonio.saldo_total)}
- Fluxo Mensal: ${this.formatCurrency(context.indicadores.mes_atual.fluxo_liquido)}

Retorne JSON com:
{
  "type": "warning|opportunity|critical|info",
  "title": "Título do Alerta",
  "message": "Mensagem explicativa",
  "prediction": "Predição específica",
  "confidence": 0.0-1.0,
  "estimatedDays": número_de_dias,
  "impact": "low|medium|high|critical",
  "suggestedActions": ["ação1", "ação2", "ação3"]
}`;

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
          max_tokens: 500,
          temperature: 0.3,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const alertData = JSON.parse(aiResponse.choices[0]?.message?.content || '{}');

      return {
        id: `custom_${Date.now()}`,
        category: 'anomaly',
        timeframe: 'days',
        actionable: true,
        data,
        createdAt: new Date(),
        ...alertData
      } as PredictiveAlert;

    } catch (error) {
      console.warn('Erro ao gerar alerta personalizado:', error);
      return null;
    }
  }

  private hasOpenAI(): boolean {
    return !!import.meta.env.VITE_OPENAI_API_KEY;
  }
}

export const aiPredictiveAlerts = AIPredictiveAlerts.getInstance(); 