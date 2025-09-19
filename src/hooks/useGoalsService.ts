import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { GoalService } from '../services/api';
import type { FinancialGoal, NewFinancialGoal } from '../services/api';

/**
 * Hook para gerenciar metas financeiras usando o GoalService
 */
export function useGoalsService() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const goalService = new GoalService();

  const fetchGoals = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await goalService.fetchGoals();
      setGoals(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar metas financeiras');
      console.error('Erro ao carregar metas financeiras:', err);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (newGoal: NewFinancialGoal) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await goalService.createGoal(newGoal);
      setGoals(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar meta financeira');
      console.error('Erro ao adicionar meta financeira:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateGoal = async (id: number, updates: Partial<FinancialGoal>) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await goalService.updateGoal(id, updates);
      
      if (success) {
        setGoals(prev => 
          prev.map(goal => 
            goal.id === id ? { ...goal, ...updates } : goal
          )
        );
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar meta financeira');
      console.error('Erro ao atualizar meta financeira:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteGoal = async (id: number) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await goalService.deleteGoal(id);
      
      if (success) {
        setGoals(prev => prev.filter(goal => goal.id !== id));
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir meta financeira');
      console.error('Erro ao excluir meta financeira:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateGoalProgress = async (id: number, newProgress: number) => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await goalService.updateGoalProgress(id, newProgress);
      
      if (success) {
        setGoals(prev => 
          prev.map(goal => 
            goal.id === id ? { ...goal, valor_atual: newProgress } : goal
          )
        );
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar progresso da meta');
      console.error('Erro ao atualizar progresso da meta:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const getGoalsSummary = async () => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const summary = await goalService.getGoalsSummary();
      return summary;
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar resumo de metas financeiras');
      console.error('Erro ao buscar resumo de metas financeiras:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoals();
    } else {
      setGoals([]);
    }
  }, [user]);

  return {
    goals,
    loading,
    error,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    getGoalsSummary
  };
}
