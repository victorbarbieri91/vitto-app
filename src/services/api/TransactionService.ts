import { supabase } from '../supabase/client';
import { Database } from '../../types/supabase';
import { BaseApi } from './BaseApi';
import { saldoService } from './SaldoService';

export type Transaction = Database['public']['Tables']['app_transacoes']['Row'];
export type NewTransaction = Database['public']['Tables']['app_transacoes']['Insert'];
export type TransactionUpdate = Database['public']['Tables']['app_transacoes']['Update'];

export interface TransactionWithDetails extends Transaction {
  categoria_nome?: string;
  categoria_cor?: string;
  categoria_icone?: string;
  conta_nome?: string;
  cartao_nome?: string;
  fixo_descricao?: string;
}

// Tipos específicos para diferentes tipos de transação
export interface CreateTransactionRequest {
  descricao: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa' | 'despesa_cartao';
  categoria_id: number;
  conta_id?: number;
  cartao_id?: number;
  parcela_atual?: number;
  total_parcelas?: number;
  data_vencimento?: string;
  observacoes?: string;
  status?: 'confirmado' | 'pendente';
  fixo_id?: number;
  origem?: string;
}

export interface CreateInstallmentTransactionRequest {
  descricao: string;
  valor_total: number;
  data_primeira_parcela: string;
  total_parcelas: number;
  parcela_inicial?: number; // Default 1. Se 3, cria parcelas 3,4,5...N
  tipo: 'receita' | 'despesa' | 'despesa_cartao';
  categoria_id: number;
  conta_id?: number;
  cartao_id?: number;
  observacoes?: string;
  status?: 'confirmado' | 'pendente';
}

// Alias for backward compatibility
export type InstallmentTransactionRequest = CreateInstallmentTransactionRequest;

export class TransactionService extends BaseApi {
  private generationInProgress = new Set<string>();

  /**
   * Invalida cache de saldos após operações que afetam o saldo
   */
  private async invalidateCacheSaldos(contaId?: number): Promise<void> {
    try {
      // Aqui podemos adicionar lógica adicional de cache se necessário
      // Por enquanto, como estamos usando funções SQL que calculam em tempo real,
      // não há cache específico para invalidar, mas mantemos o hook para futuras implementações
      console.log(`Cache de saldos invalidado${contaId ? ` para conta ${contaId}` : ''}`);
    } catch (error) {
      // Não deve impedir a operação principal se a invalidação falhar
      console.warn('Erro ao invalidar cache de saldos:', error);
    }
  }
  constructor() {
    super();
  }
  
  async listByCardAndMonth(cardId: string, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('app_transacoes')
      .select(`
        *,
        app_categoria(nome, cor, icone),
        app_conta(nome),
        app_cartao_credito(nome)
      `)
      .eq('cartao_id', cardId)
      .eq('tipo', 'despesa_cartao')
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false });

    return { data, error };
  }

  async list(filters?: {
    mes?: number;
    ano?: number;
    conta_id?: number;
    cartao_id?: number;
    tipo?: string;
    status?: string;
  }): Promise<{ data: TransactionWithDetails[] | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    let query = this.supabase
      .from('app_transacoes')
      .select(`
        *,
        app_categoria(nome, cor, icone),
        app_conta(nome),
        app_cartao_credito(nome)
      `)
      .eq('user_id', user.id);

    if (filters) {
      if (filters.mes && filters.ano) {
        query = query
          .gte('data', `${filters.ano}-${String(filters.mes).padStart(2, '0')}-01`)
          .lt('data', `${filters.ano}-${String(filters.mes + 1).padStart(2, '0')}-01`);
      }
      if (filters.conta_id) query = query.eq('conta_id', filters.conta_id);
      if (filters.cartao_id) query = query.eq('cartao_id', filters.cartao_id);
      if (filters.tipo) query = query.eq('tipo', filters.tipo);
      if (filters.status) query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('data', { ascending: false });
    return { data, error };
  }

  /**
   * NOVA: Busca transações com transações fixas virtuais incluídas
   */
  async fetchTransactionsWithVirtual(filters?: {
    tipo?: string;
    categoria_id?: string;
    conta_id?: string;
    cartao_id?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<TransactionWithDetails[]> {
    try {
      console.log('[fetchTransactionsWithVirtual] Filtros recebidos:', filters);

      // Buscar transações reais (confirmadas)
      const realTransactions = await this.fetchTransactions(filters);

      console.log(`[fetchTransactionsWithVirtual] Transações reais encontradas: ${realTransactions?.length || 0}`);

      // Se há filtros de data, buscar transações fixas virtuais para o período
      let virtualTransactions: TransactionWithDetails[] = [];

      if (filters?.startDate && filters?.endDate) {
        const startDate = new Date(filters.startDate);
        const endDate = new Date(filters.endDate);

        // Se o período é de um único mês, buscar apenas uma vez
        const startMonth = startDate.getMonth();
        const startYear = startDate.getFullYear();
        const endMonth = endDate.getMonth();
        const endYear = endDate.getFullYear();

        if (startYear === endYear && startMonth === endMonth) {
          // Período dentro de um único mês
          console.log(`[fetchTransactionsWithVirtual] Usando SINGLE-MONTH case: startMonth=${startMonth}, realMonth=${startMonth + 1}, startYear=${startYear}`);
          const monthVirtual = await this.getVirtualFixedTransactions(startMonth + 1, startYear);

          // Filtrar apenas transações dentro do período especificado
          const filteredVirtual = monthVirtual.filter(transaction => {
            // Usar comparação de strings de data para evitar problemas de timezone
            const transDateStr = transaction.data;
            const startDateStr = filters.startDate;
            const endDateStr = filters.endDate;

            console.log(`[fetchTransactionsWithVirtual] Filtrando virtual - Data: ${transDateStr}, Start: ${startDateStr}, End: ${endDateStr}`);

            // Comparação de strings de data (YYYY-MM-DD) é mais confiável que Date objects
            if (transDateStr < startDateStr || transDateStr > endDateStr) {
              console.log(`[fetchTransactionsWithVirtual] Virtual rejeitada - fora do período`);
              return false;
            }
            if (filters.tipo && transaction.tipo !== filters.tipo) return false;
            if (filters.categoria_id && transaction.categoria_id?.toString() !== filters.categoria_id) return false;
            if (filters.conta_id && transaction.conta_id?.toString() !== filters.conta_id) return false;
            if (filters.cartao_id && transaction.cartao_id?.toString() !== filters.cartao_id) return false;
            if (filters.search && !transaction.descricao.toLowerCase().includes(filters.search.toLowerCase())) return false;

            console.log(`[fetchTransactionsWithVirtual] Single-month - Virtual aceita - dentro do período`);
            return true;
          });

          virtualTransactions = filteredVirtual;
        } else {
          // Período abrange múltiplos meses
          console.log(`[fetchTransactionsWithVirtual] Usando MULTI-MONTH case: startYear=${startYear}, startMonth=${startMonth}, endYear=${endYear}, endMonth=${endMonth}`);
          const processedMonths = new Set<string>();
          const currentDate = new Date(startDate);

          while (currentDate <= endDate) {
            const mes = currentDate.getMonth() + 1;
            const ano = currentDate.getFullYear();
            const monthKey = `${ano}-${mes}`;

            // Evitar processar o mesmo mês duas vezes
            if (!processedMonths.has(monthKey)) {
              processedMonths.add(monthKey);

              console.log(`[fetchTransactionsWithVirtual] Multi-month: processando mês=${mes}, ano=${ano}, monthKey=${monthKey}`);
              const monthVirtual = await this.getVirtualFixedTransactions(mes, ano);

              // Aplicar filtros nas virtuais também
              const filteredVirtual = monthVirtual.filter(transaction => {
                // Usar comparação de strings de data para evitar problemas de timezone
                const transDateStr = transaction.data;
                const startDateStr = filters.startDate;
                const endDateStr = filters.endDate;

                console.log(`[fetchTransactionsWithVirtual] Multi-month - Filtrando virtual - Data: ${transDateStr}, Start: ${startDateStr}, End: ${endDateStr}`);

                if (transDateStr < startDateStr || transDateStr > endDateStr) {
                  console.log(`[fetchTransactionsWithVirtual] Multi-month - Virtual rejeitada - fora do período`);
                  return false;
                }
                if (filters.tipo && transaction.tipo !== filters.tipo) return false;
                if (filters.categoria_id && transaction.categoria_id?.toString() !== filters.categoria_id) return false;
                if (filters.conta_id && transaction.conta_id?.toString() !== filters.conta_id) return false;
                if (filters.cartao_id && transaction.cartao_id?.toString() !== filters.cartao_id) return false;
                if (filters.search && !transaction.descricao.toLowerCase().includes(filters.search.toLowerCase())) return false;

                console.log(`[fetchTransactionsWithVirtual] Multi-month - Virtual aceita - dentro do período`);
                return true;
              });

              virtualTransactions.push(...filteredVirtual);
            }

            // Avançar para o próximo mês
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
      }

      // Combinar transações reais e virtuais
      const allTransactions = [...(realTransactions || []), ...virtualTransactions];
      allTransactions.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      return allTransactions;
    } catch (error) {
      console.error('Erro ao buscar transações com virtuais:', error);
      throw error;
    }
  }

  /**
   * ORIGINAL: Busca apenas transações reais (confirmadas)
   */
  async fetchTransactions(filters?: {
    tipo?: string;
    categoria_id?: string;
    conta_id?: string;
    cartao_id?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<TransactionWithDetails[]> {
    try {
      console.log('[fetchTransactions] Iniciando busca com filtros:', filters);

      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // REMOVIDO: Geração automática de transações fixas
      // Nova lógica: transações fixas são calculadas dinamicamente na visualização

      // Buscar transações regulares (incluindo transações confirmadas de transações fixas)
      let regularQuery = this.supabase
        .from('app_transacoes')
        .select(`
          *,
          app_categoria(nome, cor, icone),
          app_conta(nome),
          app_cartao_credito(nome)
        `)
        .eq('user_id', user.id);

      // REMOVIDO: Busca de transações fixas aqui
      // Nova lógica: transações fixas serão tratadas em método separado para visualização dinâmica

      // Aplicar filtros nas transações regulares
      if (filters) {
        if (filters.tipo) regularQuery = regularQuery.eq('tipo', filters.tipo);
        if (filters.categoria_id) regularQuery = regularQuery.eq('categoria_id', filters.categoria_id);
        if (filters.conta_id) regularQuery = regularQuery.eq('conta_id', filters.conta_id);
        if (filters.cartao_id) regularQuery = regularQuery.eq('cartao_id', filters.cartao_id);
        if (filters.startDate) regularQuery = regularQuery.gte('data', filters.startDate);
        if (filters.endDate) regularQuery = regularQuery.lte('data', filters.endDate);
        if (filters.search) {
          regularQuery = regularQuery.or(`descricao.ilike.%${filters.search}%`);
        }
      }

      // REMOVIDO: Filtros de transações fixas

      // Buscar faturas para incluir como transações consolidadas
      let invoiceQuery = this.supabase
        .from('app_fatura')
        .select(`
          *,
          app_cartao_credito(nome, user_id)
        `)
        .eq('app_cartao_credito.user_id', user.id);

      // Aplicar filtros de data nas faturas se fornecidos
      if (filters?.startDate || filters?.endDate) {
        if (filters.startDate) invoiceQuery = invoiceQuery.gte('data_vencimento', filters.startDate);
        if (filters.endDate) invoiceQuery = invoiceQuery.lte('data_vencimento', filters.endDate);
      }

      // Executar queries (removido transações fixas)
      const [regularResult, invoiceResult] = await Promise.all([
        regularQuery,
        invoiceQuery
      ]);

      if (regularResult.error) {
        console.error('Erro ao buscar transações regulares:', regularResult.error);
        throw regularResult.error;
      }

      if (invoiceResult.error) {
        console.error('Erro ao buscar faturas:', invoiceResult.error);
        throw invoiceResult.error;
      }

      console.log(`[fetchTransactions] Transações regulares encontradas: ${regularResult.data?.length || 0}`);
      console.log(`[fetchTransactions] Faturas encontradas: ${invoiceResult.data?.length || 0}`);

      // Transformar transações regulares
      const regularTransactions = (regularResult.data || []).map((transaction: any) => ({
        ...transaction,
        categoria_nome: transaction.app_categoria?.nome || '-',
        categoria_cor: transaction.app_categoria?.cor || '#6B7280',
        categoria_icone: transaction.app_categoria?.icone || 'tag',
        conta_nome: transaction.app_conta?.nome || '-',
        cartao_nome: transaction.app_cartao_credito?.nome || '-',
        tipo_recorrencia: transaction.total_parcelas > 1 ? 'parcelada' :
                         transaction.tipo_especial === 'recorrente' ? 'fixa' : 'unica',
        is_fixed: false
      }));

      // REMOVIDO: Transformação de transações fixas
      // Nova lógica: transações fixas serão calculadas dinamicamente quando necessário

      // Transformar faturas em transações consolidadas
      const invoiceTransactions = (invoiceResult.data || [])
        .filter((invoice: any) => invoice.valor_total > 0) // Apenas faturas com valor
        .map((invoice: any) => ({
          id: -invoice.id, // ID negativo para diferenciar
          user_id: invoice.app_cartao_credito?.user_id,
          descricao: `Fatura ${invoice.app_cartao_credito?.nome} (${new Date(invoice.data_vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`,
          valor: invoice.valor_total,
          data: invoice.data_vencimento,
          tipo: 'despesa',
          status: invoice.status === 'paga' ? 'confirmado' : 'pendente',
          categoria_id: null,
          conta_id: null,
          cartao_id: invoice.cartao_id,
          origem: 'fatura',
          tipo_especial: 'fatura_cartao',
          created_at: invoice.created_at,
          updated_at: invoice.created_at,
          // Campos para compatibilidade
          categoria_nome: 'Cartão de Crédito',
          categoria_cor: '#F87060',
          categoria_icone: 'credit-card',
          conta_nome: '-',
          cartao_nome: invoice.app_cartao_credito?.nome || 'Cartão',
          tipo_recorrencia: 'unica',
          is_fixed: false,
          total_parcelas: null,
          parcela_atual: null,
          grupo_parcelamento: null,
          observacoes: null,
          data_vencimento: invoice.data_vencimento,
          fixo_descricao: null
        }));

      // Combinar transações regulares e faturas (removido transações fixas)
      const allTransactions = [...regularTransactions, ...invoiceTransactions];
      allTransactions.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      return allTransactions;
    } catch (error) {
      console.error('Falha no fetchTransactions:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova transação
   */
  async create(request: CreateTransactionRequest): Promise<{ data: Transaction | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Validações
    this.validateTransaction(request);

    // Para transações de cartão, sempre usar status confirmado
    const status = request.tipo === 'despesa_cartao' ? 'confirmado' : (request.status || 'pendente');

    const transactionData: NewTransaction = {
      user_id: user.id,
      descricao: request.descricao,
      valor: request.valor,
      data: request.data,
      tipo: request.tipo,
      categoria_id: request.categoria_id,
      conta_id: request.conta_id || null,
      cartao_id: request.cartao_id || null,
      parcela_atual: request.parcela_atual || null,
      total_parcelas: request.total_parcelas || null,
      grupo_parcelamento: request.total_parcelas ? crypto.randomUUID() : null,
      origem: request.origem || 'manual',
      fixo_id: request.fixo_id || null,
      status: status,
      tipo_especial: request.total_parcelas ? 'parcelamento' : 'normal',
      data_vencimento: request.data_vencimento || null,
      observacoes: request.observacoes || null,
    };

    const { data, error } = await this.supabase
      .from('app_transacoes')
      .insert(transactionData)
      .select()
      .single();

    if (!error && data) {
      await this.invalidateCacheSaldos(data.conta_id || undefined);
    }

    return { data, error };
  }

  async update(id: string, updates: Partial<CreateTransactionRequest>) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .from('app_transacoes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (!error && data) {
      await this.invalidateCacheSaldos(data.conta_id || undefined);
    }
    
    return { data, error };
  }

  async delete(id: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Buscar dados da transação antes de deletar
    const { data: transactionData } = await this.supabase
      .from('app_transacoes')
      .select('conta_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const { error } = await this.supabase
      .from('app_transacoes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (!error && transactionData) {
      await this.invalidateCacheSaldos(transactionData.conta_id || undefined);
    }
    
    return { error };
  }

  async getById(id: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .from('app_transacoes')
      .select(`
        *,
        app_categoria(nome, cor, icone),
        app_conta(nome),
        app_cartao_credito(nome)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    return { data, error };
  }

  /**
   * Cria transações parceladas
   */
  async createInstallments(request: CreateInstallmentTransactionRequest): Promise<{ data: Transaction[] | null; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Validações
    if (request.total_parcelas <= 0) {
      throw new Error('Número de parcelas deve ser maior que zero');
    }
    if (request.valor_total <= 0) {
      throw new Error('Valor total deve ser maior que zero');
    }

    const valorParcela = request.valor_total / request.total_parcelas;
    const grupoParcelamento = crypto.randomUUID();
    const dataBase = new Date(request.data_primeira_parcela);
    const parcelaInicial = request.parcela_inicial || 1;

    const transacoes: NewTransaction[] = [];

    // Para transações de cartão, sempre usar status confirmado
    const status = request.tipo === 'despesa_cartao' ? 'confirmado' : (request.status || 'pendente');

    for (let parcela = parcelaInicial; parcela <= request.total_parcelas; parcela++) {
      const dataParcela = new Date(dataBase);
      dataParcela.setMonth(dataParcela.getMonth() + (parcela - parcelaInicial));

      transacoes.push({
        user_id: user.id,
        descricao: `${request.descricao} (${parcela}/${request.total_parcelas})`,
        valor: valorParcela,
        data: dataParcela.toISOString().split('T')[0],
        tipo: request.tipo,
        categoria_id: request.categoria_id,
        conta_id: request.conta_id || null,
        cartao_id: request.cartao_id || null,
        parcela_atual: parcela,
        total_parcelas: request.total_parcelas,
        grupo_parcelamento: grupoParcelamento,
        origem: 'manual',
        status: status,
        tipo_especial: 'parcelamento',
        observacoes: request.observacoes || null,
      });
    }

    const { data, error } = await this.supabase
      .from('app_transacoes')
      .insert(transacoes)
      .select();

    return { data, error };
  }

  /**
   * Atualiza status de uma transação
   */
  async updateStatus(id: string, status: 'pendente' | 'confirmado' | 'cancelado'): Promise<{ error: any }> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await this.supabase
      .from('app_transacoes')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id);

    return { error };
  }

  /**
   * Remove todas as parcelas de um grupo
   */
  async deleteInstallmentGroup(grupoParcelamento: string): Promise<{ error: any }> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await this.supabase
      .from('app_transacoes')
      .delete()
      .eq('user_id', user.id)
      .eq('grupo_parcelamento', grupoParcelamento);

    return { error };
  }

  /**
   * Busca transações por período
   */
  async getByPeriod(dataInicio: string, dataFim: string): Promise<TransactionWithDetails[]> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .from('app_transacoes')
      .select(`
        *,
        app_categoria(nome, cor, icone),
        app_conta(nome),
        app_cartao_credito(nome)
      `)
      .eq('user_id', user.id)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * NOVA LÓGICA: Busca transações fixas que se aplicam a um mês específico
   * e retorna como "pendentes virtuais" para visualização
   */
  async getVirtualFixedTransactions(mes: number, ano: number): Promise<TransactionWithDetails[]> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    console.log(`[getVirtualFixedTransactions] Buscando para ${mes}/${ano}`);

    try {
      // Calcular primeiro e último dia do mês
      const primeiroDay = new Date(ano, mes - 1, 1);
      const ultimoDay = new Date(ano, mes, 0);

      console.log(`[getVirtualFixedTransactions] Período: ${primeiroDay.toISOString()} até ${ultimoDay.toISOString()}`);

      // Buscar transações fixas ativas do usuário
      const { data: fixedRules, error } = await this.supabase
        .from('app_transacoes_fixas')
        .select(`
          *,
          app_categoria(nome, cor, icone),
          app_conta(nome),
          app_cartao_credito(nome)
        `)
        .eq('user_id', user.id)
        .eq('ativo', true)
        .lte('data_inicio', ultimoDay.toISOString().split('T')[0])
        .or(`data_fim.is.null,data_fim.gte.${primeiroDay.toISOString().split('T')[0]}`);

      if (error) throw error;

      console.log(`[getVirtualFixedTransactions] Encontradas ${fixedRules?.length || 0} regras fixas`);

      // Transformar regras em transações virtuais
      const virtualTransactions: TransactionWithDetails[] = [];

      for (const rule of fixedRules || []) {
        console.log(`[getVirtualFixedTransactions] Processando regra ID ${rule.id}: dia ${rule.dia_mes}`);
        // Calcular data da transação no mês
        let dataTransacao = new Date(ano, mes - 1, rule.dia_mes);

        // Se o dia não existe no mês, usar último dia
        if (dataTransacao.getMonth() !== mes - 1) {
          dataTransacao = ultimoDay;
        }

        // Validar se a regra está ativa no período específico
        const dataInicioRule = new Date(rule.data_inicio);
        const dataFimRule = rule.data_fim ? new Date(rule.data_fim) : null;

        // Se a data da transação está antes do início da regra, pular
        if (dataTransacao < dataInicioRule) continue;

        // Se há data fim e a transação está depois dela, pular
        if (dataFimRule && dataTransacao > dataFimRule) continue;

        // Verificar se já existe uma transação confirmada para esta regra neste mês
        const { data: existing, error: existingError } = await this.supabase
          .from('app_transacoes')
          .select('id, data')
          .eq('fixo_id', rule.id)
          .eq('user_id', user.id)
          .gte('data', primeiroDay.toISOString().split('T')[0])
          .lte('data', ultimoDay.toISOString().split('T')[0])
          .maybeSingle();

        console.log(`[getVirtualFixedTransactions] Regra ${rule.id} - Transação existente: ${existing ? 'SIM' : 'NÃO'}`);

        // Se não existe confirmada, criar virtual
        if (!existing && (!existingError || existingError.code === 'PGRST116')) {
          // Gerar ID único para a transação virtual usando combinação mais específica
          // Incluindo dia_mes para garantir unicidade mesmo com múltiplas regras no mesmo mês
          const uniqueVirtualId = -(rule.id * 1000000 + ano * 10000 + mes * 100 + rule.dia_mes);

          virtualTransactions.push({
            id: uniqueVirtualId, // ID único para identificar como virtual
            user_id: user.id,
            descricao: rule.descricao,
            valor: rule.valor,
            data: dataTransacao.toISOString().split('T')[0],
            tipo: rule.tipo,
            categoria_id: rule.categoria_id,
            conta_id: rule.conta_id,
            cartao_id: rule.cartao_id,
            status: 'pendente',
            origem: 'fixo_virtual',
            fixo_id: rule.id,
            fixed_transaction_id: rule.id, // Adicionar para compatibilidade com TransactionList
            is_virtual_fixed: true, // Flag clara de transação virtual
            created_at: rule.created_at,
            updated_at: rule.updated_at,
            // Campos para visualização
            categoria_nome: rule.app_categoria?.nome || '-',
            categoria_cor: rule.app_categoria?.cor || '#6B7280',
            categoria_icone: rule.app_categoria?.icone || 'tag',
            conta_nome: rule.app_conta?.nome || '-',
            cartao_nome: rule.app_cartao_credito?.nome || '-',
            tipo_recorrencia: 'fixa',
            is_fixed: true,
            // Outros campos para compatibilidade
            parcela_atual: null,
            total_parcelas: null,
            grupo_parcelamento: null,
            tipo_especial: 'normal',
            data_vencimento: dataTransacao.toISOString().split('T')[0],
            observacoes: rule.observacoes,
            fixo_descricao: rule.descricao
          });
        }
      }

      console.log(`[getVirtualFixedTransactions] Total de transações virtuais criadas: ${virtualTransactions.length}`);
      return virtualTransactions;
    } catch (error) {
      console.error(`❌ Erro ao buscar transações fixas virtuais para ${mes}/${ano}:`, error);
      return [];
    }
  }

  /**
   * NOVA: Confirma uma transação fixa virtual criando registro real
   */
  async confirmVirtualFixedTransaction(fixedTransactionId: number, targetDate?: string): Promise<{ data: any; error: any }> {
    try {
      console.log(`[confirmVirtualFixedTransaction] Iniciando confirmação - ID: ${fixedTransactionId}, Data: ${targetDate}`);

      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar a regra de transação fixa
      const { data: fixedRule, error: fixedError } = await this.supabase
        .from('app_transacoes_fixas')
        .select('*')
        .eq('id', fixedTransactionId)
        .eq('user_id', user.id)
        .single();

      if (fixedError || !fixedRule) {
        console.error('[confirmVirtualFixedTransaction] Transação fixa não encontrada:', fixedError);
        throw new Error('Transação fixa não encontrada');
      }

      console.log('[confirmVirtualFixedTransaction] Regra fixa encontrada:', fixedRule);

      // Criar transação real
      const transactionData = {
        user_id: user.id,
        descricao: fixedRule.descricao,
        valor: fixedRule.valor,
        data: targetDate || new Date().toISOString().split('T')[0],
        tipo: fixedRule.tipo,
        categoria_id: fixedRule.categoria_id,
        conta_id: fixedRule.conta_id,
        cartao_id: fixedRule.cartao_id,
        fixo_id: fixedRule.id,
        origem: 'fixo',
        status: 'confirmado',
        observacoes: fixedRule.observacoes
      };

      console.log('[confirmVirtualFixedTransaction] Criando transação com dados:', transactionData);

      const { data: createdTransaction, error: createError } = await this.supabase
        .from('app_transacoes')
        .insert(transactionData)
        .select()
        .single();

      if (createError) {
        console.error('[confirmVirtualFixedTransaction] Erro ao criar transação:', createError);
        throw createError;
      }

      console.log('[confirmVirtualFixedTransaction] Transação criada com sucesso:', createdTransaction);

      // Invalidar cache de saldos
      await this.invalidateCacheSaldos(fixedRule.conta_id);

      return { data: createdTransaction, error: null };
    } catch (error) {
      console.error('[confirmVirtualFixedTransaction] Erro geral:', error);
      return { data: null, error };
    }
  }

  /**
   * Valida dados da transação
   */
  private validateTransaction(data: CreateTransactionRequest): void {
    if (!data.descricao || data.descricao.trim().length < 2) {
      throw new Error('Descrição deve ter pelo menos 2 caracteres');
    }

    if (data.valor <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    if (!data.data) {
      throw new Error('Data é obrigatória');
    }

    if (!['receita', 'despesa', 'despesa_cartao'].includes(data.tipo)) {
      throw new Error('Tipo de transação inválido');
    }

    if (data.tipo === 'despesa_cartao' && !data.cartao_id) {
      throw new Error('Cartão é obrigatório para despesas de cartão');
    }

    if (data.tipo !== 'despesa_cartao' && !data.conta_id) {
      throw new Error('Conta é obrigatória para transações não-cartão');
    }

    if (data.parcela_atual && !data.total_parcelas) {
      throw new Error('Total de parcelas é obrigatório quando há parcela atual');
    }

    if (data.total_parcelas && (!data.parcela_atual || data.parcela_atual > data.total_parcelas)) {
      throw new Error('Parcela atual deve ser válida');
    }
  }
}

export const transactionService = new TransactionService();
export default transactionService;
