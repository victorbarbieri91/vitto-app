import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TransactionList, TransactionListRef } from '../../components/transactions/TransactionList';
import TransactionForm from '../../components/forms/TransactionForm';
import type { Transaction } from '../../services/api/AccountService';
import { MonthNavigator, ModernButton } from '../../components/ui/modern';
import FilterChip from '../../components/ui/FilterChip';
import { fixedTransactionService, FixedTransactionWithDetails } from '../../services/api/FixedTransactionService';
import transactionService from '../../services/api/TransactionService';
import { Tag, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../store/AuthContext';
import { useTransactionContext } from '../../store/TransactionContext';
import InvoicePaymentModal from '../../components/cards/InvoicePaymentModal';
import ConfirmDeleteInvoiceModal from '../../components/modals/ConfirmDeleteInvoiceModal';
import { toast } from 'react-hot-toast';
import { useCategories } from '../../hooks/useCategories';
import CurrencyInput from '../../components/ui/CurrencyInput';

export type RecurrenceFilter = 'all' | 'fixa' | 'parcelada' | 'unica';

export default function TransactionsPageModern() {
  const { user } = useAuth();
  const { onTransactionChange } = useTransactionContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const transactionListRef = useRef<TransactionListRef>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invoice payment/delete modals
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] = useState<any>(null);
  const [isDeleteInvoiceModalOpen, setIsDeleteInvoiceModalOpen] = useState(false);

  // Monthly transactions state (from dashboard - single source of truth)
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Fixed transactions state (for edit/adjustment modals)
  const [fixedTransactions, setFixedTransactions] = useState<FixedTransactionWithDetails[]>([]);

  // Point adjustment modal state
  const [adjustmentTransaction, setAdjustmentTransaction] = useState<FixedTransactionWithDetails | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState<number | undefined>(undefined);

  // Edit fixed transaction modal state
  const [editingFixedTransaction, setEditingFixedTransaction] = useState<FixedTransactionWithDetails | null>(null);
  const [isEditFixedModalOpen, setIsEditFixedModalOpen] = useState(false);

  // Categories hook
  const { categories } = useCategories();

  // Month navigation state
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  // Category filter state (from pie chart click)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Recurrence filter (chips)
  const [recurrenceFilter, setRecurrenceFilter] = useState<RecurrenceFilter>('all');

  // Process URL params
  useEffect(() => {
    const month = searchParams.get('month');
    const categoria = searchParams.get('categoria');

    // Redirect old card URLs to /cartoes
    const type = searchParams.get('type');
    const cardId = searchParams.get('card_id');
    if (type === 'cartao' && cardId) {
      navigate(`/cartoes?card_id=${cardId}${month ? `&month=${month}` : ''}`, { replace: true });
      return;
    }

    if (month) {
      const [monthNum, yearNum] = month.split('-');
      if (monthNum && yearNum) {
        setCurrentMonth(parseInt(monthNum));
        setCurrentYear(parseInt(yearNum));
      }
    }

    if (categoria) {
      setCategoryFilter(categoria);
    } else {
      setCategoryFilter(null);
    }
  }, [searchParams, navigate]);

  // Clear category filter
  const clearCategoryFilter = () => {
    setCategoryFilter(null);
    navigate('/lancamentos');
  };

  // Handle month navigation
  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  // Generate date filters for current month
  const getDateFilters = () => {
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
    const filters: any = { startDate, endDate };

    if (categoryFilter) {
      filters.categoria_id = categoryFilter;
    }

    return filters;
  };

  // === SINGLE DATA SOURCE: obter_dashboard_mes ===
  const loadData = async () => {
    if (!user) return;

    setMonthlyLoading(true);
    try {
      const { data, error } = await supabase.rpc('obter_dashboard_mes', {
        p_user_id: user.id,
        p_mes: currentMonth,
        p_ano: currentYear
      });

      if (error) throw error;

      const result = data as any;
      const transactions = result?.transacoes_mes || [];
      setMonthlyTransactions(transactions);
    } catch (error) {
      console.error('Erro ao carregar transacoes:', error);
      setMonthlyTransactions([]);
    } finally {
      setMonthlyLoading(false);
    }
  };

  // Load fixed transactions list (for edit modal lookup)
  const loadFixedTransactions = async () => {
    try {
      const transactionsData = await fixedTransactionService.list();
      setFixedTransactions(transactionsData);
    } catch (error) {
      console.error('Erro ao carregar transacoes fixas:', error);
    }
  };

  // Load data on mount and month change
  useEffect(() => {
    loadData();
    loadFixedTransactions();
  }, [currentMonth, currentYear, user]);

  // Listen for global transaction changes
  useEffect(() => {
    const unsubscribe = onTransactionChange(() => {
      loadData();
      loadFixedTransactions();
    });
    return () => unsubscribe();
  }, [onTransactionChange]);

  // === TRANSACTION HANDLERS ===

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsAddModalOpen(true);
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    try {
      setIsSubmitting(true);
      const { error } = await transactionService.delete(transactionId.toString());
      if (error) throw new Error(error.message || 'Erro ao excluir transacao');
      transactionListRef.current?.fetchTransactions();
    } catch (error: any) {
      console.error('Erro ao excluir transacao:', error);
      toast.error(error.message || 'Erro ao excluir transacao');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateTransaction = async (transactionId: number) => {
    try {
      setIsSubmitting(true);
      const { error } = await transactionService.updateStatus(transactionId.toString(), 'confirmado');
      if (error) throw new Error(error.message || 'Erro ao efetivar transacao');
      toast.success('Transacao efetivada com sucesso!');
      transactionListRef.current?.fetchTransactions();
    } catch (error: any) {
      console.error('Erro ao efetivar transacao:', error);
      toast.error(error.message || 'Erro ao efetivar transacao');
    } finally {
      setIsSubmitting(false);
    }
  };

  // === FIXED TRANSACTION HANDLERS ===

  const handleConfirmFixedTransaction = async (fixedTransactionId: number, targetDate: string) => {
    setIsSubmitting(true);
    try {
      const result = await transactionService.confirmVirtualFixedTransaction(fixedTransactionId, targetDate);
      if (result.error) throw new Error(result.error.message || 'Erro ao confirmar transacao fixa');
      toast.success('Lancamento confirmado com sucesso!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao confirmar transacao fixa:', error);
      toast.error(error.message || 'Erro ao confirmar transacao fixa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartialFixedTransaction = async (_fixedTransactionId: number, _targetDate: string) => {
    toast('Funcionalidade de recebimento parcial em desenvolvimento', { icon: 'ℹ️' });
  };

  const handleUndoFixedTransaction = async (transactionId: number) => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('desfazer_confirmacao_lancamento_fixo', {
        p_transacao_id: transactionId,
        p_user_id: user.id
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast.success(`Confirmacao de "${result.details?.fixo_descricao}" desfeita com sucesso!`);
        loadData();
      } else {
        toast.error(result?.error || 'Erro ao desfazer confirmacao');
      }
    } catch (error) {
      console.error('Erro ao desfazer confirmacao:', error);
      toast.error('Erro ao desfazer confirmacao');
    }
  };

  const handleEditFixedTransaction = async (fixedTransactionId: number) => {
    try {
      const fixedTransaction = fixedTransactions.find(t => t.id === fixedTransactionId);
      if (fixedTransaction) {
        setEditingFixedTransaction(fixedTransaction);
        setIsEditFixedModalOpen(true);
      } else {
        const transaction = await fixedTransactionService.getById(fixedTransactionId) as FixedTransactionWithDetails | null;
        if (transaction) {
          setEditingFixedTransaction(transaction);
          setIsEditFixedModalOpen(true);
        } else {
          toast.error('Lancamento fixo nao encontrado');
        }
      }
    } catch (error) {
      console.error('Erro ao editar lancamento fixo:', error);
      toast.error('Erro ao abrir editor do lancamento fixo');
    }
  };

  const handleCloseEditFixedModal = () => {
    setIsEditFixedModalOpen(false);
    setEditingFixedTransaction(null);
  };

  const handleSaveEditedFixedTransaction = async (data: any) => {
    if (!editingFixedTransaction) return;
    try {
      await fixedTransactionService.update(editingFixedTransaction.id, data);
      toast.success('Lancamento fixo atualizado com sucesso!');
      await loadFixedTransactions();
      handleCloseEditFixedModal();
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar lancamento fixo:', error);
      toast.error('Erro ao atualizar lancamento fixo');
    }
  };

  // === POINT ADJUSTMENT HANDLERS ===

  const handlePointAdjustment = (transaction: FixedTransactionWithDetails) => {
    setAdjustmentTransaction(transaction);
    setAdjustmentValue(Number(transaction.valor));
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
    setAdjustmentTransaction(null);
    setAdjustmentValue(undefined);
  };

  const handleSaveAdjustment = async () => {
    if (!adjustmentTransaction || adjustmentValue === undefined) return;
    try {
      const now = new Date();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dia = adjustmentTransaction.dia_mes > lastDayOfMonth ? lastDayOfMonth : adjustmentTransaction.dia_mes;
      const dataTransacao = new Date(now.getFullYear(), now.getMonth(), dia);

      const { error } = await supabase
        .from('app_transacoes')
        .insert({
          user_id: user?.id,
          descricao: `${adjustmentTransaction.descricao} (ajuste pontual)`,
          valor: adjustmentValue,
          data: dataTransacao.toISOString().split('T')[0],
          tipo: adjustmentTransaction.tipo,
          categoria_id: adjustmentTransaction.categoria_id,
          conta_id: adjustmentTransaction.conta_id,
          cartao_id: adjustmentTransaction.cartao_id,
          fixo_id: adjustmentTransaction.id,
          origem: 'fixo',
          status: 'confirmado',
          observacoes: `Ajuste pontual: valor original R$ ${Number(adjustmentTransaction.valor).toFixed(2)} -> R$ ${adjustmentValue.toFixed(2)}`
        });

      if (error) throw error;
      toast.success('Ajuste pontual criado com sucesso!');
      handleCloseAdjustmentModal();
      loadData();
    } catch (error) {
      console.error('Erro ao criar ajuste pontual:', error);
      toast.error('Erro ao criar ajuste pontual');
    }
  };

  // === INVOICE HANDLERS ===

  const handlePayInvoice = (invoice: any) => {
    const faturaDetails = invoice.fatura_details || {};
    setSelectedInvoiceForPayment({
      id: invoice.id,
      cartao_id: invoice.cartao_id,
      mes: faturaDetails.mes,
      ano: faturaDetails.ano,
      valor_total: invoice.valor,
      status: invoice.status,
      data_vencimento: invoice.data,
      cartao: {
        nome: faturaDetails.cartao_nome,
        cor: faturaDetails.cartao_cor
      }
    });
    setIsPaymentModalOpen(true);
  };

  const handleDeleteInvoice = (transaction: any) => {
    const faturaDetails = transaction.fatura_details || {};
    setSelectedInvoiceForDelete({
      id: transaction.id,
      cartaoNome: faturaDetails.cartao_nome || 'Cartao',
      mes: faturaDetails.mes || currentMonth,
      ano: faturaDetails.ano || currentYear,
      valor: transaction.valor || 0
    });
    setIsDeleteInvoiceModalOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!selectedInvoiceForDelete || !user) return;
    try {
      const { data, error } = await supabase.rpc('excluir_fatura_completa', {
        p_fatura_id: selectedInvoiceForDelete.id,
        p_user_id: user.id
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast.success(`Fatura de ${selectedInvoiceForDelete.cartaoNome} excluida com sucesso!`);
        loadData();
      } else {
        toast.error(result?.error || 'Erro ao excluir fatura');
      }
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      toast.error('Erro ao excluir fatura');
    } finally {
      setIsDeleteInvoiceModalOpen(false);
      setSelectedInvoiceForDelete(null);
    }
  };

  // Navigate to cards module when clicking invoice in extract
  const handleInvoiceClick = (transaction: any) => {
    const cartaoId = transaction.cartao_id || transaction.fatura_details?.cartao_id;
    if (cartaoId) {
      navigate(`/cartoes?card_id=${cartaoId}`);
    }
  };

  // === FORM HANDLERS ===

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  const handleTransactionSaved = async (_data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      handleCloseModal();
      transactionListRef.current?.fetchTransactions();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex justify-center">
        <MonthNavigator
          currentMonth={currentMonth}
          currentYear={currentYear}
          onMonthChange={handleMonthChange}
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <FilterChip
          label="Todas"
          isActive={recurrenceFilter === 'all'}
          onClick={() => setRecurrenceFilter('all')}
        />
        <FilterChip
          label="Fixas"
          isActive={recurrenceFilter === 'fixa'}
          onClick={() => setRecurrenceFilter(recurrenceFilter === 'fixa' ? 'all' : 'fixa')}
        />
        <FilterChip
          label="Parceladas"
          isActive={recurrenceFilter === 'parcelada'}
          onClick={() => setRecurrenceFilter(recurrenceFilter === 'parcelada' ? 'all' : 'parcelada')}
        />
        <FilterChip
          label="Unicas"
          isActive={recurrenceFilter === 'unica'}
          onClick={() => setRecurrenceFilter(recurrenceFilter === 'unica' ? 'all' : 'unica')}
        />
      </div>

      {/* Category Filter Indicator */}
      {categoryFilter && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-coral-50 border border-coral-200 rounded-full">
            <Tag className="w-3.5 h-3.5 text-coral-500" />
            <span className="text-sm text-coral-700">Filtrado por categoria</span>
            <button
              onClick={clearCategoryFilter}
              className="p-0.5 hover:bg-coral-100 rounded-full transition-colors"
            >
              <XCircle className="w-4 h-4 text-coral-500" />
            </button>
          </div>
        </div>
      )}

      {/* Consolidated Transaction List */}
      <div className="space-y-3">
        <TransactionList
          ref={transactionListRef}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onConfirmFixedTransaction={handleConfirmFixedTransaction}
          onPartialFixedTransaction={handlePartialFixedTransaction}
          onUndoFixedTransaction={handleUndoFixedTransaction}
          onEditFixedTransaction={handleEditFixedTransaction}
          onDeleteInvoice={handleDeleteInvoice}
          onActivateTransaction={handleActivateTransaction}
          onInvoiceClick={handleInvoiceClick}
          showFilters={true}
          defaultFilters={getDateFilters()}
          includeVirtualFixed={true}
          excludeCardTransactions={false}
          preloadedTransactions={monthlyTransactions}
          recurrenceFilter={recurrenceFilter}
        />
      </div>

      {/* Edit Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingTransaction ? 'Editar Lancamento' : 'Novo Lancamento'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <TransactionForm
              transaction={editingTransaction as any}
              onSave={handleTransactionSaved}
              onCancel={handleCloseModal}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Invoice Payment Modal */}
      {selectedInvoiceForPayment && (
        <InvoicePaymentModal
          invoice={selectedInvoiceForPayment}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoiceForPayment(null);
          }}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoiceForPayment(null);
            loadData();
          }}
        />
      )}

      {/* Confirm Delete Invoice Modal */}
      <ConfirmDeleteInvoiceModal
        isOpen={isDeleteInvoiceModalOpen}
        onClose={() => {
          setIsDeleteInvoiceModalOpen(false);
          setSelectedInvoiceForDelete(null);
        }}
        onConfirm={confirmDeleteInvoice}
        invoiceDetails={selectedInvoiceForDelete}
      />

      {/* Point Adjustment Modal */}
      {isAdjustmentModalOpen && adjustmentTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-deep-blue">Ajuste Pontual</h2>
              <button onClick={handleCloseAdjustmentModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>

            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-700">{adjustmentTransaction.descricao}</h3>
              <p className="text-sm text-slate-500 mt-1">
                Valor original: <span className="font-semibold">{formatCurrency(Number(adjustmentTransaction.valor))}</span>
              </p>
            </div>

            <div className="space-y-4">
              <CurrencyInput
                label="Novo Valor para este Mes"
                value={adjustmentValue}
                onChange={setAdjustmentValue}
                required
              />
              <div className="flex gap-3 pt-2">
                <ModernButton onClick={handleSaveAdjustment} className="flex-1" disabled={adjustmentValue === undefined || adjustmentValue <= 0}>
                  Criar Ajuste
                </ModernButton>
                <ModernButton variant="outline" onClick={handleCloseAdjustmentModal} className="flex-1">
                  Cancelar
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fixed Transaction Modal */}
      {isEditFixedModalOpen && editingFixedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-deep-blue">Editar Lancamento Fixo</h2>
              <button onClick={handleCloseEditFixedModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const data = {
                descricao: formData.get('descricao') as string,
                valor: parseFloat((formData.get('valor') as string).replace(/[^\d,]/g, '').replace(',', '.')),
                tipo: formData.get('tipo') as string,
                dia_mes: parseInt(formData.get('dia_mes') as string),
                categoria_id: parseInt(formData.get('categoria_id') as string) || null,
                ativo: formData.get('ativo') === 'on',
              };
              handleSaveEditedFixedTransaction(data);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
                <input type="text" name="descricao" defaultValue={editingFixedTransaction.descricao} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input type="text" name="valor" defaultValue={formatCurrency(Number(editingFixedTransaction.valor))} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500" placeholder="R$ 0,00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select name="tipo" defaultValue={editingFixedTransaction.tipo} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500">
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                  <option value="despesa_cartao">Despesa Cartao</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia do Mes</label>
                <input type="number" name="dia_mes" min="1" max="31" defaultValue={editingFixedTransaction.dia_mes} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select name="categoria_id" defaultValue={editingFixedTransaction.categoria_id || ''} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500">
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="ativo" id="ativo" defaultChecked={editingFixedTransaction.ativo} className="h-4 w-4 text-coral-600 focus:ring-coral-500 border-gray-300 rounded" />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">Transacao ativa</label>
              </div>
              <div className="flex gap-3 pt-4">
                <ModernButton type="submit" className="flex-1">Salvar</ModernButton>
                <ModernButton type="button" variant="outline" onClick={handleCloseEditFixedModal} className="flex-1">Cancelar</ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
