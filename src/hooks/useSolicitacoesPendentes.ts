import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/AuthContext';
import { juntosService } from '../services/api/JuntosService';

/**
 * Hook para buscar contagem de solicitações pendentes
 * Pode ser usado fora do JuntosProvider
 */
export const useSolicitacoesPendentes = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }

    setLoading(true);
    try {
      const pendentes = await juntosService.contarSolicitacoesPendentes();
      setCount(pendentes);
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Busca inicial e quando user muda
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Busca periódica a cada 60 segundos
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user, fetchCount]);

  return { count, loading, refresh: fetchCount };
};

export default useSolicitacoesPendentes;
