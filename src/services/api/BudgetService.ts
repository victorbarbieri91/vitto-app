import { BaseApi } from './BaseApi';

export type BudgetTipo = 'receita' | 'despesa';

export type Budget = {
  id: number;
  categoria_id: number;
  mes: number;
  ano: number;
  valor: number;
  tipo: BudgetTipo;
  user_id: string;
  created_at: string;
};

export type NewBudget = Omit<Budget, 'id' | 'created_at' | 'user_id'>;

export type BudgetWithCategory = Budget & {
  categoria: {
    id: number;
    nome: string;
    tipo: string;
    cor?: string;
    icone?: string;
  };
};

export type BudgetStatus = {
  budget: BudgetWithCategory;
  gastoAtual: number;
  percentualGasto: number;
  saldoRestante: number;
  status: 'verde' | 'amarelo' | 'vermelho';
  diasRestantes: number;
};

/**
 * Service to handle all budget-related API calls
 */
export class BudgetService extends BaseApi {
  /**
   * Fetch all budgets for the current user
   */
  async fetchBudgets(): Promise<BudgetWithCategory[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_orcamento')
        .select(`
          *,
          categoria:app_categoria(
            id,
            nome,
            tipo,
            cor,
            icone
          )
        `)
        .eq('user_id', user.id)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar orçamentos');
    }
  }

  /**
   * Get budgets for specific month/year
   */
  async getBudgetsForMonth(mes: number, ano: number): Promise<BudgetWithCategory[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_orcamento')
        .select(`
          *,
          categoria:app_categoria(
            id,
            nome,
            tipo,
            cor,
            icone
          )
        `)
        .eq('user_id', user.id)
        .eq('mes', mes)
        .eq('ano', ano);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar orçamentos do mês');
    }
  }

  /**
   * Get a budget by ID
   */
  async getBudget(id: number): Promise<BudgetWithCategory | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('app_orcamento')
        .select(`
          *,
          categoria:app_categoria(
            id,
            nome,
            tipo,
            cor,
            icone
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar orçamento');
    }
  }

  /**
   * Create a new budget
   */
  async createBudget(newBudget: NewBudget): Promise<Budget> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if budget already exists for this category/month/year
      const { data: existing, error: checkError } = await this.supabase
        .from('app_orcamento')
        .select('id')
        .eq('user_id', user.id)
        .eq('categoria_id', newBudget.categoria_id)
        .eq('mes', newBudget.mes)
        .eq('ano', newBudget.ano)
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existing) {
        throw new Error('Já existe um orçamento para esta categoria no período selecionado');
      }

      const { data, error } = await this.supabase
        .from('app_orcamento')
        .insert({ ...newBudget, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar orçamento');
    }
  }

  /**
   * Update a budget
   */
  async updateBudget(id: number, updates: Partial<NewBudget>): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_orcamento')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar orçamento');
    }
  }

  /**
   * Delete a budget
   */
  async deleteBudget(id: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_orcamento')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao excluir orçamento');
    }
  }

  /**
   * Calculate spending/income for a category in a month
   * @param categoriaId - Category ID
   * @param mes - Month
   * @param ano - Year
   * @param tipo - Transaction type to sum ('receita' or 'despesa')
   */
  async getCategorySpending(categoriaId: number, mes: number, ano: number, tipo: BudgetTipo = 'despesa'): Promise<number> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return 0;

      // Get spending/income from app_transacoes for the category/month
      const tiposTransacao = tipo === 'despesa' ? ['despesa', 'despesa_cartao'] : ['receita'];

      const { data, error } = await this.supabase
        .from('app_transacoes')
        .select('valor')
        .eq('user_id', user.id)
        .eq('categoria_id', categoriaId)
        .in('tipo', tiposTransacao)
        .gte('data', `${ano}-${mes.toString().padStart(2, '0')}-01`)
        .lt('data', `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`);

      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + Number(item.valor), 0) || 0;
      return total;
    } catch (error) {
      throw this.handleError(error, 'Falha ao calcular valores da categoria');
    }
  }

  /**
   * Get budget status for current month
   */
  async getBudgetsStatus(mes?: number, ano?: number): Promise<BudgetStatus[]> {
    try {
      const currentDate = new Date();
      const targetMes = mes || currentDate.getMonth() + 1;
      const targetAno = ano || currentDate.getFullYear();

      const budgets = await this.getBudgetsForMonth(targetMes, targetAno);

      const budgetsStatus: BudgetStatus[] = [];

      for (const budget of budgets) {
        // Use the budget type to get correct spending/income
        const budgetTipo = budget.tipo || 'despesa';
        const valorAtual = await this.getCategorySpending(budget.categoria_id, targetMes, targetAno, budgetTipo);
        const percentualGasto = (valorAtual / budget.valor) * 100;
        const saldoRestante = budget.valor - valorAtual;

        // Calculate days remaining in month
        const lastDayOfMonth = new Date(targetAno, targetMes, 0).getDate();
        const today = currentDate.getDate();
        const diasRestantes = Math.max(0, lastDayOfMonth - today);

        // Determine status (different logic for receita vs despesa)
        let status: 'verde' | 'amarelo' | 'vermelho' = 'verde';
        if (budgetTipo === 'despesa') {
          // For expenses: green < 80%, yellow 80-100%, red > 100%
          if (percentualGasto >= 100) {
            status = 'vermelho';
          } else if (percentualGasto >= 80) {
            status = 'amarelo';
          }
        } else {
          // For income: green >= 100%, yellow 50-99%, red < 50%
          if (percentualGasto >= 100) {
            status = 'verde';
          } else if (percentualGasto >= 50) {
            status = 'amarelo';
          } else {
            status = 'vermelho';
          }
        }

        budgetsStatus.push({
          budget,
          gastoAtual: valorAtual,
          percentualGasto: Math.round(percentualGasto * 100) / 100,
          saldoRestante,
          status,
          diasRestantes
        });
      }

      return budgetsStatus.sort((a, b) => b.percentualGasto - a.percentualGasto);
    } catch (error) {
      throw this.handleError(error, 'Falha ao calcular status dos orçamentos');
    }
  }

  /**
   * Get budget summary
   */
  async getBudgetSummary(mes?: number, ano?: number): Promise<{
    totalOrcamento: number;
    totalGasto: number;
    totalRestante: number;
    percentualGasto: number;
    orcamentosVermelhos: number;
    orcamentosAmarelos: number;
    orcamentosVerdes: number;
  }> {
    try {
      const budgetsStatus = await this.getBudgetsStatus(mes, ano);
      
      const totalOrcamento = budgetsStatus.reduce((sum, b) => sum + b.budget.valor, 0);
      const totalGasto = budgetsStatus.reduce((sum, b) => sum + b.gastoAtual, 0);
      const totalRestante = totalOrcamento - totalGasto;
      const percentualGasto = totalOrcamento > 0 ? (totalGasto / totalOrcamento) * 100 : 0;

      const orcamentosVermelhos = budgetsStatus.filter(b => b.status === 'vermelho').length;
      const orcamentosAmarelos = budgetsStatus.filter(b => b.status === 'amarelo').length;
      const orcamentosVerdes = budgetsStatus.filter(b => b.status === 'verde').length;

      return {
        totalOrcamento,
        totalGasto,
        totalRestante,
        percentualGasto: Math.round(percentualGasto * 100) / 100,
        orcamentosVermelhos,
        orcamentosAmarelos,
        orcamentosVerdes
      };
    } catch (error) {
      throw this.handleError(error, 'Falha ao calcular resumo do orçamento');
    }
  }

  /**
   * Get categories without budget for a month
   * @param mes - Month (1-12)
   * @param ano - Year
   * @param tipo - Budget type: 'receita' or 'despesa'
   */
  async getCategoriesWithoutBudget(
    mes: number,
    ano: number,
    tipo: BudgetTipo = 'despesa'
  ): Promise<Array<{ id: number; nome: string; tipo: string; cor?: string; icone?: string }>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      // Get all categories by type
      const { data: allCategories, error: categoriesError } = await this.supabase
        .from('app_categoria')
        .select('id, nome, tipo, cor, icone')
        .eq('tipo', tipo)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order('nome');

      if (categoriesError) throw categoriesError;

      // Get categories that already have budgets for this type
      const { data: budgetedCategories, error: budgetError } = await this.supabase
        .from('app_orcamento')
        .select('categoria_id')
        .eq('user_id', user.id)
        .eq('mes', mes)
        .eq('ano', ano)
        .eq('tipo', tipo);

      if (budgetError) throw budgetError;

      const budgetedIds = budgetedCategories.map(b => b.categoria_id);

      return allCategories.filter(cat => !budgetedIds.includes(cat.id));
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar categorias sem orçamento');
    }
  }

  /**
   * Get all categories by type (for budget creation)
   */
  async getCategoriesByType(tipo: BudgetTipo): Promise<Array<{ id: number; nome: string; tipo: string; cor?: string; icone?: string }>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_categoria')
        .select('id, nome, tipo, cor, icone')
        .eq('tipo', tipo)
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar categorias');
    }
  }

  /**
   * Create a new category (for quick category creation in budget modal)
   */
  async createCategory(categoria: { nome: string; tipo: BudgetTipo; cor?: string; icone?: string }): Promise<{ id: number; nome: string; tipo: string; cor?: string; icone?: string }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase
        .from('app_categoria')
        .insert({
          nome: categoria.nome,
          tipo: categoria.tipo,
          cor: categoria.cor || '#6B7280',
          icone: categoria.icone || 'tag',
          user_id: user.id,
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar categoria');
    }
  }

  // Aliases para compatibilidade com código antigo
  /**
   *
   */
  async list(): Promise<BudgetWithCategory[]> {
    return this.fetchBudgets();
  }

  /**
   *
   */
  async getById(id: number): Promise<BudgetWithCategory | null> {
    return this.getBudget(id);
  }

  /**
   *
   */
  async create(newBudget: NewBudget): Promise<Budget> {
    return this.createBudget(newBudget);
  }

  /**
   *
   */
  async update(id: number, updates: Partial<NewBudget>): Promise<boolean> {
    return this.updateBudget(id, updates);
  }

  /**
   *
   */
  async delete(id: number): Promise<boolean> {
    return this.deleteBudget(id);
  }
}

const budgetService = new BudgetService();
export default budgetService; 