import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { BudgetStatus } from '../../services/api';

interface BudgetCardProps {
  budget: BudgetStatus;
  onEdit: (budget: BudgetStatus['budget']) => void;
  onDelete: (budgetId: number) => void;
}

// Paleta de cores translúcidas e foscas
const statusColors = {
  verde: {
    bar: 'from-teal-400/80 to-teal-500/80',
    text: 'text-teal-600',
    badge: 'bg-teal-500/10 text-teal-700',
  },
  amarelo: {
    bar: 'from-amber-400/80 to-amber-500/80',
    text: 'text-amber-600',
    badge: 'bg-amber-500/10 text-amber-700',
  },
  vermelho: {
    bar: 'from-rose-400/80 to-rose-500/80',
    text: 'text-rose-600',
    badge: 'bg-rose-500/10 text-rose-700',
  },
};

export default function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
  const [showActions, setShowActions] = useState(false);

  const {
    budget: budgetData,
    gastoAtual,
    saldoRestante,
    percentualGasto,
    status
  } = budget;

  const colors = statusColors[status] || statusColors.verde;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-2xl p-5",
        "bg-white/95 backdrop-blur-sm",
        "border border-slate-200/60",
        "shadow-sm hover:shadow-md",
        "transition-all duration-300",
        "group cursor-default"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header: Categoria + Ações */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: budgetData.categoria.cor || '#6B7280' }}
          />
          <h3 className="font-semibold text-deep-blue text-sm">
            {budgetData.categoria.nome}
          </h3>
        </div>

        {/* Ações aparecem no hover */}
        <div className={cn(
          "flex gap-1 transition-opacity duration-200",
          showActions ? "opacity-100" : "opacity-0"
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(budgetData); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="Editar"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Valor Planejado em Destaque */}
      <div className="bg-slate-50/80 rounded-xl px-4 py-3 mb-4">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-deep-blue">
            {formatCurrency(budgetData.valor)}
          </span>
          <span className="text-xs text-slate-500 font-medium">planejado</span>
        </div>
      </div>

      {/* Valores: Gasto e Restante */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Gasto</span>
          <span className="font-medium text-slate-700">
            {formatCurrency(gastoAtual)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Restante</span>
          <span className={cn("font-medium", colors.text)}>
            {formatCurrency(saldoRestante)}
          </span>
        </div>
      </div>

      {/* Barra de Progresso com Gradiente */}
      <div className="space-y-2">
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percentualGasto, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              "bg-gradient-to-r",
              colors.bar
            )}
          />
        </div>

        {/* Percentual e Badge */}
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium",
            colors.badge
          )}>
            {status === 'verde' && 'Dentro do limite'}
            {status === 'amarelo' && 'Atenção'}
            {status === 'vermelho' && 'Excedido'}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {percentualGasto.toFixed(0)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
