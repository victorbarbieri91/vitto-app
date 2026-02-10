import { BaseApi } from './BaseApi';
// Database types removed - unused (TS6196)

export interface FinancialIndicators {
  id: number;
  user_id: string;
  conta_id: number | null;
  mes: number | null;
  ano: number | null;
  saldo_inicial: number;
  saldo_atual: number;
  saldo_previsto: number;
  receitas_confirmadas: number;
  despesas_confirmadas: number;
  receitas_pendentes: number;
  despesas_pendentes: number;
  receitas_recorrentes: number;
  despesas_recorrentes: number;
  fatura_atual: number;
  fatura_proxima: number;
  fluxo_liquido: number;
  projecao_fim_mes: number;
  score_saude_financeira: number;
  ultima_atualizacao: string;
}

export interface DashboardSummary {
  saldo_total_atual: number;
  saldo_total_previsto: number;
  receitas_mes: number;
  despesas_mes: number;
  projecao_fim_mes: number;
  score_medio_saude: number;
  economia_mes: number;
  taxa_economia: number;
  tipo_periodo: 'passado' | 'atual' | 'futuro';
  contas: Array<{
    conta_id: number;
    nome_conta: string;
    saldo_atual: number;
    saldo_previsto: number;
    variacao_percentual: number;
  }>;
}

/**
 *
 */
export class IndicatorsService extends BaseApi {
  /**
   * Busca indicadores de uma conta específica para um mês/ano
   */
  async getIndicatorsByAccount(
    contaId: number, 
    mes?: number, 
    ano?: number
  ): Promise<FinancialIndicators | null> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const currentDate = new Date();
    const targetMes = mes || currentDate.getMonth() + 1;
    const targetAno = ano || currentDate.getFullYear();

    const { data, error } = await this.supabase
      .from('app_indicadores')
      .select('*')
      .eq('user_id', user.id)
      .eq('conta_id', contaId)
      .eq('mes', targetMes)
      .eq('ano', targetAno)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar indicadores da conta:', error);
      throw error;
    }

    return data as FinancialIndicators | null;
  }

  /**
   * Busca todos os indicadores do usuário para um período
   */
  async getUserIndicators(mes?: number, ano?: number): Promise<FinancialIndicators[]> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const currentDate = new Date();
    const targetMes = mes || currentDate.getMonth() + 1;
    const targetAno = ano || currentDate.getFullYear();

    const { data, error } = await this.supabase
      .from('app_indicadores')
      .select(`
        *,
        app_conta (
          nome,
          tipo,
          moeda
        )
      `)
      .eq('user_id', user.id)
      .eq('mes', targetMes)
      .eq('ano', targetAno)
      .order('ultima_atualizacao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar indicadores do usuário:', error);
      throw error;
    }

    return data as FinancialIndicators[];
  }

  /**
   * Força recálculo dos indicadores de uma conta
   */
  async refreshAccountIndicators(contaId: number): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await this.supabase.rpc('refresh_indicadores_conta', {
      p_conta_id: contaId,
      p_user_id: user.id
    });

    if (error) {
      console.error('Erro ao recalcular indicadores:', error);
      throw error;
    }
  }

  /**
   * Força recálculo dos indicadores de todas as contas do usuário
   */
  async refreshAllUserIndicators(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar todas as contas do usuário
    const { data: contas, error: contasError } = await this.supabase
      .from('app_conta')
      .select('id')
      .eq('user_id', user.id);

    if (contasError) {
      console.error('Erro ao buscar contas:', contasError);
      throw contasError;
    }

    // Recalcular indicadores para cada conta
    for (const conta of contas) {
      await this.refreshAccountIndicators(conta.id);
    }
  }

  /**
   * Gera resumo do dashboard usando a função SQL corrigida
   */
  async getDashboardSummary(mes?: number, ano?: number): Promise<DashboardSummary> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const currentDate = new Date();
    const targetMes = mes || currentDate.getMonth() + 1;
    const targetAno = ano || currentDate.getFullYear();

    // Usar a função SQL corrigida que elimina duplicação
    const { data, error } = await this.supabase.rpc('obter_dashboard_mes', {
      p_user_id: user.id,
      p_mes: targetMes,
      p_ano: targetAno
    });

    if (error) {
      console.error('Erro ao buscar dashboard:', error);
      throw error;
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Erro ao carregar dados do dashboard');
    }

    const indicadores = data.indicadores_mes;
    const contas = data.contas || [];

    // Formatar dados por conta
    const contasFormatadas = contas.map((conta: any) => ({
      conta_id: conta.id,
      nome_conta: conta.nome,
      saldo_atual: conta.saldo_atual || 0,
      saldo_previsto: conta.saldo_atual || 0, // Por enquanto, pode ser melhorado
      variacao_percentual: 0
    }));

    return {
      saldo_total_atual: indicadores.saldo_atual_total,
      saldo_total_previsto: indicadores.saldo_previsto_fim_mes,
      receitas_mes: indicadores.total_receitas_mes,
      despesas_mes: indicadores.total_despesas_mes,
      projecao_fim_mes: indicadores.saldo_previsto_fim_mes,
      score_medio_saude: Math.round(indicadores.score_saude || 0),
      economia_mes: indicadores.economia_mes,
      taxa_economia: indicadores.taxa_economia,
      tipo_periodo: data.tipo_periodo,
      contas: contasFormatadas
    };
  }

  // NOTE: calculateHealthScore method removed to fix TS6133 - recoverable from git if needed

  /**
   * @deprecated Use getDashboardSummary() instead - agora usa função SQL corrigida
   */
  async getDashboardSummaryComplete(mes?: number, ano?: number): Promise<DashboardSummary> {
    console.warn('getDashboardSummaryComplete is deprecated. Use getDashboardSummary instead.');
    return this.getDashboardSummary(mes, ano);
  }

  /**
   * Busca evolução dos indicadores ao longo do tempo
   */
  async getIndicatorsEvolution(
    contaId?: number, 
    mesesAtras: number = 6
  ): Promise<Array<FinancialIndicators & { periodo: string }>> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const currentDate = new Date();
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - mesesAtras, 1);

    let query = this.supabase
      .from('app_indicadores')
      .select('*')
      .eq('user_id', user.id)
      .gte('ano', targetDate.getFullYear())
      .order('ano', { ascending: true })
      .order('mes', { ascending: true });

    if (contaId) {
      query = query.eq('conta_id', contaId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar evolução dos indicadores:', error);
      throw error;
    }

    return (data || []).map(ind => ({
      ...ind,
      periodo: `${String(ind.mes).padStart(2, '0')}/${ind.ano}`
    })) as Array<FinancialIndicators & { periodo: string }>;
  }

  /**
   * Compara indicadores entre dois períodos
   */
  async compareIndicators(
    mesAtual: number,
    anoAtual: number,
    mesAnterior: number,
    anoAnterior: number
  ): Promise<{
    atual: DashboardSummary;
    anterior: DashboardSummary;
    variacao: {
      saldo_atual: number;
      saldo_previsto: number;
      receitas: number;
      despesas: number;
      score: number;
    };
  }> {
    const [atual, anterior] = await Promise.all([
      this.getDashboardSummary(mesAtual, anoAtual),
      this.getDashboardSummary(mesAnterior, anoAnterior)
    ]);

    const variacao = {
      saldo_atual: atual.saldo_total_atual - anterior.saldo_total_atual,
      saldo_previsto: atual.saldo_total_previsto - anterior.saldo_total_previsto,
      receitas: atual.receitas_mes - anterior.receitas_mes,
      despesas: atual.despesas_mes - anterior.despesas_mes,
      score: atual.score_medio_saude - anterior.score_medio_saude
    };

    return { atual, anterior, variacao };
  }
}

export const indicatorsService = new IndicatorsService();
export default indicatorsService; 