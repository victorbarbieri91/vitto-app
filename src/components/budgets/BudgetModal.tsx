import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, TrendingUp, TrendingDown, Check, Tag } from 'lucide-react';
import { GlassOverlay } from '../ui/modern/GlassmorphCard';
import { ModernButton, ModernInput } from '../ui/modern';
import { cn } from '../../utils/cn';
import type { BudgetWithCategory, BudgetTipo } from '../../services/api/BudgetService';

interface Category {
  id: number;
  nome: string;
  tipo: string;
  cor?: string;
  icone?: string;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { categoria_id: number; valor: number; mes: number; ano: number; tipo: BudgetTipo }) => Promise<void>;
  onCreateCategory?: (data: { nome: string; tipo: BudgetTipo; cor: string }) => Promise<Category>;
  editingBudget?: BudgetWithCategory | null;
  availableCategories: Category[];
  currentMonth: number;
  currentYear: number;
}

// Cores predefinidas para novas categorias
const CATEGORY_COLORS = [
  '#F87060', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EC4899', '#14B8A6', '#6366F1', '#EF4444', '#84CC16'
];

/**
 *
 */
export default function BudgetModal({
  isOpen,
  onClose,
  onSave,
  onCreateCategory,
  editingBudget,
  availableCategories,
  currentMonth,
  currentYear,
}: BudgetModalProps) {
  const [tipo, setTipo] = useState<BudgetTipo>('despesa');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [valor, setValor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para criar nova categoria
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingBudget) {
        setTipo(editingBudget.tipo || 'despesa');
        setSelectedCategoryId(editingBudget.categoria_id);
        setValor(editingBudget.valor.toString());
      } else {
        setTipo('despesa');
        setSelectedCategoryId(null);
        setValor('');
      }
      setShowNewCategory(false);
      setNewCategoryName('');
      setNewCategoryColor(CATEGORY_COLORS[0]);
    }
  }, [isOpen, editingBudget]);

  // Filtrar categorias pelo tipo selecionado
  const filteredCategories = availableCategories.filter(cat => cat.tipo === tipo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!valor || (!editingBudget && !selectedCategoryId)) return;

    setIsSubmitting(true);
    try {
      await onSave({
        categoria_id: editingBudget ? editingBudget.categoria_id : selectedCategoryId!,
        valor: parseFloat(valor),
        mes: currentMonth,
        ano: currentYear,
        tipo,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !onCreateCategory) return;

    setIsCreatingCategory(true);
    try {
      const newCategory = await onCreateCategory({
        nome: newCategoryName.trim(),
        tipo,
        cor: newCategoryColor,
      });

      // Selecionar a nova categoria
      setSelectedCategoryId(newCategory.id);
      setShowNewCategory(false);
      setNewCategoryName('');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <GlassOverlay onClick={onClose} className="z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {monthNames[currentMonth - 1]} de {currentYear}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Tipo: Receita ou Despesa */}
                {!editingBudget && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Tipo de Orçamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTipo('despesa');
                          setSelectedCategoryId(null);
                        }}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all",
                          tipo === 'despesa'
                            ? "border-rose-500 bg-rose-50 text-rose-700"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        )}
                      >
                        <TrendingDown className="w-4 h-4" />
                        <span className="font-medium text-sm">Limite de Gasto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipo('receita');
                          setSelectedCategoryId(null);
                        }}
                        className={cn(
                          "flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all",
                          tipo === 'receita'
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 hover:border-slate-300 text-slate-600"
                        )}
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-medium text-sm">Meta de Receita</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Seleção de Categoria */}
                {!editingBudget && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-slate-600">
                        Categoria
                      </label>
                      {onCreateCategory && !showNewCategory && (
                        <button
                          type="button"
                          onClick={() => setShowNewCategory(true)}
                          className="text-xs text-coral-500 hover:text-coral-600 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Nova Categoria
                        </button>
                      )}
                    </div>

                    {/* Formulário para nova categoria */}
                    <AnimatePresence>
                      {showNewCategory && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                        >
                          <div className="space-y-3">
                            <ModernInput
                              placeholder="Nome da categoria"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              className="text-sm"
                            />

                            {/* Seletor de cor */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Cor:</span>
                              <div className="flex gap-1 flex-wrap">
                                {CATEGORY_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => setNewCategoryColor(color)}
                                    className={cn(
                                      "w-6 h-6 rounded-full transition-transform",
                                      newCategoryColor === color && "ring-2 ring-offset-2 ring-slate-400 scale-110"
                                    )}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <ModernButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowNewCategory(false);
                                  setNewCategoryName('');
                                }}
                                className="flex-1 text-xs"
                              >
                                Cancelar
                              </ModernButton>
                              <ModernButton
                                type="button"
                                size="sm"
                                onClick={handleCreateCategory}
                                disabled={!newCategoryName.trim() || isCreatingCategory}
                                isLoading={isCreatingCategory}
                                className="flex-1 text-xs"
                              >
                                Criar
                              </ModernButton>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Grid de categorias */}
                    {filteredCategories.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                        {filteredCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left",
                              selectedCategoryId === cat.id
                                ? "border-coral-500 bg-coral-50 ring-1 ring-coral-200"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.cor || '#6B7280' }}
                            />
                            <span className="text-xs font-medium text-slate-700 truncate">
                              {cat.nome}
                            </span>
                            {selectedCategoryId === cat.id && (
                              <Check className="w-3 h-3 text-coral-500 ml-auto flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {tipo === 'receita'
                            ? 'Nenhuma categoria de receita disponível'
                            : 'Nenhuma categoria de despesa disponível'}
                        </p>
                        {onCreateCategory && (
                          <button
                            type="button"
                            onClick={() => setShowNewCategory(true)}
                            className="mt-2 text-xs text-coral-500 hover:text-coral-600 font-medium"
                          >
                            Criar uma categoria
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Categoria selecionada (ao editar) */}
                {editingBudget && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: editingBudget.categoria?.cor || '#6B7280' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {editingBudget.categoria?.nome}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tipo === 'receita' ? 'Meta de Receita' : 'Limite de Gasto'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Valor */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    {tipo === 'receita' ? 'Meta de Valor' : 'Limite de Valor'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="0,00"
                      required
                      className={cn(
                        "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200",
                        "text-lg font-semibold text-slate-800",
                        "focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500",
                        "transition-all"
                      )}
                    />
                  </div>
                  {valor && (
                    <p className="mt-2 text-xs text-slate-500 text-right">
                      {formatCurrency(valor)}
                    </p>
                  )}
                </div>

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
                    disabled={isSubmitting || !valor || (!editingBudget && !selectedCategoryId)}
                  >
                    {editingBudget ? 'Salvar' : 'Criar Orçamento'}
                  </ModernButton>
                </div>
              </form>
            </div>
          </motion.div>
        </GlassOverlay>
      )}
    </AnimatePresence>
  );
}
