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

    try {
      // Buscar histórico de 3 meses para análise estatística
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Agrupar gastos por categoria para detecção de anomalias
      const categoriaStats = new Map<string, { valores: number[]; media: number; desvio: number }>();

      // Calcular estatísticas por categoria dos últimos 3 meses
      for (const transacao of context.historico.lancamentos_recentes) {
        if (transacao.tipo === 'despesa') {
          const categoria = transacao.categoria_nome || 'Sem categoria';

          if (!categoriaStats.has(categoria)) {
            categoriaStats.set(categoria, { valores: [], media: 0, desvio: 0 });
          }

          categoriaStats.get(categoria)!.valores.push(Number(transacao.valor));
        }
      }

      // Calcular média e desvio padrão por categoria
      categoriaStats.forEach((stats, categoria) => {
        if (stats.valores.length > 2) {
          const media = stats.valores.reduce((a, b) => a + b, 0) / stats.valores.length;
          const variancia = stats.valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / stats.valores.length;
          const desvio = Math.sqrt(variancia);

          stats.media = media;
          stats.desvio = desvio;

          // Detectar valores anômalos (> 2 desvios padrão)
          stats.valores.forEach(valor => {
            if (Math.abs(valor - media) > 2 * desvio && desvio > 0) {
              anomalies.push({
                tipo: 'gasto_alto',
                descricao: `Gasto incomum em ${categoria}: ${this.formatCurrency(valor)}`,
                valor_detectado: valor,
                valor_esperado: media,
                categoria,
                confianca: Math.min(0.95, (Math.abs(valor - media) / desvio) * 0.3),
                sugestao_acao: valor > media
                  ? `Revise este gasto. Está ${((valor / media - 1) * 100).toFixed(0)}% acima da média`
                  : `Economia detectada! ${((1 - valor / media) * 100).toFixed(0)}% abaixo da média`
              });
            }
          });
        }
      });

      // Detectar categorias novas com valores altos
      const categoriasNovas = context.historico.categorias_preferidas.filter(
        cat => cat.ultimo_uso && this.daysSince(cat.ultimo_uso) < 7 && cat.uso_mensal === 1
      );

      categoriasNovas.forEach(cat => {
        if (cat.valor_total_mes > context.indicadores.mes_atual.despesas_mes * 0.2) {
          anomalies.push({
            tipo: 'categoria_nova',
            descricao: `Nova categoria com gasto significativo: ${cat.categoria_nome}`,
            valor_detectado: cat.valor_total_mes,
            valor_esperado: 0,
            categoria: cat.categoria_nome,
            confianca: 0.8,
            sugestao_acao: 'Nova categoria de gasto detectada. Considere criar um orçamento para ela'
          });
        }
      });

    } catch (error) {
      console.warn('Erro ao detectar anomalias:', error);
    }

    return anomalies;
  }

  private async detectPadraoAnomalies(context: FinancialContext): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    try {
      // Analisar mudanças de padrão baseado no histórico
      for (const padrao of context.historico.padroes_gastos) {
        // Verificar se houve mudança significativa no valor médio
        const ultimasTransacoes = context.historico.lancamentos_recentes.filter(
          t => t.categoria_id === padrao.categoria_id && t.tipo === 'despesa'
        );

        if (ultimasTransacoes.length > 0) {
          const valorMedioRecente = ultimasTransacoes
            .slice(0, 5)
            .reduce((sum, t) => sum + Number(t.valor), 0) / Math.min(ultimasTransacoes.length, 5);

          const variacaoPercentual = ((valorMedioRecente - padrao.valor_medio) / padrao.valor_medio) * 100;

          if (Math.abs(variacaoPercentual) > 50) {
            anomalies.push({
              tipo: 'padrao_quebrado',
              descricao: `Mudança de padrão detectada na categoria ${padrao.categoria_id}`,
              valor_detectado: valorMedioRecente,
              valor_esperado: padrao.valor_medio,
              categoria: `Categoria ${padrao.categoria_id}`,
              confianca: Math.min(0.9, Math.abs(variacaoPercentual) / 100),
              sugestao_acao: variacaoPercentual > 0
                ? `Gastos aumentaram ${variacaoPercentual.toFixed(0)}%. Revise se é intencional`
                : `Gastos diminuíram ${Math.abs(variacaoPercentual).toFixed(0)}%. Ótima economia!`
            });
          }
        }
      }

      // Detectar mudanças na frequência de gastos
      const frequenciaAtual = context.historico.lancamentos_recentes.filter(
        t => t.tipo === 'despesa'
      ).length;

      const frequenciaEsperada = context.historico.padroes_gastos.reduce(
        (sum, p) => sum + p.frequencia_mensal, 0
      );

      if (frequenciaEsperada > 0 && Math.abs(frequenciaAtual - frequenciaEsperada) > frequenciaEsperada * 0.5) {
        anomalies.push({
          tipo: 'padrao_quebrado',
          descricao: 'Mudança significativa na frequência de gastos',
          valor_detectado: frequenciaAtual,
          valor_esperado: frequenciaEsperada,
          categoria: 'Geral',
          confianca: 0.75,
          sugestao_acao: frequenciaAtual > frequenciaEsperada
            ? 'Você está gastando com mais frequência que o normal'
            : 'Você está gastando menos frequentemente. Parabéns!'
        });
      }

    } catch (error) {
      console.warn('Erro ao detectar mudanças de padrão:', error);
    }

    return anomalies;
  }

  private async detectCategoriaAnomalies(context: FinancialContext): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    try {
      // Analisar gastos incomuns por categoria
      const categoriasComGastos = new Map<string, number>();

      // Somar gastos do mês atual por categoria
      context.historico.lancamentos_recentes.forEach(t => {
        if (t.tipo === 'despesa' && t.categoria_nome) {
          const atual = categoriasComGastos.get(t.categoria_nome) || 0;
          categoriasComGastos.set(t.categoria_nome, atual + Number(t.valor));
        }
      });

      // Comparar com médias históricas das categorias preferidas
      context.historico.categorias_preferidas.forEach(cat => {
        const gastoAtual = categoriasComGastos.get(cat.categoria_nome) || 0;
        const gastoEsperado = cat.valor_total_mes;

        if (gastoEsperado > 0) {
          const variacao = ((gastoAtual - gastoEsperado) / gastoEsperado) * 100;

          if (variacao > 100) {
            anomalies.push({
              tipo: 'gasto_incomum',
              descricao: `Gasto muito elevado em ${cat.categoria_nome}`,
              valor_detectado: gastoAtual,
              valor_esperado: gastoEsperado,
              categoria: cat.categoria_nome,
              confianca: Math.min(0.95, variacao / 200),
              sugestao_acao: `Gastos ${variacao.toFixed(0)}% acima da média. Verifique se há gastos desnecessários`
            });
          } else if (variacao < -50 && gastoAtual > 0) {
            anomalies.push({
              tipo: 'gasto_incomum',
              descricao: `Gasto reduzido em ${cat.categoria_nome}`,
              valor_detectado: gastoAtual,
              valor_esperado: gastoEsperado,
              categoria: cat.categoria_nome,
              confianca: 0.7,
              sugestao_acao: `Economia de ${Math.abs(variacao).toFixed(0)}% nesta categoria!`
            });
          }
        }
      });

      // Detectar categorias sem gastos quando deveriam ter
      context.historico.categorias_preferidas
        .filter(cat => cat.uso_mensal > 3) // Categorias frequentes
        .forEach(cat => {
          if (!categoriasComGastos.has(cat.categoria_nome)) {
            anomalies.push({
              tipo: 'gasto_incomum',
              descricao: `Nenhum gasto em ${cat.categoria_nome} este mês`,
              valor_detectado: 0,
              valor_esperado: cat.valor_total_mes,
              categoria: cat.categoria_nome,
              confianca: 0.6,
              sugestao_acao: 'Categoria usual sem gastos. Isso é intencional?'
            });
          }
        });

    } catch (error) {
      console.warn('Erro ao detectar anomalias de categoria:', error);
    }

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

    try {
      // Analisar tendências por categoria
      context.indicadores.tendencias.forEach(tendencia => {
        if (tendencia.tendencia === 'crescente' && tendencia.variacao_percentual > 20) {
          const valorProjetado = tendencia.mes_atual * (1 + tendencia.variacao_percentual / 100);

          predictions.push({
            tipo: 'gasto_categoria',
            valor_previsto: valorProjetado,
            data_previsao: this.endOfCurrentMonth(),
            confianca: Math.min(0.85, 0.5 + tendencia.variacao_percentual / 100),
            fatores: [
              `Tendência ${tendencia.tendencia}`,
              `Variação de ${tendencia.variacao_percentual.toFixed(0)}%`,
              `Média histórica: ${this.formatCurrency(tendencia.media_mensal)}`
            ],
            recomendacao: `${tendencia.categoria_nome} em alta. Considere definir um orçamento de ${this.formatCurrency(valorProjetado * 0.9)}`
          });
        }
      });

      // Predição baseada em sazonalidade (categorias com padrões)
      context.historico.padroes_gastos.forEach(padrao => {
        if (padrao.frequencia_mensal > 2) {
          const diasRestantes = this.daysUntilEndOfMonth();
          const gastosProjetados = padrao.valor_medio * padrao.frequencia_mensal;

          predictions.push({
            tipo: 'gasto_categoria',
            valor_previsto: gastosProjetados,
            data_previsao: this.endOfCurrentMonth(),
            confianca: Math.min(0.8, padrao.frequencia_mensal / 10),
            fatores: [
              `Frequência: ${padrao.frequencia_mensal.toFixed(1)}x/mês`,
              `Valor médio: ${this.formatCurrency(padrao.valor_medio)}`,
              `Dia preferido: ${this.getDayName(padrao.dia_semana_preferido)}`
            ],
            recomendacao: `Categoria ${padrao.categoria_id} tem padrão regular. Previsto: ${this.formatCurrency(gastosProjetados)}`
          });
        }
      });

    } catch (error) {
      console.warn('Erro ao prever gastos por categoria:', error);
    }

    return predictions;
  }

  private async predictMetasAtingidas(context: FinancialContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    try {
      context.planejamento.metas_ativas.forEach(meta => {
        if (meta.valor_atual < meta.valor_meta) {
          const faltante = meta.valor_meta - meta.valor_atual;
          const diasRestantes = this.daysBetween(new Date(), new Date(meta.data_fim));
          const economiaMedia = context.indicadores.mes_atual.fluxo_liquido;

          if (economiaMedia > 0) {
            const mesesNecessarios = faltante / economiaMedia;
            const diasNecessarios = mesesNecessarios * 30;

            predictions.push({
              tipo: 'meta_atingida',
              valor_previsto: meta.valor_meta,
              data_previsao: new Date(Date.now() + diasNecessarios * 24 * 60 * 60 * 1000),
              confianca: diasNecessarios <= diasRestantes ? 0.8 : 0.4,
              fatores: [
                `Faltam ${this.formatCurrency(faltante)}`,
                `Economia média: ${this.formatCurrency(economiaMedia)}/mês`,
                `Progresso: ${((meta.valor_atual / meta.valor_meta) * 100).toFixed(0)}%`
              ],
              recomendacao: diasNecessarios <= diasRestantes
                ? `Meta será atingida no prazo se mantiver economia de ${this.formatCurrency(economiaMedia)}/mês`
                : `Aumente economia para ${this.formatCurrency(faltante / (diasRestantes / 30))}/mês para atingir no prazo`
            });
          } else {
            predictions.push({
              tipo: 'meta_atingida',
              valor_previsto: meta.valor_meta,
              data_previsao: new Date(meta.data_fim),
              confianca: 0.2,
              fatores: [
                `Fluxo negativo: ${this.formatCurrency(economiaMedia)}`,
                `Faltam ${this.formatCurrency(faltante)}`,
                `Dias restantes: ${diasRestantes}`
              ],
              recomendacao: 'Com fluxo negativo, meta não será atingida. Reduza gastos ou aumente receitas'
            });
          }
        }
      });

    } catch (error) {
      console.warn('Erro ao prever metas:', error);
    }

    return predictions;
  }

  private async predictOrcamentosExcedidos(context: FinancialContext): Promise<Prediction[]> {
    const predictions: Prediction[] = [];

    try {
      const diasPassados = new Date().getDate();
      const diasNoMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const percentualMes = diasPassados / diasNoMes;

      context.planejamento.orcamentos_ativos.forEach(orcamento => {
        // Buscar gastos atuais da categoria
        const gastosCategoria = context.historico.lancamentos_recentes
          .filter(t => t.categoria_id === orcamento.categoria_id && t.tipo === 'despesa')
          .reduce((sum, t) => sum + Number(t.valor), 0);

        const percentualGasto = gastosCategoria / orcamento.valor;

        // Se já gastou mais que o proporcional ao tempo do mês
        if (percentualGasto > percentualMes) {
          const taxaGastoDiario = gastosCategoria / diasPassados;
          const gastoProjetado = taxaGastoDiario * diasNoMes;

          predictions.push({
            tipo: 'orcamento_excedido',
            valor_previsto: gastoProjetado,
            data_previsao: this.endOfCurrentMonth(),
            confianca: Math.min(0.9, percentualGasto),
            fatores: [
              `Orçamento: ${this.formatCurrency(orcamento.valor)}`,
              `Já gasto: ${this.formatCurrency(gastosCategoria)} (${(percentualGasto * 100).toFixed(0)}%)`,
              `Taxa diária: ${this.formatCurrency(taxaGastoDiario)}`
            ],
            recomendacao: gastoProjetado > orcamento.valor * 1.2
              ? `ALERTA: Projeção ${((gastoProjetado / orcamento.valor - 1) * 100).toFixed(0)}% acima. Reduza gastos imediatamente`
              : `Atenção: Pode exceder em ${this.formatCurrency(gastoProjetado - orcamento.valor)}`
          });
        }
      });

      // Predição geral de orçamento total
      const orcamentoTotal = context.planejamento.orcamentos_ativos.reduce((sum, o) => sum + o.valor, 0);
      const gastosTotal = context.indicadores.mes_atual.despesas_mes;

      if (orcamentoTotal > 0) {
        const taxaGastoMensal = gastosTotal / diasPassados * diasNoMes;

        if (taxaGastoMensal > orcamentoTotal) {
          predictions.push({
            tipo: 'orcamento_excedido',
            valor_previsto: taxaGastoMensal,
            data_previsao: this.endOfCurrentMonth(),
            confianca: 0.75,
            fatores: [
              `Orçamento total: ${this.formatCurrency(orcamentoTotal)}`,
              `Projeção mensal: ${this.formatCurrency(taxaGastoMensal)}`,
              `Excesso previsto: ${this.formatCurrency(taxaGastoMensal - orcamentoTotal)}`
            ],
            recomendacao: 'Orçamento geral em risco. Revise gastos em todas as categorias'
          });
        }
      }

    } catch (error) {
      console.warn('Erro ao prever orçamentos:', error);
    }

    return predictions;
  }

  private getDayName(day: number): string {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[day] || 'Dia';
  }

  private daysBetween(date1: Date, date2: Date): number {
    return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
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