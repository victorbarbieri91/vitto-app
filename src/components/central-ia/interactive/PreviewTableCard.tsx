/**
 * PreviewTableCard - Preview de itens para importação no chat
 */

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import type { PreviewTableElement } from '../../../types/central-ia';
import { cn } from '../../../utils/cn';

interface PreviewTableCardProps {
  element: PreviewTableElement;
}

/**
 *
 */
export function PreviewTableCard({ element }: PreviewTableCardProps) {
  const [showAll, setShowAll] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  const displayItems = showAll ? element.items : element.items.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Summary */}
      <div className="p-4 bg-gradient-to-r from-coral-50 to-blue-50 border-b border-slate-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-800">
              {element.summary.total}
            </p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {element.summary.valid}
            </p>
            <p className="text-xs text-slate-500">Válidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {element.summary.invalid}
            </p>
            <p className="text-xs text-slate-500">Inválidos</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">
              {formatCurrency(element.summary.totalValue)}
            </p>
            <p className="text-xs text-slate-500">Valor</p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-slate-100">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              'px-4 py-3 flex items-center gap-3',
              !item.valid && 'bg-red-50/50'
            )}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {item.valid ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <span title={item.errors?.join(', ')}>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {item.descricao}
                </p>
                <span
                  className={cn(
                    'text-sm font-semibold whitespace-nowrap',
                    item.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {item.tipo === 'receita' ? '+' : '-'}
                  {formatCurrency(item.valor)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {item.data && (
                  <span className="text-xs text-slate-500">
                    {formatDate(item.data)}
                  </span>
                )}
                {item.categoria && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {item.categoria}
                  </span>
                )}
              </div>
              {!item.valid && item.errors && item.errors.length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {item.errors.join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {element.items.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-200 hover:bg-slate-50 transition-colors text-sm text-coral-600 font-medium"
        >
          {showAll ? (
            <>
              Mostrar menos
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Ver todos ({element.items.length - 5} restantes)
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
