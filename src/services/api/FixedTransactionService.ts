import { supabase } from '../supabase/client';
import { Database } from '../../types/supabase';
import { BaseApi } from './BaseApi';

export type FixedTransaction = Database['public']['Tables']['app_transacoes_fixas']['Row'];
export type NewFixedTransaction = Database['public']['Tables']['app_transacoes_fixas']['Insert'];
export type FixedTransactionUpdate = Database['public']['Tables']['app_transacoes_fixas']['Update'];

export interface CreateFixedTransactionRequest {
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa' | 'despesa_cartao';
  categoria_id: number;
  conta_id?: number;
  cartao_id?: number;
  dia_mes: number;
  data_inicio: string;
  data_fim?: string;
  observacoes?: string;
}

export interface FixedTransactionWithDetails extends FixedTransaction {
  categoria_nome?: string;
  categoria_cor?: string;
  categoria_icone?: string;
  conta_nome?: string;
  cartao_nome?: string;
}

export interface HybridTransaction {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa' | 'despesa_cartao';
  categoria_id: number;
  categoria_nome: string;
  categoria_cor: string;
  categoria_icone: string;
  conta_id?: number;
  conta_nome?: string;
  cartao_id?: number;
  cartao_nome?: string;
  fixo_id?: number;
  origem: 'manual' | 'fixo';
  status: 'pendente' | 'confirmado';
  is_virtual: boolean; // true = transação fixa pendente, false = transação confirmada
}

export class FixedTransactionService extends BaseApi {
  /**
   * Lista todas as transações fixas do usuário
   */
  async list(): Promise<FixedTransactionWithDetails[]> {
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

    if (error) throw error;

    // Mapear os dados para o formato esperado
    const mapped = data?.map(item => ({
      ...item,
      categoria_nome: item.app_categoria?.nome,
      categoria_cor: item.app_categoria?.cor,
      categoria_icone: item.app_categoria?.icone,
      conta_nome: item.app_conta?.nome,
      cartao_nome: item.app_cartao_credito?.nome,
    })) || [];

    return mapped;
  }

  /**
   * Lista apenas transações fixas ativas
   */
  async listActive(): Promise<FixedTransactionWithDetails[]> {
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
      .order('dia_mes', { ascending: true });

    if (error) throw error;

    const mapped = data?.map(item => ({
      ...item,
      categoria_nome: item.app_categoria?.nome,
      categoria_cor: item.app_categoria?.cor,
      categoria_icone: item.app_categoria?.icone,
      conta_nome: item.app_conta?.nome,
      cartao_nome: item.app_cartao_credito?.nome,
    })) || [];

    return mapped;
  }

  /**
   * Busca uma transação fixa específica por ID
   */
  async getById(id: number): Promise<FixedTransaction | null> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * Cria uma nova transação fixa
   */
  async create(request: CreateFixedTransactionRequest): Promise<FixedTransaction> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Validações
    this.validateFixedTransaction(request);

    const fixedTransactionData: NewFixedTransaction = {
      user_id: user.id,
      descricao: request.descricao,
      valor: request.valor,
      tipo: request.tipo,
      categoria_id: request.categoria_id,
      conta_id: request.conta_id || null,
      cartao_id: request.cartao_id || null,
      dia_mes: request.dia_mes,
      data_inicio: request.data_inicio,
      data_fim: request.data_fim || null,
      ativo: true,
      observacoes: request.observacoes || null,
    };

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .insert(fixedTransactionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Atualiza uma transação fixa
   */
  async update(id: number, request: Partial<CreateFixedTransactionRequest>): Promise<FixedTransaction> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se a transação existe e pertence ao usuário
    const existing = await this.getById(id);
    if (!existing) throw new Error('Transação fixa não encontrada');

    // Validações se necessário
    if (request.dia_mes || request.valor || request.tipo) {
      this.validateFixedTransaction({
        descricao: request.descricao || existing.descricao,
        valor: request.valor || existing.valor,
        tipo: request.tipo || existing.tipo,
        categoria_id: request.categoria_id || existing.categoria_id,
        dia_mes: request.dia_mes || existing.dia_mes,
        data_inicio: request.data_inicio || existing.data_inicio,
      });
    }

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .update(request)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Ativa/desativa uma transação fixa
   */
  async toggle(id: number, ativo: boolean): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await this.supabase
      .from('app_transacoes_fixas')
      .update({ ativo })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Se estiver ativando, gerar transação para o mês atual
    if (ativo) {
      const now = new Date();
      const mes = now.getMonth() + 1;
      const ano = now.getFullYear();

      // Chamar a função RPC para gerar transações do mês
      const { error: rpcError } = await this.supabase
        .rpc('gerar_transacoes_fixas_mes', {
          p_user_id: user.id,
          p_mes: mes,
          p_ano: ano
        });

      if (rpcError) {
        console.error('Erro ao gerar transações fixas:', rpcError);
      }
    }
  }

  /**
   * Marca uma transação fixa como confirmada/recebida no mês atual
   */
  async markAsConfirmed(id: number): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const fixa = await this.getById(id);
    if (!fixa) throw new Error('Transação fixa não encontrada');

    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();

    // Verificar se já existe transação para este mês
    const { data: existingTransaction } = await this.supabase
      .from('app_transacoes')
      .select('id')
      .eq('fixo_id', id)
      .eq('user_id', user.id)
      .gte('data', `${ano}-${String(mes).padStart(2, '0')}-01`)
      .lt('data', `${ano}-${String(mes + 1).padStart(2, '0')}-01`)
      .single();

    if (existingTransaction) {
      // Atualizar status para confirmado
      const { error } = await this.supabase
        .from('app_transacoes')
        .update({ status: 'confirmado' })
        .eq('id', existingTransaction.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // Criar nova transação com status confirmado
      const dia = fixa.dia_mes > new Date(ano, mes, 0).getDate()
        ? new Date(ano, mes, 0).getDate()
        : fixa.dia_mes;

      const dataTransacao = new Date(ano, mes - 1, dia);

      const { error } = await this.supabase
        .from('app_transacoes')
        .insert({
          user_id: user.id,
          descricao: fixa.descricao,
          valor: fixa.valor,
          data: dataTransacao.toISOString().split('T')[0],
          tipo: fixa.tipo,
          categoria_id: fixa.categoria_id,
          conta_id: fixa.conta_id,
          cartao_id: fixa.cartao_id,
          fixo_id: id,
          origem: 'fixo',
          status: 'confirmado',
          observacoes: fixa.observacoes || 'Transação recorrente'
        });

      if (error) throw error;
    }
  }

  /**
   * Remove uma transação fixa
   */
  async delete(id: number): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se a transação existe e pertence ao usuário
    const existing = await this.getById(id);
    if (!existing) throw new Error('Transação fixa não encontrada');

    const { error } = await this.supabase
      .from('app_transacoes_fixas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Busca estatísticas das transações fixas
   */
  async getStats(): Promise<{
    total_ativo: number;
    total_inativo: number;
    receita_mensal_fixa: number;
    despesa_mensal_fixa: number;
    fluxo_mensal_fixo: number;
  }> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .from('app_transacoes_fixas')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    if (!data) return {
      total_ativo: 0,
      total_inativo: 0,
      receita_mensal_fixa: 0,
      despesa_mensal_fixa: 0,
      fluxo_mensal_fixo: 0
    };

    const ativas = data.filter(item => item.ativo);
    const inativas = data.filter(item => !item.ativo);

    const receitaMensalFixa = ativas
      .filter(item => item.tipo === 'receita')
      .reduce((sum, item) => sum + Number(item.valor), 0);

    const despesaMensalFixa = ativas
      .filter(item => item.tipo === 'despesa' || item.tipo === 'despesa_cartao')
      .reduce((sum, item) => sum + Number(item.valor), 0);

    return {
      total_ativo: ativas.length,
      total_inativo: inativas.length,
      receita_mensal_fixa: receitaMensalFixa,
      despesa_mensal_fixa: despesaMensalFixa,
      fluxo_mensal_fixo: receitaMensalFixa - despesaMensalFixa
    };
  }

  /**
   * Calcula transações fixas para um mês específico
   */
  async calculateForMonth(mes: number, ano: number): Promise<Array<{
    id: number;
    descricao: string;
    valor: number;
    tipo: string;
    categoria_id: number;
    conta_id: number | null;
    cartao_id: number | null;
    data: string;
  }>> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .rpc('calcular_transacoes_fixas_mes', {
        p_user_id: user.id,
        p_mes: mes,
        p_ano: ano
      });

    if (error) throw error;
    return data || [];
  }

  /**
   * Busca transações híbridas para um mês específico
   * Combina transações confirmadas + transações fixas pendentes
   */
  async getHybridTransactionsForMonth(month: number, year: number): Promise<HybridTransaction[]> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const { data, error } = await this.supabase
        .rpc('obter_transacoes_hibridas_mes', {
          p_user_id: user.id,
          p_mes: month,
          p_ano: year
        });

      if (error) throw error;

      // Mapear os dados para o formato esperado
      const hybridTransactions: HybridTransaction[] = (data || []).map((item: any) => ({
        id: item.is_virtual ? `virtual-${item.fixo_id}-${month}-${year}` : item.id,
        descricao: item.descricao,
        valor: Number(item.valor),
        data: item.data,
        tipo: item.tipo,
        categoria_id: item.categoria_id,
        categoria_nome: item.categoria_nome || 'Sem categoria',
        categoria_cor: item.categoria_cor || '#6B7280',
        categoria_icone: item.categoria_icone || 'tag',
        conta_id: item.conta_id,
        conta_nome: item.conta_nome,
        cartao_id: item.cartao_id,
        cartao_nome: item.cartao_nome,
        fixo_id: item.fixo_id,
        origem: item.origem,
        status: item.status,
        is_virtual: item.is_virtual
      }));

      return hybridTransactions;
    } catch (error) {
      console.error('Erro ao buscar transações híbridas:', error);
      throw error;
    }
  }

  /**
   * Confirma uma transação fixa pendente (virtual)
   * Cria registro real na tabela app_transacoes
   */
  async confirmVirtualTransaction(fixoId: number, month: number, year: number): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar dados da transação fixa
    const fixa = await this.getById(fixoId);
    if (!fixa) throw new Error('Transação fixa não encontrada');

    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const dia = fixa.dia_mes > lastDayOfMonth ? lastDayOfMonth : fixa.dia_mes;
    const dataTransacao = new Date(year, month - 1, dia);

    // Criar transação real
    const { error } = await this.supabase
      .from('app_transacoes')
      .insert({
        user_id: user.id,
        descricao: fixa.descricao,
        valor: fixa.valor,
        data: dataTransacao.toISOString().split('T')[0],
        tipo: fixa.tipo,
        categoria_id: fixa.categoria_id,
        conta_id: fixa.conta_id,
        cartao_id: fixa.cartao_id,
        fixo_id: fixoId,
        origem: 'fixo',
        status: 'confirmado',
        observacoes: fixa.observacoes || 'Transação recorrente confirmada'
      });

    if (error) throw error;
  }

  /**
   * Valida dados da transação fixa
   */
  private validateFixedTransaction(data: {
    descricao: string;
    valor: number;
    tipo: string;
    categoria_id: number;
    dia_mes: number;
    data_inicio: string;
  }): void {
    if (!data.descricao || data.descricao.trim().length < 2) {
      throw new Error('Descrição deve ter pelo menos 2 caracteres');
    }

    if (data.valor <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    if (!['receita', 'despesa', 'despesa_cartao'].includes(data.tipo)) {
      throw new Error('Tipo de transação inválido');
    }

    if (data.dia_mes < 1 || data.dia_mes > 31) {
      throw new Error('Dia do mês deve estar entre 1 e 31');
    }

    if (!data.data_inicio) {
      throw new Error('Data de início é obrigatória');
    }
  }
}

export const fixedTransactionService = new FixedTransactionService();
export default fixedTransactionService;