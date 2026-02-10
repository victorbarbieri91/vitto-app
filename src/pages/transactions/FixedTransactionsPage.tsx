import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Edit2, Trash2, Power, PowerOff, Settings, X, AlertCircle, SkipForward, ArrowRight, CreditCard, Wallet, Banknote } from 'lucide-react';
import { ModernCard, ModernButton } from '../../components/ui/modern';
import { fixedTransactionService, FixedTransactionWithDetails } from '../../services/api/FixedTransactionService';
import { transactionService } from '../../services/api/TransactionService';
import { useTransactionModal } from '../../hooks/useTransactionModal';
import { useTransactionContext } from '../../store/TransactionContext';
import { cn } from '../../utils/cn';
import { toast } from 'react-hot-toast';

type AdjustmentType = 'change_this_month' | 'change_from_now' | 'skip_this_month';

interface FixedTransactionStats {
  total_ativo: number;
  total_inativo: number;
  receita_mensal_fixa: number;
  despesa_mensal_fixa: number;
  fluxo_mensal_fixo: number;
}

/**
 *
 */
export default function FixedTransactionsPage() {
  const [searchParams] = useSearchParams();
  const { onTransactionChange } = useTransactionContext();
  const [fixedTransactions, setFixedTransactions] = useState<FixedTransactionWithDetails[]>([]);
  const [stats, setStats] = useState<FixedTransactionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [typeFilter, setTypeFilter] = useState<'all' | 'receita' | 'despesa' | 'despesa_cartao'>('all');
  const [editingTransaction, setEditingTransaction] = useState<FixedTransactionWithDetails | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adjustmentTransaction, setAdjustmentTransaction] = useState<FixedTransactionWithDetails | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('change_this_month');
  const [adjustmentMonth, setAdjustmentMonth] = useState(() => new Date().getMonth() + 1);
  const [adjustmentYear, setAdjustmentYear] = useState(() => new Date().getFullYear());
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const { openModal, TransactionModalComponent } = useTransactionModal();

  // Gerar opções de mês/ano para o seletor
  const monthYearOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // 2 meses anteriores + mês atual + 12 meses futuros
    for (let i = -2; i <= 12; i++) {
      let month = currentMonth + i;
      let year = currentYear;

      while (month <= 0) { month += 12; year -= 1; }
      while (month > 12) { month -= 12; year += 1; }

      options.push({
        month,
        year,
        label: `${monthNames[month - 1]} ${year}`,
        value: `${month}-${year}`,
        isCurrent: month === currentMonth && year === currentYear
      });
    }

    return options;
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [transactionsData, statsData] = await Promise.all([
        fixedTransactionService.list(),
        fixedTransactionService.getStats()
      ]);

      setFixedTransactions(transactionsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar transações fixas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Processar parâmetro edit da URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && fixedTransactions.length > 0) {
      const transactionToEdit = fixedTransactions.find(t => t.id === parseInt(editId));
      if (transactionToEdit) {
        console.log(`Abrindo edição automática para lançamento fixo ID: ${editId}`, transactionToEdit);
        handleEdit(transactionToEdit);
        // Limpar o parâmetro da URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      } else {
        toast.error('Lançamento fixo não encontrado para edição');
      }
    }
  }, [searchParams, fixedTransactions]);

  // Escutar mudanças globais nas transações (quando criar transação fixa)
  useEffect(() => {
    const unsubscribe = onTransactionChange((event) => {
      console.log('[FixedTransactionsPage] Recebeu notificação de mudança:', event);
      // Recarregar dados quando houver mudança em transações fixas
      if (event.transactionType === 'fixed' || event.type === 'all') {
        loadData();
      }
    });

    return () => unsubscribe();
  }, [onTransactionChange]);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fixedTransactionService.toggle(id, !currentStatus);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status da transação');
    }
  };

  const handleEdit = (transaction: FixedTransactionWithDetails) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSaveEditedTransaction = async (data: any) => {
    if (!editingTransaction) return;

    try {
      await fixedTransactionService.update(editingTransaction.id, data);
      await loadData(); // Reload data
      handleCloseEditModal();
    } catch (error) {
      console.error('Erro ao atualizar transação fixa:', error);
      alert('Erro ao atualizar transação fixa');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação fixa?')) return;

    try {
      await fixedTransactionService.delete(id);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir transação fixa');
    }
  };

  const handlePointAdjustment = (transaction: FixedTransactionWithDetails) => {
    setAdjustmentTransaction(transaction);
    setAdjustmentValue(Number(transaction.valor));
    setAdjustmentType('change_this_month');
    setAdjustmentMonth(new Date().getMonth() + 1);
    setAdjustmentYear(new Date().getFullYear());
    setAdjustmentNote('');
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustmentModal = () => {
    setIsAdjustmentModalOpen(false);
    setAdjustmentTransaction(null);
    setAdjustmentValue(0);
    setAdjustmentNote('');
  };

  const handleSubmitAdjustment = async () => {
    if (!adjustmentTransaction) return;

    setIsSubmittingAdjustment(true);
    try {
      const lastDayOfMonth = new Date(adjustmentYear, adjustmentMonth, 0).getDate();
      const dia = adjustmentTransaction.dia_mes > lastDayOfMonth ? lastDayOfMonth : adjustmentTransaction.dia_mes;
      const dataTransacao = `${adjustmentYear}-${String(adjustmentMonth).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

      if (adjustmentType === 'change_this_month') {
        // Criar uma transação real com o valor ajustado apenas para este mês
        const { error } = await transactionService.create({
          descricao: `${adjustmentTransaction.descricao} (ajuste)`,
          valor: adjustmentValue,
          data: dataTransacao,
          tipo: adjustmentTransaction.tipo as 'receita' | 'despesa' | 'despesa_cartao',
          categoria_id: adjustmentTransaction.categoria_id,
          conta_id: adjustmentTransaction.conta_id || undefined,
          cartao_id: adjustmentTransaction.cartao_id || undefined,
          status: 'pendente',
          observacoes: adjustmentNote || `Ajuste pontual - valor original: ${formatCurrency(Number(adjustmentTransaction.valor))}`
        });

        if (error) throw error;
        toast.success(`Ajuste para ${monthYearOptions.find(o => o.month === adjustmentMonth && o.year === adjustmentYear)?.label} criado!`);

      } else if (adjustmentType === 'change_from_now') {
        // Atualizar o valor da regra fixa (afeta todos os meses futuros)
        await fixedTransactionService.update(adjustmentTransaction.id, {
          valor: adjustmentValue
        });
        toast.success('Valor atualizado para todos os meses futuros!');

      } else if (adjustmentType === 'skip_this_month') {
        // Criar uma transação com valor 0 para "pular" o mês (será ignorada nos cálculos)
        const { error } = await transactionService.create({
          descricao: `${adjustmentTransaction.descricao} (pulado)`,
          valor: 0,
          data: dataTransacao,
          tipo: adjustmentTransaction.tipo as 'receita' | 'despesa' | 'despesa_cartao',
          categoria_id: adjustmentTransaction.categoria_id,
          conta_id: adjustmentTransaction.conta_id || undefined,
          cartao_id: adjustmentTransaction.cartao_id || undefined,
          status: 'confirmado',
          observacoes: adjustmentNote || `Lançamento fixo pulado neste mês`
        });

        if (error) throw error;
        toast.success(`Lançamento pulado em ${monthYearOptions.find(o => o.month === adjustmentMonth && o.year === adjustmentYear)?.label}!`);
      }

      handleCloseAdjustmentModal();
      await loadData();
    } catch (error) {
      console.error('Erro ao aplicar ajuste:', error);
      toast.error('Erro ao aplicar ajuste');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const filteredTransactions = fixedTransactions.filter(transaction => {
    // Filtro por status (ativo/inativo)
    if (filter === 'active' && !transaction.ativo) return false;
    if (filter === 'inactive' && transaction.ativo) return false;

    // Filtro por tipo
    if (typeFilter !== 'all' && transaction.tipo !== typeFilter) return false;

    return true;
  });

  // Contadores por tipo
  const typeCounters = useMemo(() => {
    const active = fixedTransactions.filter(t => t.ativo);
    return {
      receita: active.filter(t => t.tipo === 'receita').length,
      despesa: active.filter(t => t.tipo === 'despesa').length,
      despesa_cartao: active.filter(t => t.tipo === 'despesa_cartao').length,
    };
  }, [fixedTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
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


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-96"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <ModernCard key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-8 bg-slate-200 rounded w-32"></div>
              </div>
            </ModernCard>
          ))}
        </div>

        <ModernCard className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-deep-blue">Transações Fixas</h1>
          <p className="text-slate-500">
            Gerencie suas receitas e despesas recorrentes mensais.
          </p>
        </div>
        <ModernButton
          onClick={() => openModal('receita')}
        >
          Nova Transação Fixa
        </ModernButton>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ModernCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Power className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-600">Ativas</span>
            </div>
            <div className="text-2xl font-bold text-deep-blue">
              {stats.total_ativo}
            </div>
          </ModernCard>

          <ModernCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-600">Receita Fixa</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.receita_mensal_fixa)}
            </div>
          </ModernCard>

          <ModernCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-slate-600">Despesa Fixa</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.despesa_mensal_fixa)}
            </div>
          </ModernCard>

          <ModernCard className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-deep-blue" />
              <span className="text-sm font-medium text-slate-600">Fluxo Mensal</span>
            </div>
            <div className={cn(
              "text-2xl font-bold",
              stats.fluxo_mensal_fixo >= 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {formatCurrency(stats.fluxo_mensal_fixo)}
            </div>
          </ModernCard>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Filtro por Status */}
        <div className="flex gap-2">
          <ModernButton
            variant={filter === 'active' ? 'primary' : 'outline'}
            onClick={() => setFilter('active')}
            size="sm"
          >
            Ativas ({stats?.total_ativo || 0})
          </ModernButton>
          <ModernButton
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Todas ({fixedTransactions.length})
          </ModernButton>
          <ModernButton
            variant={filter === 'inactive' ? 'primary' : 'outline'}
            onClick={() => setFilter('inactive')}
            size="sm"
          >
            Inativas ({stats?.total_inativo || 0})
          </ModernButton>
        </div>

        {/* Separador */}
        <div className="hidden sm:block w-px bg-slate-200" />

        {/* Filtro por Tipo */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
              typeFilter === 'all'
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Todos os tipos
          </button>
          <button
            onClick={() => setTypeFilter('receita')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
              typeFilter === 'receita'
                ? "bg-emerald-500 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            )}
          >
            <Banknote className="w-4 h-4" />
            Receitas ({typeCounters.receita})
          </button>
          <button
            onClick={() => setTypeFilter('despesa')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
              typeFilter === 'despesa'
                ? "bg-red-500 text-white"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            )}
          >
            <Wallet className="w-4 h-4" />
            Despesas Conta ({typeCounters.despesa})
          </button>
          <button
            onClick={() => setTypeFilter('despesa_cartao')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
              typeFilter === 'despesa_cartao'
                ? "bg-purple-500 text-white"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            )}
          >
            <CreditCard className="w-4 h-4" />
            Despesas Cartão ({typeCounters.despesa_cartao})
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <ModernCard className="p-6">
        {filteredTransactions.length === 0 ? (
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
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                  transaction.ativo
                    ? transaction.tipo === 'receita'
                      ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300"
                      : transaction.tipo === 'despesa_cartao'
                        ? "bg-purple-50/50 border-purple-200 hover:border-purple-300"
                        : "bg-red-50/50 border-red-200 hover:border-red-300"
                    : "bg-slate-50 border-slate-200"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Ícone do tipo com cor de fundo */}
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    transaction.tipo === 'receita'
                      ? "bg-emerald-100"
                      : transaction.tipo === 'despesa_cartao'
                        ? "bg-purple-100"
                        : "bg-red-100",
                    !transaction.ativo && "opacity-50"
                  )}>
                    {transaction.tipo === 'receita' ? (
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    ) : transaction.tipo === 'despesa_cartao' ? (
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Wallet className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "font-semibold truncate",
                        transaction.ativo ? "text-slate-900" : "text-slate-500"
                      )}>
                        {transaction.descricao}
                      </h4>
                      {!transaction.ativo && (
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                          Inativa
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {/* Data de vencimento */}
                      <span className="flex items-center gap-1 text-slate-600">
                        <Calendar className="w-3.5 h-3.5" />
                        Dia {transaction.dia_mes}
                      </span>

                      {/* Destino: Conta ou Cartão */}
                      {transaction.conta_id && transaction.conta_nome && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          <Wallet className="w-3 h-3" />
                          {transaction.conta_nome}
                        </span>
                      )}
                      {transaction.cartao_id && transaction.cartao_nome && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                          <CreditCard className="w-3 h-3" />
                          {transaction.cartao_nome}
                        </span>
                      )}

                      {/* Categoria */}
                      {transaction.categoria_nome && (
                        <span className="text-slate-500">
                          {transaction.categoria_nome}
                        </span>
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
                      onClick={() => handleToggleStatus(transaction.id, transaction.ativo)}
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
                      onClick={() => handleEdit(transaction)}
                      className="p-2 text-slate-600 hover:text-slate-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </ModernButton>

                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(transaction.id)}
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
      </ModernCard>

      {/* Modal for creating new fixed transactions */}
      <TransactionModalComponent />

      {/* Modal for editing fixed transactions */}
      {isEditModalOpen && editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Editar Transação Fixa</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const data = {
                descricao: formData.get('descricao') as string,
                valor: parseFloat(formData.get('valor') as string),
                tipo: formData.get('tipo') as string,
                dia_mes: parseInt(formData.get('dia_mes') as string),
                categoria_id: parseInt(formData.get('categoria_id') as string),
                conta_id: editingTransaction.conta_id ? parseInt(formData.get('conta_id') as string) : null,
                cartao_id: editingTransaction.cartao_id ? parseInt(formData.get('cartao_id') as string) : null,
                ativo: formData.get('ativo') === 'on',
              };
              handleSaveEditedTransaction(data);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  name="descricao"
                  defaultValue={editingTransaction.descricao}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  name="valor"
                  step="0.01"
                  defaultValue={editingTransaction.valor}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  name="tipo"
                  defaultValue={editingTransaction.tipo}
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
                  defaultValue={editingTransaction.dia_mes}
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
                  defaultValue={editingTransaction.categoria_id || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {/* TODO: Load categories */}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  id="ativo"
                  defaultChecked={editingTransaction.ativo}
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
                  onClick={handleCloseEditModal}
                  className="flex-1"
                >
                  Cancelar
                </ModernButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ajuste Pontual - MELHORADO */}
      {isAdjustmentModalOpen && adjustmentTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-deep-blue">Ajuste de Lançamento Fixo</h2>
                <p className="text-sm text-slate-500 mt-1">{adjustmentTransaction.descricao}</p>
              </div>
              <button
                onClick={handleCloseAdjustmentModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Info do lançamento */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm text-slate-500">Valor atual da regra</p>
                  <p className={cn(
                    "text-xl font-bold",
                    adjustmentTransaction.tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {formatCurrency(Number(adjustmentTransaction.valor))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Dia de vencimento</p>
                  <p className="text-lg font-semibold text-slate-700">Dia {adjustmentTransaction.dia_mes}</p>
                </div>
              </div>

              {/* Seletor de mês */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Para qual mês é o ajuste?
                </label>
                <select
                  value={`${adjustmentMonth}-${adjustmentYear}`}
                  onChange={(e) => {
                    const [m, y] = e.target.value.split('-').map(Number);
                    setAdjustmentMonth(m);
                    setAdjustmentYear(y);
                  }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 text-slate-700"
                >
                  {monthYearOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.isCurrent ? '(atual)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de ajuste */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  O que você quer fazer?
                </label>
                <div className="space-y-2">
                  {/* Opção 1: Alterar apenas este mês */}
                  <label
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      adjustmentType === 'change_this_month'
                        ? 'border-coral-500 bg-coral-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="change_this_month"
                      checked={adjustmentType === 'change_this_month'}
                      onChange={() => setAdjustmentType('change_this_month')}
                      className="mt-1 text-coral-500 focus:ring-coral-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-coral-600" />
                        <span className="font-medium text-slate-800">Alterar apenas neste mês</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        O valor será diferente só neste mês. Os próximos meses continuam com o valor original.
                      </p>
                    </div>
                  </label>

                  {/* Opção 2: Alterar daqui em diante */}
                  <label
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      adjustmentType === 'change_from_now'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="change_from_now"
                      checked={adjustmentType === 'change_from_now'}
                      onChange={() => setAdjustmentType('change_from_now')}
                      className="mt-1 text-blue-500 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-slate-800">Alterar daqui em diante</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        O valor da regra será atualizado permanentemente. Afeta este mês e todos os futuros.
                      </p>
                    </div>
                  </label>

                  {/* Opção 3: Pular este mês */}
                  <label
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                      adjustmentType === 'skip_this_month'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="adjustmentType"
                      value="skip_this_month"
                      checked={adjustmentType === 'skip_this_month'}
                      onChange={() => setAdjustmentType('skip_this_month')}
                      className="mt-1 text-amber-500 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <SkipForward className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-slate-800">Pular este mês</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Este lançamento não será considerado neste mês (férias, cancelamento temporário, etc).
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Campo de valor (apenas se não for pular) */}
              {adjustmentType !== 'skip_this_month' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {adjustmentType === 'change_from_now' ? 'Novo valor (permanente)' : 'Valor para este mês'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustmentValue}
                      onChange={(e) => setAdjustmentValue(parseFloat(e.target.value) || 0)}
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              )}

              {/* Observação */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 resize-none"
                  placeholder="Ex: Reajuste anual, férias, promoção..."
                />
              </div>

              {/* Alerta para mudança permanente */}
              {adjustmentType === 'change_from_now' && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Mudança permanente</p>
                    <p className="text-sm text-blue-600 mt-1">
                      O valor de <strong>{formatCurrency(Number(adjustmentTransaction.valor))}</strong> será alterado para <strong>{formatCurrency(adjustmentValue)}</strong> em todos os meses futuros.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <ModernButton
                variant="outline"
                onClick={handleCloseAdjustmentModal}
                className="flex-1"
                disabled={isSubmittingAdjustment}
              >
                Cancelar
              </ModernButton>
              <ModernButton
                onClick={handleSubmitAdjustment}
                className="flex-1"
                disabled={isSubmittingAdjustment}
              >
                {isSubmittingAdjustment ? 'Aplicando...' : 'Aplicar Ajuste'}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}