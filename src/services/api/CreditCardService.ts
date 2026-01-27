import { supabase } from '../supabase/client';
import { Database } from '../../types/supabase';

export type CreditCard = Database['public']['Tables']['app_cartao_credito']['Row'];
export type NewCreditCard = Database['public']['Tables']['app_cartao_credito']['Insert'];
export type CreditCardUpdate = Database['public']['Tables']['app_cartao_credito']['Update'];
export type CreditCardInsert = Database['public']['Tables']['app_cartao_credito']['Insert'];

export interface CreateCreditCardRequest {
  nome: string;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  cor?: string;
  icone?: string;
  ultimos_quatro_digitos?: string;
}

export interface UpdateCreditCardRequest {
  nome?: string;
  limite?: number;
  dia_fechamento?: number;
  dia_vencimento?: number;
  cor?: string;
  icone?: string;
  ultimos_quatro_digitos?: string;
}

export interface CreditCardWithUsage extends CreditCard {
  limite_usado: number;
  limite_disponivel: number;
  fatura_atual: number;
  fatura_proxima: number;
}

export class CreditCardService {
  /**
   * Lista todos os cartões de crédito do usuário
   */
  async list(): Promise<CreditCard[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('app_cartao_credito')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Lista cartões com informações de uso
   */
  async listWithUsage(): Promise<CreditCardWithUsage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: cards, error: cardsError } = await supabase
      .from('app_cartao_credito')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (cardsError) throw cardsError;
    if (!cards) return [];

    // Buscar informações de uso para cada cartão
    const cardsWithUsage: CreditCardWithUsage[] = [];

    for (const card of cards) {
      const usage = await this.calculateCardUsage(card.id);
      cardsWithUsage.push({
        ...card,
        ...usage,
      });
    }

    return cardsWithUsage;
  }

  /**
   * Busca um cartão específico por ID
   */
  async getById(id: number): Promise<CreditCard | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('app_cartao_credito')
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
   * Busca cartão com informações de uso
   */
  async getByIdWithUsage(id: number): Promise<CreditCardWithUsage | null> {
    const card = await this.getById(id);
    if (!card) return null;

    const usage = await this.calculateCardUsage(card.id);
    return {
      ...card,
      ...usage,
    };
  }

  /**
   * Cria um novo cartão de crédito
   */
  async create(request: CreateCreditCardRequest): Promise<CreditCard> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Validações
    this.validateCreditCardData(request);

    const cardData: CreditCardInsert = {
      nome: request.nome,
      limite: request.limite,
      dia_fechamento: request.dia_fechamento,
      dia_vencimento: request.dia_vencimento,
      cor: request.cor || '#F87060',
      icone: request.icone || 'card',
      ultimos_quatro_digitos: request.ultimos_quatro_digitos,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('app_cartao_credito')
      .insert(cardData)
      .select()
      .single();

    if (error) throw error;

    // Criar primeira fatura (mês atual)
    await this.createInitialInvoice(data.id);

    return data;
  }

  /**
   * Atualiza um cartão de crédito
   */
  async update(id: number, request: UpdateCreditCardRequest): Promise<CreditCard> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se o cartão existe e pertence ao usuário
    const existing = await this.getById(id);
    if (!existing) throw new Error('Cartão não encontrado');

    // Validações
    if (request.dia_fechamento || request.dia_vencimento || request.limite) {
      this.validateCreditCardData({
        nome: request.nome || existing.nome,
        limite: request.limite || existing.limite,
        dia_fechamento: request.dia_fechamento || existing.dia_fechamento,
        dia_vencimento: request.dia_vencimento || existing.dia_vencimento,
      });
    }

    const { data, error } = await supabase
      .from('app_cartao_credito')
      .update(request)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove um cartão de crédito
   * Permite exclusão se:
   * - Não há faturas
   * - Todas as faturas não pagas têm valor zero (serão excluídas junto)
   * Bloqueia se houver faturas com valor > 0 não pagas
   */
  async delete(id: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Verificar se o cartão existe e pertence ao usuário
    const existing = await this.getById(id);
    if (!existing) throw new Error('Cartão não encontrado');

    // Verificar se há faturas pendentes COM VALOR
    const { data: pendingInvoices, error: invoicesError } = await supabase
      .from('app_fatura')
      .select('id, valor_total, status')
      .eq('cartao_id', id)
      .neq('status', 'paga');

    if (invoicesError) throw invoicesError;

    // Verificar se alguma fatura pendente tem valor > 0
    const invoicesWithValue = pendingInvoices?.filter(
      inv => Number(inv.valor_total) > 0
    ) || [];

    if (invoicesWithValue.length > 0) {
      const totalPendente = invoicesWithValue.reduce(
        (sum, inv) => sum + Number(inv.valor_total), 0
      );
      throw new Error(
        `Não é possível excluir cartão com faturas pendentes. ` +
        `Existem ${invoicesWithValue.length} fatura(s) com valor total de R$ ${totalPendente.toFixed(2)}. ` +
        `Pague ou exclua as faturas primeiro.`
      );
    }

    // Excluir faturas vazias (valor = 0) antes de excluir o cartão
    if (pendingInvoices && pendingInvoices.length > 0) {
      const { error: deleteInvoicesError } = await supabase
        .from('app_fatura')
        .delete()
        .eq('cartao_id', id)
        .eq('valor_total', 0);

      if (deleteInvoicesError) throw deleteInvoicesError;
    }

    // Excluir o cartão
    const { error } = await supabase
      .from('app_cartao_credito')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  /**
   * Calcula uso atual do cartão
   */
  private async calculateCardUsage(cardId: number): Promise<{
    limite_usado: number;
    limite_disponivel: number;
    fatura_atual: number;
    fatura_proxima: number;
  }> {
    const now = new Date();
    const mesAtual = now.getMonth() + 1;
    const anoAtual = now.getFullYear();
    
    const proximoMes = mesAtual === 12 ? 1 : mesAtual + 1;
    const proximoAno = mesAtual === 12 ? anoAtual + 1 : anoAtual;

    // Buscar faturas atual e próxima
    const { data: faturas, error } = await supabase
      .from('app_fatura')
      .select('mes, ano, valor_total')
      .eq('cartao_id', cardId)
      .in('status', ['aberta', 'fechada'])
      .or(`and(mes.eq.${mesAtual},ano.eq.${anoAtual}),and(mes.eq.${proximoMes},ano.eq.${proximoAno})`);

    if (error) throw error;

    let faturaAtual = 0;
    let faturaProxima = 0;

    if (faturas) {
      for (const fatura of faturas) {
        if (fatura.mes === mesAtual && fatura.ano === anoAtual) {
          faturaAtual = Number(fatura.valor_total);
        } else if (fatura.mes === proximoMes && fatura.ano === proximoAno) {
          faturaProxima = Number(fatura.valor_total);
        }
      }
    }

    const limiteUsado = faturaAtual + faturaProxima;

    return {
      limite_usado: limiteUsado,
      limite_disponivel: 0, // Será calculado quando buscar o limite
      fatura_atual: faturaAtual,
      fatura_proxima: faturaProxima,
    };
  }

  /**
   * Cria fatura inicial para um novo cartão
   */
  private async createInitialInvoice(cardId: number): Promise<void> {
    const card = await this.getById(cardId);
    if (!card) return;

    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();

    // Calcular data de vencimento
    const dataVencimento = new Date(ano, mes - 1, card.dia_vencimento);
    if (now.getDate() > card.dia_fechamento) {
      // Já passou do fechamento, fatura para próximo mês
      dataVencimento.setMonth(dataVencimento.getMonth() + 1);
    }

    const { error } = await supabase
      .from('app_fatura')
      .insert({
        cartao_id: cardId,
        mes,
        ano,
        valor_total: 0,
        status: 'aberta',
        data_vencimento: dataVencimento.toISOString().split('T')[0],
      });

    if (error) throw error;
  }

  /**
   * Valida dados do cartão de crédito
   */
  private validateCreditCardData(data: {
    nome: string;
    limite: number;
    dia_fechamento: number;
    dia_vencimento: number;
    ultimos_quatro_digitos?: string;
  }): void {
    if (!data.nome || data.nome.trim().length < 2) {
      throw new Error('Nome do cartão deve ter pelo menos 2 caracteres');
    }

    if (data.limite <= 0) {
      throw new Error('Limite deve ser maior que zero');
    }

    if (data.dia_fechamento < 1 || data.dia_fechamento > 31) {
      throw new Error('Dia de fechamento deve estar entre 1 e 31');
    }

    if (data.dia_vencimento < 1 || data.dia_vencimento > 31) {
      throw new Error('Dia de vencimento deve estar entre 1 e 31');
    }

    if (data.dia_vencimento <= data.dia_fechamento) {
      throw new Error('Dia de vencimento deve ser posterior ao fechamento');
    }

    if (data.ultimos_quatro_digitos) {
      if (!/^\d{4}$/.test(data.ultimos_quatro_digitos)) {
        throw new Error('Últimos 4 dígitos devem conter exatamente 4 números');
      }
    }
  }
}

export const creditCardService = new CreditCardService();
export default creditCardService; 