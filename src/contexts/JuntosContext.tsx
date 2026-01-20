import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../store/AuthContext';
import { juntosService } from '../services/api/JuntosService';
import type {
  GrupoResumo,
  DadosGrupoJuntos,
  CriarGrupoForm,
  CriarGrupoResponse,
  ConvidarMembroForm,
  EnviarConviteResponse,
  AceitarConviteResponse,
  JuntosSuccessResponse,
  AtualizarPermissoesForm,
  CriarMetaForm,
  CriarMetaResponse,
  ContribuirMetaForm,
  JuntosContextType,
} from '../types/juntos';

const JuntosContext = createContext<JuntosContextType | undefined>(undefined);

interface JuntosProviderProps {
  children: ReactNode;
}

export const JuntosProvider: React.FC<JuntosProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // Estado
  const [grupos, setGrupos] = useState<GrupoResumo[]>([]);
  const [grupoAtivo, setGrupoAtivoState] = useState<GrupoResumo | null>(null);
  const [dadosGrupo, setDadosGrupo] = useState<DadosGrupoJuntos | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState(0);

  /**
   * Busca todos os grupos do usuário
   */
  const fetchGrupos = useCallback(async () => {
    if (!user) {
      setGrupos([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const gruposData = await juntosService.listarGrupos();
      setGrupos(gruposData);

      // Se tiver grupos e nenhum ativo, seleciona o primeiro
      if (gruposData.length > 0 && !grupoAtivo) {
        setGrupoAtivoState(gruposData[0]);
      }
    } catch (err) {
      console.error('Erro ao buscar grupos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar grupos');
    } finally {
      setLoading(false);
    }
  }, [user, grupoAtivo]);

  /**
   * Busca contagem de solicitações pendentes
   */
  const fetchSolicitacoesPendentes = useCallback(async () => {
    if (!user) {
      setSolicitacoesPendentes(0);
      return;
    }

    try {
      const count = await juntosService.contarSolicitacoesPendentes();
      setSolicitacoesPendentes(count);
    } catch (err) {
      console.error('Erro ao buscar solicitações pendentes:', err);
    }
  }, [user]);

  /**
   * Define o grupo ativo
   */
  const setGrupoAtivo = useCallback((grupo: GrupoResumo | null) => {
    setGrupoAtivoState(grupo);
    setDadosGrupo(null); // Limpa dados ao trocar de grupo
  }, []);

  /**
   * Busca dados consolidados do grupo ativo
   */
  const fetchDadosGrupo = useCallback(async (grupoId: number, mes?: number, ano?: number) => {
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dados = await juntosService.obterDadosGrupo(grupoId, mes, ano);

      if (!dados.success) {
        setError(dados.error || 'Erro ao buscar dados do grupo');
        return;
      }

      setDadosGrupo(dados);
    } catch (err) {
      console.error('Erro ao buscar dados do grupo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados do grupo');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Cria um novo grupo
   */
  const criarGrupo = useCallback(async (form: CriarGrupoForm): Promise<CriarGrupoResponse> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await juntosService.criarGrupo(form);

      if (response.success) {
        // Atualiza lista de grupos
        await fetchGrupos();
      }

      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar grupo';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [user, fetchGrupos]);

  /**
   * Envia convite para membro
   */
  const enviarConvite = useCallback(async (
    grupoId: number,
    form: ConvidarMembroForm
  ): Promise<EnviarConviteResponse> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      return await juntosService.enviarConvite(grupoId, form);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao enviar convite';
      return { success: false, error: errorMsg };
    }
  }, [user]);

  /**
   * Aceita um convite
   */
  const aceitarConvite = useCallback(async (token: string): Promise<AceitarConviteResponse> => {
    if (!user) {
      return { success: false, error: 'Você precisa estar logado para aceitar o convite' };
    }

    try {
      const response = await juntosService.aceitarConvite(token);

      if (response.success) {
        // Atualiza lista de grupos após aceitar
        await fetchGrupos();
      }

      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao aceitar convite';
      return { success: false, error: errorMsg };
    }
  }, [user, fetchGrupos]);

  /**
   * Sai de um grupo
   */
  const sairGrupo = useCallback(async (grupoId: number): Promise<JuntosSuccessResponse> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const response = await juntosService.sairGrupo(grupoId);

      if (response.success) {
        // Se saiu do grupo ativo, limpa
        if (grupoAtivo?.id === grupoId) {
          setGrupoAtivoState(null);
          setDadosGrupo(null);
        }
        // Atualiza lista
        await fetchGrupos();
      }

      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao sair do grupo';
      return { success: false, error: errorMsg };
    }
  }, [user, grupoAtivo, fetchGrupos]);

  /**
   * Atualiza permissões de um membro
   */
  const atualizarPermissoes = useCallback(async (
    grupoId: number,
    membroUserId: string,
    permissoes: AtualizarPermissoesForm
  ): Promise<JuntosSuccessResponse> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const response = await juntosService.atualizarPermissoes(grupoId, membroUserId, permissoes);

      if (response.success && grupoAtivo?.id === grupoId) {
        // Atualiza dados do grupo
        await fetchDadosGrupo(grupoId);
      }

      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar permissões';
      return { success: false, error: errorMsg };
    }
  }, [user, grupoAtivo, fetchDadosGrupo]);

  /**
   * Cria uma meta compartilhada
   */
  const criarMeta = useCallback(async (
    grupoId: number,
    form: CriarMetaForm
  ): Promise<CriarMetaResponse> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const response = await juntosService.criarMeta(grupoId, form);

      if (response.success && grupoAtivo?.id === grupoId) {
        // Atualiza dados do grupo
        await fetchDadosGrupo(grupoId);
      }

      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar meta';
      return { success: false, error: errorMsg };
    }
  }, [user, grupoAtivo, fetchDadosGrupo]);

  /**
   * Contribui para uma meta
   */
  const contribuirMeta = useCallback(async (
    metaId: number,
    form: ContribuirMetaForm
  ): Promise<JuntosSuccessResponse> => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    try {
      const response = await juntosService.contribuirMeta(metaId, form);

      if (response.success && grupoAtivo) {
        // Atualiza dados do grupo
        await fetchDadosGrupo(grupoAtivo.id);
      }

      return response;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao contribuir para meta';
      return { success: false, error: errorMsg };
    }
  }, [user, grupoAtivo, fetchDadosGrupo]);

  /**
   * Refresh geral dos dados
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchGrupos(),
      fetchSolicitacoesPendentes(),
    ]);
    if (grupoAtivo) {
      await fetchDadosGrupo(grupoAtivo.id);
    }
  }, [fetchGrupos, fetchSolicitacoesPendentes, grupoAtivo, fetchDadosGrupo]);

  // Carrega grupos e solicitações quando usuário loga
  useEffect(() => {
    if (user) {
      fetchGrupos();
      fetchSolicitacoesPendentes();
    } else {
      setGrupos([]);
      setGrupoAtivoState(null);
      setDadosGrupo(null);
      setSolicitacoesPendentes(0);
    }
  }, [user]); // Não incluir fetchGrupos/fetchSolicitacoesPendentes para evitar loop

  // Carrega dados do grupo ativo quando ele muda
  useEffect(() => {
    if (grupoAtivo && user) {
      fetchDadosGrupo(grupoAtivo.id);
    }
  }, [grupoAtivo, user]); // Não incluir fetchDadosGrupo para evitar loop

  const value: JuntosContextType = {
    // Estado
    grupos,
    grupoAtivo,
    dadosGrupo,
    loading,
    error,
    solicitacoesPendentes,
    // Ações
    fetchGrupos,
    setGrupoAtivo,
    fetchDadosGrupo,
    criarGrupo,
    enviarConvite,
    aceitarConvite,
    sairGrupo,
    atualizarPermissoes,
    criarMeta,
    contribuirMeta,
    refresh,
    fetchSolicitacoesPendentes,
  };

  return (
    <JuntosContext.Provider value={value}>
      {children}
    </JuntosContext.Provider>
  );
};

/**
 * Hook para usar o contexto Juntos
 */
export const useJuntos = (): JuntosContextType => {
  const context = useContext(JuntosContext);

  if (context === undefined) {
    throw new Error('useJuntos deve ser usado dentro de um JuntosProvider');
  }

  return context;
};

export default JuntosContext;
