import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { useAuth } from '../../store/AuthContext';
import { PatrimonioProvider, usePatrimonio } from '../../contexts/PatrimonioContext';
import type { PatrimonioAtivo, NewPatrimonioAtivo, CategoriaAtivo } from '../../types/patrimonio';

// Componentes
import {
  PatrimonioTotalCard,
  PatrimonioPizzaChart,
  PatrimonioEvolucaoChart,
  PatrimonioListaAtivos,
  PatrimonioFormModal,
  PatrimonioCategoriaFilter
} from '../../components/patrimonio';

// Animações
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// Componente interno que usa o contexto
function PatrimonioContent() {
  const { size, classes } = useResponsiveClasses();
  const isMobile = size === 'mobile';
  const { perfil } = useAuth();

  // Estados do contexto
  const {
    ativos,
    consolidado,
    porCategoria,
    evolucao,
    categoriaFiltro,
    setCategoriaFiltro,
    loading,
    loadingAction,
    error,
    refreshData,
    createAtivo,
    updateAtivo,
    deleteAtivo,
    sincronizarContas
  } = usePatrimonio();

  // Estados locais para modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ativoParaEditar, setAtivoParaEditar] = useState<PatrimonioAtivo | null>(null);
  const [categoriaParaAdicionar, setCategoriaParaAdicionar] = useState<CategoriaAtivo>('outros');

  // Handlers
  const handleAddAtivo = useCallback((categoria?: CategoriaAtivo) => {
    setCategoriaParaAdicionar(categoria || 'outros');
    setAtivoParaEditar(null);
    setIsModalOpen(true);
  }, []);

  const handleEditAtivo = useCallback((ativo: PatrimonioAtivo) => {
    setAtivoParaEditar(ativo);
    setCategoriaParaAdicionar(ativo.categoria);
    setIsModalOpen(true);
  }, []);

  const handleDeleteAtivo = useCallback(async (ativo: PatrimonioAtivo) => {
    if (confirm(`Deseja realmente excluir "${ativo.nome}"?`)) {
      const success = await deleteAtivo(ativo.id);
      if (success) {
        toast.success('Ativo excluido com sucesso');
      } else {
        toast.error('Erro ao excluir ativo');
      }
    }
  }, [deleteAtivo]);

  const handleSaveAtivo = useCallback(async (dados: NewPatrimonioAtivo) => {
    try {
      if (ativoParaEditar) {
        // Edição
        const success = await updateAtivo(ativoParaEditar.id, dados);
        if (success) {
          toast.success('Ativo atualizado com sucesso');
        } else {
          toast.error('Erro ao atualizar ativo');
        }
      } else {
        // Criação
        const novoAtivo = await createAtivo(dados);
        if (novoAtivo) {
          toast.success('Ativo adicionado com sucesso');
        } else {
          toast.error('Erro ao adicionar ativo');
        }
      }
    } catch (error) {
      toast.error('Erro ao salvar ativo');
    }
  }, [ativoParaEditar, createAtivo, updateAtivo]);

  const handleSincronizarContas = useCallback(async () => {
    const count = await sincronizarContas();
    if (count > 0) {
      toast.success(`${count} conta(s) sincronizada(s)`);
    } else {
      toast.success('Contas ja sincronizadas');
    }
  }, [sincronizarContas]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-deep-blue animate-spin" />
          <p className="text-slate-500">Carregando patrimonio...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-deep-blue text-white rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-6", isMobile ? "pb-20" : "")}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Central do Patrimonio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visao consolidada de todos os seus ativos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSincronizarContas}
            disabled={loadingAction}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loadingAction && "animate-spin")} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
          <button
            onClick={() => handleAddAtivo()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-deep-blue rounded-lg hover:bg-deep-blue/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Ativo</span>
          </button>
        </div>
      </motion.div>

      {/* Card Principal - Patrimonio Total */}
      <motion.div variants={itemVariants}>
        <PatrimonioTotalCard
          patrimonioTotal={consolidado?.patrimonio_total || 0}
          patrimonioLiquido={consolidado?.patrimonio_liquido || 0}
          totalDividas={consolidado?.total_dividas || 0}
          variacaoMes={consolidado?.variacao_mes_valor || 0}
          variacaoPercentual={consolidado?.variacao_mes_percentual || 0}
          quantidadeAtivos={consolidado?.quantidade_ativos || 0}
          isLoading={loading}
        />
      </motion.div>

      {/* Graficos - Grid responsivo */}
      <motion.div
        variants={itemVariants}
        className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}
      >
        <PatrimonioPizzaChart
          dados={porCategoria}
          isLoading={loading}
          onCategoriaClick={setCategoriaFiltro}
        />
        <PatrimonioEvolucaoChart
          dados={evolucao}
          isLoading={loading}
        />
      </motion.div>

      {/* Filtro de Categorias */}
      <motion.div variants={itemVariants}>
        <PatrimonioCategoriaFilter
          categoriaAtiva={categoriaFiltro}
          onCategoriaChange={setCategoriaFiltro}
          dadosPorCategoria={porCategoria}
          isLoading={loading}
        />
      </motion.div>

      {/* Lista de Ativos */}
      <motion.div variants={itemVariants}>
        <PatrimonioListaAtivos
          ativos={ativos}
          categoriaFiltro={categoriaFiltro}
          isLoading={loading}
          onAddAtivo={handleAddAtivo}
          onEditAtivo={handleEditAtivo}
          onDeleteAtivo={handleDeleteAtivo}
        />
      </motion.div>

      {/* Modal de Formulario */}
      <PatrimonioFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAtivoParaEditar(null);
        }}
        onSave={handleSaveAtivo}
        ativoParaEditar={ativoParaEditar}
        categoriaInicial={categoriaParaAdicionar}
      />
    </motion.div>
  );
}

// Componente principal com Provider
export default function PatrimonioPage() {
  return (
    <PatrimonioProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PatrimonioContent />
        </div>
      </div>
    </PatrimonioProvider>
  );
}
