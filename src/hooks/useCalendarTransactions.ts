import { useState, useEffect, useMemo } from 'react';
import { transactionService, type TransactionWithDetails } from '../services/api/TransactionService';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface DayTransactions {
  date: string;
  receitas: number;
  despesas: number;
  saldo: number;
  count: number;
  transactions: TransactionWithDetails[];
}

export interface CalendarTransactionsData {
  [key: string]: DayTransactions;
}

export const useCalendarTransactions = (month: number, year: number) => {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcular datas do período
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  // Buscar transações do mês
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`[Calendar] Buscando transações para ${month}/${year}`);
        console.log(`[Calendar] Período: ${format(startDate, 'yyyy-MM-dd')} a ${format(endDate, 'yyyy-MM-dd')}`);

        // Primeiro tentar buscar transações simples do mês
        const { data: simpleData } = await transactionService.list({
          mes: month,
          ano: year
        });

        console.log(`[Calendar] Transações encontradas:`, simpleData?.length || 0);

        if (simpleData && simpleData.length > 0) {
          setTransactions(simpleData);
        } else {
          // Se não houver dados, tentar com fetchTransactionsWithVirtual
          const data = await transactionService.fetchTransactionsWithVirtual({
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd')
          });
          console.log(`[Calendar] Transações virtuais encontradas:`, data?.length || 0);
          setTransactions(data || []);
        }
      } catch (err) {
        console.error('Erro ao buscar transações do calendário:', err);
        setError('Erro ao carregar transações');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [month, year]);

  // Processar transações por dia
  const transactionsByDay = useMemo<CalendarTransactionsData>(() => {
    const result: CalendarTransactionsData = {};

    console.log(`[Calendar] Processando ${transactions.length} transações`);

    transactions.forEach(transaction => {
      const dateKey = transaction.data; // formato: yyyy-MM-dd

      if (!result[dateKey]) {
        result[dateKey] = {
          date: dateKey,
          receitas: 0,
          despesas: 0,
          saldo: 0,
          count: 0,
          transactions: []
        };
      }

      const value = Math.abs(Number(transaction.valor) || 0);

      if (transaction.tipo === 'receita') {
        result[dateKey].receitas += value;
      } else if (transaction.tipo === 'despesa' || transaction.tipo === 'despesa_cartao') {
        result[dateKey].despesas += value;
      }

      result[dateKey].transactions.push(transaction);
      result[dateKey].count++;
    });

    // Calcular saldo de cada dia
    Object.values(result).forEach(day => {
      day.saldo = day.receitas - day.despesas;
    });

    const daysWithTransactions = Object.keys(result).length;
    console.log(`[Calendar] ${daysWithTransactions} dias com transações:`, Object.keys(result));

    return result;
  }, [transactions]);

  // Verificar se um dia tem transações
  const hasTransactions = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return !!transactionsByDay[dateKey]?.count;
  };

  // Obter resumo de um dia específico
  const getDayTransactions = (date: Date): DayTransactions | null => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return transactionsByDay[dateKey] || null;
  };

  // Obter lista de datas com transações (para modifiers)
  const datesWithTransactions = useMemo(() => {
    return Object.keys(transactionsByDay).map(dateStr => {
      // Criar data com fuso horário local para evitar problemas de offset
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
  }, [transactionsByDay]);

  return {
    transactions,
    transactionsByDay,
    hasTransactions,
    getDayTransactions,
    datesWithTransactions,
    loading,
    error
  };
};