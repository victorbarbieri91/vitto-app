import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../store/AuthContext';
import { creditCardService, CreditCardWithUsage } from '../services/api';

export function useCreditCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCardWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedCreditCardService = useMemo(() => creditCardService, []);

  useEffect(() => {
    const fetchCreditCards = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await memoizedCreditCardService.listWithUsage();
        setCards(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar os cartões de crédito.');
        console.error('Erro ao carregar os cartões de crédito:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditCards();
  }, [user, memoizedCreditCardService]);

  return { cards, loading, error };
} 