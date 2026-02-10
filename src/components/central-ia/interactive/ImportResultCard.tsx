/**
 * ImportResultCard - Resultado da importação no chat
 */

import { motion } from 'framer-motion';
import {
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  PartyPopper,
} from 'lucide-react';
import { useState } from 'react';
import type { ImportResultElement } from '../../../types/central-ia';
import { cn } from '../../../utils/cn';

interface ImportResultCardProps {
  element: ImportResultElement;
}

/**
 *
 */
export function ImportResultCard({ element }: ImportResultCardProps) {
  const [showErrors, setShowErrors] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isFullSuccess = element.imported > 0 && element.failed === 0;
  const isPartialSuccess = element.imported > 0 && element.failed > 0;
  const isFullFailure = element.imported === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'mt-3 border rounded-xl overflow-hidden',
        isFullSuccess && 'bg-green-50 border-green-200',
        isPartialSuccess && 'bg-amber-50 border-amber-200',
        isFullFailure && 'bg-red-50 border-red-200'
      )}
    >
      {/* Header */}
      <div className="p-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-block mb-3"
        >
          {isFullSuccess && (
            <div className="p-3 bg-green-100 rounded-full inline-block">
              <PartyPopper className="w-8 h-8 text-green-600" />
            </div>
          )}
          {isPartialSuccess && (
            <div className="p-3 bg-amber-100 rounded-full inline-block">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
          )}
          {isFullFailure && (
            <div className="p-3 bg-red-100 rounded-full inline-block">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </motion.div>

        <h4
          className={cn(
            'font-bold text-lg',
            isFullSuccess && 'text-green-800',
            isPartialSuccess && 'text-amber-800',
            isFullFailure && 'text-red-800'
          )}
        >
          {isFullSuccess && 'Importação Concluída!'}
          {isPartialSuccess && 'Importação Parcial'}
          {isFullFailure && 'Erro na Importação'}
        </h4>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <div className="p-2 bg-white/60 rounded-lg text-center">
          <p className="text-xl font-bold text-green-600">{element.imported}</p>
          <p className="text-xs text-slate-600">Importados</p>
        </div>
        <div className="p-2 bg-white/60 rounded-lg text-center">
          <p className="text-xl font-bold text-red-600">{element.failed}</p>
          <p className="text-xs text-slate-600">Falhas</p>
        </div>
        <div className="p-2 bg-white/60 rounded-lg text-center">
          <p className="text-xl font-bold text-slate-600">{element.skipped}</p>
          <p className="text-xs text-slate-600">Ignorados</p>
        </div>
      </div>

      {/* Total Value */}
      {element.totalValue > 0 && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-white/60 rounded-lg text-center">
            <p className="text-sm text-slate-600">Valor total importado</p>
            <p className="text-xl font-bold text-coral-600">
              {formatCurrency(element.totalValue)}
            </p>
          </div>
        </div>
      )}

      {/* Errors */}
      {element.errors && element.errors.length > 0 && (
        <div className="border-t border-slate-200/60">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/40 transition-colors"
          >
            <span className="text-sm font-medium text-red-700">
              Ver erros ({element.errors.length})
            </span>
            {showErrors ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showErrors && (
            <div className="px-4 pb-4 space-y-2">
              {element.errors.map((error, i) => (
                <div key={i} className="p-2 bg-red-100/60 rounded-lg text-sm">
                  <p className="font-medium text-red-800">{error.description}</p>
                  <p className="text-red-600">{error.error}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
