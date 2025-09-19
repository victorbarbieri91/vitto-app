import { supabase } from '../supabase/client';
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

export class FaturaService extends BaseApi {
  constructor() {
    super();
  }

  async findByCardAndMonth(cardId: string, year: number, month: number) {
    const { data, error } = await this.supabase
      .from('app_fatura')
      .select('*')
      .eq('cartao_id', cardId)
      .eq('ano', year)
      .eq('mes', month);

    return { data, error };
  }
  
  async payInvoice(request: PayInvoiceRequest) {
    const { data, error } = await this.supabase.rpc('pagar_fatura', request);
    return { data, error };
  }

  async list(filters?: any) {
    const { data, error } = await this.supabase
      .from('app_fatura')
      .select('*')
      .order('data_vencimento', { ascending: false });

    return { data, error };
  }

  // ... (outros métodos create, update, delete devem ser mantidos)
}

export const faturaService = new FaturaService();
export default faturaService; 