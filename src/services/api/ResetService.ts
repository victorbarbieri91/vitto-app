import { supabase } from '../supabase/client';

export interface DataSummary {
  transacoes: number;
  transacoes_fixas: number;
  contas: number;
  cartoes: number;
  faturas: number;
  orcamentos: number;
  metas: number;
  patrimonio: number;
  chat_sessoes: number;
  chat_mensagens: number;
  indicadores: number;
  saldo_historico: number;
  grupos: number;
  memoria_ia: number;
  total: number;
}

export interface ResetResult {
  success: boolean;
  deletedCounts: Record<string, number | string>;
}

export class ResetService {
  /**
   * Busca resumo de todos os dados do usuário para exibir no modal de confirmação
   */
  async getDataSummary(): Promise<DataSummary> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Executar todas as contagens em paralelo
    const [
      transacoes,
      transacoes_fixas,
      contas,
      cartoes,
      faturas,
      orcamentos,
      metas,
      patrimonio,
      chat_sessoes,
      indicadores,
      saldo_historico,
      grupos,
      memoria_ia
    ] = await Promise.all([
      supabase.from('app_transacoes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('app_transacoes_fixas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('app_conta').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('app_cartao_credito').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      this.countFaturas(user.id),
      supabase.from('app_orcamento').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('app_meta_financeira').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('app_patrimonio_ativo').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('app_chat_sessoes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('app_indicadores').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('app_saldo_historico').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('app_grupo_compartilhado').select('id', { count: 'exact', head: true }).eq('criado_por', user.id),
      supabase.from('app_memoria_ia').select('id', { count: 'exact', head: true }).eq('usuario_id', user.id),
    ]);

    // Contar mensagens de chat (dependem das sessões)
    const { count: chat_mensagens_count } = await supabase
      .from('app_chat_mensagens')
      .select('id', { count: 'exact', head: true })
      .in('sessao_id',
        (await supabase.from('app_chat_sessoes').select('id').eq('user_id', user.id)).data?.map(s => s.id) || []
      );

    const summary: DataSummary = {
      transacoes: transacoes.count || 0,
      transacoes_fixas: transacoes_fixas.count || 0,
      contas: contas.count || 0,
      cartoes: cartoes.count || 0,
      faturas: faturas || 0,
      orcamentos: orcamentos.count || 0,
      metas: metas.count || 0,
      patrimonio: patrimonio.count || 0,
      chat_sessoes: chat_sessoes.count || 0,
      chat_mensagens: chat_mensagens_count || 0,
      indicadores: indicadores.count || 0,
      saldo_historico: saldo_historico.count || 0,
      grupos: grupos.count || 0,
      memoria_ia: memoria_ia.count || 0,
      total: 0
    };

    // Calcular total
    summary.total = Object.values(summary).reduce((a, b) => a + b, 0) - summary.total;

    return summary;
  }

  /**
   * Conta faturas (dependem dos cartões do usuário)
   */
  private async countFaturas(userId: string): Promise<number> {
    // Primeiro buscar IDs dos cartões do usuário
    const { data: cartoes } = await supabase
      .from('app_cartao_credito')
      .select('id')
      .eq('user_id', userId);

    if (!cartoes || cartoes.length === 0) return 0;

    const { count } = await supabase
      .from('app_fatura')
      .select('id', { count: 'exact', head: true })
      .in('cartao_id', cartoes.map(c => c.id));

    return count || 0;
  }

  /**
   * Reseta todos os dados do usuário
   * Chama a stored procedure reset_user_data que executa em transação
   */
  async resetAllData(): Promise<ResetResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase.rpc('reset_user_data', {
      target_user_id: user.id
    });

    if (error) {
      console.error('Erro ao resetar dados:', error);
      throw new Error(error.message || 'Erro ao resetar dados');
    }

    return {
      success: true,
      deletedCounts: data as Record<string, number | string>
    };
  }
}

export const resetService = new ResetService();
export default resetService;
