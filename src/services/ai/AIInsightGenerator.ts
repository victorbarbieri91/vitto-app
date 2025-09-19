import type {
  FinancialContext,
  Insight,
  Anomaly,
  Prediction
} from '../../types/ai';

/**
 * AIInsightGenerator
 * 
 * Sistema de geração de insights financeiros inteligentes
 * Analisa padrões, detecta anomalias e gera predições
 */
export class AIInsightGenerator {
  private static instance: AIInsightGenerator;

  static getInstance(): AIInsightGenerator {
    if (!AIInsightGenerator.instance) {
      AIInsightGenerator.instance = new AIInsightGenerator();
    }
    return AIInsightGenerator.instance;
  }

  /**
   * Gera insights personalizados baseados no contexto financeiro
   */
  async generateInsights(context: FinancialContext): Promise<Insight[]> {
    console.log('💡 AIInsightGenerator: Gerando insights');

    try {
      const insights: Insight[] = [];

      // Gerar insights de diferentes categorias em paralelo
      const [
        saldoInsights,
        gastoInsights,
        metaInsights,
        orcamentoInsights,
        saudeInsights,
        tendenciaInsights
      ] = await Promise.all([
        this.generateSaldoInsights(context),
        this.generateGastoInsights(context),
        this.generateMetaInsights(context),
        this.generateOrcamentoInsights(context),
        this.generateSaudeFinanceiraInsights(context),
        this.generateTendenciaInsights(context)
      ]);

      // Combinar todos os insights
      insights.push(
        ...saldoInsights,
        ...gastoInsights,
        ...metaInsights,
        ...orcamentoInsights,
        ...saudeInsights,
        ...tendenciaInsights
      );

      // Ordenar por prioridade e limitar quantidade
      const sortedInsights = this.sortInsightsByPriority(insights);
      const limitedInsights = sortedInsights.slice(0, 8); // Máximo 8 insights

      console.log(`✅ ${limitedInsights.length} insights gerados`);
      return limitedInsights;

    } catch (error) {
      console.error('❌ Erro ao gerar insights:', error);
      return [];
    }
  }

  /**
   * Detecta anomalias nos padrões financeiros
   */
  async detectAnomalies(context: FinancialContext): Promise<Anomaly[]> {
    console.log('🔍 Detectando anomalias');

    try {
      const anomalies: Anomaly[] = [];

      // Detectar gastos altos incomuns
      const gastoAnomalies = await this.detectGastoAnomalies(context);
      anomalies.push(...gastoAnomalies);

      // Detectar mudanças de padrão
      const padraoAnomalies = await this.detectPadraoAnomalies(context);
      anomalies.push(...padraoAnomalies);

      // Detectar categorias novas com valores altos
      const categoriaAnomalies = await this.detectCategoriaAnomalies(context);
      anomalies.push(...categoriaAnomalies);

      console.log(`🔍 ${anomalies.length} anomalias detectadas`);
      return anomalies;

    } catch (error) {
      console.error('❌ Erro ao detectar anomalias:', error);
      return [];
    }
  }

  /**
   * Gera predições financeiras
   */
  async generatePredictions(context: FinancialContext): Promise<Prediction[]> {
    console.log('🔮 Gerando predições');

    try {
      const predictions: Prediction[] = [];

      // Predição de saldo fim do mês
      const saldoPrediction = await this.predictSaldoFimMes(context);
      if (saldoPrediction) predictions.push(saldoPrediction);

      // Predição de gastos por categoria
      const gastoPredictions = await this.predictGastosCategorias(context);
      predictions.push(...gastoPredictions);

      // Predição de metas
      const metaPredictions = await this.predictMetasAtingidas(context);
      predictions.push(...metaPredictions);

      // Predição de orçamentos
      const orcamentoPredictions = await this.predictOrcamentosExcedidos(context);
      predictions.push(...orcamentoPredictions);

      console.log(`🔮 ${predictions.length} predições geradas`);
      return predictions;

    } catch (error) {
      console.error('❌ Erro ao gerar predições:', error);
      return [];
    }
  }

  // Métodos de geração de insights específicos

  private async generateSaldoInsights(context: FinancialContext): Promise<Insight[]> {
    const insights: Insight[] = [];
    const { patrimonio, indicadores } = context;

    // Insight de saldo positivo/negativo
    if (patrimonio.saldo_total > 0) {
      if (patrimonio.saldo_total > 5000) {
        insights.push({
          id: this.generateId(),
          tipo: 'parabens',
          titulo: 'Excelente Reserva Financeira!',
          descricao: `Você tem ${this.formatCurrency(patrimonio.saldo_total)} de saldo total. Isso representa uma boa reserva de emergência.`,
          acao: 'Considere investir parte desse valor para fazer seu dinheiro render',
          prioridade: 'media',
          created_at: new Date()
        });
      } else {
        insights.push({
          id: this.generateId(),
          tipo: 'dica',
          titulo: 'Construindo sua Reserva',
          descricao: `Seu saldo atual é ${this.formatCurrency(patrimonio.saldo_total)}. Continue construindo sua reserva de emergência.`,
          acao: 'Meta: ter pelo menos 3x seus gastos mensais de reserva',
          prioridade: 'media',
          created_at: new Date()
        });
      }
    } else {
      insights.push({
        id: this.generateId(),
        tipo: 'alerta',
        titulo: 'Saldo Negativo - Atenção!',
        descricao: `Seu saldo total está negativo: ${this.formatCurrency(patrimonio.saldo_total)}`,
        acao: 'Foque em reduzir gastos e aumentar receitas urgentemente',
        prioridade: 'urgente',
        created_at: new Date()
      });
    }

    // Insight de diferença entre saldo atual e previsto
    const diferenca = patrimonio.saldo_previsto - patrimonio.saldo_total;
    if (Math.abs(diferenca) > 100) {
      insights.push({
        id: this.generateId(),
        tipo: diferenca > 0 ? 'economia' : 'alerta',
        titulo: diferenca > 0 ? 'Receitas Futuras Confirmadas' : 'Gastos Futuros Previstos',
        descricao: `Há uma diferença de ${this.formatCurrency(Math.abs(diferenca))} entre seu saldo atual e previsto`,
        acao: diferenca > 0 ? 'Ótimo! Suas receitas futuras irão melhorar seu saldo' : 'Monitore seus gastos futuros programados',
        prioridade: 'media',
        created_at: new Date()
      });
    }

    return insights;
  }

  private async generateGastoInsights(context: FinancialContext): Promise<Insight[]> {
    const insights: Insight[] = [];
    const { indicadores } = context;

    // Insight de fluxo de caixa
    const fluxo = indicadores.mes_atual.fluxo_liquido;
    if (fluxo < 0) {
      insights.push({
        id: this.generateId(),
        tipo: 'alerta',
        titulo: 'Gastos Superiores às Receitas',
        descricao: `Este mês você gastou ${this.formatCurrency(Math.abs(fluxo))} a mais do que recebeu`,
        acao: 'Revise seus gastos e identifique onde pode economizar',
        prioridade: 'alta',
        valor_impacto: Math.abs(fluxo),
        created_at: new Date()
      });
    } else if (fluxo > 0) {
      insights.push({
        id: this.generateId(),
        tipo: 'parabens',
        titulo: 'Mês Positivo - Parabéns!',
        descricao: `Você economizou ${this.formatCurrency(fluxo)} este mês!`,
        acao: 'Continue assim! Considere investir essa quantia',
        prioridade: 'media',
        valor_impacto: fluxo,
        created_at: new Date()
      });
    }

    // Insight sobre proporção de gastos vs receitas
    if (indicadores.mes_atual.receitas_mes > 0) {
      const proporcao = (indicadores.mes_atual.despesas_mes / indicadores.mes_atual.receitas_mes) * 100;
      
      if (proporcao > 90) {
        insights.push({
          id: this.generateId(),
          tipo: 'alerta',
          titulo: 'Gastando Quase Tudo que Ganha',
          descricao: `Você está gastando ${proporcao.toFixed(1)}% de suas receitas`,
          acao: 'Tente manter os gastos abaixo de 80% da sua receita',
          prioridade: 'alta',
          created_at: new Date()
        });
      } else if (proporcao < 60) {
        insights.push({
          id: this.generateId(),
          tipo: 'parabens',
          titulo: 'Excelente Controle de Gastos!',
          descricao: `Você está gastando apenas ${proporcao.toFixed(1)}% de suas receitas`,
          acao: 'Perfeito! Você está no caminho certo para construir patrimônio',
          prioridade: 'baixa',
          created_at: new Date()
        });
      }
    }

    return insights;
  }

  private async generateMetaInsights(context: FinancialContext): Promise<Insight[]> {
    const insights: Insight[] = [];
    const metas = context.planejamento.metas_ativas;

    if (metas.length === 0) {
      insights.push({
        id: this.generateId(),
        tipo: 'dica',
        titulo: 'Que tal Criar uma Meta?',
        descricao: 'Metas financeiras ajudam a manter o foco e disciplina nos gastos',
        acao: 'Crie sua primeira meta financeira - pode ser para viagem, reserva ou um item específico',
        prioridade: 'media',
        created_at: new Date()
      });
    } else {
      // Analisar progresso das metas
      for (const meta of metas) {
        const progresso = (meta.valor_atual / meta.valor_meta) * 100;
        
        if (progresso >= 100) {
          insights.push({
            id: this.generateId(),
            tipo: 'parabens',
            titulo: `Meta "${meta.titulo}" Concluída! 🎉`,
            descricao: `Parabéns! Você atingiu sua meta de ${this.formatCurrency(meta.valor_meta)}`,
            acao: 'Que tal criar uma nova meta ainda mais ambiciosa?',
            prioridade: 'alta',
            created_at: new Date()
          });
        } else if (progresso < 10 && this.daysSince(new Date(meta.data_inicio)) > 30) {
          insights.push({
            id: this.generateId(),
            tipo: 'alerta',
            titulo: `Meta "${meta.titulo}" Precisa de Atenção`,
            descricao: `Você está apenas ${progresso.toFixed(1)}% da sua meta após 30+ dias`,
            acao: 'Revise o valor da meta ou estabeleça um plano de contribuição regular',
            prioridade: 'media',
            created_at: new Date()
          });
        }
      }
    }

    return insights;
  }

  private async generateOrcamentoInsights(context: FinancialContext): Promise<Insight[]> {
    const insights: Insight[] = [];
    const orcamentos = context.planejamento.orcamentos_ativos;

    if (orcamentos.length === 0) {
      insights.push({
        id: this.generateId(),
        tipo: 'dica',
        titulo: 'Controle seus Gastos com Orçamentos',
        descricao: 'Orçamentos por categoria ajudam a manter os gastos sob controle',
        acao: 'Crie orçamentos para suas principais categorias de gasto',
        prioridade: 'media',
        created_at: new Date()
      });
    } else {
      // TODO: Analisar status dos orçamentos quando implementarmos
      // Por enquanto, insight genérico
      insights.push({
        id: this.generateId(),
        tipo: 'dica',
        titulo: 'Monitore seus Orçamentos',
        descricao: `Você tem ${orcamentos.length} orçamento(s) ativo(s)`,
        acao: 'Verifique regularmente se está dentro dos limites estabelecidos',
        prioridade: 'baixa',
        created_at: new Date()
      });
    }

    return insights;
  }

  private async generateSaudeFinanceiraInsights(context: FinancialContext): Promise<Insight[]> {
    const insights: Insight[] = [];
    const saude = context.indicadores.saude_financeira;

    // Insight baseado no score de saúde
    if (saude.score >= 80) {
      insights.push({
        id: this.generateId(),
        tipo: 'parabens',
        titulo: 'Saúde Financeira Excelente!',
        descricao: `Seu score de saúde financeira é ${saude.score}/100 - ${saude.nivel}`,
        acao: 'Continue assim! Você está no caminho certo',
        prioridade: 'baixa',
        created_at: new Date()
      });
    } else if (saude.score >= 60) {
      insights.push({
        id: this.generateId(),
        tipo: 'otimizacao',
        titulo: 'Boa Saúde Financeira',
        descricao: `Seu score é ${saude.score}/100. Há espaço para melhorar`,
        acao: 'Foque nos pontos negativos para elevar seu score',
        prioridade: 'media',
        created_at: new Date()
      });
    } else {
      insights.push({
        id: this.generateId(),
        tipo: 'alerta',
        titulo: 'Saúde Financeira Precisa de Atenção',
        descricao: `Seu score é ${saude.score}/100 - situação ${saude.nivel}`,
        acao: 'Siga as recomendações para melhorar sua situação financeira',
        prioridade: 'alta',
        created_at: new Date()
      });
    }

    // Insights baseados nas recomendações
    for (const recomendacao of saude.recomendacoes.slice(0, 2)) { // Máximo 2
      insights.push({
        id: this.generateId(),
        tipo: 'dica',
        titulo: 'Recomendação Personalizada',
        descricao: recomendacao,
        prioridade: 'media',
        created_at: new Date()
      });
    }

    return insights;
  }

  private async generateTendenciaInsights(context: FinancialContext): Promise<Insight[]> {
    const insights: Insight[] = [];
    // TODO: Implementar quando tivermos dados de tendências reais
    
    // Por enquanto, insight genérico
    insights.push({
      id: this.generateId(),
      tipo: 'dica',
      titulo: 'Análise de Tendências em Desenvolvimento',
      descricao: 'Em breve você terá insights sobre suas tendências de gastos',
      acao: 'Continue usando o app para acumular dados para análise',
      prioridade: 'baixa',
      created_at: new Date()
    });

    return insights;
  }

  // Métodos de detecção de anomalias

  private async detectGastoAnomalies(context: FinancialContext): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // TODO: Implementar detecção real de anomalias de gastos
    // Por enquanto retorna array vazio
    
    return anomalies;
  }

  private async detectPadraoAnomalies(context: FinancialContext): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // TODO: Implementar detecção de mudanças de padrão
    
    return anomalies;
  }

  private async detectCategoriaAnomalies(context: FinancialContext): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // TODO: Implementar detecção de categorias com gastos incomuns
    
    return anomalies;
  }

  // Métodos de predição

  private async predictSaldoFimMes(context: FinancialContext): Promise<Prediction | null> {
    try {
      const { patrimonio, indicadores } = context;
      
      // Predição simples baseada no fluxo atual
      const diasRestantes = this.daysUntilEndOfMonth();
      const fluxoDiario = indicadores.mes_atual.fluxo_liquido / this.daysInCurrentMonth();
      const saldoPrevisto = patrimonio.saldo_total + (fluxoDiario * diasRestantes);

      return {
        tipo: 'saldo_fim_mes',
        valor_previsto: saldoPrevisto,
        data_previsao: this.endOfCurrentMonth(),
        confianca: 0.7,
        fatores: ['Fluxo de caixa atual', 'Padrão de gastos do mês'],
        recomendacao: saldoPrevisto < 0 
          ? 'Atenção: saldo pode ficar negativo. Reduza gastos.'
          : 'Saldo previsto positivo. Continue assim!'
      };

    } catch (error) {
      console.error('Erro ao prever saldo fim do mês:', error);
      return null;
    }
  }

  private async predictGastosCategorias(context: FinancialContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    
    // TODO: Implementar predições por categoria baseadas no histórico
    
    return predictions;
  }

  private async predictMetasAtingidas(context: FinancialContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    
    // TODO: Implementar predições de quando metas serão atingidas
    
    return predictions;
  }

  private async predictOrcamentosExcedidos(context: FinancialContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    
    // TODO: Implementar predições de orçamentos que podem ser excedidos
    
    return predictions;
  }

  // Métodos auxiliares

  private sortInsightsByPriority(insights: Insight[]): Insight[] {
    const priorityOrder = { 'urgente': 4, 'alta': 3, 'media': 2, 'baixa': 1 };
    
    return insights.sort((a, b) => {
      const priorityA = priorityOrder[a.prioridade] || 0;
      const priorityB = priorityOrder[b.prioridade] || 0;
      
      // Ordenar por prioridade (descendente) e depois por data (mais recente primeiro)
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private generateId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private daysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private daysUntilEndOfMonth(): number {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return Math.ceil((endOfMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  private daysInCurrentMonth(): number {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  }

  private endOfCurrentMonth(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }
}

// Instância única exportada
export const aiInsightGenerator = AIInsightGenerator.getInstance(); 