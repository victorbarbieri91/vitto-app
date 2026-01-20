import React from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  PlusCircle,
  Target,
  FileText,
  ArrowDownCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { QuickAction } from '../../types/central-ia';

interface QuickActionsMenuProps {
  actions: QuickAction[];
  onSelect: (action: QuickAction) => void;
  disabled?: boolean;
}

const ICONS: Record<string, React.ElementType> = {
  saldo: Wallet,
  gastos: TrendingUp,
  despesa: ArrowDownCircle,
  receita: PlusCircle,
  metas: Target,
  relatorio: FileText,
};

const COLORS: Record<string, string> = {
  consulta: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
  acao: 'bg-coral-50 text-coral-600 border-coral-100 hover:bg-coral-100',
  analise: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100',
};

export function QuickActionsMenu({
  actions,
  onSelect,
  disabled,
}: QuickActionsMenuProps) {
  return (
    <div className="px-4 pb-2">
      <p className="text-xs text-gray-400 mb-2 text-center">Ações rápidas</p>

      <div className="flex flex-wrap justify-center gap-2">
        {actions.map((action, index) => {
          const Icon = ICONS[action.id] || Wallet;
          const colorClass = COLORS[action.category] || COLORS.consulta;

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(action)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium',
                'border transition-all duration-200',
                colorClass,
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
