import { BaseApi } from './BaseApi';
import type { Database } from '../supabase/types';

type RecurrentTransaction = Database['public']['Tables']['app_transacoes_fixas']['Row'];
type RecurrentTransactionInsert = Database['public']['Tables']['app_transacoes_fixas']['Insert'];
type RecurrentTransactionUpdate = Database['public']['Tables']['app_transacoes_fixas']['Update'];

export interface RecurrentTransactionData {
  id: number;
  user_id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa' | 'despesa_cartao';
  categoria_id: number;
  conta_id?: number;
  cartao_id?: number;
  dia_mes: number;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateRecurrentTransactionRequest {
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa' | 'despesa_cartao';
  categoria_id: number;
  conta_id?: number;
  cartao_id?: number;
  dia_mes?: number;
  data_inicio: string;
  data_fim?: string;
  observacoes?: string;
}

export interface ProcessRecurrentResult {
  lancamentos_criados: number;
  proximas_execucoes: Array<{
    id: number;
    descricao: string;
    proxima_execucao: string;
  }>;
}

export class RecurrentTransactionService extends BaseApi {
  /**
   * Lista todos os lançamentos recorrentes do usuário
   */
  async getRecurrentTransactions(): Promise<RecurrentTransactionData[]> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .select(`
        *,
        app_categoria (
          nome,
          cor,
          icone
        ),
        app_conta (
          nome
        ),
        app_cartao_credito (
          nome
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar lançamentos recorrentes:', error);
      throw error;
    }

    return data as RecurrentTransactionData[];
  }

  /**
   * Busca lançamentos recorrentes ativos
   */
  async getActiveRecurrentTransactions(): Promise<RecurrentTransactionData[]> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .select(`
        *,
        app_categoria (
          nome,
          cor,
          icone
        ),
        app_conta (
          nome
        ),
        app_cartao_credito (
          nome
        )
      `)
      .eq('user_id', user.id)
      .eq('ativo', true)
      .order('proxima_execucao', { ascending: true });

    if (error) {
      console.error('Erro ao buscar lançamentos recorrentes ativos:', error);
      throw error;
    }

    return data as RecurrentTransactionData[];
  }

  /**
   * Busca lançamentos que devem ser executados hoje ou estão atrasados
   */
  async getPendingRecurrentTransactions(): Promise<RecurrentTransactionData[]> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .select(`
        *,
        app_categoria (
          nome,
          cor,
          icone
        ),
        app_conta (
          nome
        ),
        app_cartao_credito (
          nome
        )
      `)
      .eq('user_id', user.id)
      .eq('ativo', true)
      .lte('proxima_execucao', today)
      .order('proxima_execucao', { ascending: true });

    if (error) {
      console.error('Erro ao buscar lançamentos pendentes:', error);
      throw error;
    }

    return data as RecurrentTransactionData[];
  }

  /**
   * Cria um novo lançamento recorrente
   */
  async createRecurrentTransaction(data: CreateRecurrentTransactionRequest): Promise<RecurrentTransactionData> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Validações
    if (!data.dia_mes) {
      throw new Error('Dia do mês é obrigatório');
    }

    if (!data.conta_id && !data.cartao_id) {
      throw new Error('Deve informar uma conta ou cartão');
    }

    if (data.conta_id && data.cartao_id) {
      throw new Error('Não pode informar conta e cartão ao mesmo tempo');
    }

    const insertData = {
      user_id: user.id,
      descricao: data.descricao,
      valor: data.valor,
      tipo: data.tipo,
      categoria_id: data.categoria_id,
      conta_id: data.conta_id || null,
      cartao_id: data.cartao_id || null,
      dia_mes: data.dia_mes,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim || null,
      ativo: true,
      observacoes: data.observacoes || null
    };

    const { data: result, error } = await this.supabase
      .from('app_transacoes_fixas')
      .insert(insertData)
      .select()
      .single();

    console.log('[RecurrentTransactionService] Resposta do Supabase:', { data: result, error });

    if (error) {
      console.error('Erro ao criar lançamento recorrente:', error);
      throw error;
    }

    return result as RecurrentTransactionData;
  }

  /**
   * Atualiza um lançamento recorrente
   */
  async updateRecurrentTransaction(
    id: number, 
    updates: Partial<CreateRecurrentTransactionRequest>
  ): Promise<RecurrentTransactionData> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Se atualizou dados que afetam o cálculo da próxima execução, recalcular
    const needsRecalculation = updates.data_inicio || updates.intervalo || updates.dia_mes;
    
    let updateData: RecurrentTransactionUpdate = { ...updates };
    
    if (needsRecalculation && updates.data_inicio && updates.tipo_recorrencia && updates.tipo_recorrencia === 'fixo') {
      updateData.proxima_execucao = this.calculateNextExecution(
        updates.data_inicio,
        updates.tipo_recorrencia,
        updates.intervalo,
        updates.dia_mes
      );
    }

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar lançamento recorrente:', error);
      throw error;
    }

    return data as RecurrentTransactionData;
  }

  /**
   * Ativa/desativa um lançamento recorrente
   */
  async toggleRecurrentTransaction(id: number, ativo: boolean): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await this.supabase
      .from('app_transacoes_fixas')
      .update({ ativo })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao alterar status do lançamento recorrente:', error);
      throw error;
    }
  }

  /**
   * Deleta um lançamento recorrente
   */
  async deleteRecurrentTransaction(id: number): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await this.supabase
      .from('app_transacoes_fixas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar lançamento recorrente:', error);
      throw error;
    }
  }

  /**
   * Processa lançamentos recorrentes pendentes (executa a função do banco)
   */
  async processRecurrentTransactions(): Promise<ProcessRecurrentResult> {
    const { data: lancamentosCriados, error } = await this.supabase
      .rpc('processar_lancamentos_recorrentes');

    if (error) {
      console.error('Erro ao processar lançamentos recorrentes:', error);
      throw error;
    }

    // Buscar próximas execuções para retornar
    const proximasExecucoes = await this.getUpcomingExecutions();

    return {
      lancamentos_criados: lancamentosCriados || 0,
      proximas_execucoes: proximasExecucoes
    };
  }

  /**
   * Busca próximas execuções (próximos 30 dias)
   */
  async getUpcomingExecutions(): Promise<Array<{ id: number; descricao: string; proxima_execucao: string }>> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .select('id, descricao, proxima_execucao')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .gte('proxima_execucao', today.toISOString().split('T')[0])
      .lte('proxima_execucao', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('proxima_execucao', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Erro ao buscar próximas execuções:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Calcula a próxima data de execução para um lançamento
   */
  private calculateNextExecution(
    dataInicio: string,
    tipoRecorrencia?: 'fixo' | 'parcelado',
    intervalo?: string,
    diaMes?: number
  ): string {
    const startDate = new Date(dataInicio);
    const today = new Date();
    
    if (tipoRecorrencia === 'parcelado') {
      // Para parcelados, próxima execução é sempre no próximo mês na mesma data
      const nextMonth = new Date(startDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.toISOString().split('T')[0];
    }

    // Para fixos, calcular baseado no intervalo
    let nextDate = new Date(startDate);

    if (intervalo === 'mensal') {
      if (diaVencimento) {
        // Ajustar para o dia de vencimento especificado
        nextDate = new Date(today.getFullYear(), today.getMonth(), diaVencimento);
        
        // Se a data já passou este mês, vai para o próximo mês
        if (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
    } else if (intervalo === 'quinzenal') {
      nextDate.setDate(nextDate.getDate() + 15);
    } else if (intervalo === 'semanal') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (intervalo === 'anual') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    // Garantir que a próxima execução seja no futuro
    while (nextDate <= today) {
      if (intervalo === 'mensal') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (intervalo === 'quinzenal') {
        nextDate.setDate(nextDate.getDate() + 15);
      } else if (intervalo === 'semanal') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (intervalo === 'anual') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }
    }

    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Busca estatísticas dos lançamentos recorrentes
   */
  async getRecurrentTransactionStats(): Promise<{
    total_ativo: number;
    total_inativo: number;
    proximas_receitas: number;
    proximas_despesas: number;
    receita_mensal_recorrente: number;
    despesa_mensal_recorrente: number;
  }> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }

    if (!data) return {
      total_ativo: 0,
      total_inativo: 0,
      proximas_receitas: 0,
      proximas_despesas: 0,
      receita_mensal_recorrente: 0,
      despesa_mensal_recorrente: 0
    };

    const ativos = data.filter(item => item.ativo);
    const inativos = data.filter(item => !item.ativo);
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const proximos = ativos.filter(item => {
      const proximaExecucao = new Date(item.proxima_execucao);
      return proximaExecucao >= today && proximaExecucao <= thirtyDaysFromNow;
    });

    const proximasReceitas = proximos.filter(item => item.tipo === 'receita').length;
    const proximasDespesas = proximos.filter(item => item.tipo === 'despesa').length;

    // Calcular valor mensal recorrente (apenas fixos mensais)
    const mensaisFixos = ativos.filter(item => 
      item.tipo_recorrencia === 'fixo' && item.intervalo === 'mensal'
    );

    const receitaMensalRecorrente = mensaisFixos
      .filter(item => item.tipo === 'receita')
      .reduce((sum, item) => sum + (item.valor || 0), 0);

    const despesaMensalRecorrente = mensaisFixos
      .filter(item => item.tipo === 'despesa')
      .reduce((sum, item) => sum + (item.valor || 0), 0);

    return {
      total_ativo: ativos.length,
      total_inativo: inativos.length,
      proximas_receitas: proximasReceitas,
      proximas_despesas: proximasDespesas,
      receita_mensal_recorrente: receitaMensalRecorrente,
      despesa_mensal_recorrente: despesaMensalRecorrente
    };
  }
}

export const recurrentTransactionService = new RecurrentTransactionService();
export default recurrentTransactionService; 