import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Target, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { BudgetCard, AddBudgetCard, BudgetModal } from '../../components/budgets';
import { ModernCard } from '../../components/ui/modern';
import { cn } from '../../utils/cn';
import budgetService from '../../services/api/BudgetService';
import type { BudgetWithCategory, BudgetTipo } from '../../services/api/BudgetService';

interface Category {
  id: number;
  nome: string;
  tipo: string;
  cor?: string;
  icone?: string;
}

/**
 *
 */
export default function BudgetsPage() {
  const {
    budgetStatus,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useBudget();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Carregar categorias disponíveis (tanto receita quanto despesa)
  const loadAvailableCategories = useCallback(async () => {
    try {
      const [despesas, receitas] = await Promise.all([
        budgetService.getCategoriesWithoutBudget(currentMonth, currentYear, 'despesa'),
        budgetService.getCategoriesWithoutBudget(currentMonth, currentYear, 'receita'),
      ]);
      setAvailableCategories([...despesas, ...receitas]);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  }, [currentMonth, currentYear]);

  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  // Abrir modal para novo orçamento
  const handleAddBudget = async () => {
    await loadAvailableCategories();
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEditBudget = (budget: BudgetWithCategory) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  // Salvar orçamento (criar ou atualizar)
  const handleSaveBudget = async (data: { categoria_id: number; valor: number; mes: number; ano: number; tipo: BudgetTipo }) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
    } else {
      await addBudget(data);
    }
    await loadAvailableCategories();
  };

  // Criar nova categoria
  const handleCreateCategory = async (data: { nome: string; tipo: BudgetTipo; cor: string }): Promise<Category> => {
    const newCategory = await budgetService.createCategory(data);
    setAvailableCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  // Excluir orçamento
  const handleDeleteBudget = async (budgetId: number) => {
    await deleteBudget(budgetId);
    await loadAvailableCategories();
  };

  // Calcular métricas de cumprimento
  const despesasBudgets = budgetStatus.filter(b => b.budget.tipo !== 'receita');
  const receitasBudgets = budgetStatus.filter(b => b.budget.tipo === 'receita');

  // KPIs de cumprimento
  const budgetsNoLimite = budgetStatus.filter(b => b.status === 'verde').length;
  const budgetsEmRisco = budgetStatus.filter(b => b.status === 'amarelo').length;
  const budgetsExcedidos = budgetStatus.filter(b => b.status === 'vermelho').length;

  // Animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-40 h-7 bg-slate-200 rounded animate-pulse" />
            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[120px] bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <ModernCard variant="default" className="p-8 text-center max-w-md mx-auto">
          <div className="text-coral-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-deep-blue font-medium mb-2">Erro ao carregar orçamentos</p>
          <p className="text-slate-500 text-sm mb-4">Não foi possível carregar seus orçamentos.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-lg font-medium text-sm transition-colors"
          >
            Tentar novamente
          </button>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header com navegação de mês CENTRALIZADA */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth('prev')}
            className={cn(
              "p-2.5 rounded-xl",
              "bg-white border border-slate-200",
              "hover:bg-slate-50 hover:border-coral-300",
              "text-slate-600 hover:text-coral-500",
              "transition-all duration-150"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="min-w-[180px] text-center">
            <h1 className="text-xl font-bold text-deep-blue">
              {monthNames[currentMonth - 1]} {currentYear}
            </h1>
          </div>

          <button
            onClick={() => navigateMonth('next')}
            className={cn(
              "p-2.5 rounded-xl",
              "bg-white border border-slate-200",
              "hover:bg-slate-50 hover:border-coral-300",
              "text-slate-600 hover:text-coral-500",
              "transition-all duration-150"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* KPIs de Cumprimento - Usando SimpleMetricCard pattern */}
      {budgetStatus.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2 sm:gap-3"
        >
          {/* No Limite */}
          <div className={cn(
            "rounded-xl shadow-sm border p-3 sm:p-4",
            "bg-teal-700"
          )}>
            <div className="flex justify-between items-start">
              <p className="text-[9px] sm:text-[10px] font-medium text-teal-100 uppercase tracking-wide">
                No Limite
              </p>
              <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-teal-200" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">{budgetsNoLimite}</span>
              <span className="text-[10px] sm:text-xs text-teal-200 hidden sm:inline">orcamentos</span>
            </div>
          </div>

          {/* Em Risco */}
          <div className={cn(
            "rounded-xl shadow-sm border p-3 sm:p-4",
            "bg-amber-500"
          )}>
            <div className="flex justify-between items-start">
              <p className="text-[9px] sm:text-[10px] font-medium text-amber-100 uppercase tracking-wide">
                Em Risco
              </p>
              <AlertTriangle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-100" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">{budgetsEmRisco}</span>
              <span className="text-[10px] sm:text-xs text-amber-100 hidden sm:inline">orcamentos</span>
            </div>
          </div>

          {/* Excedidos */}
          <div className={cn(
            "rounded-xl shadow-sm border p-3 sm:p-4",
            "bg-coral-500"
          )}>
            <div className="flex justify-between items-start">
              <p className="text-[9px] sm:text-[10px] font-medium text-coral-100 uppercase tracking-wide">
                Excedidos
              </p>
              <XCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-coral-100" />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1 sm:gap-2">
              <span className="text-xl sm:text-2xl font-bold text-white">{budgetsExcedidos}</span>
              <span className="text-[10px] sm:text-xs text-coral-100 hidden sm:inline">orcamentos</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Seção de Despesas */}
      {despesasBudgets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-coral-400" />
              Limites de Gastos
            </h2>
            <span className="text-xs text-slate-400">{despesasBudgets.length} orçamentos</span>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
          >
            {despesasBudgets.map((budgetItem) => (
              <motion.div key={budgetItem.budget.id} variants={itemVariants}>
                <BudgetCard
                  budget={budgetItem}
                  onEdit={handleEditBudget}
                  onDelete={handleDeleteBudget}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Seção de Receitas */}
      {receitasBudgets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Metas de Receita
            </h2>
            <span className="text-xs text-slate-400">{receitasBudgets.length} orçamentos</span>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
          >
            {receitasBudgets.map((budgetItem) => (
              <motion.div key={budgetItem.budget.id} variants={itemVariants}>
                <BudgetCard
                  budget={budgetItem}
                  onEdit={handleEditBudget}
                  onDelete={handleDeleteBudget}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Botão de adicionar - sempre visível */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="pt-2"
      >
        <div className="max-w-xs">
          <AddBudgetCard onClick={handleAddBudget} />
        </div>
      </motion.div>

      {/* Estado vazio */}
      {budgetStatus.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <div className="p-4 bg-slate-100 rounded-2xl mb-4">
            <Wallet className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-deep-blue mb-2">
            Nenhum orçamento definido
          </h3>
          <p className="text-slate-500 text-sm text-center max-w-md mb-6">
            Crie orçamentos para {monthNames[currentMonth - 1]} de {currentYear} e
            tenha controle total sobre seus gastos e receitas.
          </p>
          <button
            onClick={handleAddBudget}
            className={cn(
              "px-6 py-3 rounded-xl",
              "bg-coral-500 hover:bg-coral-600",
              "text-white font-medium",
              "flex items-center gap-2",
              "transition-colors duration-150",
              "shadow-md hover:shadow-lg"
            )}
          >
            <Target className="w-5 h-5" />
            Criar primeiro orçamento
          </button>
        </motion.div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        onCreateCategory={handleCreateCategory}
        editingBudget={editingBudget}
        availableCategories={availableCategories}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  );
}
