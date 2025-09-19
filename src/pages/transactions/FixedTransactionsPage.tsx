import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { ModernCard, ModernButton, ModernBadge } from '../../components/ui/modern';
import { fixedTransactionService, FixedTransactionWithDetails } from '../../services/api/FixedTransactionService';
import { useTransactionModal } from '../../hooks/useTransactionModal';
import { cn } from '../../utils/cn';

interface FixedTransactionStats {
  total_ativo: number;
  total_inativo: number;
  receita_mensal_fixa: number;
  despesa_mensal_fixa: number;
  fluxo_mensal_fixo: number;
}

export default function FixedTransactionsPage() {
  const [fixedTransactions, setFixedTransactions] = useState<FixedTransactionWithDetails[]>([]);
  const [stats, setStats] = useState<FixedTransactionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const { openModal, TransactionModalComponent } = useTransactionModal();

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

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await fixedTransactionService.toggle(id, !currentStatus);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status da transação');
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

  const filteredTransactions = fixedTransactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'active') return transaction.ativo;
    if (filter === 'inactive') return !transaction.ativo;
    return true;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

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
      <div className="flex gap-2">
        <ModernButton
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
          size="sm"
        >
          Ativas ({stats?.total_ativo || 0})
        </ModernButton>
        <ModernButton
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Todas ({fixedTransactions.length})
        </ModernButton>
        <ModernButton
          variant={filter === 'inactive' ? 'default' : 'outline'}
          onClick={() => setFilter('inactive')}
          size="sm"
        >
          Inativas ({stats?.total_inativo || 0})
        </ModernButton>
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
                  "flex items-center justify-between p-4 rounded-lg border transition-all",
                  transaction.ativo
                    ? "bg-white border-slate-200 hover:border-slate-300"
                    : "bg-slate-50 border-slate-100"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(transaction.tipo)}
                    <ModernBadge variant={transaction.ativo ? 'default' : 'secondary'}>
                      {getTypeLabel(transaction.tipo)}
                    </ModernBadge>
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
                      {transaction.conta_nome && (
                        <>
                          <span>•</span>
                          <span>{transaction.conta_nome}</span>
                        </>
                      )}
                      {transaction.cartao_nome && (
                        <>
                          <span>•</span>
                          <span>{transaction.cartao_nome}</span>
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
                      onClick={() => {/* TODO: Implement edit */}}
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
    </div>
  );
}