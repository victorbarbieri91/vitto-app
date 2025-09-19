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
  ChevronUp
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../store/AuthContext';
import { transactionService } from '../../services/api/TransactionService';
import { supabase } from '../../services/supabase/client';

interface PendingTransaction {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa' | 'despesa_cartao';
  categoria_nome: string;
  categoria_cor: string;
  categoria_icone: string;
  conta_nome?: string;
  cartao_nome?: string;
  origem: 'manual' | 'fixo';
  fixo_id?: number;
  data_vencimento?: string;
}

interface PendingTransactionsListProps {
  currentMonth: number;
  currentYear: number;
  onTransactionUpdate?: () => void;
  className?: string;
}

const PendingTransactionsList: React.FC<PendingTransactionsListProps> = ({
  currentMonth,
  currentYear,
  onTransactionUpdate,
  className
}) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar transações pendentes do mês
  const fetchPendingTransactions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('app_transacoes')
        .select(`
          id,
          descricao,
          valor,
          data,
          tipo,
          origem,
          fixo_id,
          data_vencimento,
          app_categoria(nome, cor, icone),
          app_conta(nome),
          app_cartao_credito(nome)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .gte('data', startDate)
        .lte('data', endDate)
        .order('data', { ascending: true });

      if (error) throw error;

      const processedTransactions: PendingTransaction[] = (data || []).map((t: any) => ({
        id: t.id,
        descricao: t.descricao,
        valor: Number(t.valor),
        data: t.data,
        tipo: t.tipo,
        categoria_nome: t.app_categoria?.nome || 'Sem categoria',
        categoria_cor: t.app_categoria?.cor || '#6B7280',
        categoria_icone: t.app_categoria?.icone || 'tag',
        conta_nome: t.app_conta?.nome,
        cartao_nome: t.app_cartao_credito?.nome,
        origem: t.origem,
        fixo_id: t.fixo_id,
        data_vencimento: t.data_vencimento
      }));

      setTransactions(processedTransactions);
    } catch (err) {
      console.error('Erro ao buscar transações pendentes:', err);
      setError('Erro ao carregar transações pendentes');
    } finally {
      setLoading(false);
    }
  }, [user, currentMonth, currentYear]);

  // Confirmar transação
  const handleConfirmTransaction = async (transactionId: number) => {
    try {
      setUpdating(prev => [...prev, transactionId]);

      const { error } = await transactionService.updateStatus(transactionId.toString(), 'confirmado');

      if (error) throw error;

      // Remover da lista local
      setTransactions(prev => prev.filter(t => t.id !== transactionId));

      // Notificar atualização
      onTransactionUpdate?.();

    } catch (err) {
      console.error('Erro ao confirmar transação:', err);
      setError('Erro ao confirmar transação');
    } finally {
      setUpdating(prev => prev.filter(id => id !== transactionId));
    }
  };

  // Cancelar transação
  const handleCancelTransaction = async (transactionId: number) => {
    try {
      setUpdating(prev => [...prev, transactionId]);

      const { error } = await transactionService.updateStatus(transactionId.toString(), 'cancelado');

      if (error) throw error;

      // Remover da lista local
      setTransactions(prev => prev.filter(t => t.id !== transactionId));

      // Notificar atualização
      onTransactionUpdate?.();

    } catch (err) {
      console.error('Erro ao cancelar transação:', err);
      setError('Erro ao cancelar transação');
    } finally {
      setUpdating(prev => prev.filter(id => id !== transactionId));
    }
  };

  // Buscar transações quando mudar mês/ano
  useEffect(() => {
    fetchPendingTransactions();
  }, [fetchPendingTransactions]);

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
  const renderTransactionIcon = (transaction: PendingTransaction) => {
    if (transaction.tipo === 'receita') {
      return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
    } else if (transaction.tipo === 'despesa_cartao') {
      return <CreditCard className="w-5 h-5 text-purple-500" />;
    } else {
      return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className={cn('bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20', className)}>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-deep-blue" />
          <h3 className="text-lg font-semibold text-deep-blue">Transações Pendentes</h3>
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
          <Check className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-deep-blue">Transações Pendentes</h3>
        </div>
        <p className="text-gray-600 text-sm text-center py-4">
          Nenhuma transação pendente neste mês
        </p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-deep-blue">
            Transações Pendentes ({transactions.length})
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
                  className="bg-white/20 rounded-lg p-3 border border-white/10"
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
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Fixa
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

                    {/* Botões de ação */}
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => handleConfirmTransaction(transaction.id)}
                        disabled={updating.includes(transaction.id)}
                        className={cn(
                          'p-2 rounded-lg transition-all duration-200',
                          'bg-green-500/20 hover:bg-green-500/30 text-green-700',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        title="Confirmar transação"
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleCancelTransaction(transaction.id)}
                        disabled={updating.includes(transaction.id)}
                        className={cn(
                          'p-2 rounded-lg transition-all duration-200',
                          'bg-red-500/20 hover:bg-red-500/30 text-red-700',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        title="Cancelar transação"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
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
            {transactions.filter(t => t.tipo === 'receita').length} receitas, {' '}
            {transactions.filter(t => t.tipo === 'despesa').length} despesas, {' '}
            {transactions.filter(t => t.tipo === 'despesa_cartao').length} cartão
          </span>
          <span className="text-deep-blue font-medium">
            Toque para expandir
          </span>
        </div>
      )}
    </div>
  );
};

export default PendingTransactionsList;