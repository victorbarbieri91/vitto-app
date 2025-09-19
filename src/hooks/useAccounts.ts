import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { AccountService } from '../services/api/AccountService';
import type { Account, AccountGroup, NewAccountGroup, UpdateAccountGroup, AccountFormData, TransferData } from '../services/api/AccountService';

export function useAccounts() {
  const { user } = useAuth();
  const accountService = useMemo(() => new AccountService(), []);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any, defaultMessage: string) => {
    const message = err.message || defaultMessage;
    setError(message);
    console.error(message, err);
  };

  const fetchAllData = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setAccountGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [fetchedAccounts, fetchedGroups] = await Promise.all([
        accountService.fetchAccounts(),
        accountService.fetchAccountGroups(),
      ]);
      setAccounts(fetchedAccounts);
      setAccountGroups(fetchedGroups);
    } catch (err) {
      handleError(err, 'Erro ao carregar dados das contas');
    } finally {
      setLoading(false);
    }
  }, [user, accountService]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

    const addAccount = async (accountData: AccountFormData) => {
    if (!user) {
      handleError(new Error('Usuário não autenticado.'), 'Erro ao adicionar conta');
      return null;
    }
    setLoading(true);
    try {
      const newAccount = await accountService.createAccount({
        ...accountData,
        user_id: user.id,
        saldo_atual: accountData.saldo_inicial,
      });
      setAccounts(prev => [...prev, newAccount]);
      fetchAllData();
      return newAccount;
    } catch (err) {
      handleError(err, 'Erro ao adicionar conta');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (id: number, accountData: Partial<AccountFormData>) => {
    try {
      await accountService.updateAccount(id, accountData);

      // Atualizar o estado local imediatamente para melhor UX
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === id ? { ...acc, ...accountData } : acc
        )
      );

      // Re-fetch para garantir consistência, mas sem loading
      setTimeout(() => fetchAllData(), 500);
      return true;
    } catch (err) {
      handleError(err, 'Erro ao atualizar conta');
      return false;
    }
  };

  const deleteAccount = async (id: number) => {
    setLoading(true);
    try {
      await accountService.deleteAccount(id);
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      return true;
    } catch (err) {
      handleError(err, 'Erro ao excluir conta');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // --- Account Group Functions ---
  
  const addAccountGroup = async (newGroup: NewAccountGroup) => {
    setLoading(true);
    try {
      const createdGroup = await accountService.createAccountGroup(newGroup);
      setAccountGroups(prev => [...prev, createdGroup]);
      return createdGroup;
    } catch (err) {
      handleError(err, 'Erro ao adicionar grupo de contas');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const updateAccountGroup = async (id: number, updates: UpdateAccountGroup) => {
    setLoading(true);
    try {
      await accountService.updateAccountGroup(id, updates);
      setAccountGroups(prev =>
        prev.map(group => (group.id === id ? { ...group, ...updates } : group))
      );
      return true;
    } catch (err) {
      handleError(err, 'Erro ao atualizar grupo de contas');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteAccountGroup = async (id: number) => {
    setLoading(true);
    try {
      await accountService.deleteAccountGroup(id);
      setAccountGroups(prev => prev.filter(group => group.id !== id));
      return true;
    } catch (err) {
      handleError(err, 'Erro ao excluir grupo de contas');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createTransfer = async (transferData: TransferData) => {
    setLoading(true);
    try {
      const success = await accountService.createTransfer(transferData);
      if (success) {
        // Re-fetch all data to update balances and transactions
        await fetchAllData();
      }
      return success;
    } catch (err) {
      handleError(err, 'Erro ao realizar transferência');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    accounts,
    accountGroups,
    loading,
    error,
    fetchAccounts: fetchAllData,
    addAccount,
    updateAccount,
    deleteAccount,
    addAccountGroup,
    updateAccountGroup,
    deleteAccountGroup,
    createTransfer,
  };
}
