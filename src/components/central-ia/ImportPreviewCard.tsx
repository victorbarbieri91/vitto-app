import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ExtractedTransaction } from '../../types/import-flow';

interface ImportPreviewCardProps {
  transacoes: ExtractedTransaction[];
  summary: {
    total: number;
    valor: string;
    destino: string;
  };
  onToggleTransaction: (id: string) => void;
  onConfirmImport: () => void;
  onCancel: () => void;
  isImporting?: boolean;
}

/**
 *
 */
export function ImportPreviewCard({
  transacoes,
  summary,
  onToggleTransaction,
  onConfirmImport,
  onCancel,
  isImporting = false
}: ImportPreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedCount = transacoes.filter(t => t.selecionada).length;
  const selectedTotal = transacoes
    .filter(t => t.selecionada)
    .reduce((sum, t) => sum + t.valor, 0);

  const formatDate = (dateStr: string) => {
    try {
      const [, month, day] = dateStr.split('-');
      return `${day}/${month}`;
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl overflow-hidden',
        'bg-white',
        'border border-slate-200',
        'shadow-lg'
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-coral-500 to-coral-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Preview da Importação</h3>
              <p className="text-sm text-white/80">{summary.destino}</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Resumo */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-white/70 mb-1">Selecionadas</p>
            <p className="text-lg font-bold">{selectedCount} de {transacoes.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-white/70 mb-1">Valor Total</p>
            <p className="text-lg font-bold">{formatCurrency(selectedTotal)}</p>
          </div>
        </div>
      </div>

      {/* Lista de transacoes */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="max-h-[300px] overflow-y-auto">
              {transacoes.map((transacao, index) => (
                <motion.div
                  key={transacao.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    'flex items-center gap-3 p-3 border-b border-slate-100',
                    'hover:bg-slate-50 transition-colors',
                    !transacao.selecionada && 'opacity-50'
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => onToggleTransaction(transacao.id)}
                    className={cn(
                      'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
                      'border-2 transition-all',
                      transacao.selecionada
                        ? 'bg-coral-500 border-coral-500'
                        : 'bg-white border-slate-300 hover:border-coral-400'
                    )}
                  >
                    {transacao.selecionada && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>

                  {/* Data */}
                  <div className="w-12 flex-shrink-0">
                    <span className="text-xs text-slate-500">
                      {formatDate(transacao.data)}
                    </span>
                  </div>

                  {/* Descricao */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      {transacao.descricao}
                    </p>
                    {transacao.categoria_nome && (
                      <span className="text-xs text-slate-400">
                        {transacao.categoria_nome}
                      </span>
                    )}
                  </div>

                  {/* Valor */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        transacao.tipo === 'credito'
                          ? 'text-emerald-600'
                          : 'text-slate-700'
                      )}
                    >
                      {transacao.tipo === 'credito' ? '+' : '-'}{' '}
                      {formatCurrency(transacao.valor)}
                    </span>
                  </div>

                  {/* Indicador de duplicata */}
                  {transacao.duplicata && (
                    <div className="flex-shrink-0" title="Possível duplicata">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Acoes */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={isImporting}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-lg',
              'text-sm font-medium',
              'bg-white border border-slate-200 text-slate-600',
              'hover:bg-slate-100 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmImport}
            disabled={isImporting || selectedCount === 0}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-lg',
              'text-sm font-medium',
              'bg-coral-500 text-white',
              'hover:bg-coral-600 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2'
            )}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Importar {selectedCount} transações
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
