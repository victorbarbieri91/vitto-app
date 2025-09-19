import { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { AccountService } from '../services/api';
import type { Account, NewAccount } from '../services/api';

/**
 * Hook para gerenciar contas financeiras usando o AccountService
 */
export function useAccountsService() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accountService = new AccountService();

  const fetchAccounts = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await accountService.fetchAccounts();
      setAccounts(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar contas');
      console.error('Erro ao carregar contas:', err);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (newAccount: NewAccount) => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const data = await accountService.createAccount(newAccount);
      setAccounts(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar conta');
      console.error('Erro ao adicionar conta:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: number, updates: Partial<Account>) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await accountService.updateAccount(id, updates);
      
      if (success) {
        setAccounts(prev => 
          prev.map(account => 
            account.id === id ? { ...account, ...updates } : account
          )
        );
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar conta');
      console.error('Erro ao atualizar conta:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (id: number) => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await accountService.deleteAccount(id);
      
      if (success) {
        setAccounts(prev => prev.filter(account => account.id !== id));
      }
      
      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir conta');
      console.error('Erro ao excluir conta:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getTotalBalance = async () => {
    if (!user) return 0;
    
    try {
      const totalBalance = await accountService.getTotalBalance();
      return totalBalance;
    } catch (err: any) {
      console.error('Erro ao buscar saldo total:', err);
      return 0;
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccounts();
    } else {
      setAccounts([]);
    }
  }, [user]);

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getTotalBalance
  };
}
