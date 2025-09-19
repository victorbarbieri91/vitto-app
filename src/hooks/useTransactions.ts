import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { transactionService, type TransactionWithDetails } from '../services/api/TransactionService';

export type Transaction = {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa' | 'transferencia';
  categoria_id: number | null;
  conta_id: number;
  status: 'pendente' | 'confirmado' | 'cancelado';
  user_id: string;
  created_at: string;
};

export type NewTransaction = Omit<Transaction, 'id' | 'created_at' | 'user_id'>;

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (filters?: {
    startDate?: string;
    endDate?: string;
    tipo?: string;
    conta_id?: number;
    categoria_id?: number;
    status?: string;
  }) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('app_lancamento')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters) {
        if (filters.startDate) {
          query = query.gte('data', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('data', filters.endDate);
        }
        if (filters.tipo) {
          query = query.eq('tipo', filters.tipo);
        }
        if (filters.conta_id) {
          query = query.eq('conta_id', filters.conta_id);
        }
        if (filters.categoria_id) {
          query = query.eq('categoria_id', filters.categoria_id);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
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
      // Iniciar uma transação para garantir consistência
      const { data, error } = await supabase
        .from('app_lancamento')
        .insert({ ...newTransaction, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Se o status for efetivado, atualizar o saldo da conta
      if (newTransaction.status === 'efetivado') {
        await updateAccountBalance(
          newTransaction.conta_id,
          newTransaction.tipo,
          newTransaction.valor
        );
      }

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
      // Buscar a transação atual para comparar mudanças
      const { data: currentTransaction, error: fetchError } = await supabase
        .from('app_lancamento')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Atualizar a transação
      const { error } = await supabase
        .from('app_lancamento')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Verificar se o status mudou e atualizar saldos se necessário
      if (updates.status && updates.status !== currentTransaction.status) {
        // Se a transação foi efetivada
        if (updates.status === 'confirmado' && currentTransaction.status !== 'confirmado') {
          await updateAccountBalance(
            currentTransaction.conta_id,
            currentTransaction.tipo,
            currentTransaction.valor
          );
        }
        // Se a transação foi cancelada ou revertida
        else if (currentTransaction.status === 'efetivado' && updates.status !== 'efetivado') {
          await updateAccountBalance(
            currentTransaction.conta_id,
            currentTransaction.tipo === 'despesa' ? 'receita' : 'despesa',
            currentTransaction.valor
          );
        }
      }

      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id ? { ...transaction, ...updates } : transaction
        )
      );
      
      return true;
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
      // Buscar a transação para reverter o saldo se necessário
      const { data: transaction, error: fetchError } = await supabase
        .from('app_lancamento')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Excluir a transação
      const { error } = await supabase
        .from('app_lancamento')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Se a transação estava confirmada, reverter o saldo
      if (transaction.status === 'confirmado') {
        await updateAccountBalance(
          transaction.conta_id,
          transaction.tipo === 'despesa' ? 'receita' : 'despesa',
          transaction.valor
        );
      }

      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir lançamento');
      console.error('Erro ao excluir lançamento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para atualizar o saldo da conta
  const updateAccountBalance = async (
    accountId: number,
    type: string,
    amount: number
  ) => {
    try {
      // Buscar a conta de origem
      const { data: sourceAccount, error: sourceError } = await supabase
        .from('app_conta')
        .select('saldo_atual')
        .eq('id', accountId)
        .single();

      if (sourceError) throw sourceError;

      let newBalance = sourceAccount.saldo_atual;

      // Atualizar saldo com base no tipo de transação
      if (type === 'receita') {
        newBalance += amount;
      } else if (type === 'despesa') {
        newBalance -= amount;
      } else if (type === 'transferencia') {
        // Para transferências, diminuir da conta de origem
        newBalance -= amount;
      }

      // Atualizar saldo da conta de origem
      await supabase
        .from('app_conta')
        .update({ saldo_atual: newBalance })
        .eq('id', accountId);

    } catch (err) {
      console.error('Erro ao atualizar saldo da conta:', err);
      throw err;
    }
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
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
