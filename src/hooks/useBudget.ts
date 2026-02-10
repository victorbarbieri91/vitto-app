import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { BudgetService, type BudgetWithCategory, type NewBudget, type BudgetStatus } from '../services/api/BudgetService';

/**
 *
 */
export function useBudget() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const budgetService = new BudgetService();

  const fetchBudgets = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await budgetService.fetchBudgets();
      setBudgets(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar orçamentos');
      console.error('Erro ao carregar orçamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetStatus = async (mes?: number, ano?: number) => {
    if (!user) return;

    try {
      const data = await budgetService.getBudgetsStatus(mes, ano);
      setBudgetStatus(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar status dos orçamentos');
      console.error('Erro ao carregar status dos orçamentos:', err);
    }
  };

  const addBudget = async (newBudget: NewBudget) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const budget = await budgetService.createBudget(newBudget);
      await fetchBudgets();
      await fetchBudgetStatus();
      return budget;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar orçamento';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateBudget = async (id: number, updates: Partial<NewBudget>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const success = await budgetService.updateBudget(id, updates);
      if (success) {
        await fetchBudgets();
        await fetchBudgetStatus();
      }
      return success;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar orçamento';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteBudget = async (id: number) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const success = await budgetService.deleteBudget(id);
      if (success) {
        await fetchBudgets();
        await fetchBudgetStatus();
      }
      return success;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir orçamento';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getBudgetsForMonth = async (mes: number, ano: number) => {
    if (!user) return [];

    try {
      return await budgetService.getBudgetsForMonth(mes, ano);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar orçamentos do mês');
      console.error('Erro ao carregar orçamentos do mês:', err);
      return [];
    }
  };

  const getCategoriesWithoutBudget = async (mes: number, ano: number) => {
    if (!user) return [];

    try {
      return await budgetService.getCategoriesWithoutBudget(mes, ano);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar categorias sem orçamento');
      console.error('Erro ao carregar categorias sem orçamento:', err);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchBudgets();
      fetchBudgetStatus();
    }
  }, [user]);

  return {
    budgets,
    budgetStatus,
    loading,
    error,
    fetchBudgets,
    fetchBudgetStatus,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetsForMonth,
    getCategoriesWithoutBudget
  };
}