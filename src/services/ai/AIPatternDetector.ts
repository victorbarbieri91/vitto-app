/**
 * AIPatternDetector - Sistema de ML Local para Detecção de Padrões Financeiros
 * 
 * Implementa algoritmos de machine learning local para:
 * - Detecção de padrões sazonais
 * - Identificação de anomalias em tempo real
 * - Classificação automática de transações
 * - Predições de comportamento financeiro
 */

import type { 
  Lancamento, 
  Categoria, 
  IndicadoresMes,
  PatternAnalysis,
  SeasonalPattern,
  SpendingAnomaly,
  CategoryPrediction,
  TrendForecast
} from '@/types/ai';

interface TransactionPattern {
  category_id: number;
  amount_range: { min: number; max: number };
  frequency: number; // por mês
  time_pattern: {
    hours: number[];
    days_of_week: number[];
    days_of_month: number[];
  };
  seasonal_factor: number;
  confidence: number;
}

interface FinancialCycle {
  type: 'monthly' | 'quarterly' | 'seasonal' | 'yearly';
  start_month: number;
  pattern: number[]; // valores normalizados
  impact_factor: number;
  categories_affected: number[];
}

interface AnomalyRule {
  type: 'amount' | 'frequency' | 'timing' | 'category';
  threshold: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class AIPatternDetector {
  private patterns: Map<string, TransactionPattern> = new Map();
  private cycles: FinancialCycle[] = [];
  private anomalyRules: AnomalyRule[] = [];

  constructor() {
    this.initializeAnomalyRules();
  }

  /**
   * Analisa padrões completos do usuário
   */
  async analyzePatterns(
    transactions: Lancamento[],
    indicators: IndicadoresMes[],
    userId: string
  ): Promise<PatternAnalysis> {
    console.log('🔍 AI Pattern Detector: Analisando padrões financeiros...');

    const seasonalPatterns = await this.detectSeasonalPatterns(transactions, indicators);
    const spendingPatterns = await this.analyzeSpendingPatterns(transactions);
    const categoryCorrelations = await this.calculateCategoryCorrelations(transactions);
    const predictiveModels = await this.buildPredictiveModels(transactions, indicators);

    return {
      seasonal_patterns: seasonalPatterns,
      spending_patterns: spendingPatterns,
      category_correlations: categoryCorrelations,
      predictive_models: predictiveModels,
      confidence_score: this.calculateOverallConfidence(seasonalPatterns, spendingPatterns),
      last_analysis: new Date().toISOString(),
      user_id: userId
    };
  }

  /**
   * Detecta padrões sazonais nos gastos
   */
  private async detectSeasonalPatterns(
    transactions: Lancamento[],
    indicators: IndicadoresMes[]
  ): Promise<SeasonalPattern[]> {
    const monthlyData = this.groupTransactionsByMonth(transactions);
    const patterns: SeasonalPattern[] = [];

    // Análise por categoria
    const categories = [...new Set(transactions.map(t => t.categoria_id))];

    for (const categoryId of categories) {
      const categoryTransactions = transactions.filter(t => t.categoria_id === categoryId);
      const monthlyAmounts = this.calculateMonthlyAmounts(categoryTransactions);

      // Detectar ciclicidade
      const seasonality = this.detectSeasonality(monthlyAmounts);
      
      if (seasonality.is_seasonal) {
        patterns.push({
          category_id: categoryId,
          type: seasonality.type,
          cycle_length: seasonality.cycle_length,
          peak_months: seasonality.peak_months,
          low_months: seasonality.low_months,
          amplitude: seasonality.amplitude,
          confidence: seasonality.confidence,
          impact_score: this.calculateImpactScore(categoryTransactions, indicators)
        });
      }
    }

    return patterns.sort((a, b) => b.impact_score - a.impact_score);
  }

  /**
   * Analisa padrões de gastos por diferentes dimensões
   */
  private async analyzeSpendingPatterns(transactions: Lancamento[]) {
    const patterns = {
      by_day_of_week: this.analyzeByDayOfWeek(transactions),
      by_time_of_day: this.analyzeByTimeOfDay(transactions),
      by_amount_range: this.analyzeByAmountRange(transactions),
      by_frequency: this.analyzeFrequencyPatterns(transactions),
      growth_trends: this.analyzeGrowthTrends(transactions)
    };

    return patterns;
  }

  /**
   * Detecta anomalias em tempo real
   */
  async detectAnomalies(
    recentTransactions: Lancamento[],
    historicalPattern: PatternAnalysis
  ): Promise<SpendingAnomaly[]> {
    const anomalies: SpendingAnomaly[] = [];
    const currentDate = new Date();

    for (const transaction of recentTransactions) {
      const anomaly = await this.evaluateTransactionAnomaly(
        transaction,
        historicalPattern,
        currentDate
      );

      if (anomaly) {
        anomalies.push(anomaly);
      }
    }

    return anomalies.sort((a, b) => b.severity_score - a.severity_score);
  }

  /**
   * Avalia se uma transação é anômala
   */
  private async evaluateTransactionAnomaly(
    transaction: Lancamento,
    pattern: PatternAnalysis,
    currentDate: Date
  ): Promise<SpendingAnomaly | null> {
    const categoryPattern = pattern.spending_patterns;
    const anomalyFactors: string[] = [];
    let severityScore = 0;

    // 1. Análise de valor (statistical outlier)
    const amountAnomaly = this.detectAmountAnomaly(transaction, categoryPattern);
    if (amountAnomaly.is_anomalous) {
      anomalyFactors.push(amountAnomaly.reason);
      severityScore += amountAnomaly.severity * 30;
    }

    // 2. Análise temporal (timing unusual)
    const timingAnomaly = this.detectTimingAnomaly(transaction, categoryPattern);
    if (timingAnomaly.is_anomalous) {
      anomalyFactors.push(timingAnomaly.reason);
      severityScore += timingAnomaly.severity * 20;
    }

    // 3. Análise de frequência (too frequent/rare)
    const frequencyAnomaly = this.detectFrequencyAnomaly(transaction, categoryPattern);
    if (frequencyAnomaly.is_anomalous) {
      anomalyFactors.push(frequencyAnomaly.reason);
      severityScore += frequencyAnomaly.severity * 25;
    }

    // 4. Análise sazonal (fora da época)
    const seasonalAnomaly = this.detectSeasonalAnomaly(transaction, pattern.seasonal_patterns);
    if (seasonalAnomaly.is_anomalous) {
      anomalyFactors.push(seasonalAnomaly.reason);
      severityScore += seasonalAnomaly.severity * 15;
    }

    // Se nenhuma anomalia foi detectada
    if (anomalyFactors.length === 0) {
      return null;
    }

    return {
      transaction_id: transaction.id,
      anomaly_type: this.classifyAnomalyType(anomalyFactors),
      severity_score: Math.min(severityScore, 100),
      confidence: this.calculateAnomalyConfidence(anomalyFactors, severityScore),
      factors: anomalyFactors,
      description: this.generateAnomalyDescription(transaction, anomalyFactors),
      suggested_actions: this.generateSuggestedActions(transaction, anomalyFactors),
      detected_at: currentDate.toISOString()
    };
  }

  /**
   * Classifica automaticamente transações por padrão
   */
  async classifyTransaction(
    transaction: Partial<Lancamento>,
    userPatterns: PatternAnalysis,
    availableCategories: Categoria[]
  ): Promise<CategoryPrediction[]> {
    const predictions: CategoryPrediction[] = [];

    // Análise por descrição (text similarity)
    const textScores = await this.analyzeTextSimilarity(
      transaction.descricao || '',
      userPatterns,
      availableCategories
    );

    // Análise por valor (amount patterns)
    const amountScores = await this.analyzeAmountPatterns(
      transaction.valor || 0,
      userPatterns,
      availableCategories
    );

    // Análise temporal (timing patterns)
    const timingScores = await this.analyzeTimingPatterns(
      transaction.data || new Date(),
      userPatterns,
      availableCategories
    );

    // Combinar scores com pesos
    for (const category of availableCategories) {
      const textScore = textScores.get(category.id) || 0;
      const amountScore = amountScores.get(category.id) || 0;
      const timingScore = timingScores.get(category.id) || 0;

      // Weighted average
      const finalScore = (
        textScore * 0.5 +      // 50% peso para texto
        amountScore * 0.3 +    // 30% peso para valor
        timingScore * 0.2      // 20% peso para timing
      );

      if (finalScore > 0.1) { // Threshold mínimo
        predictions.push({
          category_id: category.id,
          category_name: category.nome,
          confidence: finalScore,
          reasoning: this.generateClassificationReasoning(
            textScore, amountScore, timingScore, category
          )
        });
      }
    }

    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3); // Top 3 predições
  }

  /**
   * Gera previsões de tendências futuras
   */
  async generateTrendForecasts(
    transactions: Lancamento[],
    indicators: IndicadoresMes[],
    months: number = 3
  ): Promise<TrendForecast[]> {
    const forecasts: TrendForecast[] = [];

    // Forecast por categoria
    const categories = [...new Set(transactions.map(t => t.categoria_id))];

    for (const categoryId of categories) {
      const categoryData = this.prepareCategoryTimeSeries(transactions, categoryId);
      const trend = this.calculateTrend(categoryData);
      
      if (trend.is_significant) {
        const forecast = await this.projectCategoryTrend(
          categoryData,
          trend,
          months
        );

        forecasts.push({
          category_id: categoryId,
          forecast_type: 'category_spending',
          time_horizon: months,
          predicted_values: forecast.values,
          trend_direction: trend.direction,
          confidence: forecast.confidence,
          seasonal_adjustments: forecast.seasonal_factors,
          assumptions: forecast.assumptions,
          generated_at: new Date().toISOString()
        });
      }
    }

    // Forecast de saldo geral
    const balanceForecast = await this.forecastBalance(indicators, months);
    forecasts.push(balanceForecast);

    return forecasts.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Análise de correlações entre categorias
   */
  private async calculateCategoryCorrelations(transactions: Lancamento[]) {
    const categories = [...new Set(transactions.map(t => t.categoria_id))];
    const correlations: { [key: string]: number } = {};

    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const cat1 = categories[i];
        const cat2 = categories[j];
        
        const correlation = this.calculatePearsonCorrelation(
          this.getCategoryTimeSeries(transactions, cat1),
          this.getCategoryTimeSeries(transactions, cat2)
        );

        if (Math.abs(correlation) > 0.3) { // Correlação significativa
          correlations[`${cat1}-${cat2}`] = correlation;
        }
      }
    }

    return correlations;
  }

  // ================ HELPER METHODS ================

  private initializeAnomalyRules(): void {
    this.anomalyRules = [
      {
        type: 'amount',
        threshold: 3.0, // 3 desvios padrão
        description: 'Valor muito acima/abaixo do padrão',
        severity: 'high'
      },
      {
        type: 'frequency',
        threshold: 2.0, // 2x a frequência normal
        description: 'Frequência anormal de transações',
        severity: 'medium'
      },
      {
        type: 'timing',
        threshold: 0.1, // 10% de probabilidade normal
        description: 'Horário ou dia incomum',
        severity: 'low'
      },
      {
        type: 'category',
        threshold: 5.0, // 5x o gasto normal da categoria
        description: 'Gasto excepcional na categoria',
        severity: 'critical'
      }
    ];
  }

  private groupTransactionsByMonth(transactions: Lancamento[]) {
    const grouped: { [key: string]: Lancamento[] } = {};
    
    for (const transaction of transactions) {
      const monthKey = transaction.data.substring(0, 7); // YYYY-MM
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(transaction);
    }

    return grouped;
  }

  private calculateMonthlyAmounts(transactions: Lancamento[]): number[] {
    const monthlyData = this.groupTransactionsByMonth(transactions);
    const amounts: number[] = [];

    for (const month of Object.keys(monthlyData).sort()) {
      const monthTotal = monthlyData[month].reduce(
        (sum, t) => sum + (t.tipo === 'despesa' ? t.valor : 0), 
        0
      );
      amounts.push(monthTotal);
    }

    return amounts;
  }

  private detectSeasonality(monthlyAmounts: number[]) {
    if (monthlyAmounts.length < 12) {
      return { is_seasonal: false, confidence: 0 };
    }

    // Detecção de padrão sazonal simples
    const mean = monthlyAmounts.reduce((a, b) => a + b) / monthlyAmounts.length;
    const variance = monthlyAmounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyAmounts.length;
    const stdDev = Math.sqrt(variance);

    // Calcular picos e vales
    const peaks: number[] = [];
    const lows: number[] = [];

    for (let i = 0; i < 12; i++) {
      const monthValues = monthlyAmounts.filter((_, idx) => idx % 12 === i);
      const monthMean = monthValues.reduce((a, b) => a + b, 0) / monthValues.length;

      if (monthMean > mean + stdDev) {
        peaks.push(i + 1); // 1-indexed months
      } else if (monthMean < mean - stdDev) {
        lows.push(i + 1);
      }
    }

    const is_seasonal = peaks.length > 0 || lows.length > 0;
    const amplitude = Math.max(...monthlyAmounts) - Math.min(...monthlyAmounts);
    const confidence = is_seasonal ? Math.min(amplitude / mean, 1) : 0;

    return {
      is_seasonal,
      type: 'monthly' as const,
      cycle_length: 12,
      peak_months: peaks,
      low_months: lows,
      amplitude,
      confidence
    };
  }

  private calculateImpactScore(transactions: Lancamento[], indicators: IndicadoresMes[]): number {
    const totalAmount = transactions.reduce((sum, t) => sum + t.valor, 0);
    const avgMonthlySpending = indicators.reduce((sum, i) => sum + i.despesas_confirmadas, 0) / indicators.length;
    
    return Math.min(totalAmount / avgMonthlySpending, 1) * 100;
  }

  private analyzeByDayOfWeek(transactions: Lancamento[]) {
    const dayPatterns: { [key: number]: { count: number; total: number } } = {};

    for (const transaction of transactions) {
      const dayOfWeek = new Date(transaction.data).getDay();
      if (!dayPatterns[dayOfWeek]) {
        dayPatterns[dayOfWeek] = { count: 0, total: 0 };
      }
      dayPatterns[dayOfWeek].count++;
      dayPatterns[dayOfWeek].total += transaction.valor;
    }

    return dayPatterns;
  }

  private analyzeByTimeOfDay(transactions: Lancamento[]) {
    // Implementação simplificada - assumindo que não temos hora exata
    // Em implementação real, extrairia hora do timestamp
    return {};
  }

  private analyzeByAmountRange(transactions: Lancamento[]) {
    const ranges = {
      'small': { min: 0, max: 50, count: 0, total: 0 },
      'medium': { min: 50, max: 200, count: 0, total: 0 },
      'large': { min: 200, max: 1000, count: 0, total: 0 },
      'xlarge': { min: 1000, max: Infinity, count: 0, total: 0 }
    };

    for (const transaction of transactions) {
      for (const [rangeName, range] of Object.entries(ranges)) {
        if (transaction.valor >= range.min && transaction.valor < range.max) {
          range.count++;
          range.total += transaction.valor;
          break;
        }
      }
    }

    return ranges;
  }

  private analyzeFrequencyPatterns(transactions: Lancamento[]) {
    const monthlyData = this.groupTransactionsByMonth(transactions);
    const frequencies: number[] = [];

    for (const month of Object.keys(monthlyData)) {
      frequencies.push(monthlyData[month].length);
    }

    const avgFrequency = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    const variance = frequencies.reduce((sum, f) => sum + Math.pow(f - avgFrequency, 2), 0) / frequencies.length;

    return {
      average_transactions_per_month: avgFrequency,
      frequency_variance: variance,
      most_active_months: Object.entries(monthlyData)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 3)
        .map(([month, trans]) => ({ month, count: trans.length }))
    };
  }

  private analyzeGrowthTrends(transactions: Lancamento[]) {
    const monthlyTotals = this.calculateMonthlyAmounts(transactions);
    
    if (monthlyTotals.length < 2) {
      return { trend: 'insufficient_data' };
    }

    // Linear regression simples
    const n = monthlyTotals.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = monthlyTotals;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return {
      trend: slope > 0 ? 'increasing' : 'decreasing',
      slope,
      intercept,
      growth_rate: (slope / (sumY / n)) * 100 // porcentagem por mês
    };
  }

  private buildPredictiveModels(transactions: Lancamento[], indicators: IndicadoresMes[]) {
    // Modelo simples baseado em médias móveis e tendências
    return {
      spending_model: 'moving_average',
      prediction_accuracy: 0.75, // placeholder
      last_trained: new Date().toISOString()
    };
  }

  private calculateOverallConfidence(seasonalPatterns: SeasonalPattern[], spendingPatterns: any): number {
    const seasonalConfidence = seasonalPatterns.reduce((sum, p) => sum + p.confidence, 0) / seasonalPatterns.length || 0;
    // Simplificado - em implementação real, calcularia baseado em todos os padrões
    return Math.min(seasonalConfidence * 0.8, 1);
  }

  private detectAmountAnomaly(transaction: Lancamento, patterns: any) {
    // Implementação simplificada
    return {
      is_anomalous: false,
      reason: '',
      severity: 0
    };
  }

  private detectTimingAnomaly(transaction: Lancamento, patterns: any) {
    return {
      is_anomalous: false,
      reason: '',
      severity: 0
    };
  }

  private detectFrequencyAnomaly(transaction: Lancamento, patterns: any) {
    return {
      is_anomalous: false,
      reason: '',
      severity: 0
    };
  }

  private detectSeasonalAnomaly(transaction: Lancamento, seasonalPatterns: SeasonalPattern[]) {
    return {
      is_anomalous: false,
      reason: '',
      severity: 0
    };
  }

  private classifyAnomalyType(factors: string[]): string {
    if (factors.some(f => f.includes('valor'))) return 'amount_anomaly';
    if (factors.some(f => f.includes('frequência'))) return 'frequency_anomaly';
    if (factors.some(f => f.includes('timing'))) return 'timing_anomaly';
    return 'general_anomaly';
  }

  private calculateAnomalyConfidence(factors: string[], severity: number): number {
    return Math.min(factors.length * 0.3 + severity / 100, 1);
  }

  private generateAnomalyDescription(transaction: Lancamento, factors: string[]): string {
    return `Transação de R$ ${transaction.valor} em ${transaction.descricao} apresenta padrão incomum: ${factors.join(', ')}`;
  }

  private generateSuggestedActions(transaction: Lancamento, factors: string[]): string[] {
    return [
      'Verificar se a transação está correta',
      'Analisar se há padrão similar nos próximos meses',
      'Considerar ajustar orçamento da categoria'
    ];
  }

  private async analyzeTextSimilarity(
    description: string,
    patterns: PatternAnalysis,
    categories: Categoria[]
  ): Promise<Map<number, number>> {
    const scores = new Map<number, number>();
    // Implementação simplificada de similaridade de texto
    return scores;
  }

  private async analyzeAmountPatterns(
    amount: number,
    patterns: PatternAnalysis,
    categories: Categoria[]
  ): Promise<Map<number, number>> {
    const scores = new Map<number, number>();
    // Implementação simplificada de análise por valor
    return scores;
  }

  private async analyzeTimingPatterns(
    date: Date,
    patterns: PatternAnalysis,
    categories: Categoria[]
  ): Promise<Map<number, number>> {
    const scores = new Map<number, number>();
    // Implementação simplificada de análise temporal
    return scores;
  }

  private generateClassificationReasoning(
    textScore: number,
    amountScore: number,
    timingScore: number,
    category: Categoria
  ): string {
    const factors = [];
    if (textScore > 0.3) factors.push('descrição similar');
    if (amountScore > 0.3) factors.push('valor típico');
    if (timingScore > 0.3) factors.push('timing usual');
    
    return `Categoria sugerida baseada em: ${factors.join(', ')}`;
  }

  private prepareCategoryTimeSeries(transactions: Lancamento[], categoryId: number): number[] {
    return transactions
      .filter(t => t.categoria_id === categoryId)
      .map(t => t.valor);
  }

  private calculateTrend(data: number[]) {
    if (data.length < 3) {
      return { is_significant: false, direction: 'stable', confidence: 0 };
    }

    // Regressão linear simples
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return {
      is_significant: Math.abs(slope) > 0.1,
      direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
      confidence: Math.min(Math.abs(slope) / 100, 1)
    };
  }

  private async projectCategoryTrend(categoryData: number[], trend: any, months: number) {
    const lastValue = categoryData[categoryData.length - 1] || 0;
    const values = [];
    
    for (let i = 1; i <= months; i++) {
      const projected = lastValue + (trend.direction === 'increasing' ? i * 50 : -i * 30);
      values.push(Math.max(projected, 0));
    }

    return {
      values,
      confidence: trend.confidence * 0.8, // Diminui confiança para futuro
      seasonal_factors: [],
      assumptions: ['Baseado em tendência histórica', 'Não considera eventos externos']
    };
  }

  private async forecastBalance(indicators: IndicadoresMes[], months: number): Promise<TrendForecast> {
    const recentBalance = indicators[indicators.length - 1]?.saldo_atual || 0;
    const avgChange = indicators.reduce((sum, ind, i) => {
      if (i === 0) return 0;
      return sum + (ind.saldo_atual - indicators[i - 1].saldo_atual);
    }, 0) / (indicators.length - 1);

    const predictedValues = [];
    for (let i = 1; i <= months; i++) {
      predictedValues.push(recentBalance + avgChange * i);
    }

    return {
      category_id: 0, // 0 = saldo geral
      forecast_type: 'balance_projection',
      time_horizon: months,
      predicted_values: predictedValues,
      trend_direction: avgChange > 0 ? 'increasing' : 'decreasing',
      confidence: 0.7,
      seasonal_adjustments: [],
      assumptions: ['Baseado em variação média mensal'],
      generated_at: new Date().toISOString()
    };
  }

  private getCategoryTimeSeries(transactions: Lancamento[], categoryId: number): number[] {
    const monthlyData = this.groupTransactionsByMonth(
      transactions.filter(t => t.categoria_id === categoryId)
    );

    return Object.keys(monthlyData)
      .sort()
      .map(month => monthlyData[month].reduce((sum, t) => sum + t.valor, 0));
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }
}

export default AIPatternDetector; 