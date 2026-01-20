import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useBudget } from '../../hooks/useBudget';
import { BudgetCard, AddBudgetCard, BudgetModal } from '../../components/budgets';
import { ModernCard } from '../../components/ui/modern';
import { cn } from '../../utils/cn';
import type { BudgetWithCategory } from '../../services/api';

export default function BudgetsPage() {
  const {
    budgetStatus,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    getCategoriesWithoutBudget
  } = useBudget();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(null);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

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
    const categories = await getCategoriesWithoutBudget(currentMonth, currentYear);
    setAvailableCategories(categories);
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEditBudget = (budget: BudgetWithCategory) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  // Salvar orçamento (criar ou atualizar)
  const handleSaveBudget = async (data: { categoria_id: number; valor: number; mes: number; ano: number }) => {
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
    } else {
      await addBudget(data);
    }
  };

  // Excluir orçamento
  const handleDeleteBudget = async (budgetId: number) => {
    await deleteBudget(budgetId);
  };

  // Animações para o grid
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
          <div className="w-40 h-8 bg-slate-200 rounded-lg animate-pulse" />
          <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-52 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ModernCard variant="default" className="p-8 text-center">
        <div className="text-rose-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-slate-600 mb-4">Erro ao carregar orçamentos</p>
        <button
          onClick={() => window.location.reload()}
          className="text-coral-500 hover:text-coral-600 font-medium"
        >
          Tentar novamente
        </button>
      </ModernCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com navegação de mês */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-3"
      >
        <button
          onClick={() => navigateMonth('prev')}
          className={cn(
            "p-2.5 rounded-xl",
            "bg-white/80 border border-slate-200/60",
            "hover:bg-slate-50 hover:border-slate-300",
            "text-slate-600 hover:text-deep-blue",
            "transition-all duration-200",
            "shadow-sm hover:shadow"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="min-w-[180px] text-center">
          <h2 className="text-xl font-bold text-deep-blue">
            {monthNames[currentMonth - 1]}
          </h2>
          <p className="text-sm text-slate-500">{currentYear}</p>
        </div>

        <button
          onClick={() => navigateMonth('next')}
          className={cn(
            "p-2.5 rounded-xl",
            "bg-white/80 border border-slate-200/60",
            "hover:bg-slate-50 hover:border-slate-300",
            "text-slate-600 hover:text-deep-blue",
            "transition-all duration-200",
            "shadow-sm hover:shadow"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Grid de orçamentos */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Cards de orçamento existentes */}
        {budgetStatus.map((budgetItem) => (
          <motion.div key={budgetItem.budget.id} variants={itemVariants}>
            <BudgetCard
              budget={budgetItem}
              onEdit={handleEditBudget}
              onDelete={handleDeleteBudget}
            />
          </motion.div>
        ))}

        {/* Card de adicionar */}
        <motion.div variants={itemVariants}>
          <AddBudgetCard onClick={handleAddBudget} />
        </motion.div>
      </motion.div>

      {/* Estado vazio (quando não há orçamentos) */}
      {budgetStatus.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-slate-500">
            Você ainda não tem orçamentos para {monthNames[currentMonth - 1]} de {currentYear}.
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Clique no card acima para criar seu primeiro orçamento.
          </p>
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
        editingBudget={editingBudget}
        availableCategories={availableCategories}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
    </div>
  );
}
