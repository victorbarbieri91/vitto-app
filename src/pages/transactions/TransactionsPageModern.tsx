import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTransactionModal } from '../../hooks/useTransactionModal';
import { TransactionList } from '../../components/transactions/TransactionList';
import MonthlyTransactionsList from '../../components/transactions/MonthlyTransactionsList';
import TransactionForm from '../../components/forms/TransactionForm';
import type { Transaction } from '../../services/api/AccountService';
import TransactionTypeSelector from '../../components/transactions/TransactionTypeSelector';
import { MonthNavigator, ModernButton } from '../../components/ui/modern';
import MonthlyTotals from '../../components/transactions/MonthlyTotals';
import { fixedTransactionService, FixedTransactionWithDetails } from '../../services/api/FixedTransactionService';
import { creditCardService, CreditCard } from '../../services/api/CreditCardService';
import transactionService, { TransactionWithDetails } from '../../services/api/TransactionService';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Edit2, Trash2, Power, PowerOff, CreditCard as CreditCardIcon, Settings, Tag, XCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../store/AuthContext';
import { useTransactionContext } from '../../store/TransactionContext';
import InvoiceCard, { InvoiceTransaction } from '../../components/cards/InvoiceCard';
import InvoicePaymentModal from '../../components/cards/InvoicePaymentModal';
import ConfirmDeleteInvoiceModal from '../../components/modals/ConfirmDeleteInvoiceModal';
import CreditCardSelector from '../../components/transactions/CreditCardSelector';
import { getInvoicePeriodFilter } from '../../utils/invoicePeriod';
import { toast } from 'react-hot-toast';
import { useCategories } from '../../hooks/useCategories';
import CurrencyInput from '../../components/ui/CurrencyInput';

type TabType = 'month' | 'fixed' | 'cards';

export default function TransactionsPageModern() {
  const { user } = useAuth();
  const { onTransactionChange } = useTransactionContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { openModal, TransactionModalComponent, transactionListRef } = useTransactionModal();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('month');

  // Estado para faturas consolidadas
  const [consolidatedInvoices, setConsolidatedInvoices] = useState<any[]>([]);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] = useState<any>(null);
  const [isDeleteInvoiceModalOpen, setIsDeleteInvoiceModalOpen] = useState(false);

  // Monthly transactions state (from dashboard)
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Fixed transactions state
  const [fixedTransactions, setFixedTransactions] = useState<FixedTransactionWithDetails[]>([]);
  const [fixedStats, setFixedStats] = useState({
    total_ativo: 0,
    total_inativo: 0,
    receita_mensal_fixa: 0,
    despesa_mensal_fixa: 0,
    fluxo_mensal_fixo: 0
  });
  const [fixedFilter, setFixedFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Point adjustment modal state
  const [adjustmentTransaction, setAdjustmentTransaction] = useState<FixedTransactionWithDetails | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentValue, setAdjustmentValue] = useState<number | undefined>(undefined);

  // Edit fixed transaction modal state
  const [editingFixedTransaction, setEditingFixedTransaction] = useState<FixedTransactionWithDetails | null>(null);
  const [isEditFixedModalOpen, setIsEditFixedModalOpen] = useState(false);

  // Categories hook
  const { categories } = useCategories();

  // Credit card transactions state
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [cardTransactions, setCardTransactions] = useState<TransactionWithDetails[]>([]);
  const [cardStats, setCardStats] = useState({
    total_transacoes: 0,
    valor_total: 0
  });
  const [cardMonth, setCardMonth] = useState(new Date().getMonth() + 1);
  const [cardYear, setCardYear] = useState(new Date().getFullYear());
  const [invoiceValues, setInvoiceValues] = useState<{ [cardId: number]: number }>({});
  // Estado para transações da fatura do cartão selecionado
  const [cardInvoiceTransactions, setCardInvoiceTransactions] = useState<InvoiceTransaction[]>([]);
  const [cardInvoiceLoading, setCardInvoiceLoading] = useState(false);
  const [selectedCardInvoiceId, setSelectedCardInvoiceId] = useState<number | null>(null);

  // Estado para edição de categoria inline
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  // Estado para paginação da lista de lançamentos
  const [invoicePage, setInvoicePage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Month navigation state
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  // Resetar página quando mudar cartão ou mês
  useEffect(() => {
    setInvoicePage(1);
  }, [selectedCardId, currentMonth, currentYear]);

  // Category filter state (from pie chart click)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Processar query params na inicialização
  useEffect(() => {
    const type = searchParams.get('type');
    const cardId = searchParams.get('card_id');
    const month = searchParams.get('month');
    const categoria = searchParams.get('categoria');

    if (type === 'cartao') {
      setActiveTab('cards');
      if (cardId) {
        setSelectedCardId(parseInt(cardId));
      }
    }

    if (month) {
      const [monthNum, yearNum] = month.split('-');
      if (monthNum && yearNum) {
        setCurrentMonth(parseInt(monthNum));
        setCurrentYear(parseInt(yearNum));
      }
    }

    // Set category filter from URL
    if (categoria) {
      setCategoryFilter(categoria);
    } else {
      setCategoryFilter(null);
    }
  }, [searchParams]);

  // Clear category filter
  const clearCategoryFilter = () => {
    setCategoryFilter(null);
    navigate('/lancamentos');
  };

  // Monthly totals state
  const [monthlyTotals, setMonthlyTotals] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoLiquido: 0,
    totalTransacoes: 0,
    isLoading: false
  });

  // Handle month navigation
  const handleMonthChange = (month: number, year: number) => {
    console.log(`🗓️ Month change requested: ${currentMonth}/${currentYear} → ${month}/${year}`);

    setCurrentMonth(month);
    setCurrentYear(year);

    // Immediate refresh (remove setTimeout that may cause confusion)
    transactionListRef.current?.fetchTransactions();
  };

  // Generate date filters for current month
  const getDateFilters = () => {
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
    const filters: any = { startDate, endDate };

    // Add category filter if present
    if (categoryFilter) {
      filters.categoria_id = categoryFilter;
    }

    return filters;
  };

  // Get invoice period filters for credit card transactions
  const getInvoiceDateFilters = (cardId: number) => {
    const selectedCard = creditCards.find(card => card.id === cardId);
    if (!selectedCard) {
      return getDateFilters(); // Fallback to regular month filters
    }

    const period = getInvoicePeriodFilter(selectedCard, currentMonth, currentYear);
    return {
      startDate: period.startDate,
      endDate: period.endDate
    };
  };

  // Validate monthly totals for consistency
  const validateMonthlyTotals = (totals: any, source: string) => {
    const { totalReceitas, totalDespesas, saldoLiquido, totalTransacoes } = totals;

    // Basic validation
    if (isNaN(totalReceitas) || isNaN(totalDespesas) || isNaN(saldoLiquido)) {
      console.warn(`⚠️ [${source}] Invalid numeric values detected:`, totals);
      return false;
    }

    // Logical validation (allowing small floating point differences)
    const expectedBalance = totalReceitas - totalDespesas;
    const balanceDiff = Math.abs(saldoLiquido - expectedBalance);

    if (balanceDiff > 0.01) {
      console.warn(`⚠️ [${source}] Balance calculation mismatch:`, {
        expected: expectedBalance,
        actual: saldoLiquido,
        difference: balanceDiff
      });
    }

    console.log(`✅ [${source}] Totals validated:`, {
      receitas: `R$ ${totalReceitas.toFixed(2)}`,
      despesas: `R$ ${totalDespesas.toFixed(2)}`,
      saldo: `R$ ${saldoLiquido.toFixed(2)}`,
      transacoes: totalTransacoes
    });

    return true;
  };

  // Load monthly transactions from dashboard
  const loadMonthlyTransactions = async () => {
    if (!user) return;

    setMonthlyLoading(true);
    try {
      const { data, error } = await supabase.rpc('obter_dashboard_mes', {
        p_user_id: user.id,
        p_mes: currentMonth,
        p_ano: currentYear
      });

      if (error) throw error;

      const transactions = data?.transacoes_mes || [];
      setMonthlyTransactions(transactions);

      // Extract totals from dashboard data (unified source)
      const indicadores = data?.indicadores_mes || {};
      const totalReceitas = Number(indicadores.total_receitas_mes) || 0;
      const totalDespesas = Number(indicadores.total_despesas_mes) || 0;
      const saldoLiquido = Number(indicadores.economia_mes) || 0; // Use economia_mes for accurate balance
      const totalTransacoes = transactions.length || 0;

      const newTotals = {
        totalReceitas,
        totalDespesas,
        saldoLiquido,
        totalTransacoes,
        isLoading: false
      };

      // Validate totals before setting state
      validateMonthlyTotals(newTotals, 'loadMonthlyTransactions');

      setMonthlyTotals(newTotals);
    } catch (error) {
      console.error('Erro ao carregar transações mensais:', error);
      setMonthlyTransactions([]);
      setMonthlyTotals(prev => ({ ...prev, isLoading: false }));
    } finally {
      setMonthlyLoading(false);
    }
  };

  // Carregar transações consolidadas com faturas integradas
  const loadConsolidatedTransactions = async () => {
    if (!user) return;

    console.log('🔍 loadConsolidatedTransactions called for', { currentMonth, currentYear, activeTab });

    try {
      console.log('🔍 Calling obter_transacoes_mes_atual with params:', {
        p_user_id: user.id,
        p_mes: currentMonth,
        p_ano: currentYear
      });

      const { data, error } = await supabase.rpc('obter_transacoes_mes_atual', {
        p_user_id: user.id,
        p_mes: currentMonth,
        p_ano: currentYear
      });

      if (error) throw error;

      console.log('🔍 obter_transacoes_mes_atual returned data:', data);

      // Consolidar todas as transações (incluindo faturas) em uma lista única
      const allTransactions = data || [];

      console.log('🔍 All consolidated transactions:', {
        total: allTransactions.length,
        transactions: allTransactions
      });

      // As faturas agora aparecem como lançamentos normais na lista
      setMonthlyTransactions(allTransactions);
      // Limpar faturas separadas
      setConsolidatedInvoices([]);

      // Recalcular totais incluindo todas as transações
      let totalReceitas = 0;
      let totalDespesas = 0;

      allTransactions.forEach((t: any) => {
        if (t.tipo === 'receita') {
          totalReceitas += Number(t.valor);
        } else if (t.tipo === 'despesa' || t.tipo === 'despesa_cartao' || t.is_fatura) {
          // Faturas não pagas são contabilizadas como despesas
          if (t.is_fatura && t.status === 'paga') {
            // Fatura paga não conta como despesa pendente
          } else {
            totalDespesas += Number(t.valor);
          }
        }
      });

      setMonthlyTotals({
        totalReceitas,
        totalDespesas,
        saldoLiquido: totalReceitas - totalDespesas,
        totalTransacoes: allTransactions.length,
        isLoading: false
      });
    } catch (error) {
      console.error('Erro ao carregar transações consolidadas:', error);
    }
  };

  // Carregar transações de uma fatura específica
  const loadInvoiceTransactions = async (faturaId: string): Promise<InvoiceTransaction[]> => {
    try {
      const { data, error } = await supabase.rpc('obter_transacoes_fatura', {
        p_fatura_id: parseInt(faturaId)
      });

      if (error) throw error;

      // Buscar IDs únicos de categorias para carregar os dados
      const categoryIds = [...new Set(data?.map((t: any) => t.categoria_id).filter(Boolean))];

      // Buscar dados das categorias do banco
      let categoriesMap: Record<number, { id: number; nome: string; cor: string; icone: string }> = {};
      if (categoryIds.length > 0) {
        const { data: catData } = await supabase
          .from('app_categoria')
          .select('id, nome, cor, icone')
          .in('id', categoryIds);

        if (catData) {
          categoriesMap = catData.reduce((acc, cat) => {
            acc[cat.id] = cat;
            return acc;
          }, {} as Record<number, any>);
        }
      }

      return data?.map((t: any) => {
        const catId = t.categoria_id ? Number(t.categoria_id) : undefined;
        const foundCategory = catId ? categoriesMap[catId] : undefined;

        return {
          id: Number(t.id),
          descricao: t.descricao,
          valor: Number(t.valor),
          data: t.data,
          categoria_id: catId,
          categoria: foundCategory ? {
            id: foundCategory.id,
            nome: foundCategory.nome,
            cor: foundCategory.cor || '#6B7280',
            icone: foundCategory.icone || 'default'
          } : undefined,
          parcela_atual: t.parcela_atual,
          total_parcelas: t.total_parcelas,
          observacoes: t.observacoes,
          is_fixed: t.is_fixed || false,
          fixo_id: t.fixo_id
        };
      }) || [];
    } catch (error) {
      console.error('Erro ao carregar transações da fatura:', error);
      return [];
    }
  };

  // Abrir modal de pagamento de fatura
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

  // Calculate monthly totals usando dados híbridos
  const calculateMonthlyTotals = async () => {
    if (!user) return;

    setMonthlyTotals(prev => ({ ...prev, isLoading: true }));

    try {
      console.log(`🔄 Calculando totais para ${currentMonth}/${currentYear} usando dados do dashboard`);

      const { data, error } = await supabase.rpc('obter_dashboard_mes', {
        p_user_id: user.id,
        p_mes: currentMonth,
        p_ano: currentYear
      });

      if (error) throw error;

      // ✅ EXTRAIR TOTAIS PRÉ-CALCULADOS DO DASHBOARD
      const indicadores = data?.indicadores_mes || {};
      const transacoes = data?.transacoes_mes || [];

      const totalReceitas = Number(indicadores.total_receitas_mes) || 0;
      const totalDespesas = Number(indicadores.total_despesas_mes) || 0;
      const saldoLiquido = Number(indicadores.economia_mes) || 0;
      const totalTransacoes = transacoes.length || 0;

      const newTotals = {
        totalReceitas,
        totalDespesas,
        saldoLiquido,
        totalTransacoes,
        isLoading: false
      };

      // Validate totals before setting state
      validateMonthlyTotals(newTotals, 'calculateMonthlyTotals');

      setMonthlyTotals(newTotals);
    } catch (error) {
      console.error('Erro ao calcular totais mensais:', error);
      setMonthlyTotals(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsAddModalOpen(true);
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    try {
      setIsSubmitting(true);
      const { error } = await transactionService.delete(transactionId.toString());

      if (error) {
        throw new Error(error.message || 'Erro ao excluir transação');
      }

      // Refresh the transaction list
      transactionListRef.current?.fetchTransactions();

      // Show success message
      console.log('Transação excluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error);
      alert(error.message || 'Erro ao excluir transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle activating a transaction (change status from pendente to confirmado)
  const handleActivateTransaction = async (transactionId: number) => {
    try {
      setIsSubmitting(true);
      const { error } = await transactionService.updateStatus(transactionId.toString(), 'confirmado');
      if (error) {
        throw new Error(error.message || 'Erro ao efetivar transação');
      }

      // Show success message
      toast.success('Transação efetivada com sucesso!');

      // Refresh the transaction list
      transactionListRef.current?.fetchTransactions();
      console.log('Transação efetivada com sucesso');
    } catch (error: any) {
      console.error('Erro ao efetivar transação:', error);
      toast.error(error.message || 'Erro ao efetivar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle confirming a virtual fixed transaction
  const handleConfirmFixedTransaction = async (fixedTransactionId: number, targetDate: string) => {
    setIsSubmitting(true);
    try {
      console.log(`Confirmando transação fixa ID: ${fixedTransactionId} para a data: ${targetDate}`);

      const result = await transactionService.confirmVirtualFixedTransaction(fixedTransactionId, targetDate);

      if (result.error) {
        throw new Error(result.error.message || 'Erro ao confirmar transação fixa');
      }

      toast.success('Lançamento confirmado com sucesso!');
      // Refresh the transaction list to show the new confirmed transaction
      transactionListRef.current?.fetchTransactions();

      // Update monthly data
      loadMonthlyTransactions(); // Now loads both transactions and totals
      loadConsolidatedTransactions();

      console.log('Transação fixa confirmada com sucesso:', result.data);
    } catch (error: any) {
      console.error('Erro ao confirmar transação fixa:', error);
      toast.error(error.message || 'Erro ao confirmar transação fixa');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle partial fixed transaction
  const handlePartialFixedTransaction = async (fixedTransactionId: number, targetDate: string) => {
    // Por enquanto, apenas mostrar mensagem
    toast.info('Funcionalidade de recebimento parcial em desenvolvimento');
  };

  // Handle invoice deletion
  const handleDeleteInvoice = (transaction: any) => {
    // Extrair detalhes da fatura
    const faturaDetails = transaction.fatura_details || {};
    setSelectedInvoiceForDelete({
      id: transaction.id,
      cartaoNome: faturaDetails.cartao_nome || 'Cartão',
      mes: faturaDetails.mes || currentMonth,
      ano: faturaDetails.ano || currentYear,
      valor: transaction.valor || 0
    });
    setIsDeleteInvoiceModalOpen(true);
  };

  // Handle undo fixed transaction
  const handleUndoFixedTransaction = async (transactionId: number) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('desfazer_confirmacao_lancamento_fixo', {
        p_transacao_id: transactionId,
        p_user_id: user.id
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `Confirmação de "${data.details.fixo_descricao}" desfeita com sucesso! O lançamento voltou ao estado pendente.`
        );
        // Reload transactions
        transactionListRef.current?.fetchTransactions();
        loadMonthlyTransactions(); // Now loads both transactions and totals
        loadConsolidatedTransactions();
      } else {
        toast.error(data.error || 'Erro ao desfazer confirmação');
      }
    } catch (error) {
      console.error('Erro ao desfazer confirmação:', error);
      toast.error('Erro ao desfazer confirmação');
    }
  };

  // Handle edit fixed transaction - abre modal de edição
  const handleEditFixedTransaction = async (fixedTransactionId: number) => {
    try {
      console.log(`Editando lançamento fixo ID: ${fixedTransactionId}`);

      // Buscar dados do lançamento fixo para edição
      const fixedTransaction = fixedTransactions.find(t => t.id === fixedTransactionId);

      if (fixedTransaction) {
        setEditingFixedTransaction(fixedTransaction);
        setIsEditFixedModalOpen(true);
      } else {
        // Se não encontrar na lista, buscar do servidor
        const transaction = await fixedTransactionService.getById(fixedTransactionId) as FixedTransactionWithDetails | null;
        if (transaction) {
          setEditingFixedTransaction(transaction as FixedTransactionWithDetails);
          setIsEditFixedModalOpen(true);
        } else {
          toast.error('Lançamento fixo não encontrado');
        }
      }
    } catch (error) {
      console.error('Erro ao editar lançamento fixo:', error);
      toast.error('Erro ao abrir editor do lançamento fixo');
    }
  };

  // Handle close edit fixed modal
  const handleCloseEditFixedModal = () => {
    setIsEditFixedModalOpen(false);
    setEditingFixedTransaction(null);
  };

  // Handle save edited fixed transaction
  const handleSaveEditedFixedTransaction = async (data: any) => {
    if (!editingFixedTransaction) return;

    try {
      await fixedTransactionService.update(editingFixedTransaction.id, data);
      toast.success('Lançamento fixo atualizado com sucesso!');
      await loadFixedTransactions();
      handleCloseEditFixedModal();
      // Atualizar também a lista de transações do mês
      transactionListRef.current?.fetchTransactions();
    } catch (error) {
      console.error('Erro ao atualizar lançamento fixo:', error);
      toast.error('Erro ao atualizar lançamento fixo');
    }
  };

  // Handle point adjustment
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

  // Handle save point adjustment
  const handleSaveAdjustment = async () => {
    if (!adjustmentTransaction || adjustmentValue === undefined) return;

    try {
      // Criar uma transação real com o valor ajustado para o mês atual
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
          observacoes: `Ajuste pontual: valor original R$ ${Number(adjustmentTransaction.valor).toFixed(2)} → R$ ${adjustmentValue.toFixed(2)}`
        });

      if (error) throw error;

      toast.success('Ajuste pontual criado com sucesso!');
      handleCloseAdjustmentModal();
      // Recarregar dados
      loadMonthlyTransactions();
      loadConsolidatedTransactions();
      transactionListRef.current?.fetchTransactions();
    } catch (error) {
      console.error('Erro ao criar ajuste pontual:', error);
      toast.error('Erro ao criar ajuste pontual');
    }
  };

  // Confirm invoice deletion
  const confirmDeleteInvoice = async () => {
    if (!selectedInvoiceForDelete || !user) return;

    try {
      const { data, error } = await supabase.rpc('excluir_fatura_completa', {
        p_fatura_id: selectedInvoiceForDelete.id,
        p_user_id: user.id
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `Fatura de ${selectedInvoiceForDelete.cartaoNome} excluída com sucesso! ${data.details.transacoes_deletadas} transações foram removidas.`
        );
        // Reload transactions
        transactionListRef.current?.fetchTransactions();
        loadMonthlyTransactions(); // Now loads both transactions and totals
        loadConsolidatedTransactions();
      } else {
        toast.error(data.error || 'Erro ao excluir fatura');
      }
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      toast.error('Erro ao excluir fatura');
    } finally {
      setIsDeleteInvoiceModalOpen(false);
      setSelectedInvoiceForDelete(null);
    }
  };

  const handleSelectTransactionType = (type: 'receita' | 'despesa' | 'despesa_cartao') => {
    console.log(`Tipo de transação selecionado: ${type}`);
    setEditingTransaction(null);
    setIsAddModalOpen(false);
    openModal(type);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  const handleTransactionSaved = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      // Esta função é apenas para o formulário de edição antigo
      console.log('Salvando transação editada:', data);
      handleCloseModal();
      transactionListRef.current?.fetchTransactions();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar categoria de uma transação da fatura
  const handleUpdateTransactionCategory = async (transactionId: number, newCategoryId: number) => {
    try {
      const { error } = await supabase
        .from('app_transacoes')
        .update({ categoria_id: newCategoryId })
        .eq('id', transactionId);

      if (error) throw error;

      // Buscar a categoria atualizada para mostrar no UI
      const foundCategory = categories.find(c => c.id === newCategoryId);
      const newCategory = foundCategory ? {
        id: foundCategory.id,
        nome: foundCategory.nome,
        cor: foundCategory.cor || '#6B7280',
        icone: foundCategory.icone || 'default'
      } : undefined;

      // Atualizar estado local
      setCardInvoiceTransactions(prev =>
        prev.map(t =>
          t.id === transactionId
            ? { ...t, categoria: newCategory, categoria_id: newCategoryId }
            : t
        )
      );

      toast.success('Categoria atualizada!');
      setEditingCategoryId(null);
      onTransactionChange?.();
    } catch (err: any) {
      console.error('Erro ao atualizar categoria:', err);
      toast.error('Erro ao atualizar categoria');
    }
  };

  // Atualizar a lista quando o modal for fechado ou o mês mudar
  useEffect(() => {
    transactionListRef.current?.fetchTransactions();
  }, []);

  // Update list when month changes
  useEffect(() => {
    console.log(`🔄 useEffect triggered for month change: ${currentMonth}/${currentYear}, tab: ${activeTab}`);

    // Always load monthly data (for totals) regardless of tab
    loadMonthlyTransactions();

    // Refresh transaction list
    if (transactionListRef.current) {
      transactionListRef.current.fetchTransactions();
    }

    // Load tab-specific data
    if (activeTab === 'month') {
      loadConsolidatedTransactions();
    } else if (activeTab === 'cards' && creditCards.length > 0) {
      // Reload invoice values when month changes
      loadInvoiceValues(creditCards);
    }
  }, [currentMonth, currentYear, activeTab]);

  // Load card invoice transactions when card or month changes
  useEffect(() => {
    if (activeTab === 'cards' && selectedCardId) {
      loadCardInvoiceTransactions(selectedCardId);
    }
  }, [selectedCardId, currentMonth, currentYear, activeTab]);

  // Load data on initial load
  useEffect(() => {
    loadMonthlyTransactions(); // Now loads both transactions and totals
    if (activeTab === 'month') {
      loadConsolidatedTransactions();
    } else if (activeTab === 'fixed') {
      loadFixedTransactions();
    } else if (activeTab === 'cards') {
      loadCreditCards();
    }
  }, [activeTab]);

  // Listen for global transaction changes (from context)
  useEffect(() => {
    const unsubscribe = onTransactionChange((event) => {
      console.log('[TransactionsPage] Recebeu notificação de mudança:', event);

      // Recarregar dados baseado na aba ativa
      if (activeTab === 'month') {
        loadMonthlyTransactions();
        loadConsolidatedTransactions();
      } else if (activeTab === 'fixed' || event.transactionType === 'fixed') {
        loadFixedTransactions();
      } else if (activeTab === 'cards') {
        loadCreditCards();
        if (selectedCardId) {
          loadCardInvoiceTransactions(selectedCardId);
        }
      }
    });

    return () => unsubscribe();
  }, [onTransactionChange, activeTab, selectedCardId]);

  // Load fixed transactions data
  const loadFixedTransactions = async () => {
    try {
      const [transactionsData, statsData] = await Promise.all([
        fixedTransactionService.list(),
        fixedTransactionService.getStats()
      ]);

      setFixedTransactions(transactionsData);
      setFixedStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar transações fixas:', error);
    }
  };

  // Handle fixed transaction actions
  const handleToggleFixedStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fixedTransactionService.toggle(id, !currentStatus);
      await loadFixedTransactions();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status da transação');
    }
  };

  const handleDeleteFixedTransaction = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação fixa?')) return;

    try {
      await fixedTransactionService.delete(id);
      await loadFixedTransactions();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir transação fixa');
    }
  };

  // Filter fixed transactions
  const filteredFixedTransactions = fixedTransactions.filter(transaction => {
    if (fixedFilter === 'all') return true;
    if (fixedFilter === 'active') return transaction.ativo;
    if (fixedFilter === 'inactive') return !transaction.ativo;
    return true;
  });

  // Load credit cards
  const loadCreditCards = async () => {
    try {
      const cards = await creditCardService.list();
      setCreditCards(cards);
      if (cards.length > 0 && !selectedCardId) {
        setSelectedCardId(cards[0].id);
      }

      // Load invoice values for each card
      await loadInvoiceValues(cards);
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
    }
  };

  // Load invoice values for credit cards (incluindo transações fixas)
  const loadInvoiceValues = async (cards: CreditCard[]) => {
    if (!user || !cards.length) return;

    try {
      const invoicePromises = cards.map(async (card) => {
        console.log(`💳 Loading invoice for card ${card.nome} (ID: ${card.id})`);

        // Usar função do banco que calcula valor incluindo transações fixas
        const { data, error } = await supabase.rpc('calcular_valor_fatura_periodo', {
          p_cartao_id: card.id,
          p_mes: currentMonth,
          p_ano: currentYear
        });

        if (error) {
          console.error(`❌ Error calculating invoice for card ${card.id}:`, error);
          // Fallback: buscar apenas transações reais
          const period = getInvoicePeriodFilter(card, currentMonth, currentYear);
          const { data: fallbackData } = await supabase
            .from('app_transacoes')
            .select('valor')
            .eq('user_id', user.id)
            .eq('tipo', 'despesa_cartao')
            .eq('cartao_id', card.id)
            .gte('data', period.startDate)
            .lte('data', period.endDate);

          const fallbackTotal = (fallbackData || []).reduce((sum: number, t: any) => sum + Number(t.valor), 0);
          return { cardId: card.id, value: fallbackTotal };
        }

        const totalValue = Number(data) || 0;
        console.log(`💰 Total value for ${card.nome} (incl. fixas): R$${totalValue}`);

        return { cardId: card.id, value: totalValue };
      });

      const results = await Promise.all(invoicePromises);
      const invoiceMap = results.reduce((acc, { cardId, value }) => {
        acc[cardId] = value;
        return acc;
      }, {} as { [cardId: number]: number });

      console.log('🎯 Final invoice values map:', invoiceMap);
      setInvoiceValues(invoiceMap);
    } catch (error) {
      console.error('Erro ao carregar valores das faturas:', error);
    }
  };

  // Load invoice transactions for selected card (usando RPC que inclui transações fixas)
  const loadCardInvoiceTransactions = async (cardId: number) => {
    if (!user) return;

    setCardInvoiceLoading(true);
    try {
      console.log(`📋 Loading invoice transactions for card ${cardId}, month ${currentMonth}/${currentYear}`);

      // Primeiro, buscar ou criar a fatura do cartão/mês/ano
      const { data: faturaData, error: faturaError } = await supabase.rpc('criar_fatura_se_nao_existe', {
        p_cartao_id: cardId,
        p_mes: currentMonth,
        p_ano: currentYear
      });

      if (faturaError) {
        console.error('❌ Erro ao buscar/criar fatura:', faturaError);
        setCardInvoiceTransactions([]);
        return;
      }

      const faturaId = faturaData;
      console.log(`✅ Fatura ID: ${faturaId}`);
      setSelectedCardInvoiceId(faturaId);

      if (!faturaId) {
        console.log('⚠️ Nenhuma fatura encontrada para este cartão/mês');
        setCardInvoiceTransactions([]);
        return;
      }

      // Carregar transações usando a função existente que já usa obter_transacoes_fatura
      const transactions = await loadInvoiceTransactions(faturaId.toString());
      console.log(`📦 Loaded ${transactions.length} transactions for invoice ${faturaId}`);
      setCardInvoiceTransactions(transactions);
    } catch (error) {
      console.error('❌ Erro ao carregar transações da fatura:', error);
      setCardInvoiceTransactions([]);
    } finally {
      setCardInvoiceLoading(false);
    }
  };

  // Load card transactions
  const loadCardTransactions = async () => {
    if (!selectedCardId) return;

    try {
      const { data } = await transactionService.listByCardAndMonth(
        selectedCardId.toString(),
        cardYear,
        cardMonth
      );

      const transactions = data || [];
      setCardTransactions(transactions);

      // Calcular estatísticas
      const totalTransacoes = transactions.length;
      const valorTotal = transactions.reduce((sum, t) => sum + Number(t.valor), 0);

      setCardStats({
        total_transacoes: totalTransacoes,
        valor_total: valorTotal
      });
    } catch (error) {
      console.error('Erro ao carregar transações do cartão:', error);
    }
  };

  // Effect to load card transactions when card or month changes
  useEffect(() => {
    if (activeTab === 'cards' && selectedCardId) {
      loadCardTransactions();
    }
  }, [selectedCardId, cardMonth, cardYear, activeTab]);

  // Handle card month change
  const handleCardMonthChange = (month: number, year: number) => {
    setCardMonth(month);
    setCardYear(year);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Get transaction type helpers
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'receita':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'despesa':
      case 'despesa_cartao':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'receita':
        return 'text-emerald-600';
      case 'despesa':
      case 'despesa_cartao':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'receita':
        return 'Receita';
      case 'despesa':
        return 'Despesa';
      case 'despesa_cartao':
        return 'Cartão';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center relative">
        <div>
          <div className="h-8"></div>
          <div className="h-5"></div>
        </div>
        <TransactionTypeSelector onSelect={handleSelectTransactionType} />
      </div>

      {/* Navegação por Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('month')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'month'
                ? 'border-coral-500 text-coral-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            Mês Atual
          </button>
          <button
            onClick={() => setActiveTab('fixed')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'fixed'
                ? 'border-coral-500 text-coral-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            Transações Fixas
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={cn(
              'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'cards'
                ? 'border-coral-500 text-coral-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            Faturas dos Cartões
          </button>
        </nav>
      </div>

      {/* Conteúdo baseado na tab ativa */}
      {activeTab === 'month' && (
        <div className="space-y-4">
          {/* Indicativo de Saldo Fixo */}
          <div className="flex justify-center">
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
              <span className="text-sm text-slate-600">Saldo do Período:</span>
              <span className={cn(
                "text-lg font-bold",
                monthlyTotals.saldoLiquido >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {formatCurrency(monthlyTotals.saldoLiquido)}
              </span>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex justify-center">
            <MonthNavigator
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={handleMonthChange}
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

          {/* Lista de transações do mês */}
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
              showFilters={true}
              defaultFilters={getDateFilters()}
              includeVirtualFixed={true}
              excludeCardTransactions={false}
              preloadedTransactions={monthlyTransactions}
            />
          </div>
        </div>
      )}

      {activeTab === 'fixed' && (
        <div className="space-y-4">
          {/* Métricas resumidas para transações fixas */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Receitas Fixas</div>
              <div className="text-xl font-bold text-emerald-600">
                {formatCurrency(fixedStats.receita_mensal_fixa)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-600 mb-1">Despesas Fixas</div>
              <div className="text-xl font-bold text-red-600">
                {formatCurrency(fixedStats.despesa_mensal_fixa)}
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 justify-center">
            <ModernButton
              variant={fixedFilter === 'active' ? 'primary' : 'outline'}
              onClick={() => setFixedFilter('active')}
              size="sm"
            >
              Ativas ({fixedStats.total_ativo})
            </ModernButton>
            <ModernButton
              variant={fixedFilter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFixedFilter('all')}
              size="sm"
            >
              Todas ({fixedTransactions.length})
            </ModernButton>
            <ModernButton
              variant={fixedFilter === 'inactive' ? 'primary' : 'outline'}
              onClick={() => setFixedFilter('inactive')}
              size="sm"
            >
              Inativas ({fixedStats.total_inativo})
            </ModernButton>
          </div>

          {/* Lista de Transações Fixas - Estilo Extrato Compacto */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {filteredFixedTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-medium text-slate-600 mb-1">
                  Nenhuma transação fixa encontrada
                </h3>
                <p className="text-slate-500 text-sm mb-3">
                  Crie sua primeira transação fixa.
                </p>
                <ModernButton onClick={() => openModal('receita')} size="sm">
                  Criar Transação Fixa
                </ModernButton>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredFixedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors",
                      !transaction.ativo && "bg-slate-50/50 opacity-70"
                    )}
                  >
                    {/* Coluna esquerda: Ícone + Info */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        transaction.tipo === 'receita' ? "bg-emerald-100" : "bg-red-100"
                      )}>
                        {getTypeIcon(transaction.tipo)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-medium truncate",
                            transaction.ativo ? "text-slate-800" : "text-slate-500"
                          )}>
                            {transaction.descricao}
                          </span>
                          {!transaction.ativo && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">
                              Inativa
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>Dia {transaction.dia_mes}</span>
                          {transaction.categoria_nome && (
                            <>
                              <span>•</span>
                              <span className="truncate">{transaction.categoria_nome}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coluna direita: Valor + Ações */}
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-semibold whitespace-nowrap",
                        transaction.tipo === 'receita' ? "text-emerald-600" : "text-red-600",
                        !transaction.ativo && "opacity-50"
                      )}>
                        {formatCurrency(Number(transaction.valor))}
                      </span>

                      {/* Ações compactas */}
                      <div className="flex items-center">
                        <button
                          onClick={() => handleToggleFixedStatus(transaction.id, transaction.ativo)}
                          className={cn(
                            "p-1.5 rounded hover:bg-slate-200 transition-colors",
                            transaction.ativo ? "text-emerald-600" : "text-slate-400"
                          )}
                          title={transaction.ativo ? "Desativar" : "Ativar"}
                        >
                          {transaction.ativo ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handlePointAdjustment(transaction)}
                          className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Ajuste pontual"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingFixedTransaction(transaction);
                            setIsEditFixedModalOpen(true);
                          }}
                          className="p-1.5 rounded text-slate-600 hover:bg-slate-200 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFixedTransaction(transaction.id)}
                          className="p-1.5 rounded text-red-600 hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'cards' && (
        <div className="space-y-6 pb-8">
          {/* Credit Card Selector */}
          <CreditCardSelector
            cards={creditCards}
            selectedCardId={selectedCardId}
            onCardSelect={setSelectedCardId}
            invoiceValues={invoiceValues}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />

          {/* Month Navigation */}
          <div className="flex justify-center">
            <MonthNavigator
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={handleMonthChange}
            />
          </div>

          {/* Transações da Fatura do Cartão Selecionado */}
          {selectedCardId && (() => {
            const totalItems = cardInvoiceTransactions.length;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            const startIndex = (invoicePage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const paginatedTransactions = cardInvoiceTransactions.slice(startIndex, endIndex);
            const despesaCategories = categories.filter(c => c.tipo === 'despesa');

            const formatDate = (dateString: string) => {
              return new Date(dateString).toLocaleDateString('pt-BR');
            };
            const formatCurrency = (value: number) => {
              return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(value);
            };

            return (
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-8">
                {/* Cabeçalho leve */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-deep-blue">Lançamentos da Fatura</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{totalItems} itens • Clique na categoria para editar</p>
                </div>

                {/* Tabela compacta */}
                {cardInvoiceLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-coral-500 border-t-transparent" />
                  </div>
                ) : totalItems > 0 ? (
                  <>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-4 pt-4 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-20">Data</th>
                          <th className="px-4 pt-4 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Descrição</th>
                          <th className="px-4 pt-4 pb-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-48">Categoria</th>
                          <th className="px-4 pt-4 pb-2 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-28">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedTransactions.map((transaction) => {
                          const isEditingThisCategory = editingCategoryId === transaction.id;
                          const dateCompact = new Date(transaction.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                          return (
                            <tr key={transaction.id} className="hover:bg-slate-50/50 transition-colors">
                              {/* Data */}
                              <td className="px-4 py-1.5 text-xs text-slate-500 tabular-nums">
                                {dateCompact}
                              </td>

                              {/* Descrição */}
                              <td className="px-4 py-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-slate-700">{transaction.descricao}</span>
                                  {transaction.parcela_atual && transaction.total_parcelas && (
                                    <span className="text-[9px] text-purple-600 bg-purple-50 px-1 py-0.5 rounded font-medium">
                                      {transaction.parcela_atual}/{transaction.total_parcelas}
                                    </span>
                                  )}
                                  {transaction.is_fixed && (
                                    <span className="text-[9px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-medium">
                                      Fixa
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Categoria - Clicável */}
                              <td className="px-4 py-1.5 relative">
                                <button
                                  onClick={() => setEditingCategoryId(isEditingThisCategory ? null : transaction.id)}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs transition-all",
                                    "hover:bg-slate-100 cursor-pointer",
                                    isEditingThisCategory && "bg-blue-50 ring-1 ring-blue-200"
                                  )}
                                >
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: transaction.categoria?.cor || '#94a3b8' }}
                                  />
                                  <span className="text-slate-600">{transaction.categoria?.nome || 'Sem categoria'}</span>
                                </button>

                                {/* Dropdown de categorias */}
                                {isEditingThisCategory && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-40"
                                      onClick={() => setEditingCategoryId(null)}
                                    />
                                    <div className="absolute left-4 top-full mt-1 z-50 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 max-h-52 overflow-y-auto">
                                      {despesaCategories.map((cat) => (
                                        <button
                                          key={cat.id}
                                          onClick={() => handleUpdateTransactionCategory(transaction.id, cat.id)}
                                          className={cn(
                                            "w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                                            "hover:bg-slate-50",
                                            transaction.categoria_id === cat.id && "bg-slate-100 font-medium"
                                          )}
                                        >
                                          <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: cat.cor || '#94a3b8' }}
                                          />
                                          <span className="text-slate-700">{cat.nome}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </td>

                              {/* Valor */}
                              <td className="px-4 py-1.5 text-right">
                                <span className="text-xs font-semibold text-slate-700 tabular-nums">
                                  {formatCurrency(transaction.valor)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Paginação compacta */}
                    {totalPages > 1 && (
                      <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                          {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
                        </p>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                            disabled={invoicePage === 1}
                            className={cn(
                              "p-1 rounded transition-colors",
                              invoicePage === 1
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-500 hover:bg-slate-100"
                            )}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => setInvoicePage(page)}
                              className={cn(
                                "w-6 h-6 rounded text-xs font-medium transition-colors",
                                page === invoicePage
                                  ? "bg-coral-500 text-white"
                                  : "text-slate-500 hover:bg-slate-100"
                              )}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() => setInvoicePage(p => Math.min(totalPages, p + 1))}
                            disabled={invoicePage === totalPages}
                            className={cn(
                              "p-1 rounded transition-colors",
                              invoicePage === totalPages
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-500 hover:bg-slate-100"
                            )}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CreditCardIcon className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-slate-600">Nenhum lançamento</p>
                    <p className="text-xs text-slate-400 mt-1">Esta fatura ainda não possui lançamentos</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Modais */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <TransactionForm
              transaction={editingTransaction}
              onSave={handleTransactionSaved}
              onCancel={handleCloseModal}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Modal compartilhado de nova transação */}
      <TransactionModalComponent />

      {/* Modal de Pagamento de Fatura */}
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
            // Recarregar transações consolidadas
            loadConsolidatedTransactions();
            loadMonthlyTransactions(); // Now loads both transactions and totals
          }}
        />
      )}

      {/* Modal de confirmação de exclusão de fatura */}
      <ConfirmDeleteInvoiceModal
        isOpen={isDeleteInvoiceModalOpen}
        onClose={() => {
          setIsDeleteInvoiceModalOpen(false);
          setSelectedInvoiceForDelete(null);
        }}
        onConfirm={confirmDeleteInvoice}
        invoiceDetails={selectedInvoiceForDelete}
      />

      {/* Modal de Ajuste Pontual */}
      {isAdjustmentModalOpen && adjustmentTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-deep-blue">
                Ajuste Pontual
              </h2>
              <button
                onClick={handleCloseAdjustmentModal}
                className="p-1 hover:bg-slate-100 rounded"
              >
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
                label="Novo Valor para este Mês"
                value={adjustmentValue}
                onChange={setAdjustmentValue}
                required
              />

              <div className="flex gap-3 pt-2">
                <ModernButton
                  onClick={handleSaveAdjustment}
                  className="flex-1"
                  disabled={adjustmentValue === undefined || adjustmentValue <= 0}
                >
                  Criar Ajuste
                </ModernButton>
                <ModernButton
                  variant="outline"
                  onClick={handleCloseAdjustmentModal}
                  className="flex-1"
                >
                  Cancelar
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Transação Fixa */}
      {isEditFixedModalOpen && editingFixedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-deep-blue">
                Editar Lançamento Fixo
              </h2>
              <button
                onClick={handleCloseEditFixedModal}
                className="p-1 hover:bg-slate-100 rounded"
              >
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  name="descricao"
                  defaultValue={editingFixedTransaction.descricao}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="text"
                  name="valor"
                  defaultValue={formatCurrency(Number(editingFixedTransaction.valor))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  name="tipo"
                  defaultValue={editingFixedTransaction.tipo}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                  <option value="despesa_cartao">Despesa Cartão</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dia do Mês
                </label>
                <input
                  type="number"
                  name="dia_mes"
                  min="1"
                  max="31"
                  defaultValue={editingFixedTransaction.dia_mes}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  name="categoria_id"
                  defaultValue={editingFixedTransaction.categoria_id || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  id="ativo"
                  defaultChecked={editingFixedTransaction.ativo}
                  className="h-4 w-4 text-coral-600 focus:ring-coral-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                  Transação ativa
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <ModernButton type="submit" className="flex-1">
                  Salvar
                </ModernButton>
                <ModernButton
                  type="button"
                  variant="outline"
                  onClick={handleCloseEditFixedModal}
                  className="flex-1"
                >
                  Cancelar
                </ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}