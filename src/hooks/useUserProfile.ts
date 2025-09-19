import { useState, useEffect, useCallback } from 'react';
import { getUserProfile, UserProfile } from '../services/api/users';

interface UseUserProfileReturn {
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook para gerenciar o perfil do usuário
 * Busca automaticamente o perfil quando o userId muda
 * Inclui cache local e gerenciamento de estados
 */
export const useUserProfile = (userId: string | null): UseUserProfileReturn => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[useUserProfile] Buscando perfil para usuário:', id);
      const profile = await getUserProfile(id);
      
      if (profile) {
        console.log('[useUserProfile] Perfil encontrado:', profile.nome);
        setUserProfile(profile);
      } else {
        console.log('[useUserProfile] Perfil não encontrado');
        setUserProfile(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar perfil do usuário';
      console.error('[useUserProfile] Erro ao buscar perfil:', err);
      setError(errorMessage);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (userId) {
      await fetchProfile(userId);
    }
  }, [userId, fetchProfile]);

  // Busca o perfil automaticamente quando o userId muda
  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    } else {
      // Limpa os dados quando não há usuário
      setUserProfile(null);
      setError(null);
      setLoading(false);
    }
  }, [userId, fetchProfile]);

  return {
    userProfile,
    loading,
    error,
    refreshProfile,
  };
};