import { BaseApi } from './BaseApi';
import type { User } from '@supabase/supabase-js';

/**
 * Interface para histórico de saldo
 */
export interface SaldoHistorico {
  id: number;
  user_id: string;
  conta_id: number;
  data_referencia: string;
  saldo_anterior: number;
  saldo_novo: number;
  tipo_operacao: 'inicial' | 'ajuste_manual' | 'transacao';
  lancamento_ajuste_id?: number;
  observacoes?: string;
  created_at: string;
}

/**
 * Interface para métricas financeiras
 */
export interface MetricasFinanceiras {
  saldo_atual: number;
  saldo_previsto: number;
  receitas_confirmadas: number;
  despesas_confirmadas: number;
  receitas_pendentes: number;
  despesas_pendentes: number;
  fluxo_liquido: number;
  // Novos campos do saldo previsto consolidado do mês
  saldo_base_atual: number;
  total_receitas_mes: number;
  total_despesas_mes: number;
  resultado_mes: number;
  saldo_previsto_fim_mes: number;
}

/**
 * Interface para indicadores mensais do app_indicadores
 */
export interface IndicadoresMes {
  id: number;
  user_id: string;
  conta_id: number;
  mes: number;
  ano: number;
  saldo_inicial: number;
  saldo_atual: number;
  saldo_previsto: number;
  receitas_confirmadas: number;
  despesas_confirmadas: number;
  receitas_pendentes: number;
  despesas_pendentes: number;
  fluxo_liquido: number;
  projecao_fim_mes: number;
  taxa_economia: number;
  ultima_atualizacao: string;
}

/**
 * Interface para dados de ajuste de saldo
 */
export interface DadosAjusteSaldo {
  conta_id: number;
  saldo_atual_calculado: number;
  novo_saldo: number;
  diferenca: number;
  observacoes?: string;
}

/**
 * Service para gerenciar todos os cálculos relacionados a saldo
 */
export class SaldoService extends BaseApi {

  /**
   * Calcula o saldo atual de um usuário até uma data específica
   */
  async calcularSaldoAtual(
    userId?: string, 
    dataLimite?: string, 
    contaId?: number
  ): Promise<number> {
    try {
      const user = userId ? { id: userId } as User : await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase.rpc('calcular_saldo_atual', {
        p_user_id: user.id,
        p_data_limite: dataLimite || new Date().toISOString().split('T')[0],
        p_conta_id: contaId || null
      });

      if (error) throw error;
      return Number(data) || 0;
    } catch (error) {
      throw this.handleError(error, 'Erro ao calcular saldo atual');
    }
  }

  /**
   * Calcula o saldo previsto incluindo transações futuras
   */
  async calcularSaldoPrevisto(
    userId?: string, 
    dataLimite?: string, 
    contaId?: number
  ): Promise<number> {
    try {
      const user = userId ? { id: userId } as User : await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Data limite padrão: fim do mês atual
      const defaultDataLimite = (() => {
        const now = new Date();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return this.formatDateToISO(lastDayOfMonth);
      })();

      const { data, error } = await this.supabase.rpc('calcular_saldo_previsto', {
        p_user_id: user.id,
        p_data_limite: dataLimite || defaultDataLimite,
        p_conta_id: contaId || null
      });

      if (error) throw error;
      return Number(data) || 0;
    } catch (error) {
      throw this.handleError(error, 'Erro ao calcular saldo previsto');
    }
  }

  /**
   * Calcula saldo de uma conta específica
   */
  async calcularSaldoConta(contaId: number, dataLimite?: string): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('calcular_saldo_conta', {
        p_conta_id: contaId,
        p_data_limite: dataLimite || new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      return Number(data) || 0;
    } catch (error) {
      throw this.handleError(error, 'Erro ao calcular saldo da conta');
    }
  }

  /**
   * Obtém métricas financeiras consolidadas de um mês
   */
  async obterMetricasFinanceiras(
    mes?: number, 
    ano?: number, 
    userId?: string
  ): Promise<MetricasFinanceiras> {
    try {
      const user = userId ? { id: userId } as User : await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const now = new Date();
      const mesAtual = mes || (now.getMonth() + 1);
      const anoAtual = ano || now.getFullYear();

      const { data, error } = await this.supabase.rpc('obter_metricas_financeiras', {
        p_user_id: user.id,
        p_mes: mesAtual,
        p_ano: anoAtual
      });

      if (error) throw error;
      if (!data || data.length === 0) {
        return {
          saldo_atual: 0,
          saldo_previsto: 0,
          receitas_confirmadas: 0,
          despesas_confirmadas: 0,
          receitas_pendentes: 0,
          despesas_pendentes: 0,
          fluxo_liquido: 0,
          saldo_base_atual: 0,
          total_receitas_mes: 0,
          total_despesas_mes: 0,
          resultado_mes: 0,
          saldo_previsto_fim_mes: 0
        };
      }

      const metrics = data[0];
      return {
        saldo_atual: Number(metrics.saldo_atual) || 0,
        saldo_previsto: Number(metrics.saldo_previsto) || 0,
        receitas_confirmadas: Number(metrics.receitas_confirmadas) || 0,
        despesas_confirmadas: Number(metrics.despesas_confirmadas) || 0,
        receitas_pendentes: Number(metrics.receitas_pendentes) || 0,
        despesas_pendentes: Number(metrics.despesas_pendentes) || 0,
        fluxo_liquido: Number(metrics.fluxo_liquido) || 0,
        saldo_base_atual: Number(metrics.saldo_base_atual) || 0,
        total_receitas_mes: Number(metrics.total_receitas_mes) || 0,
        total_despesas_mes: Number(metrics.total_despesas_mes) || 0,
        resultado_mes: Number(metrics.resultado_mes) || 0,
        saldo_previsto_fim_mes: Number(metrics.saldo_previsto_fim_mes) || 0
      };
    } catch (error) {
      throw this.handleError(error, 'Erro ao obter métricas financeiras');
    }
  }

  /**
   * Realiza ajuste manual de saldo de uma conta
   */
  async ajustarSaldoConta(dadosAjuste: DadosAjusteSaldo): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter categoria de ajuste de saldo
      const { data: categoria } = await this.supabase
        .from('app_categoria')
        .select('id')
        .eq('nome', 'Ajuste de Saldo')
        .eq('is_default', true)
        .single();

      if (!categoria) throw new Error('Categoria "Ajuste de Saldo" não encontrada');

      // Determinar tipo de lançamento baseado na diferença
      const isReceita = dadosAjuste.diferenca > 0;
      const valorAbsoluto = Math.abs(dadosAjuste.diferenca);

      // Criar lançamento de ajuste
      const { data: lancamento, error: lancamentoError } = await this.supabase
        .from('app_transacoes')
        .insert({
          descricao: `Ajuste manual de saldo`,
          valor: valorAbsoluto,
          data: new Date().toISOString().split('T')[0],
          tipo: isReceita ? 'receita' : 'despesa',
          categoria_id: categoria.id,
          conta_id: dadosAjuste.conta_id,
          user_id: user.id,
          status: 'confirmado',
          tipo_especial: 'ajuste_manual',
          observacoes: dadosAjuste.observacoes
        })
        .select()
        .single();

      if (lancamentoError) throw lancamentoError;

      // Registrar no histórico de saldo
      const { error: historicoError } = await this.supabase
        .from('app_saldo_historico')
        .insert({
          user_id: user.id,
          conta_id: dadosAjuste.conta_id,
          data_referencia: new Date().toISOString().split('T')[0],
          saldo_anterior: dadosAjuste.saldo_atual_calculado,
          saldo_novo: dadosAjuste.novo_saldo,
          tipo_operacao: 'ajuste_manual',
          lancamento_ajuste_id: lancamento.id,
          observacoes: dadosAjuste.observacoes || 'Ajuste manual de saldo'
        });

      if (historicoError) throw historicoError;

    } catch (error) {
      throw this.handleError(error, 'Erro ao ajustar saldo da conta');
    }
  }

  /**
   * Obtém histórico de saldo de uma conta
   */
  async obterHistoricoSaldo(contaId: number): Promise<SaldoHistorico[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase
        .from('app_saldo_historico')
        .select('*')
        .eq('user_id', user.id)
        .eq('conta_id', contaId)
        .order('data_referencia', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Erro ao obter histórico de saldo');
    }
  }

  /**
   * Valida consistência entre saldo calculado e registrado de uma conta
   */
  async validarConsistenciaSaldo(contaId: number): Promise<{
    conta_nome: string;
    saldo_registrado: number;
    saldo_calculado: number;
    diferenca: number;
    consistente: boolean;
  }> {
    try {
      // Obter dados da conta
      const { data: conta, error: contaError } = await this.supabase
        .from('app_conta')
        .select('nome, saldo_atual')
        .eq('id', contaId)
        .single();

      if (contaError) throw contaError;

      // Calcular saldo atual
      const saldoCalculado = await this.calcularSaldoConta(contaId);
      const saldoRegistrado = Number(conta.saldo_atual) || 0;
      const diferenca = saldoCalculado - saldoRegistrado;

      return {
        conta_nome: conta.nome,
        saldo_registrado: saldoRegistrado,
        saldo_calculado: saldoCalculado,
        diferenca,
        consistente: Math.abs(diferenca) < 0.01 // Tolerância de 1 centavo
      };
    } catch (error) {
      throw this.handleError(error, 'Erro ao validar consistência de saldo');
    }
  }

  /**
   * Busca indicadores de um mês específico
   */
  async getIndicadoresMes(mes: number, ano: number, contaId?: number): Promise<IndicadoresMes | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const query = this.supabase
        .from('app_indicadores')
        .select('*')
        .eq('user_id', user.id)
        .eq('mes', mes)
        .eq('ano', ano);

      if (contaId) {
        query.eq('conta_id', contaId);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Erro ao buscar indicadores:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar indicadores do mês:', error);
      return null;
    }
  }

  /**
   * Força recálculo de indicadores de um mês
   */
  async recalcularMes(mes: number, ano: number, contaId: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const { error } = await this.supabase.rpc('atualizar_indicadores_mes', {
        p_user_id: user.id,
        p_conta_id: contaId,
        p_mes: mes,
        p_ano: ano
      });

      if (error) {
        console.error('Erro ao recalcular indicadores:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao recalcular indicadores do mês:', error);
      return false;
    }
  }

  /**
   * Obtém resumo de saldos por período para navegação mensal
   */
  async obterResumoSaldosPorPeriodo(
    mesInicio: number, 
    anoInicio: number,
    mesesAFrente: number = 12
  ): Promise<Array<{
    mes: number;
    ano: number;
    saldo_inicial_periodo: number;
    saldo_final_periodo: number;
    receitas: number;
    despesas: number;
    fluxo_liquido: number;
  }>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const resultados = [];
      
      for (let i = 0; i < mesesAFrente; i++) {
        const dataAtual = new Date(anoInicio, mesInicio - 1 + i, 1);
        const mes = dataAtual.getMonth() + 1;
        const ano = dataAtual.getFullYear();
        
        const indicadores = await this.getIndicadoresMes(mes, ano);
        
        if (indicadores) {
          resultados.push({
            mes,
            ano,
            saldo_inicial_periodo: indicadores.saldo_inicial,
            saldo_final_periodo: indicadores.saldo_atual,
            receitas: indicadores.receitas_confirmadas,
            despesas: indicadores.despesas_confirmadas,
            fluxo_liquido: indicadores.fluxo_liquido
          });
        }
      }
      
      return resultados;
    } catch (error) {
      throw this.handleError(error, 'Erro ao obter resumo de saldos por período');
    }
  }
}

// Instância singleton do service
export const saldoService = new SaldoService();