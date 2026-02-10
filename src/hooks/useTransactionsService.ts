import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { transactionService } from '../services/api';
import type { Transaction, NewTransaction } from '../hooks/useTransactions';

/**
 * Hook para gerenciar transações financeiras usando o TransactionService
 */
export interface ChartData {
  labels: string[];
  incomes: number[];
  expenses: number[];
  balance: number[];
}

export const useTransactionsService = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    incomes: [],
    expenses: [],
    balance: []
  });
  const { user } = useAuth();

  const fetchTransactions = async (filters?: {
    startDate?: string;
    endDate?: string;
    tipo?: string;
    conta_id?: number;
    categoria_id?: number;
  }) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Voltando a chamar fetchTransactions, que agora usa a view unificada
      const data = await transactionService.fetchTransactions(filters);
      setTransactions(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar lançamentos');
      console.error('Erro ao carregar lançamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (newTransaction: NewTransaction) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await transactionService.addTransaction(newTransaction);
      setTransactions(prev => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar lançamento');
      console.error('Erro ao adicionar lançamento:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (id: number, updates: Partial<Transaction>) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await transactionService.updateTransaction(id, updates);
      
      if (success) {
        setTransactions(prev => 
          prev.map(transaction => 
            transaction.id === id ? { ...transaction, ...updates } : transaction
          )
        );
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar lançamento');
      console.error('Erro ao atualizar lançamento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: number) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await transactionService.deleteTransaction(id);
      
      if (success) {
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir lançamento');
      console.error('Erro ao excluir lançamento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getChartData = async (period: 'week' | 'month' | 'year') => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await transactionService.getChartData(period);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar dados do gráfico');
      console.error('Erro ao buscar dados do gráfico:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const getDashboardSummary = async () => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await transactionService.getDashboardSummary();
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar resumo');
      console.error('Erro ao buscar resumo:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async (period: 'week' | 'month' | 'year') => {
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
      
      // Buscar transações no período
      const result = await transactionService.getTransactionsByDateRange(
        user.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      // Processar dados para o gráfico
      const chartData = processChartData(result, period);
      setChartData(chartData);
      return chartData;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const fetchChartDataForDateRange = async (startDate: Date, endDate: Date) => {
    if (!user) return;
    setLoading(true);
    try {
      // Buscar transações no período personalizado
      const result = await transactionService.getTransactionsByDateRange(
        user.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      // Determinar o período apropriado baseado no intervalo de dias
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let period: 'week' | 'month' | 'year';
      if (diffDays <= 14) {
        period = 'week';
      } else if (diffDays <= 60) {
        period = 'month';
      } else {
        period = 'year';
      }
      
      // Processar dados para o gráfico
      const chartData = processChartData(result, period, startDate, endDate);
      setChartData(chartData);
      return chartData;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const processChartData = (
    transactions: Transaction[], 
    period: 'week' | 'month' | 'year',
    customStartDate?: Date,
    _customEndDate?: Date
  ): ChartData => {
    const labels: string[] = [];
    const incomes: number[] = [];
    const expenses: number[] = [];
    const balance: number[] = [];
    
    // Gerar labels e inicializar arrays baseados no período
    if (period === 'week') {
      // Para período semanal, mostrar últimos 7 dias
      const startDate = customStartDate || new Date(new Date().setDate(new Date().getDate() - 6));
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
        incomes.push(0);
        expenses.push(0);
        balance.push(0);
      }
    } else if (period === 'month') {
      // Para período mensal, mostrar últimos 30 dias agrupados por semana
      const startDate = customStartDate || new Date(new Date().setDate(new Date().getDate() - 29));
      for (let i = 0; i < 4; i++) { // 4 semanas
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        labels.push(`${weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}-${weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`);
        incomes.push(0);
        expenses.push(0);
        balance.push(0);
      }
    } else {
      // Para período anual, mostrar últimos 12 meses
      const startDate = customStartDate || new Date(new Date().setMonth(new Date().getMonth() - 11));
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        labels.push(date.toLocaleDateString('pt-BR', { month: 'short' }));
        incomes.push(0);
        expenses.push(0);
        balance.push(0);
      }
    }
    
    // Agrupar transações nos períodos corretos
    transactions.forEach(transaction => {
      const date = new Date(transaction.data);
      let index = 0;
      
      if (period === 'week') {
        // Encontrar o dia da semana
        const startDate = customStartDate || new Date(new Date().setDate(new Date().getDate() - 6));
        const diffDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        index = Math.max(0, Math.min(diffDays, 6));
      } else if (period === 'month') {
        // Encontrar a semana
        const startDate = customStartDate || new Date(new Date().setDate(new Date().getDate() - 29));
        const diffDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        index = Math.floor(diffDays / 7);
        index = Math.max(0, Math.min(index, 3)); // Garantir que esteja entre 0-3
      } else {
        // Encontrar o mês
        const startDate = customStartDate || new Date(new Date().setMonth(new Date().getMonth() - 11));
        const diffMonths = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
        index = Math.max(0, Math.min(diffMonths, 11)); // Garantir que esteja entre 0-11
      }
      
      if (transaction.tipo === 'receita') {
        incomes[index] = (incomes[index] || 0) + transaction.valor;
      } else {
        expenses[index] = (expenses[index] || 0) + transaction.valor;
      }
    });
    
    // Calcular saldo para cada período
    for (let i = 0; i < labels.length; i++) {
      balance[i] = incomes[i] - expenses[i];
    }
    
    return { labels, incomes, expenses, balance };
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [user]);

  return {
    transactions,
    loading,
    error,
    chartData,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getChartData,
    getDashboardSummary,
    fetchChartData,
    fetchChartDataForDateRange
  };
};
