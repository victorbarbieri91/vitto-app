import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Search,
  Pencil,
  Trash2,
  Repeat,
} from 'lucide-react';
import { ModernButton, ModernBadge } from '../ui/modern';
import { ModernInput } from '../ui/modern';
import InvoicePaymentModal from './InvoicePaymentModal';
import { TransactionFormModal } from '../forms/transaction/TransactionFormModal';
import CreditCardExpenseForm from '../forms/transaction/CreditCardExpenseForm';
import {
  faturaService,
  transactionService,
  Fatura,
  CreditCardWithUsage,
  FaturaTransaction,
  CreateTransactionRequest
} from '../../services/api';
import { fixedTransactionService } from '../../services/api/FixedTransactionService';
import { useCategories } from '../../hooks/useCategories';
import FilterChip from '../ui/FilterChip';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { getCategoryIcon } from '../../utils/getCategoryIcon';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../store/AuthContext';
import { useIsMobile } from '../../hooks/useIsMobile';


// Types
interface InvoiceDrawerProps {
  card: CreditCardWithUsage | null;
  isOpen: boolean;
  onClose: () => void;
}

type SortOption = 'date' | 'value_asc' | 'value_desc';
type FilterType = 'all' | 'parceladas' | 'fixas';

/**
 *
 */
export default function InvoiceDrawer({ card, isOpen, onClose }: InvoiceDrawerProps) {
  const { user } = useAuth();
  const { categories } = useCategories();
  const isMobile = useIsMobile();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [invoice, setInvoice] = useState<Fatura | null>(null);
  const [dynamicTotal, setDynamicTotal] = useState<number>(0);
  const [transactions, setTransactions] = useState<FaturaTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sortBy, _setSortBy] = useState<SortOption>('date');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isTransactionFormOpen, setTransactionFormOpen] = useState(false);

  // Edit modal state
  const [editingTx, setEditingTx] = useState<FaturaTransaction | null>(null);
  const [editForm, setEditForm] = useState({ descricao: '', valor: '', data: '', categoria_id: 0 });
  const [editScope, setEditScope] = useState<'this_month' | 'from_now'>('this_month');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (isOpen && card) {
      loadInvoiceData();
    }
  }, [isOpen, card, currentMonth]);

  // Reset search when changing month
  useEffect(() => {
    setSearchQuery('');
  }, [currentMonth]);

  const loadInvoiceData = async () => {
    if (!card) return;
    setLoading(true);
    setError(null);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      const invoiceRes = await faturaService.findByCardAndMonth(card.id, year, month);
      if (invoiceRes.error) throw new Error(invoiceRes.error.message);
      const fatura = invoiceRes.data?.[0] || null;
      setInvoice(fatura);

      if (fatura) {
        const txRes = await faturaService.getInvoiceTransactions(fatura.id);
        if (txRes.error) throw new Error(txRes.error.message);
        setTransactions(txRes.data || []);

        const total = (txRes.data || []).reduce((sum, t) => sum + Number(t.valor), 0);
        setDynamicTotal(total);
      } else {
        setTransactions([]);
        setDynamicTotal(0);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (formData: any) => {
    if (!card || !user) return;
    setIsSubmitting(true);
    try {
      const newTransaction: CreateTransactionRequest = {
        ...formData,
        valor: Number(formData.valor),
        user_id: user.id,
        tipo: 'despesa_cartao',
        status: 'confirmado',
        cartao_id: card.id,
        recorrente: formData.is_recorrente,
        parcelado: formData.is_parcelado,
        total_parcelas: formData.is_parcelado ? formData.parcelamento.total_parcelas : null,
      };
      const { error } = await transactionService.create(newTransaction);
      if (error) throw error;

      toast.success('Despesa adicionada!');
      setTransactionFormOpen(false);
      await loadInvoiceData();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao adicionar despesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];
    if (filterType === 'parceladas') filtered = filtered.filter(t => t.total_parcelas != null);
    if (filterType === 'fixas') filtered = filtered.filter(t => t.is_fixed);
    const sorters = {
      date: (a: FaturaTransaction, b: FaturaTransaction) => new Date(b.data).getTime() - new Date(a.data).getTime(),
      value_asc: (a: FaturaTransaction, b: FaturaTransaction) => Number(a.valor) - Number(b.valor),
      value_desc: (a: FaturaTransaction, b: FaturaTransaction) => Number(b.valor) - Number(a.valor),
    };
    return filtered.sort(sorters[sortBy]);
  }, [transactions, sortBy, filterType]);

  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return filteredAndSortedTransactions;
    const q = searchQuery.toLowerCase().trim();
    return filteredAndSortedTransactions.filter(tx =>
      tx.descricao.toLowerCase().includes(q) ||
      tx.valor.toString().includes(q) ||
      (tx.categoria_nome || '').toLowerCase().includes(q)
    );
  }, [filteredAndSortedTransactions, searchQuery]);

  const insights = useMemo(() => ({
    totalCount: transactions.length,
    installmentCount: transactions.filter(t => t.total_parcelas != null).length,
    recurringCount: transactions.filter(t => t.is_fixed).length,
  }), [transactions]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
    setFilterType('all');
  };

  const handleFilterClick = (type: FilterType) => {
    setFilterType(current => (current === type ? 'all' : type));
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const variants = { paga: 'success', fechada: 'warning', aberta: 'info' } as const;
    return <ModernBadge variant={variants[status as keyof typeof variants] || 'default'} size="sm">{status.charAt(0).toUpperCase() + status.slice(1)}</ModernBadge>;
  };

  // Edit handlers
  const handleStartEdit = (tx: FaturaTransaction) => {
    setEditingTx(tx);
    setEditScope('this_month');
    setEditForm({
      descricao: tx.descricao,
      valor: String(tx.valor),
      data: tx.data,
      categoria_id: tx.categoria_id || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    setIsSavingEdit(true);
    try {
      const isFixed = editingTx.is_fixed || editingTx.fixo_id != null;

      if (isFixed && editScope === 'from_now') {
        // Atualizar a regra fixa permanentemente
        const fixoId = editingTx.fixo_id || Math.abs(editingTx.id);
        await fixedTransactionService.update(fixoId, {
          descricao: editForm.descricao,
          valor: Number(editForm.valor),
          categoria_id: editForm.categoria_id || undefined,
        });
        toast.success('Regra fixa atualizada para este mes em diante');

      } else if (isFixed && editScope === 'this_month') {
        if (editingTx.id > 0) {
          // Transacao real com fixo_id - atualizar diretamente
          const { error } = await transactionService.update(String(editingTx.id), {
            descricao: editForm.descricao,
            valor: Number(editForm.valor),
            data: editForm.data,
            categoria_id: editForm.categoria_id || undefined,
          });
          if (error) throw error;
        } else {
          // Virtual (id < 0) - criar transacao real com valor ajustado
          const { error } = await transactionService.create({
            descricao: editForm.descricao,
            valor: Number(editForm.valor),
            data: editForm.data,
            tipo: 'despesa_cartao',
            categoria_id: editForm.categoria_id || undefined,
            cartao_id: card?.id,
            status: 'efetivado',
            fixo_id: Math.abs(editingTx.id),
            observacoes: `Valor ajustado (original: R$ ${Number(editingTx.valor).toFixed(2)})`,
          } as any);
          if (error) throw error;
        }
        toast.success('Valor ajustado para este mes');

      } else {
        // Transacao normal (nao fixa)
        const { error } = await transactionService.update(String(editingTx.id), {
          descricao: editForm.descricao,
          valor: Number(editForm.valor),
          data: editForm.data,
          categoria_id: editForm.categoria_id || undefined,
        });
        if (error) throw error;
        toast.success('Transacao atualizada!');
      }

      setEditingTx(null);
      await loadInvoiceData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (tx: FaturaTransaction) => {
    if (tx.is_fixed && tx.id <= 0) {
      // Virtual/fixa: desativar a regra
      const fixoId = Math.abs(tx.id);
      if (!confirm(`Desativar "${tx.descricao}" como transacao fixa? Ela nao aparecera mais nas faturas futuras.`)) return;
      try {
        await fixedTransactionService.toggle(fixoId, false);
        toast.success('Transacao fixa desativada');
        await loadInvoiceData();
      } catch (err: any) {
        toast.error(err.message || 'Erro ao desativar');
      }
    } else if (tx.id > 0) {
      // Transacao real
      if (!confirm(`Excluir "${tx.descricao}" (${formatCurrency(Number(tx.valor))})?`)) return;
      try {
        const { error } = await transactionService.delete(String(tx.id));
        if (error) throw error;
        toast.success('Transacao excluida');
        await loadInvoiceData();
      } catch (err: any) {
        toast.error(err.message || 'Erro ao excluir');
      }
    }
  };

  const handleCategoryChange = async (tx: FaturaTransaction, newCategoryId: number) => {
    try {
      if (tx.id > 0) {
        // Real transaction - update directly
        const { error } = await transactionService.update(String(tx.id), {
          categoria_id: newCategoryId,
        });
        if (error) throw error;
      } else if (tx.is_fixed) {
        // Virtual/fixed - update the fixed rule
        const fixoId = tx.fixo_id || Math.abs(tx.id);
        await fixedTransactionService.update(fixoId, {
          categoria_id: newCategoryId,
        });
      } else {
        return;
      }
      toast.success('Categoria atualizada');
      await loadInvoiceData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar categoria');
    }
  };

  // Filter categories for despesa type
  const expenseCategories = useMemo(() =>
    categories.filter(c => c.tipo === 'despesa' || c.tipo === 'ambos'),
  [categories]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 220 }}
            className={cn(
              "fixed bg-slate-100 shadow-2xl z-[60] flex flex-col",
              isMobile ? "inset-0" : "inset-y-0 right-0 w-full max-w-[56rem]"
            )}
            style={isMobile ? { paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
          >
            {/* Header redesenhado */}
            <header className="flex-shrink-0 border-b border-slate-200 bg-white/70 backdrop-blur-md">
              {/* Linha 1: Nome do cartao + Status + Close */}
              <div className={cn("flex items-center justify-between pt-3 pb-1", isMobile ? "px-3" : "px-4")}>
                <div className="flex items-center gap-2">
                  <h2 className={cn("font-bold text-deep-blue", isMobile ? "text-base" : "text-lg")}>{card?.nome}</h2>
                  {getStatusBadge(invoice?.status)}
                </div>
                <ModernButton variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </ModernButton>
              </div>

              {/* Linha 2: Navegacao de mes centralizada */}
              <div className={cn("flex items-center justify-between pb-3", isMobile ? "px-3" : "px-4")}>
                <ModernButton
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                  className="text-slate-600 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </ModernButton>

                <div className="text-center">
                  <span className="text-base font-bold text-deep-blue capitalize">
                    {currentMonth.toLocaleString('pt-BR', { month: 'long' })}
                  </span>
                  <span className="text-base font-bold text-deep-blue ml-1">
                    {currentMonth.getFullYear()}
                  </span>
                  <div className="text-xl font-bold text-coral-500 mt-0.5">
                    {formatCurrency(dynamicTotal)}
                  </div>
                </div>

                <ModernButton
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                  className="text-slate-600 hover:bg-slate-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </ModernButton>
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
              {loading ? (
                 <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-coral-500" /></div>
              ) : error ? (
                 <div className="p-6 text-center text-red-500">{error}</div>
              ) : (
                <div className="p-3 pb-20">
                  {/* Input de busca */}
                  <ModernInput
                    size="sm"
                    placeholder="Buscar por nome, valor ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    className="mb-3"
                  />

                  {/* Filtros compactos */}
                  <div className="flex items-center gap-2 mb-4">
                    <FilterChip
                      label={`Todos (${insights.totalCount})`}
                      isActive={filterType === 'all'}
                      onClick={() => handleFilterClick('all')}
                    />
                    <FilterChip
                      label={`Parceladas (${insights.installmentCount})`}
                      isActive={filterType === 'parceladas'}
                      onClick={() => handleFilterClick('parceladas')}
                    />
                    <FilterChip
                      label={`Fixas (${insights.recurringCount})`}
                      isActive={filterType === 'fixas'}
                      onClick={() => handleFilterClick('fixas')}
                    />
                  </div>

                  {/* Lista estilo extrato */}
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {/* Cabecalho da tabela - desktop only */}
                    {!isMobile && (
                      <div className="flex items-center py-2 px-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        <span className="w-12">Data</span>
                        <span className="flex-1 ml-8">Descricao</span>
                        <span className="w-28 text-center">Categoria</span>
                        <span className="text-right w-24">Valor</span>
                      </div>
                    )}

                    {/* Lista de transacoes */}
                    {searchFiltered.length > 0 ? (
                      searchFiltered.map((tx, index) => (
                        <TransactionItem
                          key={tx.id}
                          transaction={tx}
                          isLast={index === searchFiltered.length - 1}
                          onReload={loadInvoiceData}
                          onEdit={handleStartEdit}
                          onDelete={handleDelete}
                          onCategoryChange={handleCategoryChange}
                          expenseCategories={expenseCategories}
                          isMobile={isMobile}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <p className="text-sm">
                          {searchQuery.trim() ? 'Nenhum resultado encontrado.' : 'Nenhum lancamento para este periodo.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>

            {/* Footer */}
            <footer className={cn("flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-slate-200", isMobile ? "p-3" : "p-4")}>
                <div className={cn("flex items-center justify-center", isMobile ? "gap-2" : "gap-3")}>
                    <ModernButton
                      size={isMobile ? "sm" : "md"}
                      onClick={() => setTransactionFormOpen(true)}
                      className={cn("bg-deep-blue text-white hover:bg-deep-blue/90", isMobile ? "h-10 px-4 text-xs" : "h-11 px-6")}
                    >
                      Adicionar Despesa
                    </ModernButton>
                    <ModernButton
                      size={isMobile ? "sm" : "md"}
                      onClick={() => setPaymentModalOpen(true)}
                      className={cn(isMobile ? "h-10 px-4 text-xs" : "h-11 px-6")}
                      variant="primary"
                      disabled={!invoice || invoice.status === 'paga'}
                    >
                      Pagar Fatura
                    </ModernButton>
                </div>
            </footer>
          </motion.div>

          {/* Edit Modal */}
          <AnimatePresence>
            {editingTx && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 z-[70]"
                  onClick={() => setEditingTx(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full bg-white rounded-2xl shadow-2xl z-[70]",
                    isMobile ? "max-w-[calc(100%-2rem)] p-4" : "max-w-md p-6"
                  )}
                >
                  <h3 className="text-lg font-bold text-deep-blue mb-4">Editar Transacao</h3>
                  <div className="space-y-3">
                    <ModernInput
                      label="Descricao"
                      value={editForm.descricao}
                      onChange={(e) => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                    />
                    <ModernInput
                      label="Valor"
                      type="number"
                      value={editForm.valor}
                      onChange={(e) => setEditForm(f => ({ ...f, valor: e.target.value }))}
                    />
                    <ModernInput
                      label="Data"
                      type="date"
                      value={editForm.data}
                      onChange={(e) => setEditForm(f => ({ ...f, data: e.target.value }))}
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                      <select
                        value={editForm.categoria_id}
                        onChange={(e) => setEditForm(f => ({ ...f, categoria_id: Number(e.target.value) }))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-coral-500 focus:ring-1 focus:ring-coral-500 outline-none"
                      >
                        <option value={0}>Selecionar...</option>
                        {expenseCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nome}</option>
                        ))}
                      </select>
                    </div>

                    {/* Scope selection for fixed transactions */}
                    {(editingTx?.is_fixed || editingTx?.fixo_id != null) && (
                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-600">Aplicar alteracao:</p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="editScope"
                            checked={editScope === 'this_month'}
                            onChange={() => setEditScope('this_month')}
                            className="accent-coral-500"
                          />
                          <span className="text-sm text-slate-700">Somente este mes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="editScope"
                            checked={editScope === 'from_now'}
                            onChange={() => setEditScope('from_now')}
                            className="accent-coral-500"
                          />
                          <span className="text-sm text-slate-700">A partir deste mes</span>
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 mt-6">
                    <ModernButton
                      variant="ghost"
                      size="md"
                      onClick={() => setEditingTx(null)}
                      className="flex-1"
                    >
                      Cancelar
                    </ModernButton>
                    <ModernButton
                      variant="primary"
                      size="md"
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit || !editForm.descricao.trim() || !editForm.valor}
                      className="flex-1"
                    >
                      {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Salvar
                    </ModernButton>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {invoice && <InvoicePaymentModal invoice={invoice} isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} onSuccess={loadInvoiceData} />}
          <TransactionFormModal isOpen={isTransactionFormOpen} onClose={() => setTransactionFormOpen(false)} type="despesa_cartao">
            <CreditCardExpenseForm
              onSave={handleAddExpense}
              onCancel={() => setTransactionFormOpen(false)}
              isSubmitting={isSubmitting}
              defaultCardId={card?.id}
            />
          </TransactionFormModal>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ---- TransactionItem ----

interface TransactionItemProps {
  transaction: FaturaTransaction;
  isLast: boolean;
  onReload: () => void;
  onEdit: (tx: FaturaTransaction) => void;
  onDelete: (tx: FaturaTransaction) => void;
  onCategoryChange: (tx: FaturaTransaction, newCategoryId: number) => void;
  expenseCategories: { id: number; nome: string; cor: string | null; icone: string | null }[];
  isMobile: boolean;
}

const TransactionItem = ({ transaction, isLast, onReload, onEdit, onDelete, onCategoryChange, expenseCategories, isMobile }: TransactionItemProps) => {
  const [isMarkingFixed, setIsMarkingFixed] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const transactionDate = new Date(transaction.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const canMarkAsFixed = !transaction.is_fixed && transaction.total_parcelas == null && transaction.id > 0;
  const isRealTransaction = transaction.id > 0;

  const handleMarkAsFixed = async () => {
    if (isMarkingFixed) return;
    setIsMarkingFixed(true);
    try {
      await fixedTransactionService.createFromTransaction(transaction.id);
      toast.success(`"${transaction.descricao}" marcada como fixa!`);
      onReload();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao marcar como fixa');
      setIsMarkingFixed(false);
    }
  };

  // ========== MOBILE: expand/collapse style ==========
  if (isMobile) {
    const btnClass = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors active:scale-95";
    return (
      <div
        className={cn("transition-colors cursor-pointer", !isLast && "border-b border-slate-100")}
        onClick={() => { setIsExpanded(!isExpanded); setShowCategoryPicker(false); }}
      >
        {/* Main row: icon + description + value */}
        <div className="flex items-center px-2.5 py-2 gap-2">
          {/* Category icon */}
          {transaction.categoria_icone && (
            <div
              className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${transaction.categoria_cor || '#6B7280'}15` }}
            >
              {getCategoryIcon(transaction.categoria_icone, transaction.categoria_cor || '#6B7280', 12)}
            </div>
          )}
          {/* Description + badges + date */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-800 truncate">{transaction.descricao}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400">{transactionDate}</span>
              {transaction.total_parcelas != null && (
                <span className="text-[9px] text-blue-600 bg-blue-50 px-1 py-px rounded font-medium">
                  {transaction.parcela_atual}/{transaction.total_parcelas}
                </span>
              )}
              {transaction.is_fixed && (
                <span className="text-[9px] text-amber-600 bg-amber-50 px-1 py-px rounded font-medium">Fixa</span>
              )}
            </div>
          </div>
          {/* Value */}
          <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap tabular-nums flex-shrink-0">
            {formatCurrency(Number(transaction.valor))}
          </span>
        </div>

        {/* Expanded section with actions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="px-2.5 pb-2.5">
                <div className="border-t border-slate-100 mb-2" />

                {/* Category - clickable to change */}
                <div className="relative mb-2">
                  {(isRealTransaction || transaction.is_fixed) ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowCategoryPicker(!showCategoryPicker); }}
                      className="flex items-center gap-1 text-[11px] text-slate-500 active:text-coral-600 transition-colors"
                    >
                      <span>{transaction.categoria_nome || 'Outros'}</span>
                      <ChevronDown className="w-3 h-3 text-slate-300" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">{transaction.categoria_nome || 'Outros'}</span>
                  )}

                  {/* Category picker dropdown */}
                  {showCategoryPicker && (
                    <>
                      <div className="fixed inset-0 z-[80]" onClick={(e) => { e.stopPropagation(); setShowCategoryPicker(false); }} />
                      <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-[80] max-h-48 overflow-y-auto py-1">
                        {expenseCategories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCategoryChange(transaction, cat.id);
                              setShowCategoryPicker(false);
                            }}
                            className={cn(
                              "flex items-center gap-2 w-full px-3 py-2 text-left text-xs active:bg-slate-50 transition-colors",
                              cat.id === transaction.categoria_id && "bg-coral-50 text-coral-600"
                            )}
                          >
                            {cat.icone && (
                              <span className="w-4 h-4 flex-shrink-0">
                                {getCategoryIcon(cat.icone, cat.cor || '#6B7280', 12)}
                              </span>
                            )}
                            <span className="truncate">{cat.nome}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {(isRealTransaction || transaction.is_fixed) && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); onEdit(transaction); }}
                        className={cn(btnClass, "text-slate-600 bg-slate-100")}>
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(transaction); }}
                        className={cn(btnClass, "text-red-500 bg-red-50")}>
                        <Trash2 className="w-3 h-3" /> Excluir
                      </button>
                    </>
                  )}
                  {canMarkAsFixed && (
                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsFixed(); }}
                      disabled={isMarkingFixed}
                      className={cn(btnClass, "text-amber-600 bg-amber-50 disabled:opacity-50")}>
                      {isMarkingFixed ? <Loader2 className="w-3 h-3 animate-spin" /> : <Repeat className="w-3 h-3" />}
                      Marcar fixa
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ========== DESKTOP: layout horizontal com hover actions ==========
  return (
    <div className={cn(
      "flex items-center py-2 px-3 hover:bg-slate-50/50 transition-colors group",
      !isLast && "border-b border-slate-100"
    )}>
      {/* Data */}
      <span className="text-[11px] text-slate-400 w-12 flex-shrink-0 font-medium">
        {transactionDate}
      </span>

      {/* Icone da categoria */}
      {transaction.categoria_icone && (
        <div
          className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center mr-2"
          style={{ backgroundColor: `${transaction.categoria_cor || '#6B7280'}15` }}
        >
          {getCategoryIcon(transaction.categoria_icone, transaction.categoria_cor || '#6B7280', 14)}
        </div>
      )}

      {/* Descricao + badges */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-[13px] text-slate-700 truncate">{transaction.descricao}</span>
        {transaction.total_parcelas != null && (
          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
            {transaction.parcela_atual}/{transaction.total_parcelas}
          </span>
        )}
        {transaction.is_fixed && (
          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
            Fixa
          </span>
        )}
      </div>

      {/* Categoria nome (clicavel para trocar) */}
      <div className="relative w-28 flex-shrink-0">
        {(isRealTransaction || transaction.is_fixed) ? (
          <button
            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-coral-600 transition-colors w-full group/cat cursor-pointer"
            title="Clique para trocar categoria"
          >
            <span className="truncate">{transaction.categoria_nome || 'Outros'}</span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-slate-300 group-hover/cat:text-coral-400 transition-colors" />
          </button>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-slate-400 w-full">
            <span className="truncate">{transaction.categoria_nome || 'Outros'}</span>
          </span>
        )}

        {/* Category picker dropdown */}
        {showCategoryPicker && (
          <>
            <div className="fixed inset-0 z-[80]" onClick={() => setShowCategoryPicker(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-[80] max-h-60 overflow-y-auto py-1">
              {expenseCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onCategoryChange(transaction, cat.id);
                    setShowCategoryPicker(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 transition-colors",
                    cat.id === transaction.categoria_id && "bg-coral-50 text-coral-600"
                  )}
                >
                  {cat.icone && (
                    <span className="w-4 h-4 flex-shrink-0">
                      {getCategoryIcon(cat.icone, cat.cor || '#6B7280', 14)}
                    </span>
                  )}
                  <span className="truncate">{cat.nome}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Acoes (hover) */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mx-1 flex-shrink-0">
        {canMarkAsFixed && (
          <button
            onClick={handleMarkAsFixed}
            disabled={isMarkingFixed}
            title="Marcar como fixa (recorrente)"
            className="p-1 rounded hover:bg-amber-50 text-slate-400 hover:text-amber-600 disabled:opacity-50"
          >
            {isMarkingFixed ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Repeat className="w-3.5 h-3.5" />}
          </button>
        )}
        {(isRealTransaction || transaction.is_fixed) && (
          <>
            <button
              onClick={() => onEdit(transaction)}
              title="Editar"
              className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(transaction)}
              title={transaction.is_fixed && !isRealTransaction ? 'Desativar fixa' : 'Excluir'}
              className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Valor */}
      <span className="text-[13px] font-semibold text-slate-800 whitespace-nowrap tabular-nums w-24 text-right flex-shrink-0">
        {formatCurrency(Number(transaction.valor))}
      </span>
    </div>
  );
};