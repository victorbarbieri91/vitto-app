import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { CategoryService, TransactionService } from '../services/api';
import type { Category, NewCategory } from '../services/api';

/**
 * Hook para gerenciar categorias usando o CategoryService
 */
export interface CategoryDistribution {
  labels: string[];
  values: number[];
  colors: string[];
}

export const useCategoriesService = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution>({
    labels: [],
    values: [],
    colors: []
  });
  const { user } = useAuth();
  const categoryService = new CategoryService();
  const transactionService = new TransactionService();

  const fetchCategories = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await categoryService.fetchCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err);
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoriesByType = async (type: 'receita' | 'despesa' | 'ambos') => {
    if (!user) return [];

    setLoading(true);
    setError(null);

    try {
      const data = await categoryService.getCategoriesByType(type);
      return data;
    } catch (err: any) {
      setError(err);
      console.error('Erro ao buscar categorias por tipo:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (newCategory: NewCategory) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await categoryService.createCategory(newCategory);
      setCategories(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err);
      console.error('Erro ao adicionar categoria:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (id: number, updates: Partial<Category>) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await categoryService.updateCategory(id, updates);
      
      if (success) {
        setCategories(prev => 
          prev.map(category => 
            category.id === id ? { ...category, ...updates } : category
          )
        );
      }
      
      return success;
    } catch (err: any) {
      setError(err);
      console.error('Erro ao atualizar categoria:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await categoryService.deleteCategory(id);
      
      if (success) {
        setCategories(prev => prev.filter(category => category.id !== id));
      }
      
      return success;
    } catch (err: any) {
      setError(err);
      console.error('Erro ao excluir categoria:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getExpenseDistribution = async (period: 'week' | 'month' | 'year') => {
    if (!user) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await categoryService.getExpenseDistributionByCategory(period);
      return data;
    } catch (err: any) {
      setError(err);
      console.error('Erro ao buscar distribuição de despesas:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Busca dados de distribuição por categoria para um período
  const fetchCategoryDistribution = async (period: 'week' | 'month' | 'year') => {
    if (!user) return;
    setLoading(true);
    try {
      // Configurar datas baseadas no período selecionado
      const endDate = new Date();
      const startDate = new Date();
      
      switch(period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      // Buscar transações do tipo despesa no período
      const transactions = await transactionService.getTransactionsByDateRange(
        user.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      // Filtrar apenas despesas
      const expenses = transactions.filter(t => t.tipo === 'despesa');
      
      // Buscar categorias
      const allCategories = await categoryService.getCategoriesByUserId(user.id);
      
      // Processar distribuição de categorias
      const distribution = processCategoryDistribution(expenses, allCategories);
      setCategoryDistribution(distribution);
      return distribution;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Busca dados de distribuição por categoria para um intervalo personalizado
  const fetchCategoryDistributionForDateRange = async (startDate: Date, endDate: Date) => {
    if (!user) return;
    setLoading(true);
    try {
      // Buscar transações do tipo despesa no período personalizado
      const transactions = await transactionService.getTransactionsByDateRange(
        user.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      // Filtrar apenas despesas
      const expenses = transactions.filter(t => t.tipo === 'despesa');
      
      // Buscar categorias
      const allCategories = await categoryService.getCategoriesByUserId(user.id);
      
      // Processar distribuição de categorias
      const distribution = processCategoryDistribution(expenses, allCategories);
      setCategoryDistribution(distribution);
      return distribution;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Função auxiliar para processar a distribuição de categorias
  const processCategoryDistribution = (
    transactions: any[], 
    categories: Category[]
  ): CategoryDistribution => {
    // Agrupar transações por categoria_id
    const categoryTotals = transactions.reduce((acc, transaction) => {
      const categoryId = transaction.categoria_id;
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      acc[categoryId] += transaction.valor;
      return acc;
    }, {});
    
    // Preparar dados para o gráfico
    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];
    
    // Para cada categoria com gastos
    Object.entries(categoryTotals).forEach(([categoryId, total]) => {
      const category = categories.find(c => c.id === parseInt(categoryId));
      if (category) {
        labels.push(category.nome);
        values.push(total as number);
        colors.push(category.cor || '#6366F1');
      } else {
        labels.push('Sem categoria');
        values.push(total as number);
        colors.push('#CBD5E1'); // Cor padrão para categoria não encontrada
      }
    });
    
    return { labels, values, colors };
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    } else {
      setCategories([]);
    }
  }, [user]);

  return {
    categories,
    loading,
    error,
    categoryDistribution,
    fetchCategories,
    getCategoriesByType,
    addCategory,
    updateCategory,
    deleteCategory,
    getExpenseDistribution,
    fetchCategoryDistribution,
    fetchCategoryDistributionForDateRange
  };
};
