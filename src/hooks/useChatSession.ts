import { useState, useCallback, useEffect } from 'react';
import { chatSessionService } from '../services/central-ia';
import type { ChatSession, SessionFilters } from '../types/central-ia';

interface UseChatSessionReturn {
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;

  // Ações
  loadSessions: (filters?: SessionFilters) => Promise<void>;
  createSession: (titulo?: string) => Promise<ChatSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, titulo: string) => Promise<void>;
  searchSessions: (query: string) => void;
  refreshSessions: () => Promise<void>;
}

export function useChatSession(): UseChatSessionReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega sessões
  const loadSessions = useCallback(async (filters?: SessionFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await chatSessionService.listSessions(filters);
      setSessions(data);
      setAllSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sessões');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cria nova sessão
  const createSession = useCallback(async (titulo?: string): Promise<ChatSession> => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await chatSessionService.createSession(titulo);
      setSessions(prev => [session, ...prev]);
      setAllSessions(prev => [session, ...prev]);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sessão');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Deleta sessão
  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await chatSessionService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setAllSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar sessão');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Renomeia sessão
  const renameSession = useCallback(async (sessionId: string, titulo: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await chatSessionService.updateSessionTitle(sessionId, titulo);
      setSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, titulo } : s))
      );
      setAllSessions(prev =>
        prev.map(s => (s.id === sessionId ? { ...s, titulo } : s))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao renomear sessão');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Busca local nas sessões
  const searchSessions = useCallback((query: string) => {
    if (!query.trim()) {
      setSessions(allSessions);
      return;
    }

    const lower = query.toLowerCase();
    const filtered = allSessions.filter(
      s =>
        s.titulo?.toLowerCase().includes(lower) ||
        s.ultima_mensagem?.toLowerCase().includes(lower)
    );
    setSessions(filtered);
  }, [allSessions]);

  // Recarrega sessões (para ser chamado externamente)
  const refreshSessions = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

  // Carrega sessões no mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    isLoading,
    error,
    loadSessions,
    createSession,
    deleteSession,
    renameSession,
    searchSessions,
    refreshSessions,
  };
}
