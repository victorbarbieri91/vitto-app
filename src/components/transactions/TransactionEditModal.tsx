import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3 } from 'lucide-react';
import CurrencyInput from '../ui/CurrencyInput';
import { ModernButton } from '../ui/modern';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';

type Transaction = any;

export interface EditTransactionData {
  descricao: string;
  valor: number;
  data: string;
  categoria_id: number | null;
  conta_id: number | null;
  scope: 'single' | 'this_month' | 'from_now';
}

interface TransactionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (transaction: Transaction, data: EditTransactionData) => Promise<void>;
}

/**
 *
 */
export default function TransactionEditModal({ isOpen, onClose, transaction, onSave }: TransactionEditModalProps) {
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number | undefined>(undefined);
  const [data, setData] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [contaId, setContaId] = useState<number | null>(null);
  const [scope, setScope] = useState<'single' | 'this_month' | 'from_now'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect if fixed/parcelado
  const isFixedOrParcelado = useMemo(() => {
    if (!transaction) return false;
    return (
      transaction.is_virtual_fixed ||
      transaction.is_virtual ||
      transaction.origem === 'fixo' ||
      transaction.origem === 'parcelado' ||
      transaction.fixed_transaction_id ||
      transaction.fixo_id
    );
  }, [transaction]);

  // Header gradient by type
  const headerGradient = useMemo(() => {
    if (!transaction) return 'from-slate-400 to-slate-600';
    const tipo = transaction.tipo;
    if (tipo === 'receita') return 'from-emerald-400 to-emerald-600';
    if (tipo === 'despesa_cartao') return 'from-blue-400 to-purple-600';
    return 'from-coral-400 to-coral-600';
  }, [transaction]);

  // Filter categories by transaction type
  const filteredCategories = useMemo(() => {
    if (!transaction) return categories;
    const tipo = transaction.tipo;
    if (tipo === 'receita') return categories.filter(c => c.tipo === 'receita' || c.tipo === 'ambos');
    if (tipo === 'despesa' || tipo === 'despesa_cartao') return categories.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos');
    return categories;
  }, [transaction, categories]);

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction && isOpen) {
      setDescricao(transaction.descricao || '');
      setValor(Number(transaction.valor) || 0);
      // Handle date - may be ISO string or YYYY-MM-DD
      const rawDate = transaction.data || '';
      setData(rawDate.includes('T') ? rawDate.split('T')[0] : rawDate);
      setCategoriaId(transaction.categoria_id || transaction.categoria?.id || null);
      setContaId(transaction.conta_id || null);
      setScope(isFixedOrParcelado ? 'this_month' : 'single');
      setIsSubmitting(false);
    }
  }, [transaction, isOpen, isFixedOrParcelado]);

  const handleSubmit = async () => {
    if (!transaction || !valor || valor <= 0 || !descricao.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(transaction, {
        descricao: descricao.trim(),
        valor,
        data,
        categoria_id: categoriaId,
        conta_id: contaId,
        scope,
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
            className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${headerGradient} px-6 py-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">
                    Editar Lancamento
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Descricao */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Descricao
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:border-coral-500 focus:ring-coral-500/20 transition-all duration-200 placeholder:text-slate-400"
                  placeholder="Descricao do lancamento"
                />
              </div>

              {/* Valor + Data (2 cols) */}
              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput
                  label="Valor"
                  value={valor}
                  onChange={(v) => setValor(v)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:border-coral-500 focus:ring-coral-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Categoria + Conta (2 cols) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={categoriaId || ''}
                    onChange={(e) => setCategoriaId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:border-coral-500 focus:ring-coral-500/20 transition-all duration-200 text-sm"
                  >
                    <option value="">Selecione</option>
                    {filteredCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Conta
                  </label>
                  <select
                    value={contaId || ''}
                    onChange={(e) => setContaId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:border-coral-500 focus:ring-coral-500/20 transition-all duration-200 text-sm"
                  >
                    <option value="">Selecione</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Scope (only for fixed/parcelado) */}
              {isFixedOrParcelado && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    Escopo da alteracao
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === 'this_month'}
                        onChange={() => setScope('this_month')}
                        className="w-4 h-4 text-coral-500 border-slate-300 focus:ring-coral-500/20"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        Somente este mes
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="scope"
                        checked={scope === 'from_now'}
                        onChange={() => setScope('from_now')}
                        className="w-4 h-4 text-coral-500 border-slate-300 focus:ring-coral-500/20"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        A partir deste mes em diante
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
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
                  disabled={!descricao.trim() || !valor || valor <= 0 || isSubmitting}
                  className="flex-1"
                >
                  Salvar
                </ModernButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
