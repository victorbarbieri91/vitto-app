import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Repeat
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../store/AuthContext';
import { transactionService } from '../../services/api/TransactionService';
import { fixedTransactionService, type HybridTransaction } from '../../services/api/FixedTransactionService';
import { supabase } from '../../services/supabase/client';

// Usando HybridTransaction do service - suporta transações reais + virtuais

interface MonthTransactionsListProps {
  currentMonth: number;
  currentYear: number;
  onTransactionUpdate?: () => void;
  className?: string;
}

const MonthTransactionsList: React.FC<MonthTransactionsListProps> = ({
  currentMonth,
  currentYear,
  onTransactionUpdate,
  className
}) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<HybridTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string[]>([]); // Mudou para string[] para suportar IDs virtuais
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar transações híbridas do mês (confirmadas + fixas pendentes)
  const fetchMonthTransactions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 Buscando transações híbridas para ${currentMonth}/${currentYear}`);

      // ✅ NOVA API: Buscar transações híbridas (confirmadas + fixas pendentes)
      const hybridTransactions = await fixedTransactionService.getHybridTransactionsForMonth(
        currentMonth,
        currentYear
      );

      console.log(`✅ Transações híbridas encontradas:`, hybridTransactions.length);

      // Ordenar: pendentes primeiro (fixas virtuais no topo), depois confirmadas por data decrescente
      const sortedTransactions = hybridTransactions.sort((a, b) => {
        // Primeiro: status (pendentes primeiro)
        if (a.status !== b.status) {
          return a.status === 'pendente' ? -1 : 1;
        }

        // Segundo: dentro das pendentes, fixas/virtuais primeiro
        if (a.status === 'pendente' && a.is_virtual !== b.is_virtual) {
          return a.is_virtual ? -1 : 1;
        }

        // Terceiro: por data (pendentes crescente, confirmadas decrescente)
        if (a.status === 'pendente') {
          return new Date(a.data).getTime() - new Date(b.data).getTime();
        } else {
          return new Date(b.data).getTime() - new Date(a.data).getTime();
        }
      });

      setTransactions(sortedTransactions);
      console.log(`🎯 Transações ordenadas e definidas no state`);

    } catch (err) {
      console.error('Erro ao buscar transações híbridas:', err);
      setError('Erro ao carregar transações do mês');
    } finally {
      setLoading(false);
    }
  }, [user, currentMonth, currentYear]);

  // Confirmar transação (real ou virtual)
  const handleConfirmTransaction = async (transaction: HybridTransaction) => {
    try {
      setUpdating(prev => [...prev, transaction.id.toString()]);

      if (transaction.is_virtual && transaction.fixo_id) {
        // ✅ TRANSAÇÃO VIRTUAL: Confirmar transação fixa (criar registro real)
        console.log(`🔄 Confirmando transação fixa virtual:`, transaction.descricao);
        await fixedTransactionService.confirmVirtualTransaction(
          transaction.fixo_id,
          currentMonth,
          currentYear
        );
        console.log(`✅ Transação fixa confirmada e criada na tabela app_transacoes`);
      } else {
        // ✅ TRANSAÇÃO REAL: Atualizar status
        console.log(`🔄 Confirmando transação real:`, transaction.descricao);
        const { error } = await transactionService.updateStatus(transaction.id.toString(), 'confirmado');
        if (error) throw error;
        console.log(`✅ Status da transação real atualizado`);
      }

      // Recarregar lista para refletir mudanças (transação virtual vira real)
      await fetchMonthTransactions();

      // Notificar atualização
      onTransactionUpdate?.();

    } catch (err) {
      console.error('Erro ao confirmar transação:', err);
      setError('Erro ao confirmar transação');
    } finally {
      setUpdating(prev => prev.filter(id => id !== transaction.id.toString()));
    }
  };

  // Cancelar transação (só para transações reais - virtuais não podem ser canceladas)
  const handleCancelTransaction = async (transaction: HybridTransaction) => {
    // Transações virtuais/fixas não podem ser canceladas (só desativadas na configuração)
    if (transaction.is_virtual) {
      setError('Transações fixas não podem ser canceladas aqui. Use a tela de Transações Fixas.');
      return;
    }

    try {
      setUpdating(prev => [...prev, transaction.id.toString()]);

      const { error } = await transactionService.updateStatus(transaction.id.toString(), 'cancelado');

      if (error) throw error;

      // Recarregar lista
      await fetchMonthTransactions();

      // Notificar atualização
      onTransactionUpdate?.();

    } catch (err) {
      console.error('Erro ao cancelar transação:', err);
      setError('Erro ao cancelar transação');
    } finally {
      setUpdating(prev => prev.filter(id => id !== transaction.id.toString()));
    }
  };

  // Buscar transações quando mudar mês/ano
  useEffect(() => {
    fetchMonthTransactions();
  }, [fetchMonthTransactions]);

  // Formatar valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // Renderizar ícone do tipo de transação
  const renderTransactionIcon = (transaction: HybridTransaction) => {
    const baseClasses = "w-5 h-5";
    const opacity = transaction.is_virtual ? "opacity-70" : "";

    if (transaction.tipo === 'receita') {
      return <ArrowUpCircle className={`${baseClasses} text-green-500 ${opacity}`} />;
    } else if (transaction.tipo === 'despesa_cartao') {
      return <CreditCard className={`${baseClasses} text-purple-500 ${opacity}`} />;
    } else {
      return <ArrowDownCircle className={`${baseClasses} text-red-500 ${opacity}`} />;
    }
  };

  const pendingCount = transactions.filter(t => t.status === 'pendente').length;
  const confirmedCount = transactions.filter(t => t.status === 'confirmado').length;

  if (loading) {
    return (
      <div className={cn('bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20', className)}>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-deep-blue" />
          <h3 className="text-lg font-semibold text-deep-blue">Transações do Mês</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/10 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20', className)}>
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-deep-blue">Erro</h3>
        </div>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={cn('bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20', className)}>
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-deep-blue">Transações do Mês</h3>
        </div>
        <p className="text-gray-600 text-sm text-center py-4">
          Nenhuma transação neste mês
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-deep-blue">
            Transações do Mês ({transactions.length})
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-deep-blue" />
          ) : (
            <ChevronDown className="w-5 h-5 text-deep-blue" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  layout
                  className={cn(
                    'bg-white/20 rounded-lg p-3 border border-white/10',
                    transaction.status === 'pendente' ? 'border-amber-200/20' : 'border-green-200/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    {/* Info da transação */}
                    <div className="flex items-center gap-3 flex-1">
                      {renderTransactionIcon(transaction)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-deep-blue truncate">
                            {transaction.descricao}
                          </p>
                          {transaction.origem === 'fixo' && (
                            <span className={cn(
                              "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                              transaction.is_virtual
                                ? "bg-blue-100/70 text-blue-700"
                                : "bg-blue-100 text-blue-800"
                            )}>
                              <Repeat className="w-3 h-3" />
                              {transaction.is_virtual ? 'Fixa (Pendente)' : 'Fixa'}
                            </span>
                          )}
                          {transaction.status === 'pendente' && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              Pendente
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(transaction.data)}
                          </span>

                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {formatCurrency(transaction.valor)}
                          </span>

                          <span className="truncate">
                            {transaction.categoria_nome}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de ação para pendentes */}
                    {transaction.status === 'pendente' && (
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => handleConfirmTransaction(transaction)}
                          disabled={updating.includes(transaction.id.toString())}
                          className={cn(
                            'p-2 rounded-lg transition-all duration-200',
                            'bg-green-500/20 hover:bg-green-500/30 text-green-700',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                          )}
                          title={transaction.is_virtual ? "Confirmar transação fixa" : "Confirmar transação"}
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        {/* Só mostrar botão cancelar para transações reais */}
                        {!transaction.is_virtual && (
                          <button
                            onClick={() => handleCancelTransaction(transaction)}
                            disabled={updating.includes(transaction.id.toString())}
                            className={cn(
                              'p-2 rounded-lg transition-all duration-200',
                              'bg-red-500/20 hover:bg-red-500/30 text-red-700',
                              'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                            title="Cancelar transação"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumo quando colapsado */}
      {!isExpanded && transactions.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {pendingCount} pendentes, {confirmedCount} confirmadas
          </span>
          <span className="text-deep-blue font-medium">
            Toque para expandir
          </span>
        </div>
      )}
    </div>
  );
};

export default MonthTransactionsList;