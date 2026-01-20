import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import patrimonioService from '../services/api/PatrimonioService';
import type {
  PatrimonioAtivo,
  NewPatrimonioAtivo,
  UpdatePatrimonioAtivo,
  PatrimonioConsolidado,
  PatrimonioPorCategoria,
  EvolucaoPatrimonial,
  CategoriaAtivo
} from '../types/patrimonio';

// =============================================
// INTERFACE DO CONTEXTO
// =============================================

interface PatrimonioContextValue {
  // Dados
  ativos: PatrimonioAtivo[];
  consolidado: PatrimonioConsolidado | null;
  porCategoria: PatrimonioPorCategoria[];
  evolucao: EvolucaoPatrimonial[];

  // Filtros
  categoriaFiltro: CategoriaAtivo | null;
  setCategoriaFiltro: (categoria: CategoriaAtivo | null) => void;

  // Estado
  loading: boolean;
  loadingAction: boolean;
  error: string | null;

  // Ações de dados
  refreshData: () => Promise<void>;
  refreshConsolidado: () => Promise<void>;

  // CRUD de ativos
  createAtivo: (ativo: NewPatrimonioAtivo) => Promise<PatrimonioAtivo | null>;
  updateAtivo: (id: number, updates: UpdatePatrimonioAtivo) => Promise<boolean>;
  deleteAtivo: (id: number) => Promise<boolean>;
  updateValorAtivo: (id: number, valor: number) => Promise<boolean>;

  // Ações especiais
  sincronizarContas: () => Promise<number>;
  criarSnapshot: () => Promise<number>;

  // Estatísticas
  getEstatisticasRentabilidade: () => Promise<{
    rentabilidade_total: number;
    rentabilidade_percentual: number;
    maior_valorizacao: PatrimonioAtivo | null;
    maior_desvalorizacao: PatrimonioAtivo | null;
  }>;
}

// =============================================
// CONTEXTO
// =============================================

const PatrimonioContext = createContext<PatrimonioContextValue | undefined>(undefined);

// =============================================
// PROVIDER
// =============================================

interface PatrimonioProviderProps {
  children: ReactNode;
}

export const PatrimonioProvider: React.FC<PatrimonioProviderProps> = ({ children }) => {
  // Estados de dados
  const [ativos, setAtivos] = useState<PatrimonioAtivo[]>([]);
  const [consolidado, setConsolidado] = useState<PatrimonioConsolidado | null>(null);
  const [porCategoria, setPorCategoria] = useState<PatrimonioPorCategoria[]>([]);
  const [evolucao, setEvolucao] = useState<EvolucaoPatrimonial[]>([]);

  // Estados de filtro
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaAtivo | null>(null);

  // Estados de loading/error
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // FUNÇÕES DE BUSCA
  // ==========================================

  /**
   * Busca todos os ativos (com filtro opcional)
   */
  const fetchAtivos = useCallback(async () => {
    try {
      const data = await patrimonioService.fetchAtivos(categoriaFiltro || undefined);
      setAtivos(data);
    } catch (err) {
      console.error('Erro ao buscar ativos:', err);
      throw err;
    }
  }, [categoriaFiltro]);

  /**
   * Busca dados consolidados do patrimônio
   */
  const fetchConsolidado = useCallback(async () => {
    try {
      const data = await patrimonioService.getPatrimonioConsolidado();
      setConsolidado(data);
      setPorCategoria(data.por_categoria);
      setEvolucao(data.evolucao_12_meses);
    } catch (err) {
      console.error('Erro ao buscar consolidado:', err);
      throw err;
    }
  }, []);

  /**
   * Refresh completo de todos os dados
   */
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchAtivos(),
        fetchConsolidado()
      ]);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do patrimônio');
    } finally {
      setLoading(false);
    }
  }, [fetchAtivos, fetchConsolidado]);

  /**
   * Refresh apenas dos dados consolidados
   */
  const refreshConsolidado = useCallback(async () => {
    try {
      await fetchConsolidado();
    } catch (err: any) {
      console.error('Erro ao atualizar consolidado:', err);
    }
  }, [fetchConsolidado]);

  // ==========================================
  // FUNÇÕES CRUD
  // ==========================================

  /**
   * Cria um novo ativo
   */
  const createAtivo = useCallback(async (ativo: NewPatrimonioAtivo): Promise<PatrimonioAtivo | null> => {
    setLoadingAction(true);
    try {
      const novoAtivo = await patrimonioService.createAtivo(ativo);

      // Atualizar lista local
      setAtivos(prev => [novoAtivo, ...prev].sort((a, b) => b.valor_atual - a.valor_atual));

      // Atualizar consolidado
      await fetchConsolidado();

      return novoAtivo;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar ativo');
      return null;
    } finally {
      setLoadingAction(false);
    }
  }, [fetchConsolidado]);

  /**
   * Atualiza um ativo existente
   */
  const updateAtivo = useCallback(async (id: number, updates: UpdatePatrimonioAtivo): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const success = await patrimonioService.updateAtivo(id, updates);

      if (success) {
        // Atualizar lista local
        setAtivos(prev => prev.map(ativo =>
          ativo.id === id ? { ...ativo, ...updates } : ativo
        ).sort((a, b) => b.valor_atual - a.valor_atual));

        // Atualizar consolidado
        await fetchConsolidado();
      }

      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar ativo');
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [fetchConsolidado]);

  /**
   * Atualiza apenas o valor de um ativo (para atualizações rápidas)
   */
  const updateValorAtivo = useCallback(async (id: number, valor: number): Promise<boolean> => {
    try {
      const success = await patrimonioService.updateValorAtivo(id, valor);

      if (success) {
        // Atualizar lista local imediatamente
        setAtivos(prev => prev.map(ativo =>
          ativo.id === id ? { ...ativo, valor_atual: valor } : ativo
        ).sort((a, b) => b.valor_atual - a.valor_atual));

        // Atualizar consolidado em background
        fetchConsolidado();
      }

      return success;
    } catch (err: any) {
      console.error('Erro ao atualizar valor:', err);
      return false;
    }
  }, [fetchConsolidado]);

  /**
   * Exclui um ativo (soft delete)
   */
  const deleteAtivo = useCallback(async (id: number): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const success = await patrimonioService.deleteAtivo(id);

      if (success) {
        // Remover da lista local
        setAtivos(prev => prev.filter(ativo => ativo.id !== id));

        // Atualizar consolidado
        await fetchConsolidado();
      }

      return success;
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir ativo');
      return false;
    } finally {
      setLoadingAction(false);
    }
  }, [fetchConsolidado]);

  // ==========================================
  // FUNÇÕES ESPECIAIS
  // ==========================================

  /**
   * Sincroniza contas bancárias com ativos de liquidez
   */
  const sincronizarContas = useCallback(async (): Promise<number> => {
    setLoadingAction(true);
    try {
      const count = await patrimonioService.sincronizarLiquidezComContas();
      await refreshData();
      return count;
    } catch (err: any) {
      setError(err.message || 'Erro ao sincronizar contas');
      return 0;
    } finally {
      setLoadingAction(false);
    }
  }, [refreshData]);

  /**
   * Cria snapshot mensal do patrimônio
   */
  const criarSnapshot = useCallback(async (): Promise<number> => {
    setLoadingAction(true);
    try {
      const count = await patrimonioService.criarSnapshotMensal();
      return count;
    } catch (err: any) {
      setError(err.message || 'Erro ao criar snapshot');
      return 0;
    } finally {
      setLoadingAction(false);
    }
  }, []);

  /**
   * Obtém estatísticas de rentabilidade
   */
  const getEstatisticasRentabilidade = useCallback(async () => {
    try {
      return await patrimonioService.getEstatisticasRentabilidade();
    } catch (err: any) {
      console.error('Erro ao obter estatísticas:', err);
      return {
        rentabilidade_total: 0,
        rentabilidade_percentual: 0,
        maior_valorizacao: null,
        maior_desvalorizacao: null
      };
    }
  }, []);

  // ==========================================
  // EFEITOS
  // ==========================================

  // Carregar dados na inicialização
  useEffect(() => {
    refreshData();
  }, []);

  // Recarregar ativos quando o filtro mudar
  useEffect(() => {
    fetchAtivos();
  }, [categoriaFiltro, fetchAtivos]);

  // ==========================================
  // VALOR DO CONTEXTO
  // ==========================================

  const value: PatrimonioContextValue = {
    // Dados
    ativos,
    consolidado,
    porCategoria,
    evolucao,

    // Filtros
    categoriaFiltro,
    setCategoriaFiltro,

    // Estado
    loading,
    loadingAction,
    error,

    // Ações de dados
    refreshData,
    refreshConsolidado,

    // CRUD
    createAtivo,
    updateAtivo,
    deleteAtivo,
    updateValorAtivo,

    // Ações especiais
    sincronizarContas,
    criarSnapshot,

    // Estatísticas
    getEstatisticasRentabilidade
  };

  return (
    <PatrimonioContext.Provider value={value}>
      {children}
    </PatrimonioContext.Provider>
  );
};

// =============================================
// HOOK
// =============================================

export const usePatrimonio = (): PatrimonioContextValue => {
  const context = useContext(PatrimonioContext);

  if (context === undefined) {
    throw new Error('usePatrimonio must be used within a PatrimonioProvider');
  }

  return context;
};

export default PatrimonioContext;
