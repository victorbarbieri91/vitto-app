import { useState, useEffect, useCallback } from 'react';
import marcosService from '../services/api/MarcosService';
import type { 
  Marco, 
  Badge, 
  EventoTimeline, 
  NovoMarco, 
  NovaBadge,
  ResumoHistoria,
  ProgressoMarco,
  EstatisticasJornada
} from '../types/historia';

/**
 * Hook para gerenciar o estado e operações do módulo "Sua História"
 */
export function useHistoriaService() {
  const [marcos, setMarcos] = useState<Marco[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [timeline, setTimeline] = useState<EventoTimeline[]>([]);
  const [resumo, setResumo] = useState<ResumoHistoria | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasJornada | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ===== CARREGAMENTO INICIAL =====

  const loadMarcos = useCallback(async () => {
    try {
      setError(null);
      const data = await marcosService.fetchMarcos();
      setMarcos(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const loadBadges = useCallback(async () => {
    try {
      setError(null);
      const data = await marcosService.fetchBadges();
      setBadges(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const loadTimeline = useCallback(async (limite?: number) => {
    try {
      setError(null);
      const data = await marcosService.fetchTimeline(limite);
      setTimeline(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const loadResumo = useCallback(async () => {
    try {
      setError(null);
      const data = await marcosService.fetchResumoHistoria();
      setResumo(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const loadEstatisticas = useCallback(async () => {
    try {
      setError(null);
      const data = await marcosService.fetchEstatisticas();
      setEstatisticas(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  // ===== OPERAÇÕES COM MARCOS =====

  const createMarco = useCallback(async (novoMarco: NovoMarco): Promise<Marco | null> => {
    try {
      setError(null);
      const marco = await marcosService.createMarco(novoMarco);
      setMarcos(prev => [...prev, marco]);
      await loadResumo(); // Atualizar resumo
      return marco;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [loadResumo]);

  const updateProgressoMarco = useCallback(async (id: string, valor: number): Promise<ProgressoMarco | null> => {
    try {
      setError(null);
      const progresso = await marcosService.updateProgressoMarco(id, valor);
      
      // Atualizar o marco local
      setMarcos(prev => 
        prev.map(marco => 
          marco.id === id 
            ? { 
                ...marco, 
                valor_atual: progresso.valor_atual,
                status: progresso.atingido ? 'concluido' : marco.status,
                achieved_at: progresso.atingido ? new Date().toISOString() : marco.achieved_at
              }
            : marco
        )
      );

      // Recarregar dados se marco foi concluído
      if (progresso.atingido) {
        await Promise.all([loadTimeline(), loadResumo()]);
      }

      return progresso;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [loadTimeline, loadResumo]);

  const completeMarco = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await marcosService.completeMarco(id);
      
      if (success) {
        // Atualizar marco local
        setMarcos(prev => 
          prev.map(marco => 
            marco.id === id 
              ? { 
                  ...marco, 
                  status: 'concluido',
                  achieved_at: new Date().toISOString()
                }
              : marco
          )
        );
        
        // Recarregar dados
        await Promise.all([loadTimeline(), loadResumo()]);
      }
      
      return success;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [loadTimeline, loadResumo]);

  const deleteMarco = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await marcosService.deleteMarco(id);
      
      if (success) {
        setMarcos(prev => prev.filter(marco => marco.id !== id));
        await loadResumo(); // Atualizar resumo
      }
      
      return success;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, [loadResumo]);

  // ===== OPERAÇÕES COM BADGES =====

  const createBadge = useCallback(async (novaBadge: NovaBadge): Promise<Badge | null> => {
    try {
      setError(null);
      const badge = await marcosService.createBadge(novaBadge);
      setBadges(prev => [badge, ...prev]);
      await Promise.all([loadTimeline(), loadResumo()]);
      return badge;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [loadTimeline, loadResumo]);

  // ===== FUNÇÕES AUXILIARES =====

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadMarcos(),
      loadBadges(),
      loadTimeline(100), // Pede explicitamente até 100 eventos
      loadResumo()
    ]);
    setLoading(false);
  }, [loadMarcos, loadBadges, loadTimeline, loadResumo]);

  const getMarcosPendentes = useCallback((): Marco[] => {
    return marcos.filter(marco => marco.status === 'pendente');
  }, [marcos]);

  const getMarcosCompletados = useCallback((): Marco[] => {
    return marcos.filter(marco => marco.status === 'concluido');
  }, [marcos]);

  const getProximoMarco = useCallback((): Marco | null => {
    const pendentes = getMarcosPendentes();
    return pendentes.length > 0 ? pendentes[0] : null;
  }, [getMarcosPendentes]);

  const getProgressoGeral = useCallback((): number => {
    if (marcos.length === 0) return 0;
    const concluidos = getMarcosCompletados().length;
    return Math.round((concluidos / marcos.length) * 100);
  }, [marcos, getMarcosCompletados]);

  // ===== CARREGAMENTO INICIAL =====

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ===== RETURN =====

  return {
    // Estados
    marcos,
    badges,
    timeline,
    resumo,
    estatisticas,
    loading,
    error,

    // Operações com marcos
    createMarco,
    updateProgressoMarco,
    completeMarco,
    deleteMarco,

    // Operações com badges
    createBadge,

    // Carregamento
    loadMarcos,
    loadBadges,
    loadTimeline,
    loadResumo,
    loadEstatisticas,
    refreshData,

    // Funções auxiliares
    getMarcosPendentes,
    getMarcosCompletados,
    getProximoMarco,
    getProgressoGeral,

    // Dados calculados
    marcosPendentes: getMarcosPendentes(),
    marcosCompletados: getMarcosCompletados(),
    proximoMarco: getProximoMarco(),
    progressoGeral: getProgressoGeral()
  };
}

/**
 * Hook simplificado para usar apenas o resumo da história
 */
export function useResumoHistoria() {
  const [resumo, setResumo] = useState<ResumoHistoria | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadResumo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marcosService.fetchResumoHistoria();
      setResumo(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumo();
  }, [loadResumo]);

  return {
    resumo,
    loading,
    error,
    refresh: loadResumo
  };
}

/**
 * Hook específico para o timeline
 */
export function useTimeline(limite?: number) {
  const [timeline, setTimeline] = useState<EventoTimeline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marcosService.fetchTimeline(limite);
      setTimeline(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [limite]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  return {
    timeline,
    loading,
    error,
    refresh: loadTimeline
  };
}