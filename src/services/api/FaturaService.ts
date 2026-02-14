import { Database } from '../../types/supabase';
import { BaseApi } from './BaseApi';

export type Fatura = Database['public']['Tables']['app_fatura']['Row'];
export type CreateFaturaRequest = Database['public']['Tables']['app_fatura']['Insert'];
export type UpdateFaturaRequest = Database['public']['Tables']['app_fatura']['Update'];
export interface PayInvoiceRequest {
  p_fatura_id: string;
  p_conta_id: string;
  p_data_pagamento: string;
}

export interface FaturaTransaction {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  categoria_id: number | null;
  categoria_nome: string | null;
  categoria_cor: string | null;
  categoria_icone: string | null;
  parcela_atual: number | null;
  total_parcelas: number | null;
  observacoes: string | null;
  is_fixed: boolean;
  fixo_id: number | null;
}

/**
 *
 */
export class FaturaService extends BaseApi {
  /**
   *
   */
  constructor() {
    super();
  }

  /**
   *
   */
  async findByCardAndMonth(cardId: number | string, year: number, month: number) {
    const { data, error } = await this.supabase
      .from('app_fatura')
      .select('*')
      .eq('cartao_id', cardId)
      .eq('ano', year)
      .eq('mes', month);

    return { data, error };
  }

  /**
   * Get all transactions for a fatura via RPC (correct fatura period + virtual fixed)
   */
  async getInvoiceTransactions(faturaId: number): Promise<{ data: FaturaTransaction[] | null; error: any }> {
    const { data, error } = await this.supabase.rpc('obter_transacoes_fatura', { p_fatura_id: faturaId });
    return { data, error };
  }

  /**
   * Get dynamic total for a fatura (includes virtual fixed transactions)
   */
  async getDynamicTotal(faturaId: number): Promise<{ data: number | null; error: any }> {
    const { data, error } = await this.supabase.rpc('calcular_valor_total_fatura', { p_fatura_id: faturaId });
    return { data, error };
  }

  /**
   * Auto-close faturas where dia_fechamento has passed
   */
  async autoCloseInvoices(userId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('atualizar_status_faturas', { p_user_id: userId });
    if (error) {
      console.error('Erro ao atualizar status das faturas:', error);
      return 0;
    }
    return data || 0;
  }

  /**
   * Busca uma fatura por ID
   */
  async getById(id: number | string) {
    const { data, error } = await this.supabase
      .from('app_fatura')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  }

  /**
   *
   */
  async payInvoice(request: PayInvoiceRequest) {
    const { data, error } = await this.supabase.rpc('pagar_fatura', request);
    return { data, error };
  }

  /**
   *
   */
  async list(_filters?: any) {
    const { data, error } = await this.supabase
      .from('app_fatura')
      .select('*')
      .order('data_vencimento', { ascending: false });

    return { data, error };
  }
}

export const faturaService = new FaturaService();
export default faturaService; 