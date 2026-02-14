import { supabase } from '../supabase/client';
import { BaseApi } from './BaseApi';
import { faturaService } from './FaturaService';
import { creditCardService } from './CreditCardService';

export interface InvoiceClosureRequest {
  cartao_id: string;
  mes: number;
  ano: number;
  valor_total: number;
  data_fechamento: string;
  data_vencimento: string;
}

export interface InvoicePaymentRequest {
  fatura_id: string;
  valor_pago: number;
  data_pagamento: string;
  conta_id: string;
  categoria_id?: string;
}

export interface AutomationSettings {
  auto_close_enabled: boolean;
  auto_generate_expense: boolean;
  notification_days_before: number;
  default_expense_category_id?: string;
}

/**
 *
 */
export class AutomationService extends BaseApi {

  /**
   * Fecha uma fatura automaticamente
   */
  async closeInvoice(request: InvoiceClosureRequest): Promise<{ success: boolean; fatura_id?: string; error?: string }> {
    try {
      // Verificar se a fatura já existe
      const existingInvoice = await faturaService.getByCardAndPeriod(
        request.cartao_id,
        request.mes,
        request.ano
      );

      if (existingInvoice.data && existingInvoice.data.status === 'fechada') {
        return { success: false, error: 'Fatura já está fechada' };
      }

      // Calcular valor total dos lançamentos do período
      const totalAmount = await this.calculateInvoiceTotal(
        request.cartao_id,
        request.mes,
        request.ano
      );

      // Criar ou atualizar fatura
      let faturaId: string;
      if (existingInvoice.data) {
        // Atualizar fatura existente
        const updateResult = await faturaService.update(existingInvoice.data.id, {
          valor_total: totalAmount,
          status: 'fechada',
          data_fechamento: request.data_fechamento,
          data_vencimento: request.data_vencimento
        });

        if (updateResult.error) {
          throw new Error(updateResult.error);
        }
        faturaId = existingInvoice.data.id;
      } else {
        // Criar nova fatura
        const createResult = await faturaService.create({
          cartao_id: request.cartao_id,
          mes: request.mes,
          ano: request.ano,
          valor_total: totalAmount,
          status: 'fechada',
          data_fechamento: request.data_fechamento,
          data_vencimento: request.data_vencimento
        });

        if (createResult.error || !createResult.data) {
          throw new Error(createResult.error || 'Erro ao criar fatura');
        }
        faturaId = createResult.data.id;
      }

      // Atualizar lançamentos para vincular à fatura
      await this.linkTransactionsToInvoice(request.cartao_id, request.mes, request.ano, faturaId);

      return { success: true, fatura_id: faturaId };
    } catch (error) {
      console.error('Erro ao fechar fatura:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Processa pagamento de fatura
   * Operacoes diretas (sem RPC): atualiza fatura, cria 1 transacao, recalcula saldo
   */
  async payInvoice(request: InvoicePaymentRequest): Promise<{ success: boolean; lancamento_id?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Buscar dados da fatura
      const faturaResult = await faturaService.getById(request.fatura_id);
      if (faturaResult.error || !faturaResult.data) {
        throw new Error('Fatura não encontrada');
      }
      const fatura = faturaResult.data;

      // 2. Buscar dados do cartão (para descrição)
      const cartao = await creditCardService.getById(fatura.cartao_id);
      if (!cartao) {
        throw new Error('Cartão não encontrado');
      }

      // 3. Atualizar fatura para 'paga'
      const { error: updateError } = await supabase
        .from('app_fatura')
        .update({ status: 'paga', data_pagamento: request.data_pagamento })
        .eq('id', fatura.id);

      if (updateError) {
        throw new Error('Erro ao atualizar fatura: ' + updateError.message);
      }

      // 4. Criar UMA transação de pagamento (débito na conta bancária)
      const { data: transacao, error: transError } = await supabase
        .from('app_transacoes')
        .insert({
          user_id: user.id,
          descricao: `Pagamento fatura ${cartao.nome} (${fatura.mes}/${fatura.ano})`,
          valor: request.valor_pago,
          tipo: 'despesa',
          categoria_id: request.categoria_id ? parseInt(request.categoria_id) : 22,
          conta_id: parseInt(request.conta_id),
          data: request.data_pagamento,
          status: 'confirmado',
        })
        .select('id')
        .single();

      if (transError) {
        throw new Error('Erro ao criar transação: ' + transError.message);
      }

      // 5. Recalcular saldo da conta
      const contaId = parseInt(request.conta_id);
      const { data: novoSaldo } = await supabase.rpc('calcular_saldo_atual', {
        conta_id_param: contaId
      });

      if (novoSaldo !== null && novoSaldo !== undefined) {
        await supabase
          .from('app_conta')
          .update({ saldo_atual: novoSaldo })
          .eq('id', contaId);
      }

      return {
        success: true,
        lancamento_id: transacao?.id?.toString()
      };
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Executa fechamento automático de faturas
   */
  async runAutomaticClosure(): Promise<{ success: boolean; processed: number; errors: string[] }> {
    try {
      const today = new Date();
      const errors: string[] = [];
      let processed = 0;

      // Buscar todos os cartões
      const cards = await creditCardService.list();
      if (!cards || cards.length === 0) {
        return { success: true, processed: 0, errors: [] };
      }

      // Processar cada cartão
      for (const card of cards) {
        // Verificar se hoje é o dia de fechamento
        if (today.getDate() !== card.dia_fechamento) {
          continue;
        }

        // Calcular mês e ano da fatura
        const mes = today.getMonth() + 1;
        const ano = today.getFullYear();

        // Calcular data de vencimento
        const dataVencimento = new Date(today);
        dataVencimento.setDate(card.dia_vencimento);
        if (card.dia_vencimento < card.dia_fechamento) {
          dataVencimento.setMonth(dataVencimento.getMonth() + 1);
        }

        // Fechar fatura
        const closeResult = await this.closeInvoice({
          cartao_id: card.id,
          mes,
          ano,
          valor_total: 0, // Será calculado automaticamente
          data_fechamento: today.toISOString(),
          data_vencimento: dataVencimento.toISOString()
        });

        if (closeResult.success) {
          processed++;
        } else {
          errors.push(`Erro ao fechar fatura do cartão ${card.nome}: ${closeResult.error}`);
        }
      }

      return { success: true, processed, errors };
    } catch (error) {
      console.error('Erro no fechamento automático:', error);
      return { 
        success: false, 
        processed: 0, 
        errors: [error instanceof Error ? error.message : 'Erro desconhecido'] 
      };
    }
  }

  /**
   * Busca faturas próximas do vencimento
   */
  async getUpcomingInvoices(days: number = 7): Promise<{ success: boolean; invoices?: any[]; error?: string }> {
    try {
      const today = new Date();
      const limitDate = new Date(today);
      limitDate.setDate(limitDate.getDate() + days);

      const { data, error } = await supabase
        .from('app_fatura')
        .select(`
          *,
          app_cartao_credito:cartao_id (
            nome,
            cor
          )
        `)
        .eq('status', 'fechada')
        .gte('data_vencimento', today.toISOString())
        .lte('data_vencimento', limitDate.toISOString())
        .order('data_vencimento', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, invoices: data || [] };
    } catch (error) {
      console.error('Erro ao buscar faturas próximas:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  /**
   * Calcula o valor total de uma fatura
   */
  private async calculateInvoiceTotal(cartaoId: string, mes: number, ano: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('app_transacoes')
        .select('valor')
        .eq('cartao_id', cartaoId)
        .eq('tipo', 'despesa_cartao') // Atualizado para despesa_cartao
        .gte('data', `${ano}-${mes.toString().padStart(2, '0')}-01`)
        .lt('data', `${ano}-${mes === 12 ? ano + 1 : ano}-${mes === 12 ? '01' : (mes + 1).toString().padStart(2, '0')}-01`);

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).reduce((total, lancamento) => total + lancamento.valor, 0);
    } catch (error) {
      console.error('Erro ao calcular total da fatura:', error);
      return 0;
    }
  }

  /**
   * Vincula lançamentos à fatura
   */
  private async linkTransactionsToInvoice(cartaoId: string, mes: number, ano: number, faturaId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('app_transacoes')
        .update({ fatura_id: faturaId })
        .eq('cartao_id', cartaoId)
        .eq('tipo', 'despesa_cartao') // Atualizado para despesa_cartao
        .gte('data', `${ano}-${mes.toString().padStart(2, '0')}-01`)
        .lt('data', `${ano}-${mes === 12 ? ano + 1 : ano}-${mes === 12 ? '01' : (mes + 1).toString().padStart(2, '0')}-01`)
        .is('fatura_id', null);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Erro ao vincular lançamentos à fatura:', error);
    }
  }
}

export const automationService = new AutomationService(); 