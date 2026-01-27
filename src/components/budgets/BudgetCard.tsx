import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { BudgetStatus } from '../../services/api';

interface BudgetCardProps {
  budget: BudgetStatus;
  onEdit: (budget: BudgetStatus['budget']) => void;
  onDelete: (budgetId: number) => void;
}

export default function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    budget: budgetData,
    gastoAtual,
    saldoRestante,
    percentualGasto,
    status
  } = budget;

  const isReceita = budgetData.tipo === 'receita';
  const isExceeded = percentualGasto > 100;

  // Cores baseadas no design system - coral para despesas, emerald para receitas
  const getProgressColor = () => {
    if (isReceita) {
      return percentualGasto >= 100 ? 'bg-emerald-500' : 'bg-emerald-400';
    }
    if (isExceeded) return 'bg-coral-500';
    if (percentualGasto >= 80) return 'bg-amber-400';
    return 'bg-slate-400';
  };

  const getPercentageColor = () => {
    if (isReceita) {
      return percentualGasto >= 100 ? 'text-emerald-600' : 'text-emerald-500';
    }
    if (isExceeded) return 'text-coral-600';
    if (percentualGasto >= 80) return 'text-amber-600';
    return 'text-slate-500';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Excluir orçamento de ${budgetData.categoria.nome}?`)) {
      onDelete(budgetData.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-xl p-4 h-[120px]",
        "bg-white border border-slate-200",
        "shadow-sm hover:shadow-md",
        "transition-all duration-200",
        "flex flex-col justify-between"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: budgetData.categoria.cor || '#64748b' }}
          />
          <span className="text-sm font-medium text-deep-blue truncate">
            {budgetData.categoria.nome}
          </span>
          {isReceita ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-coral-400 flex-shrink-0" />
          )}
        </div>

        {/* Ações */}
        <div className={cn(
          "flex gap-1 transition-opacity duration-150",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(budgetData); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-deep-blue transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-coral-50 text-slate-400 hover:text-coral-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Valores */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-deep-blue">
            {formatCurrency(gastoAtual)}
          </span>
          <span className="text-xs text-slate-400">de</span>
          <span className="text-xs font-medium text-slate-500">
            {formatCurrency(budgetData.valor)}
          </span>
        </div>
        <span className={cn("text-sm font-semibold", getPercentageColor())}>
          {percentualGasto.toFixed(0)}%
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-1.5">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentualGasto, 100)}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={cn("h-full rounded-full", getProgressColor())}
          />
        </div>

        {/* Restante - sempre visível para manter altura consistente */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {isReceita ? 'Falta receber' : 'Restante'}
          </span>
          <span className={cn(
            "text-[11px] font-medium",
            saldoRestante < 0 && !isReceita ? 'text-coral-500' : 'text-slate-500'
          )}>
            {formatCurrency(Math.abs(saldoRestante))}
            {saldoRestante < 0 && !isReceita && ' excedido'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
