import { BaseApi } from './BaseApi';

export type FinancialGoal = {
  id: number;
  titulo: string;
  valor_meta: number;
  valor_atual: number;
  data_inicio: string;
  data_fim: string;
  descricao?: string;
  cor: string;
  user_id: string;
  created_at: string;
};

export type NewFinancialGoal = Omit<FinancialGoal, 'id' | 'created_at' | 'user_id'>;

/**
 * Service to handle all financial goal-related API calls
 */
export class GoalService extends BaseApi {
  /**
   * Fetch all financial goals for the current user
   */
  async fetchGoals(): Promise<FinancialGoal[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_meta_financeira')
        .select('*')
        .eq('user_id', user.id)
        .order('data_fim', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar metas financeiras');
    }
  }

  /**
   * Get a financial goal by ID
   */
  async getGoal(id: number): Promise<FinancialGoal | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('app_meta_financeira')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar meta financeira');
    }
  }

  /**
   * Create a new financial goal
   */
  async createGoal(newGoal: NewFinancialGoal): Promise<FinancialGoal> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase
        .from('app_meta_financeira')
        .insert({ ...newGoal, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar meta financeira');
    }
  }

  /**
   * Update a financial goal
   */
  async updateGoal(id: number, updates: Partial<FinancialGoal>): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_meta_financeira')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar meta financeira');
    }
  }

  /**
   * Delete a financial goal
   */
  async deleteGoal(id: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_meta_financeira')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao excluir meta financeira');
    }
  }
  
  /**
   * Update goal progress - add to current value
   */
  async addToGoalProgress(id: number, amount: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Get current goal
      const { data: goal, error: fetchError } = await this.supabase
        .from('app_meta_financeira')
        .select('valor_atual')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      const newProgress = goal.valor_atual + amount;
      
      // Update progress value
      const { error } = await this.supabase
        .from('app_meta_financeira')
        .update({ valor_atual: newProgress })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar progresso da meta');
    }
  }

  /**
   * Set goal progress to specific value
   */
  async setGoalProgress(id: number, newProgress: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');
      
      // Validate new progress is not negative
      if (newProgress < 0) {
        throw new Error('O progresso não pode ser negativo');
      }
      
      // Update progress value
      const { error } = await this.supabase
        .from('app_meta_financeira')
        .update({ valor_atual: newProgress })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar progresso da meta');
    }
  }
  
  /**
   * Get summary of goals progress
   */
  async getGoalsSummary(): Promise<{
    totalGoals: number;
    completedGoals: number;
    upcomingDeadlineGoals: number;
    averageProgress: number;
    totalValue: number;
    totalProgress: number;
  }> {
    try {
      const goals = await this.fetchGoals();
      
      if (!goals.length) {
        return {
          totalGoals: 0,
          completedGoals: 0,
          upcomingDeadlineGoals: 0,
          averageProgress: 0,
          totalValue: 0,
          totalProgress: 0
        };
      }
      
      // Calculate stats
      const totalGoals = goals.length;
      const completedGoals = goals.filter(g => (g.valor_atual / g.valor_meta) >= 1).length;
      
      // Goals with deadline in the next 30 days
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);
      
      const upcomingDeadlineGoals = goals.filter(g => {
        const deadline = new Date(g.data_fim);
        return deadline > today && deadline <= in30Days && (g.valor_atual / g.valor_meta) < 1;
      }).length;
      
      // Calculate totals
      const totalValue = goals.reduce((sum, g) => sum + g.valor_meta, 0);
      const totalProgress = goals.reduce((sum, g) => sum + g.valor_atual, 0);
      
      // Average progress across all goals
      const totalProgressPercentage = goals.reduce((sum, g) => {
        const progress = Math.min(g.valor_atual / g.valor_meta, 1); // Cap at 100%
        return sum + progress;
      }, 0);
      
      const averageProgress = (totalProgressPercentage / totalGoals) * 100;
      
      return {
        totalGoals,
        completedGoals,
        upcomingDeadlineGoals,
        averageProgress: Math.round(averageProgress),
        totalValue,
        totalProgress
      };
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar resumo das metas');
    }
  }

  /**
   * Get goals that are ending soon (next 30 days)
   */
  async getUpcomingGoals(): Promise<FinancialGoal[]> {
    try {
      const goals = await this.fetchGoals();
      
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);
      
      return goals.filter(goal => {
        const deadline = new Date(goal.data_fim);
        return deadline > today && deadline <= in30Days && (goal.valor_atual / goal.valor_meta) < 1;
      });
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar metas próximas do vencimento');
    }
  }

  /**
   * Get overdue goals
   */
  async getOverdueGoals(): Promise<FinancialGoal[]> {
    try {
      const goals = await this.fetchGoals();
      
      const today = new Date();
      
      return goals.filter(goal => {
        const deadline = new Date(goal.data_fim);
        return deadline < today && (goal.valor_atual / goal.valor_meta) < 1;
      });
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar metas em atraso');
    }
  }
}

const goalService = new GoalService();
export default goalService;
