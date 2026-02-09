import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TransactionList, TransactionListRef } from '../../components/transactions/TransactionList';
import type { Transaction } from '../../services/api/AccountService';
import { MonthNavigator } from '../../components/ui/modern';
import FilterChip from '../../components/ui/FilterChip';
import { fixedTransactionService, FixedTransactionWithDetails } from '../../services/api/FixedTransactionService';
import transactionService from '../../services/api/TransactionService';
import { Tag, XCircle } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../store/AuthContext';
import { useTransactionContext } from '../../store/TransactionContext';
import InvoicePaymentModal from '../../components/cards/InvoicePaymentModal';
import ConfirmDeleteInvoiceModal from '../../components/modals/ConfirmDeleteInvoiceModal';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import EfetivarModal from '../../components/transactions/EfetivarModal';
import type { EfetivarData } from '../../components/transactions/EfetivarModal';
import TransactionEditModal from '../../components/transactions/TransactionEditModal';
import type { EditTransactionData } from '../../components/transactions/TransactionEditModal';
import { toast } from 'react-hot-toast';

export type RecurrenceFilter = 'all' | 'fixa' | 'parcelada' | 'unica';

export default function TransactionsPageModern() {
  const { user } = useAuth();
  const { onTransactionChange } = useTransactionContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const transactionListRef = useRef<TransactionListRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efetivar modal state
  const [efetivarTransaction, setEfetivarTransaction] = useState<any>(null);
  const [isEfetivarModalOpen, setIsEfetivarModalOpen] = useState(false);

  // Edit modal state
  const [editModalTransaction, setEditModalTransaction] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete confirmation modal state
  const [deleteTransactionId, setDeleteTransactionId] = useState<number | null>(null);
  const [deleteTransactionDesc, setDeleteTransactionDesc] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  const handleEditTransaction = (transaction: any) => {
    setEditModalTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDeleteTransaction = (transactionId: number) => {
    const tx = monthlyTransactions.find((t: any) => t.id === transactionId);
    setDeleteTransactionId(transactionId);
    setDeleteTransactionDesc(tx?.descricao || '');
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteTransactionId) return;
    try {
      setIsSubmitting(true);
      const { error } = await transactionService.delete(deleteTransactionId.toString());
      if (error) throw new Error(error.message || 'Erro ao excluir');
      toast.success('Lancamento excluido');
      setIsDeleteModalOpen(false);
      setDeleteTransactionId(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir transacao:', error);
      toast.error(error.message || 'Erro ao excluir transacao');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opens EfetivarModal for any transaction type
  const handleOpenEfetivar = (transaction: any) => {
    setEfetivarTransaction(transaction);
    setIsEfetivarModalOpen(true);
  };

  // Process effectuation (full or partial) from EfetivarModal
  const handleEfetivarConfirm = async (transaction: any, data: EfetivarData) => {
    try {
      setIsSubmitting(true);
      const isVirtual = transaction.is_virtual_fixed || transaction.is_virtual || transaction.fatura_details?.is_virtual;
      const fixoId = transaction.fixed_transaction_id || transaction.fixo_id || transaction.fatura_details?.fixo_id;
      const valorOriginal = Number(transaction.valor);
      const valorChanged = data.valorRecebido !== valorOriginal;

      if (isVirtual && fixoId) {
        // Virtual fixed transaction: create real transaction linked to the fixed rule
        const createData: any = {
          descricao: transaction.descricao,
          valor: data.valorRecebido,
          data: data.dataRecebimento,
          tipo: transaction.tipo,
          categoria_id: transaction.categoria_id || transaction.categoria?.id,
          conta_id: transaction.conta_id || undefined,
          cartao_id: transaction.cartao_id || undefined,
          status: 'confirmado' as const,
          fixo_id: fixoId,
          origem: 'fixo',
        };
        await transactionService.create(createData);
      } else {
        // Regular transaction: update status + value if changed
        if (valorChanged) {
          await transactionService.update(String(transaction.id), { valor: data.valorRecebido, data: data.dataRecebimento });
        }
        await transactionService.updateStatus(String(transaction.id), 'confirmado');
      }

      // Create remainder transaction if partial AND user opted in
      if (data.isParcial && data.criarRestante && data.valorRestante && data.valorRestante > 0) {
        const remainderData: any = {
          descricao: transaction.descricao,
          valor: data.valorRestante,
          data: data.dataVencimentoRestante || data.dataRecebimento,
          tipo: transaction.tipo,
          categoria_id: transaction.categoria_id || transaction.categoria?.id,
          conta_id: transaction.conta_id || undefined,
          cartao_id: transaction.cartao_id || undefined,
          status: 'pendente' as const,
        };
        await transactionService.create(remainderData);
      }

      toast.success(data.isParcial ? 'Efetivacao parcial realizada!' : 'Lancamento efetivado!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao efetivar:', error);
      toast.error(error.message || 'Erro ao efetivar lancamento');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // === UNDO HANDLER (fixed + regular) ===

  const handleUndoTransaction = async (transactionId: number) => {
    if (!user) return;
    try {
      // Check if this is a fixed transaction by looking at monthlyTransactions
      const tx = monthlyTransactions.find((t: any) => t.id === transactionId);
      const isFixed = tx && (tx.origem === 'fixo' && tx.fixo_id);

      if (isFixed) {
        // Fixed transaction: delete the real record so the virtual reappears
        const { error } = await transactionService.delete(String(transactionId));
        if (error) throw new Error(error.message || 'Erro ao desfazer');
        toast.success('Efetivação desfeita!');
      } else {
        // Regular transaction: change status back to pendente
        await transactionService.updateStatus(String(transactionId), 'pendente');
        toast.success('Lançamento voltou para pendente');
      }
      loadData();
    } catch (error) {
      console.error('Erro ao desfazer:', error);
      toast.error('Erro ao desfazer efetivacao');
    }
  };

  // === DELETE FIXED VIRTUAL HANDLER ===

  const handleDeleteFixedVirtual = async (transaction: any, scope: 'this_month' | 'all') => {
    try {
      const fixoId = transaction.fixed_transaction_id || transaction.fixo_id || transaction.fatura_details?.fixo_id;
      if (!fixoId) {
        toast.error('Lancamento fixo nao identificado');
        return;
      }

      if (scope === 'all') {
        // Deactivate the fixed rule directly via supabase
        const { error } = await supabase
          .from('app_transacoes_fixas')
          .update({ ativo: false })
          .eq('id', fixoId)
          .eq('user_id', user!.id);
        if (error) throw error;
        toast.success('Lancamento fixo desativado');
      } else {
        // Create a confirmed+cancelled real transaction to block the virtual for this month
        const { error } = await supabase
          .from('app_transacoes')
          .insert({
            user_id: user!.id,
            descricao: transaction.descricao,
            valor: transaction.valor,
            data: transaction.data,
            tipo: transaction.tipo,
            categoria_id: transaction.categoria_id,
            conta_id: transaction.conta_id || null,
            cartao_id: transaction.cartao_id || null,
            status: 'cancelado',
            fixo_id: fixoId,
            origem: 'fixo',
          });
        if (error) throw error;
        toast.success('Lancamento cancelado para este mes');
      }
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir lancamento fixo:', error);
      toast.error(error.message || 'Erro ao excluir');
    }
  };

  // Handle save from TransactionEditModal (unified edit for all types)
  const handleEditModalSave = async (transaction: any, data: EditTransactionData) => {
    try {
      setIsSubmitting(true);
      const isVirtual = transaction.is_virtual_fixed || transaction.is_virtual || transaction.fatura_details?.is_virtual;
      const fixoId = transaction.fixed_transaction_id || transaction.fixo_id || transaction.fatura_details?.fixo_id;

      if (data.scope === 'from_now' && fixoId) {
        // Update the fixed rule (affects all future months)
        await fixedTransactionService.update(fixoId, {
          descricao: data.descricao,
          valor: data.valor,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id,
        });
        toast.success('Lancamento fixo atualizado para este mes em diante');
      } else if (data.scope === 'this_month' && isVirtual && fixoId) {
        // Virtual fixed: create a real transaction for this month only
        const createData: any = {
          descricao: data.descricao,
          valor: data.valor,
          data: data.data,
          tipo: transaction.tipo,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id || undefined,
          cartao_id: transaction.cartao_id || undefined,
          status: 'pendente' as const,
        };
        await transactionService.create(createData);
        toast.success('Lancamento ajustado para este mes');
      } else {
        // Regular transaction or confirmed fixed: update directly
        await transactionService.update(String(transaction.id), {
          descricao: data.descricao,
          valor: data.valor,
          data: data.data,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id,
        });
        toast.success('Lancamento atualizado');
      }

      await loadFixedTransactions();
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar edicao:', error);
      toast.error(error.message || 'Erro ao salvar alteracoes');
      throw error;
    } finally {
      setIsSubmitting(false);
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

  const handleQuickAccountChange = async (transactionId: number | string, newAccountId: number, isFixed: boolean, fixedId?: number) => {
    try {
      if (isFixed && fixedId) {
        await fixedTransactionService.update(fixedId, { conta_id: newAccountId });
        toast.success('Conta atualizada para todos os meses');
      } else {
        await transactionService.update(String(transactionId), { conta_id: newAccountId });
        toast.success('Conta atualizada');
      }
      loadData();
    } catch (error) {
      console.error('Erro ao alterar conta:', error);
      toast.error('Erro ao alterar conta');
    }
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
          onUndoFixedTransaction={handleUndoTransaction}
          onDeleteInvoice={handleDeleteInvoice}
          onInvoiceClick={handleInvoiceClick}
          onEfetivar={handleOpenEfetivar}
          onPayInvoice={handlePayInvoice}
          onDeleteFixedVirtual={handleDeleteFixedVirtual}
          onQuickAccountChange={handleQuickAccountChange}
          showFilters={true}
          defaultFilters={getDateFilters()}
          includeVirtualFixed={true}
          excludeCardTransactions={false}
          preloadedTransactions={monthlyTransactions}
          recurrenceFilter={recurrenceFilter}
        />
      </div>

      {/* Edit Transaction Modal (unified) */}
      <TransactionEditModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditModalTransaction(null); }}
        transaction={editModalTransaction}
        onSave={handleEditModalSave}
      />

      {/* Confirm Delete Transaction Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTransactionId(null); }}
        onConfirm={confirmDeleteTransaction}
        description={`Deseja excluir "${deleteTransactionDesc}"? Esta acao nao pode ser desfeita.`}
        isLoading={isSubmitting}
      />

      {/* Efetivar Modal */}
      <EfetivarModal
        isOpen={isEfetivarModalOpen}
        onClose={() => { setIsEfetivarModalOpen(false); setEfetivarTransaction(null); }}
        transaction={efetivarTransaction}
        onConfirm={handleEfetivarConfirm}
      />

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

    </div>
  );
}
