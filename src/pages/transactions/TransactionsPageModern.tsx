import { useState, useEffect } from 'react';
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
import { transactionService, TransactionWithDetails } from '../../services/api/TransactionService';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Edit2, Trash2, Power, PowerOff, CreditCard as CreditCardIcon, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../store/AuthContext';
import InvoiceCard, { InvoiceTransaction } from '../../components/cards/InvoiceCard';
import InvoicePaymentModal from '../../components/cards/InvoicePaymentModal';
import ConfirmDeleteInvoiceModal from '../../components/modals/ConfirmDeleteInvoiceModal';
import CreditCardSelector from '../../components/transactions/CreditCardSelector';
import { getInvoicePeriodFilter } from '../../utils/invoicePeriod';
import { toast } from 'react-hot-toast';

type TabType = 'month' | 'fixed' | 'cards';

export default function TransactionsPageModern() {
  const { user } = useAuth();
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

  // Month navigation state
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  // Processar query params na inicialização
  useEffect(() => {
    const type = searchParams.get('type');
    const cardId = searchParams.get('card_id');
    const month = searchParams.get('month');

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
  }, [searchParams]);

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
    return { startDate, endDate };
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

      return data?.map((t: any) => ({
        id: t.id.toString(),
        descricao: t.descricao,
        valor: Number(t.valor),
        data: t.data,
        categoria: t.categoria_id ? {
          id: t.categoria_id.toString(),
          nome: t.categoria?.nome || '',
          cor: t.categoria?.cor || '#6B7280',
          icone: t.categoria?.icone || 'default'
        } : undefined,
        parcela_atual: t.parcela_atual,
        total_parcelas: t.total_parcelas,
        observacoes: t.observacoes
      })) || [];
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

  // Handle edit fixed transaction
  const handleEditFixedTransaction = async (fixedTransactionId: number) => {
    try {
      console.log(`Editando lançamento fixo ID: ${fixedTransactionId}`);

      // Buscar dados do lançamento fixo para edição
      const fixedTransaction = await fixedTransactionService.getById(fixedTransactionId.toString());
      console.log('Dados do lançamento fixo:', fixedTransaction);

      // Redirecionar para a página de lançamentos fixos com foco na edição
      navigate(`/transacoes/fixos?edit=${fixedTransactionId}`);
    } catch (error) {
      console.error('Erro ao editar lançamento fixo:', error);
      toast.error('Erro ao abrir editor do lançamento fixo');
    }
  };

  // Handle point adjustment
  const handlePointAdjustment = (transaction: FixedTransactionWithDetails) => {
    setAdjustmentTransaction(transaction);
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
    setAdjustmentTransaction(null);
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

  // Load invoice values for credit cards
  const loadInvoiceValues = async (cards: CreditCard[]) => {
    if (!user || !cards.length) return;

    try {
      const invoicePromises = cards.map(async (card) => {
        // Get invoice period for this card and current month
        const period = getInvoicePeriodFilter(card, currentMonth, currentYear);

        console.log(`💳 Loading invoice for card ${card.nome} (ID: ${card.id})`);
        console.log(`📅 Period: ${period.startDate} to ${period.endDate}`);

        // Query individual transactions (not consolidated invoices)
        const { data, error } = await supabase
          .from('app_transacoes')
          .select('valor, descricao, data, tipo, tipo_especial')
          .eq('user_id', user.id)
          .eq('tipo', 'despesa_cartao')
          .eq('cartao_id', card.id)
          .gte('data', period.startDate)
          .lte('data', period.endDate);

        if (error) {
          console.error(`❌ Error loading transactions for card ${card.id}:`, error);
          throw error;
        }

        console.log(`🔍 Found ${data?.length || 0} transactions for card ${card.nome}:`, data);

        // Filter out consolidated invoice records manually (since tipo_registro might not exist)
        const filteredData = (data || []).filter(t => {
          const shouldExclude = (
            t.tipo_especial === 'fatura' ||
            t.descricao?.match(/Fatura.*\(\d{2}\/\d{2}\)/i)
            // Removed generic 'fatura' check to allow "Total da fatura de setembro" type transactions
          );

          if (shouldExclude) {
            console.log(`🚫 Excluding consolidated invoice: ${t.descricao}`);
          }

          return !shouldExclude;
        });

        console.log(`✅ After filtering: ${filteredData.length} individual transactions`);

        // Sum individual transaction values
        const totalValue = filteredData.reduce((sum: number, transaction: any) =>
          sum + Number(transaction.valor), 0
        );

        console.log(`💰 Total value for ${card.nome}: R$${totalValue}`);

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
              variant={fixedFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setFixedFilter('active')}
              size="sm"
            >
              Ativas ({fixedStats.total_ativo})
            </ModernButton>
            <ModernButton
              variant={fixedFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setFixedFilter('all')}
              size="sm"
            >
              Todas ({fixedTransactions.length})
            </ModernButton>
            <ModernButton
              variant={fixedFilter === 'inactive' ? 'default' : 'outline'}
              onClick={() => setFixedFilter('inactive')}
              size="sm"
            >
              Inativas ({fixedStats.total_inativo})
            </ModernButton>
          </div>

          {/* Lista de Transações Fixas */}
          <div className="bg-white rounded-lg border border-slate-200">
            {filteredFixedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  Nenhuma transação fixa encontrada
                </h3>
                <p className="text-slate-500 mb-4">
                  Crie sua primeira transação fixa para começar.
                </p>
                <ModernButton onClick={() => openModal('receita')}>
                  Criar Transação Fixa
                </ModernButton>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredFixedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-all",
                      transaction.ativo
                        ? "bg-white border-slate-200 hover:border-slate-300"
                        : "bg-slate-50 border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.tipo)}
                        <span className={cn(
                          "text-sm px-2 py-1 rounded",
                          transaction.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {getTypeLabel(transaction.tipo)}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h4 className={cn(
                          "font-medium truncate",
                          transaction.ativo ? "text-slate-900" : "text-slate-500"
                        )}>
                          {transaction.descricao}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span>Dia {transaction.dia_mes}</span>
                          {transaction.categoria_nome && (
                            <>
                              <span>•</span>
                              <span>{transaction.categoria_nome}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "text-lg font-semibold",
                        getTypeColor(transaction.tipo),
                        !transaction.ativo && "opacity-50"
                      )}>
                        {formatCurrency(Number(transaction.valor))}
                      </div>

                      <div className="flex items-center gap-2">
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFixedStatus(transaction.id, transaction.ativo)}
                          className={cn(
                            "p-2",
                            transaction.ativo
                              ? "text-emerald-600 hover:text-emerald-700"
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {transaction.ativo ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4" />
                          )}
                        </ModernButton>

                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePointAdjustment(transaction)}
                          className="p-2 text-blue-600 hover:text-blue-700"
                          title="Ajuste Pontual para este mês"
                        >
                          <Settings className="w-4 h-4" />
                        </ModernButton>

                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFixedTransaction(transaction.id)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </ModernButton>
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
        <div className="space-y-6">
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

          {/* Transações do Cartão Selecionado */}
          {selectedCardId && (
            <div className="space-y-3">
              <TransactionList
                ref={transactionListRef}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onConfirmFixedTransaction={handleConfirmFixedTransaction}
                onActivateTransaction={handleActivateTransaction}
                showFilters={false}
                defaultFilters={{
                  ...getInvoiceDateFilters(selectedCardId),
                  tipo: 'despesa_cartao',
                  cartao_id: selectedCardId?.toString(),
                  exclude_fatura_records: true // Exclude consolidated invoice records
                }}
                includeVirtualFixed={false}
                excludeCardTransactions={false}
              />
            </div>
          )}
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
            <h2 className="text-xl font-bold text-deep-blue mb-4">
              Ajuste Pontual - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>

            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-medium text-slate-700 mb-2">{adjustmentTransaction.descricao}</h3>
              <p className="text-sm text-slate-500">Valor original: {formatCurrency(Number(adjustmentTransaction.valor))}</p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const newValue = parseFloat(formData.get('valor') as string);

              // TODO: Implement point-in-time adjustment service
              console.log('Ajuste pontual:', {
                fixedTransactionId: adjustmentTransaction.id,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                originalValue: adjustmentTransaction.valor,
                newValue: newValue
              });

              toast.success('Ajuste pontual salvo! Funcionalidade em desenvolvimento.');
              handleCloseAdjustmentModal();
              // TODO: Refresh data after adjustment
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Novo Valor para este Mês
                </label>
                <input
                  type="number"
                  name="valor"
                  step="0.01"
                  defaultValue={adjustmentTransaction.valor}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observação (opcional)
                </label>
                <textarea
                  name="observacao"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                  placeholder="Motivo do ajuste..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <ModernButton type="submit" className="flex-1">
                  Criar Ajuste
                </ModernButton>
                <ModernButton
                  type="button"
                  variant="outline"
                  onClick={handleCloseAdjustmentModal}
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