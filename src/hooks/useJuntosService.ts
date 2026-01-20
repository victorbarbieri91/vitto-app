import { useState, useCallback } from 'react';
import { juntosService } from '../services/api/JuntosService';
import type { ConviteInfo, AceitarConviteResponse } from '../types/juntos';

/**
 * Hook simples para operações do módulo Juntos que não precisam do contexto completo
 * Útil para páginas como aceitar convite que estão fora do JuntosProvider
 */
export function useJuntosService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca informações de um convite pelo token
   */
  const buscarConvite = useCallback(async (token: string): Promise<ConviteInfo | null> => {
    setLoading(true);
    setError(null);

    try {
      const info = await juntosService.buscarConvitePorToken(token);
      return info;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao buscar convite';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aceita um convite usando o token
   */
  const aceitarConvite = useCallback(async (token: string): Promise<AceitarConviteResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await juntosService.aceitarConvite(token);
      if (!response.success) {
        setError(response.error || 'Erro ao aceitar convite');
      }
      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao aceitar convite';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Gera o link de convite
   */
  const gerarLinkConvite = useCallback((token: string): string => {
    return juntosService.gerarLinkConvite(token);
  }, []);

  return {
    loading,
    error,
    buscarConvite,
    aceitarConvite,
    gerarLinkConvite,
  };
}

export default useJuntosService;
