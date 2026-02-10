import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import CurrencyInput from '../ui/CurrencyInput';
import { ModernButton } from '../ui/modern';

type Transaction = any;

export interface EfetivarData {
  valorRecebido: number;
  dataRecebimento: string;
  isParcial: boolean;
  criarRestante: boolean;
  valorRestante?: number;
  dataVencimentoRestante?: string;
}

interface EfetivarModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onConfirm: (transaction: Transaction, data: EfetivarData) => Promise<void>;
}

/**
 *
 */
export default function EfetivarModal({ isOpen, onClose, transaction, onConfirm }: EfetivarModalProps) {
  const [valorRecebido, setValorRecebido] = useState<number | undefined>(undefined);
  const [dataRecebimento, setDataRecebimento] = useState('');
  const [criarRestante, setCriarRestante] = useState(false);
  const [dataVencimentoRestante, setDataVencimentoRestante] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const valorOriginal = Number(transaction?.valor || 0);
  const tipoLabel = transaction?.tipo === 'receita' ? 'recebimento' : 'pagamento';

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction && isOpen) {
      setValorRecebido(valorOriginal);
      setDataRecebimento(new Date().toISOString().split('T')[0]);
      setDataVencimentoRestante(new Date().toISOString().split('T')[0]);
      setCriarRestante(false);
      setIsSubmitting(false);
    }
  }, [transaction, isOpen, valorOriginal]);

  const isParcial = useMemo(() => {
    if (!valorRecebido || !valorOriginal) return false;
    return valorRecebido < valorOriginal;
  }, [valorRecebido, valorOriginal]);

  const valorRestante = useMemo(() => {
    if (!isParcial || !valorRecebido) return 0;
    return valorOriginal - valorRecebido;
  }, [isParcial, valorRecebido, valorOriginal]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSubmit = async () => {
    if (!transaction || !valorRecebido || valorRecebido <= 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm(transaction, {
        valorRecebido,
        dataRecebimento,
        isParcial,
        criarRestante: isParcial && criarRestante,
        valorRestante: isParcial ? valorRestante : undefined,
        dataVencimentoRestante: isParcial && criarRestante ? dataVencimentoRestante : undefined,
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <h2 className="text-sm font-semibold text-white">
                    Efetivar Lançamento
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-0.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Transaction info */}
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-xs font-medium text-slate-800">{transaction.descricao}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Valor original: <span className="font-semibold text-slate-700">{formatCurrency(valorOriginal)}</span>
                </p>
              </div>

              {/* Valor recebido/pago */}
              <CurrencyInput
                label={`Valor ${tipoLabel === 'recebimento' ? 'recebido' : 'pago'}`}
                value={valorRecebido}
                onChange={(v) => setValorRecebido(v)}
                required
              />

              {/* Data de recebimento/pagamento */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Data de {tipoLabel}
                </label>
                <input
                  type="date"
                  value={dataRecebimento}
                  onChange={(e) => setDataRecebimento(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-coral-500 focus:ring-coral-500/20 transition-all duration-200"
                />
              </div>

              {/* Partial receipt section */}
              <AnimatePresence>
                {isParcial && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5">
                      <p className="text-[11px] text-slate-500">
                        Valor parcial: faltam <span className="font-semibold text-slate-700">{formatCurrency(valorRestante)}</span>
                      </p>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Vencimento do restante
                        </label>
                        <input
                          type="date"
                          value={dataVencimentoRestante}
                          onChange={(e) => setDataVencimentoRestante(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-400/20 transition-all duration-200"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={criarRestante}
                          onChange={(e) => setCriarRestante(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-coral-500 focus:ring-coral-500/20"
                        />
                        <span className="text-xs text-slate-700">
                          Criar lançamento com o valor restante
                        </span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <ModernButton
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancelar
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={!valorRecebido || valorRecebido <= 0 || isSubmitting}
                  className="flex-1"
                >
                  Efetivar
                </ModernButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
