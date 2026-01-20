import type {
  FinancialContext,
  ContextChange,
  RelevantData,
  UserPreferences,
  UserSettings,
  IndicadoresMes,
  TendenciaGastos,
  SaudeFinanceira,
  ComparacaoMensal
} from '../../types/ai';
import { AccountService } from '../api/AccountService';
import { CategoryService } from '../api/CategoryService';
import { GoalService } from '../api/GoalService';
import { BudgetService } from '../api/BudgetService';
import { IndicatorsService } from '../api/IndicatorsService';
import { TransactionService } from '../api/TransactionService';
import { supabase } from '../supabase/client';

/**
 * AIContextManager
 * 
 * Gerenciador inteligente de contexto financeiro para IA.
 * Coleta e organiza dados relevantes de todas as fontes.
 */
export class AIContextManager {
  private static instance: AIContextManager;
  private cache: Map<string, { data: FinancialContext; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  // Instâncias dos serviços
  private accountService = new AccountService();
  private categoryService = new CategoryService();
  private goalService = new GoalService();
  private budgetService = new BudgetService();
  private indicatorsService = new IndicatorsService();
  private transactionService = new TransactionService();

  static getInstance(): AIContextManager {
    if (!AIContextManager.instance) {
      AIContextManager.instance = new AIContextManager();
    }
    return AIContextManager.instance;
  }

  /**
   * Constrói o contexto financeiro completo do usuário
   */
  async buildContext(userId: string): Promise<FinancialContext> {
    console.log('🧠 AIContextManager: Construindo contexto para usuário', userId);

    try {
      // Verificar cache primeiro
      const cached = this.cache.get(userId);
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log('📝 Usando contexto do cache');
        return cached.data;
      }

      // Buscar dados em paralelo para otimizar performance
      const [
        userProfile,
        accounts,
        categories,
        indicators,
        recentTransactions,
        activeGoals,
        activeBudgets,
        tendencies
      ] = await Promise.all([
        this.getUserProfile(userId),
        this.accountService.list(),
        this.categoryService.list(),
        this.indicatorsService.getIndicators(),
        this.transactionService.list({ limit: 20 }),
        this.goalService.list(),
        this.budgetService.list(),
        this.getTendencies(userId)
      ]);

      // Calcular dados agregados
      const patrimonio = this.calculatePatrimonio(accounts);
      const saudeFinanceira = this.calculateSaudeFinanceira(indicators, patrimonio);
      const comparacaoMensal = await this.getComparacaoMensal(userId);
      const padroes = await this.getPadroesGastos(userId);
      const projecoes = await this.getProjecoes(userId);

      // Construir contexto completo
      const context: FinancialContext = {
        usuario: {
          id: userId,
          nome: userProfile.nome || 'Usuário',
          preferencias: this.getDefaultPreferences(),
          configuracoes: this.getDefaultSettings()
        },

        patrimonio: {
          saldo_total: patrimonio.saldo_total,
          saldo_previsto: patrimonio.saldo_previsto,
          contas: accounts.map(conta => ({
            id: conta.id,
            nome: conta.nome,
            tipo: conta.tipo,
            saldo_atual: conta.saldo_atual || 0,
            saldo_previsto: conta.saldo_atual || 0, // TODO: Implementar cálculo previsto por conta
            instituicao: conta.instituicao
          })),
          investimentos: [] // TODO: Implementar quando tivermos módulo de investimentos
        },

        indicadores: {
          mes_atual: this.buildIndicadoresMes(indicators, patrimonio),
          tendencias: tendencies,
          saude_financeira: saudeFinanceira,
          comparacao_mensal: comparacaoMensal
        },

        historico: {
          lancamentos_recentes: recentTransactions,
          padroes_gastos: padroes.gastos,
          categorias_preferidas: padroes.categorias,
          horarios_transacoes: padroes.horarios
        },

        planejamento: {
          lancamentos_futuros: await this.getLancamentosFuturos(userId),
          metas_ativas: activeGoals,
          orcamentos_ativos: activeBudgets,
          projecoes: projecoes
        },

        conversa: {
          mensagens_recentes: await this.getMensagensRecentes(userId),
          intencoes_anteriores: await this.getIntencoesAnteriores(userId),
          operacoes_realizadas: await this.getOperacoesRealizadas(userId),
          preferencias_contextuais: await this.getPreferenciasContextuais(userId)
        }
      };

      // Armazenar no cache
      this.cache.set(userId, {
        data: context,
        timestamp: Date.now()
      });

      console.log('✅ Contexto construído com sucesso');
      return context;

    } catch (error) {
      console.error('❌ Erro ao construir contexto:', error);
      throw new Error('Erro ao preparar contexto financeiro');
    }
  }

  /**
   * Atualiza o contexto quando algo muda
   */
  async updateContext(userId: string, changes: ContextChange[]): Promise<void> {
    console.log('🔄 Atualizando contexto para usuário', userId, 'mudanças:', changes.length);

    try {
      // Invalidar cache para forçar reconstrução
      this.cache.delete(userId);

      // Log das mudanças para auditoria
      for (const change of changes) {
        await this.logContextChange(userId, change);
      }

      console.log('✅ Contexto atualizado');
    } catch (error) {
      console.error('❌ Erro ao atualizar contexto:', error);
    }
  }

  /**
   * Busca dados relevantes baseados em uma query
   */
  async getRelevantHistory(userId: string, query: string): Promise<RelevantData> {
    console.log('🔍 Buscando dados relevantes para:', query);

    try {
      // Buscar transações relacionadas
      const transactions = await this.transactionService.search({
        query: query,
        limit: 10
      });

      // Buscar outros dados relevantes baseados na query
      const [accounts, categories, goals, budgets] = await Promise.all([
        this.accountService.list(),
        this.categoryService.list(),
        this.goalService.list(),
        this.budgetService.list()
      ]);

      // Gerar insights relevantes
      const insights = await this.generateRelevantInsights(userId, query);

      return {
        transactions,
        accounts,
        categories,
        goals,
        budgets,
        insights
      };

    } catch (error) {
      console.error('❌ Erro ao buscar dados relevantes:', error);
      return {
        transactions: [],
        accounts: [],
        categories: [],
        goals: [],
        budgets: [],
        insights: []
      };
    }
  }

  // Métodos privados auxiliares

  private async getUserProfile(userId: string) {
    try {
      const { data } = await supabase
        .from('app_perfil')
        .select('*')
        .eq('id', userId)
        .single();
      
      return data || { nome: 'Usuário' };
    } catch (error) {
      console.warn('Perfil não encontrado, usando padrão');
      return { nome: 'Usuário' };
    }
  }

  private calculatePatrimonio(accounts: any[]) {
    const saldo_total = accounts.reduce((total, account) => total + (account.saldo_atual || 0), 0);
    
    return {
      saldo_total,
      saldo_previsto: saldo_total, // TODO: Implementar cálculo com lançamentos futuros
    };
  }

  private calculateSaudeFinanceira(indicators: any, patrimonio: any): SaudeFinanceira {
    // Algoritmo simples de saúde financeira
    let score = 50; // Base
    const fatores_positivos: string[] = [];
    const fatores_negativos: string[] = [];
    const recomendacoes: string[] = [];

    // Avaliar saldo positivo
    if (patrimonio.saldo_total > 0) {
      score += 20;
      fatores_positivos.push('Saldo positivo nas contas');
    } else {
      score -= 30;
      fatores_negativos.push('Saldo negativo ou zero');
      recomendacoes.push('Foque em aumentar sua receita ou reduzir gastos');
    }

    // Avaliar reserva de emergência (estimativa)
    if (patrimonio.saldo_total > 3000) { // 3x salário mínimo aproximado
      score += 15;
      fatores_positivos.push('Boa reserva financeira');
    } else {
      fatores_negativos.push('Reserva de emergência insuficiente');
      recomendacoes.push('Construa uma reserva de emergência');
    }

    // Definir nível baseado no score
    let nivel: SaudeFinanceira['nivel'];
    if (score >= 80) nivel = 'excelente';
    else if (score >= 60) nivel = 'boa';
    else if (score >= 40) nivel = 'moderada';
    else nivel = 'preocupante';

    return {
      score: Math.max(0, Math.min(100, score)),
      nivel,
      fatores_positivos,
      fatores_negativos,
      recomendacoes
    };
  }

  private buildIndicadoresMes(indicators: any, patrimonio: any): IndicadoresMes {
    return {
      saldo_total: patrimonio.saldo_total,
      saldo_previsto: patrimonio.saldo_previsto,
      receitas_mes: indicators?.receitas_confirmadas || 0,
      despesas_mes: indicators?.despesas_confirmadas || 0,
      fluxo_liquido: (indicators?.receitas_confirmadas || 0) - (indicators?.despesas_confirmadas || 0),
      score_saude_financeira: indicators?.score_saude_financeira || 50,
      meta_orcamento_cumprida: 0 // TODO: Calcular baseado nas metas e orçamentos
    };
  }

  private async getTendencies(userId: string): Promise<TendenciaGastos[]> {
    try {
      // Buscar gastos dos últimos 3 meses agrupados por categoria
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: transacoes } = await supabase
        .from('app_transacoes')
        .select(`
          valor,
          categoria_id,
          data,
          app_categoria!inner(nome)
        `)
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data', threeMonthsAgo.toISOString())
        .order('data', { ascending: false });

      if (!transacoes || transacoes.length === 0) return [];

      // Agrupar por categoria e mês
      const categoriasPorMes = new Map<number, Map<string, number>>();

      transacoes.forEach((t: any) => {
        if (!categoriasPorMes.has(t.categoria_id)) {
          categoriasPorMes.set(t.categoria_id, new Map());
        }

        const mesAno = new Date(t.data).toISOString().slice(0, 7);
        const mesMap = categoriasPorMes.get(t.categoria_id)!;
        mesMap.set(mesAno, (mesMap.get(mesAno) || 0) + Number(t.valor));
      });

      // Calcular tendências
      const tendencias: TendenciaGastos[] = [];

      categoriasPorMes.forEach((meses, categoriaId) => {
        const valores = Array.from(meses.values());
        if (valores.length < 2) return;

        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const mesAtual = valores[valores.length - 1];
        const variacao = ((mesAtual - media) / media) * 100;

        // Determinar tendência
        let tendencia: 'crescente' | 'decrescente' | 'estavel';
        if (variacao > 10) tendencia = 'crescente';
        else if (variacao < -10) tendencia = 'decrescente';
        else tendencia = 'estavel';

        const categoria = transacoes.find((t: any) => t.categoria_id === categoriaId);

        tendencias.push({
          categoria_id: categoriaId,
          categoria_nome: categoria?.app_categoria?.nome || 'Categoria',
          variacao_percentual: variacao,
          media_mensal: media,
          mes_atual: mesAtual,
          tendencia
        });
      });

      return tendencias.sort((a, b) => Math.abs(b.variacao_percentual) - Math.abs(a.variacao_percentual));

    } catch (error) {
      console.warn('Erro ao calcular tendências:', error);
      return [];
    }
  }

  private async getComparacaoMensal(userId: string): Promise<ComparacaoMensal> {
    try {
      const now = new Date();
      const mesAtual = now.getMonth() + 1;
      const anoAtual = now.getFullYear();

      // Calcular mês anterior
      const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
      const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;

      // Buscar indicadores do mês atual
      const { data: indicadorAtual } = await supabase
        .from('app_indicadores')
        .select('receitas_confirmadas, despesas_confirmadas, fluxo_liquido')
        .eq('user_id', userId)
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .single();

      // Buscar indicadores do mês anterior
      const { data: indicadorAnterior } = await supabase
        .from('app_indicadores')
        .select('receitas_confirmadas, despesas_confirmadas, fluxo_liquido')
        .eq('user_id', userId)
        .eq('mes', mesAnterior)
        .eq('ano', anoAnterior)
        .single();

      // Se não houver dados, buscar diretamente das transações
      let mesAtualData = indicadorAtual || await this.calcularDadosMes(userId, mesAtual, anoAtual);
      let mesAnteriorData = indicadorAnterior || await this.calcularDadosMes(userId, mesAnterior, anoAnterior);

      const receitasAtual = Number(mesAtualData.receitas_confirmadas || 0);
      const despesasAtual = Number(mesAtualData.despesas_confirmadas || 0);
      const economiaAtual = receitasAtual - despesasAtual;

      const receitasAnterior = Number(mesAnteriorData.receitas_confirmadas || 0);
      const despesasAnterior = Number(mesAnteriorData.despesas_confirmadas || 0);
      const economiaAnterior = receitasAnterior - despesasAnterior;

      // Calcular variações percentuais
      const calcVariacao = (atual: number, anterior: number) => {
        if (anterior === 0) return atual > 0 ? 100 : 0;
        return ((atual - anterior) / Math.abs(anterior)) * 100;
      };

      return {
        mes_anterior: {
          receitas: receitasAnterior,
          despesas: despesasAnterior,
          economia: economiaAnterior
        },
        mes_atual: {
          receitas: receitasAtual,
          despesas: despesasAtual,
          economia: economiaAtual
        },
        variacao: {
          receitas_percentual: calcVariacao(receitasAtual, receitasAnterior),
          despesas_percentual: calcVariacao(despesasAtual, despesasAnterior),
          economia_percentual: calcVariacao(economiaAtual, economiaAnterior)
        }
      };

    } catch (error) {
      console.warn('Erro ao comparar meses:', error);
      return {
        mes_anterior: { receitas: 0, despesas: 0, economia: 0 },
        mes_atual: { receitas: 0, despesas: 0, economia: 0 },
        variacao: { receitas_percentual: 0, despesas_percentual: 0, economia_percentual: 0 }
      };
    }
  }

  private async calcularDadosMes(userId: string, mes: number, ano: number) {
    const startDate = new Date(ano, mes - 1, 1);
    const endDate = new Date(ano, mes, 0);

    const { data: transacoes } = await supabase
      .from('app_transacoes')
      .select('valor, tipo')
      .eq('user_id', userId)
      .gte('data', startDate.toISOString())
      .lte('data', endDate.toISOString())
      .eq('status', 'confirmado');

    let receitas = 0;
    let despesas = 0;

    transacoes?.forEach(t => {
      if (t.tipo === 'receita') {
        receitas += Number(t.valor);
      } else {
        despesas += Number(t.valor);
      }
    });

    return { receitas_confirmadas: receitas, despesas_confirmadas: despesas };
  }

  private async getPadroesGastos(userId: string) {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Buscar transações dos últimos 6 meses
      const { data: transacoes } = await supabase
        .from('app_transacoes')
        .select(`
          valor,
          data,
          categoria_id,
          descricao,
          created_at,
          app_categoria!inner(nome)
        `)
        .eq('user_id', userId)
        .eq('tipo', 'despesa')
        .gte('data', sixMonthsAgo.toISOString())
        .order('data', { ascending: false });

      if (!transacoes || transacoes.length === 0) {
        return { gastos: [], categorias: [], horarios: [] };
      }

      // Análise de padrões de gastos por categoria
      const padroesGastos: any[] = [];
      const categoriasMap = new Map<number, any[]>();

      transacoes.forEach((t: any) => {
        if (!categoriasMap.has(t.categoria_id)) {
          categoriasMap.set(t.categoria_id, []);
        }
        categoriasMap.get(t.categoria_id)!.push(t);
      });

      categoriasMap.forEach((trans, categoriaId) => {
        if (trans.length < 3) return; // Precisa de pelo menos 3 transações para padrão

        const valores = trans.map(t => Number(t.valor));
        const valorMedio = valores.reduce((a, b) => a + b, 0) / valores.length;

        // Análise de dia da semana preferido
        const diasSemana = trans.map(t => new Date(t.data).getDay());
        const diaMaisFrequente = this.getMostFrequent(diasSemana);

        // Análise de horário preferido
        const horas = trans.map(t => new Date(t.created_at).getHours());
        const horaMaisFrequente = this.getMostFrequent(horas);

        padroesGastos.push({
          categoria_id: categoriaId,
          dia_semana_preferido: diaMaisFrequente,
          horario_preferido: `${horaMaisFrequente}:00`,
          valor_medio: valorMedio,
          frequencia_mensal: trans.length / 6 // média por mês
        });
      });

      // Análise de categorias preferidas
      const categoriasFrequencia: any[] = [];
      categoriasMap.forEach((trans, categoriaId) => {
        const categoria = trans[0]?.app_categoria;
        const valorTotal = trans.reduce((sum, t) => sum + Number(t.valor), 0);

        categoriasFrequencia.push({
          categoria_id: categoriaId,
          categoria_nome: categoria?.nome || 'Categoria',
          uso_mensal: trans.length / 6,
          valor_total_mes: valorTotal / 6,
          ultimo_uso: new Date(trans[0]?.data)
        });
      });

      // Análise de horários de transações
      const horariosMap = new Map<number, { count: number; valor: number }>();

      transacoes.forEach((t: any) => {
        const hora = new Date(t.created_at).getHours();
        const current = horariosMap.get(hora) || { count: 0, valor: 0 };
        horariosMap.set(hora, {
          count: current.count + 1,
          valor: current.valor + Number(t.valor)
        });
      });

      const horariosPatterns = Array.from(horariosMap.entries())
        .map(([hora, data]) => ({
          hora,
          frequencia: data.count,
          valor_medio: data.valor / data.count,
          tipos_transacao: ['despesa'] // Poderia expandir para outros tipos
        }))
        .sort((a, b) => b.frequencia - a.frequencia)
        .slice(0, 5); // Top 5 horários

      return {
        gastos: padroesGastos,
        categorias: categoriasFrequencia.sort((a, b) => b.valor_total_mes - a.valor_total_mes),
        horarios: horariosPatterns
      };

    } catch (error) {
      console.warn('Erro ao analisar padrões:', error);
      return { gastos: [], categorias: [], horarios: [] };
    }
  }

  private getMostFrequent(arr: number[]): number {
    const frequency = new Map<number, number>();
    arr.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });

    let maxFreq = 0;
    let mostFrequent = 0;

    frequency.forEach((freq, item) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mostFrequent = item;
      }
    });

    return mostFrequent;
  }

  private async getProjecoes(userId: string) {
    try {
      const projecoes = [];
      const now = new Date();

      // Projetar próximos 3 meses
      for (let i = 1; i <= 3; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        const mes = futureDate.getMonth() + 1;
        const ano = futureDate.getFullYear();

        // Buscar indicadores históricos para estimar
        const { data: historico } = await supabase
          .from('app_indicadores')
          .select('receitas_confirmadas, despesas_confirmadas')
          .eq('user_id', userId)
          .order('ano', { ascending: false })
          .order('mes', { ascending: false })
          .limit(3);

        // Calcular médias dos últimos 3 meses
        let receitasMedia = 0;
        let despesasMedia = 0;

        if (historico && historico.length > 0) {
          receitasMedia = historico.reduce((sum, h) => sum + Number(h.receitas_confirmadas || 0), 0) / historico.length;
          despesasMedia = historico.reduce((sum, h) => sum + Number(h.despesas_confirmadas || 0), 0) / historico.length;
        }

        // Buscar metas que vencerão
        const { data: metas } = await supabase
          .from('app_meta_financeira')
          .select('valor_meta')
          .eq('user_id', userId)
          .lte('data_fim', new Date(ano, mes, 0).toISOString())
          .gte('data_fim', new Date(ano, mes - 1, 1).toISOString());

        const metasVencer = metas?.reduce((sum, m) => sum + Number(m.valor_meta), 0) || 0;

        // Buscar orçamentos do mês
        const { data: orcamentos } = await supabase
          .from('app_orcamento')
          .select('valor, categoria_id')
          .eq('user_id', userId)
          .eq('mes', mes)
          .eq('ano', ano);

        const orcamentoTotal = orcamentos?.reduce((sum, o) => sum + Number(o.valor), 0) || despesasMedia;

        // Calcular risco de orçamento
        const orcamentosRisco = despesasMedia > orcamentoTotal ? 1 : 0;

        projecoes.push({
          mes,
          ano,
          saldo_projetado: receitasMedia - despesasMedia,
          receitas_previstas: receitasMedia,
          despesas_previstas: despesasMedia,
          metas_a_vencer: metasVencer,
          orcamentos_em_risco: orcamentosRisco
        });
      }

      return projecoes;

    } catch (error) {
      console.warn('Erro ao calcular projeções:', error);
      return [];
    }
  }

  private async getLancamentosFuturos(userId: string) {
    try {
      const hoje = new Date();
      const proximoMes = new Date();
      proximoMes.setMonth(proximoMes.getMonth() + 1);

      // Buscar transações recorrentes ativas
      const { data: recorrentes } = await supabase
        .from('app_transacoes_fixas')
        .select(`
          id,
          descricao,
          valor,
          tipo,
          dia_mes,
          categoria_id,
          conta_id,
          app_categoria!inner(nome),
          app_conta!inner(nome)
        `)
        .eq('user_id', userId)
        .eq('ativo', true)
        .or(`data_fim.is.null,data_fim.gte.${proximoMes.toISOString()}`);

      // Buscar parcelas futuras
      const { data: parcelas } = await supabase
        .from('app_transacoes')
        .select(`
          descricao,
          valor,
          tipo,
          data,
          parcela_atual,
          total_parcelas,
          categoria_id,
          conta_id,
          app_categoria!inner(nome),
          app_conta!inner(nome)
        `)
        .eq('user_id', userId)
        .eq('status', 'pendente')
        .gte('data', hoje.toISOString())
        .lte('data', proximoMes.toISOString())
        .not('grupo_parcelamento', 'is', null);

      const lancamentos: any[] = [];

      // Adicionar recorrentes
      recorrentes?.forEach((rec: any) => {
        const dataProxima = new Date(hoje.getFullYear(), hoje.getMonth(), rec.dia_mes);
        if (dataProxima < hoje) {
          dataProxima.setMonth(dataProxima.getMonth() + 1);
        }

        lancamentos.push({
          id: rec.id,
          descricao: rec.descricao,
          valor: Number(rec.valor),
          data: dataProxima,
          tipo: rec.tipo as 'receita' | 'despesa',
          categoria_nome: rec.app_categoria?.nome || 'Categoria',
          conta_nome: rec.app_conta?.nome || 'Conta',
          origem: 'recorrente' as const
        });
      });

      // Adicionar parcelas
      parcelas?.forEach((parc: any) => {
        lancamentos.push({
          id: parc.id,
          descricao: `${parc.descricao} (${parc.parcela_atual}/${parc.total_parcelas})`,
          valor: Number(parc.valor),
          data: new Date(parc.data),
          tipo: parc.tipo as 'receita' | 'despesa',
          categoria_nome: parc.app_categoria?.nome || 'Categoria',
          conta_nome: parc.app_conta?.nome || 'Conta',
          origem: 'parcelado' as const
        });
      });

      return lancamentos.sort((a, b) => a.data.getTime() - b.data.getTime());

    } catch (error) {
      console.warn('Erro ao buscar lançamentos futuros:', error);
      return [];
    }
  }

  private async getMensagensRecentes(userId: string) {
    // Por enquanto retorna vazio - será implementado quando criarmos a tabela app_historico_chat
    // Na FASE 2 do plano, implementaremos o histórico completo
    return [];
  }

  private async getIntencoesAnteriores(userId: string) {
    // Por enquanto retorna vazio - será implementado com a tabela app_memoria_ia
    // Na FASE 2 do plano, implementaremos o tracking de intenções
    return [];
  }

  private async getOperacoesRealizadas(userId: string) {
    try {
      // Buscar últimas transações criadas como proxy de operações
      const { data: transacoes } = await supabase
        .from('app_transacoes')
        .select(`
          id,
          descricao,
          valor,
          tipo,
          created_at,
          status
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const operacoes = transacoes?.map((t: any) => ({
        id: `op_${t.id}`,
        tipo: 'transacao_criada',
        dados: {
          descricao: t.descricao,
          valor: t.valor,
          tipo: t.tipo
        },
        timestamp: new Date(t.created_at),
        sucesso: t.status === 'confirmado',
        impacto_financeiro: `${t.tipo === 'receita' ? '+' : '-'}${this.formatCurrency(t.valor)}`
      })) || [];

      return operacoes;

    } catch (error) {
      console.warn('Erro ao buscar operações:', error);
      return [];
    }
  }

  private async getPreferenciasContextuais(userId: string) {
    try {
      // Analisar padrões das transações para inferir preferências
      const { data: categoriasMaisUsadas } = await supabase
        .from('app_transacoes')
        .select('categoria_id, app_categoria!inner(nome)')
        .eq('user_id', userId)
        .limit(100);

      const preferenciasCategorias = new Map<string, number>();

      categoriasMaisUsadas?.forEach((t: any) => {
        const nome = t.app_categoria?.nome;
        if (nome) {
          preferenciasCategorias.set(nome, (preferenciasCategorias.get(nome) || 0) + 1);
        }
      });

      const preferencias = Array.from(preferenciasCategorias.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([categoria, frequencia]) => ({
          contexto: 'categoria_preferida',
          preferencia: categoria,
          aprendido_em: new Date(),
          usado_vezes: frequencia
        }));

      return preferencias;

    } catch (error) {
      console.warn('Erro ao buscar preferências:', error);
      return [];
    }
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  private async generateRelevantInsights(userId: string, query: string) {
    // TODO: Implementar geração de insights relevantes
    return [];
  }

  private async logContextChange(userId: string, change: ContextChange) {
    try {
      await supabase
        .from('app_ai_context_log')
        .insert({
          user_id: userId,
          change_type: change.type,
          change_data: change.data,
          timestamp: change.timestamp
        });
    } catch (error) {
      console.warn('Não foi possível logar mudança de contexto:', error);
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      default_account_id: undefined,
      default_categories: {},
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notification_settings: {
        budget_alerts: true,
        goal_reminders: true,
        transaction_confirmations: true,
        insights_weekly: true
      }
    };
  }

  private getDefaultSettings(): UserSettings {
    return {
      currency: 'BRL',
      date_format: 'DD/MM/YYYY',
      number_format: 'pt-BR',
      dark_mode: false
    };
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }
}

// Instância única exportada
export const aiContextManager = AIContextManager.getInstance(); 