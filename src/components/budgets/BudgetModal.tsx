import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import GlassmorphCard, { GlassOverlay } from '../ui/modern/GlassmorphCard';
import { ModernButton, ModernInput, ModernSelect } from '../ui/modern';
import { cn } from '../../utils/cn';
import type { BudgetWithCategory } from '../../services/api';

interface Category {
  id: number;
  nome: string;
  cor?: string;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { categoria_id: number; valor: number; mes: number; ano: number }) => Promise<void>;
  editingBudget?: BudgetWithCategory | null;
  availableCategories: Category[];
  currentMonth: number;
  currentYear: number;
}

export default function BudgetModal({
  isOpen,
  onClose,
  onSave,
  editingBudget,
  availableCategories,
  currentMonth,
  currentYear,
}: BudgetModalProps) {
  const [formData, setFormData] = useState({
    categoria_id: '',
    valor: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingBudget) {
        setFormData({
          categoria_id: editingBudget.categoria_id.toString(),
          valor: editingBudget.valor.toString(),
        });
      } else {
        setFormData({ categoria_id: '', valor: '' });
      }
    }
  }, [isOpen, editingBudget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.valor || (!editingBudget && !formData.categoria_id)) return;

    setIsSubmitting(true);
    try {
      await onSave({
        categoria_id: editingBudget
          ? editingBudget.categoria_id
          : parseInt(formData.categoria_id),
        valor: parseFloat(formData.valor),
        mes: currentMonth,
        ano: currentYear,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <GlassOverlay onClick={onClose} className="z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.25, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassmorphCard
              variant="frosted"
              blur="lg"
              className="w-full max-w-md p-6"
              animate={false}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-deep-blue">
                    {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {editingBudget
                      ? `Categoria: ${editingBudget.categoria?.nome}`
                      : 'Defina um limite para a categoria'
                    }
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={cn(
                    "p-2 rounded-xl",
                    "hover:bg-slate-100",
                    "text-slate-400 hover:text-slate-600",
                    "transition-colors duration-200"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Categoria (só mostra se não estiver editando) */}
                {!editingBudget && (
                  <ModernSelect
                    label="Categoria"
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </ModernSelect>
                )}

                {/* Valor */}
                <ModernInput
                  label="Valor Planejado"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="R$ 0,00"
                  required
                />

                {/* Preview do valor formatado */}
                {formData.valor && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-slate-50/80 rounded-xl px-4 py-3"
                  >
                    <p className="text-xs text-slate-500 mb-1">Valor formatado</p>
                    <p className="text-lg font-bold text-deep-blue">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(parseFloat(formData.valor) || 0)}
                    </p>
                  </motion.div>
                )}

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <ModernButton
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancelar
                  </ModernButton>
                  <ModernButton
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || !formData.valor || (!editingBudget && !formData.categoria_id)}
                  >
                    {editingBudget ? 'Salvar' : 'Criar'}
                  </ModernButton>
                </div>
              </form>
            </GlassmorphCard>
          </motion.div>
        </GlassOverlay>
      )}
    </AnimatePresence>
  );
}
