import { BaseApi } from './BaseApi';

export type Category = {
  id: number;
  nome: string;
  tipo: 'receita' | 'despesa' | 'ambos';
  cor: string;
  user_id: string;
  created_at: string;
};

export type NewCategory = Omit<Category, 'id' | 'created_at' | 'user_id'>;

/**
 * Service to handle all category-related API calls
 */
export class CategoryService extends BaseApi {
  /**
   * Fetch all categories for the current user
   */
  async fetchCategories(): Promise<Category[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_categoria')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar categorias');
    }
  }

  /**
   * Get categories by type
   */
  async getCategoriesByType(type: 'receita' | 'despesa' | 'ambos'): Promise<Category[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_categoria')
        .select('*')
        .eq('user_id', user.id)
        .or(`tipo.eq.${type},tipo.eq.ambos`)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar categorias por tipo');
    }
  }

  /**
   * Create a new category
   */
  async createCategory(newCategory: NewCategory): Promise<Category> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase
        .from('app_categoria')
        .insert({ ...newCategory, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar categoria');
    }
  }

  /**
   * Update a category
   */
  async updateCategory(id: number, updates: Partial<Category>): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_categoria')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar categoria');
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if category has transactions
      const { data: transactions, error: checkError } = await this.supabase
        .from('app_transacoes')
        .select('id')
        .eq('categoria_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (transactions && transactions.length > 0) {
        throw new Error('Não é possível excluir categoria com transações associadas');
      }

      const { error } = await this.supabase
        .from('app_categoria')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao excluir categoria');
    }
  }
  
  /**
   * Busca categorias por ID de usuário
   * @param userId ID do usuário
   * @returns Lista de categorias do usuário
   */
  async getCategoriesByUserId(userId: string): Promise<Category[]> {
    try {
      const { data, error } = await this.supabase
        .from('app_categoria')
        .select('*')
        .eq('user_id', userId)
        .order('nome');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar categorias do usuário');
    }
  }

  /**
   * Get expense distribution by category for a period
   */
  async getExpenseDistributionByCategory(period: 'week' | 'month' | 'year'): Promise<{
    categoryName: string;
    categoryColor: string;
    amount: number;
    percentage: number;
  }[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      // Get date range for the period
      const { startDate, endDate } = this.getDateRangeByPeriod(period);

      // Get all expenses for the period (including card expenses)
      const { data: transactions, error: transactionError } = await this.supabase
        .from('app_transacoes')
        .select('valor, categoria_id')
        .eq('user_id', user.id)
        .in('tipo', ['despesa', 'despesa_cartao'])
        .eq('status', 'confirmado')
        .gte('data', startDate)
        .lte('data', endDate);

      if (transactionError) throw transactionError;

      // Get all categories (user's + system default categories)
      const { data: categories, error: categoryError } = await this.supabase
        .from('app_categoria')
        .select('id, nome, cor')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .or('tipo.eq.despesa,tipo.eq.ambos');

      if (categoryError) throw categoryError;

      if (!transactions || !categories || transactions.length === 0) {
        return [];
      }

      // Create a map of categories for easy lookup
      const categoryMap = new Map();
      categories.forEach(category => {
        categoryMap.set(category.id, {
          name: category.nome,
          color: category.cor,
          amount: 0
        });
      });

      // Add 'Sem categoria' for transactions without a category
      categoryMap.set('null', {
        name: 'Sem categoria',
        color: '#CCCCCC',
        amount: 0
      });

      // Sum expenses by category
      let totalExpenses = 0;
      transactions.forEach(transaction => {
        const categoryId = transaction.categoria_id || 'null';
        const category = categoryMap.get(categoryId);
        
        if (category) {
          category.amount += transaction.valor;
          totalExpenses += transaction.valor;
        } else {
          // Handle transactions with a category that no longer exists
          const unknownCategory = categoryMap.get('null') || { name: 'Sem categoria', color: '#CCCCCC', amount: 0 };
          unknownCategory.amount += transaction.valor;
          totalExpenses += transaction.valor;
          categoryMap.set('null', unknownCategory);
        }
      });

      // Convert to array and calculate percentages
      const result = Array.from(categoryMap.values())
        .filter(item => item.amount > 0)
        .map(item => ({
          categoryName: item.name,
          categoryColor: item.color,
          amount: item.amount,
          percentage: totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);

      return result;
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar distribuição de despesas por categoria');
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;
