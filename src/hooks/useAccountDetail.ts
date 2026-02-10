import { useState, useEffect, useCallback } from 'react';
import { AccountService } from '../services/api/AccountService';
import type { Account, Transaction } from '../services/api/AccountService';
import { useAuth } from '../store/AuthContext';

/**
 *
 */
export function useAccountDetail(accountId: string | undefined) {
  const { user } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const accountService = new AccountService();

  const fetchAccountDetails = useCallback(async () => {
    if (!user || !accountId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const numericAccountId = parseInt(accountId, 10);
      if (isNaN(numericAccountId)) {
        throw new Error('ID da conta inválido.');
      }

      const [accountData, transactionsData] = await Promise.all([
        accountService.getAccount(numericAccountId),
        accountService.fetchTransactionsByAccountId(numericAccountId),
      ]);

      setAccount(accountData);
      setTransactions(transactionsData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido';
      console.error('[useAccountDetail] Error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [accountId, user]);

  useEffect(() => {
    fetchAccountDetails();
  }, [fetchAccountDetails]);

  return { account, transactions, loading, error, refetch: fetchAccountDetails };
}
