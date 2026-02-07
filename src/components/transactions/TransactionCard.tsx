import React, { useCallback } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  DollarSign,
  Edit3,
  Trash2,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatLocalDate } from '../../utils/format';

// Tipo flexível para transações
type Transaction = any;

interface TransactionCardProps {
  transaction: Transaction;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: number) => void;
  onConfirmFixedTransaction?: (fixedTransactionId: number, targetDate: string) => void;
  onPartialFixedTransaction?: (fixedTransactionId: number, targetDate: string) => void;
  onUndoFixedTransaction?: (transactionId: number) => void;
  onEditFixedTransaction?: (fixedTransactionId: number) => void;
  onDeleteInvoice?: (invoiceId: number) => void;
  onActivateTransaction?: (transactionId: number) => void;
  onInvoiceClick?: (transaction: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEditTransaction,
  onDeleteTransaction,
  onConfirmFixedTransaction,
  onPartialFixedTransaction,
  onUndoFixedTransaction,
  onEditFixedTransaction,
  onDeleteInvoice,
  onActivateTransaction,
  onInvoiceClick,
}) => {
  // Helpers para formatação
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return formatLocalDate(dateString);
  }, []);

  // Ícone da transação
  const getTransactionIcon = useCallback((tipo: string) => {
    const iconClass = "w-3.5 h-3.5 sm:w-4 sm:h-4";
    switch (tipo) {
      case 'receita':
        return <ArrowDownLeft className={`${iconClass} text-emerald-500`} />;
      case 'despesa':
        return <ArrowUpRight className={`${iconClass} text-red-500`} />;
      case 'despesa_cartao':
        return <CreditCard className={`${iconClass} text-purple-500`} />;
      default:
        return <DollarSign className={`${iconClass} text-slate-400`} />;
    }
  }, []);

  // Badge de tipo
  const getTransactionTypeBadge = useCallback((tipo: string) => {
    const baseClass = "px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-medium";
    switch (tipo) {
      case 'receita':
        return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Receita</span>;
      case 'despesa':
        return <span className={`${baseClass} bg-red-100 text-red-700`}>Despesa</span>;
      case 'despesa_cartao':
        return <span className={`${baseClass} bg-purple-100 text-purple-700`}>Cartão</span>;
      default:
        return <span className={`${baseClass} bg-slate-100 text-slate-600`}>Outros</span>;
    }
  }, []);

  // Badge de status
  const getStatusBadge = useCallback((status: string, transaction?: Transaction) => {
    const baseClass = "px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-medium";

    // Verificar se é fatura
    if (transaction?.is_fatura || transaction?.tipo_registro === 'fatura') {
      switch (status) {
        case 'aberta':
          return <span className={`${baseClass} bg-red-100 text-red-700`}>Aberta</span>;
        case 'fechada':
          return <span className={`${baseClass} bg-yellow-100 text-yellow-700`}>Fechada</span>;
        case 'paga':
          return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Paga</span>;
        default:
          return <span className={`${baseClass} bg-red-100 text-red-700`}>Aberta</span>;
      }
    }

    // Para transações normais e fixas
    switch (status) {
      case 'efetivado':
      case 'concluido':
      case 'confirmado':
        return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Efetivada</span>;
      case 'pendente':
        return <span className={`${baseClass} bg-yellow-100 text-yellow-700`}>Pendente</span>;
      case 'cancelado':
        return <span className={`${baseClass} bg-red-100 text-red-700`}>Cancelado</span>;
      default:
        return <span className={`${baseClass} bg-slate-100 text-slate-600`}>-</span>;
    }
  }, []);

  // Badge de recorrência
  const getRecurrenceBadge = useCallback((tipoRecorrencia: 'unica' | 'fixa' | 'parcelada') => {
    const baseClass = "px-1.5 py-0.5 sm:px-2 rounded-full text-xs font-medium";
    switch (tipoRecorrencia) {
      case 'unica':
        return <span className={`${baseClass} bg-slate-100 text-slate-700`}>Única</span>;
      case 'fixa':
        return <span className={`${baseClass} bg-purple-100 text-purple-700`}>Fixa</span>;
      case 'parcelada':
        return <span className={`${baseClass} bg-orange-100 text-orange-700`}>Parcelada</span>;
      default:
        return <span className={`${baseClass} bg-slate-100 text-slate-600`}>-</span>;
    }
  }, []);

  // Verificar se uma transação fixa confirmada pode ser desfeita
  const canUndoFixedTransaction = useCallback((transaction: Transaction) => {
    if (transaction.origem !== 'fixo' || transaction.status !== 'confirmado' || !transaction.fixo_id) {
      return false;
    }

    const transactionDate = new Date(transaction.data);
    const daysDiff = Math.floor((Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysDiff <= 30;
  }, []);

  // Obter nome da conta
  const getAccountName = useCallback((transaction: Transaction) => {
    return transaction.conta_nome || transaction.cartao_nome || '-';
  }, []);

  // Obter nome da categoria
  const getCategoryName = useCallback((transaction: Transaction) => {
    return transaction.categoria_nome || '-';
  }, []);

  // Render dos botões de ação
  const renderActionButtons = () => {
    const baseButtonClass = "p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center";

    // Verificar se é uma fatura
    if (transaction.is_fatura) {
      return (
        <div className="flex gap-2">
          {onInvoiceClick && (
            <button
              onClick={() => onInvoiceClick(transaction)}
              className={`${baseButtonClass} text-slate-400 hover:text-coral-500 hover:bg-coral-50`}
              title="Ver detalhes da fatura"
            >
              <CreditCard className="w-4 h-4" />
            </button>
          )}
          {onDeleteInvoice && (
            <button
              onClick={() => onDeleteInvoice(transaction.id)}
              className={`${baseButtonClass} text-slate-400 hover:text-red-500 hover:bg-red-50`}
              title="Excluir fatura"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    // Lançamentos fixos virtuais (pendentes)
    if (transaction.is_virtual || transaction.is_virtual_fixed ||
        (transaction.fatura_details && transaction.fatura_details.is_virtual)) {
      return (
        <div className="flex gap-2">
          {onConfirmFixedTransaction && (
            <button
              onClick={() => {
                const fixoId = transaction.fixed_transaction_id ||
                              transaction.fixo_id ||
                              (transaction.fatura_details && transaction.fatura_details.fixo_id);
                if (fixoId) {
                  onConfirmFixedTransaction(fixoId, transaction.data);
                }
              }}
              className={`${baseButtonClass} text-slate-400 hover:text-emerald-500 hover:bg-emerald-50`}
              title="Confirmar recebimento/pagamento completo"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {onPartialFixedTransaction && (
            <button
              onClick={() => {
                const fixoId = transaction.fixed_transaction_id ||
                              transaction.fixo_id ||
                              (transaction.fatura_details && transaction.fatura_details.fixo_id);
                if (fixoId) {
                  onPartialFixedTransaction(fixoId, transaction.data);
                }
              }}
              className={`${baseButtonClass} text-slate-400 hover:text-blue-500 hover:bg-blue-50`}
              title="Registrar recebimento/pagamento parcial"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          )}
          {onEditFixedTransaction && (
            <button
              onClick={() => {
                const fixoId = transaction.fixed_transaction_id ||
                              transaction.fixo_id ||
                              (transaction.fatura_details && transaction.fatura_details.fixo_id);
                if (fixoId) {
                  onEditFixedTransaction(fixoId);
                }
              }}
              className={`${baseButtonClass} text-slate-400 hover:text-coral-500 hover:bg-coral-50`}
              title="Editar lançamento fixo"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    // Lançamentos fixos confirmados (que podem ser desfeitos)
    if (canUndoFixedTransaction(transaction)) {
      return (
        <div className="flex gap-2">
          {onUndoFixedTransaction && (
            <button
              onClick={() => onUndoFixedTransaction(transaction.id)}
              className={`${baseButtonClass} text-slate-400 hover:text-blue-500 hover:bg-blue-50`}
              title="Desfazer confirmação e retornar ao estado pendente"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {onEditFixedTransaction && (
            <button
              onClick={() => {
                const fixoId = transaction.fixed_transaction_id ||
                              transaction.fixo_id ||
                              (transaction.fatura_details && transaction.fatura_details.fixo_id);
                if (fixoId) {
                  onEditFixedTransaction(fixoId);
                }
              }}
              className={`${baseButtonClass} text-slate-400 hover:text-coral-500 hover:bg-coral-50`}
              title="Editar lançamento fixo"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      );
    }

    // Botões padrão para transações normais
    return (
      <div className="flex gap-2">
        {/* Botão para efetivar transações pendentes */}
        {transaction.status === 'pendente' && onActivateTransaction && (
          <button
            onClick={() => onActivateTransaction(transaction.id)}
            className={`${baseButtonClass} text-slate-400 hover:text-emerald-500 hover:bg-emerald-50`}
            title="Efetivar transação"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        {onEditTransaction && (
          <button
            onClick={() => onEditTransaction(transaction)}
            className={`${baseButtonClass} text-slate-400 hover:text-coral-500 hover:bg-coral-50`}
            title="Editar"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
        {onDeleteTransaction && (
          <button
            onClick={() => onDeleteTransaction(transaction.id)}
            className={`${baseButtonClass} text-slate-400 hover:text-red-500 hover:bg-red-50`}
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header do Card */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Ícone da transação */}
          <div className="flex-shrink-0 mt-1">
            {getTransactionIcon(transaction.tipo)}
          </div>

          {/* Informações principais */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-medium text-slate-900 truncate mb-1">
              {transaction.descricao}
            </h3>

            {/* Informações de parcela se existir */}
            {transaction.total_parcelas && (
              <p className="text-xs text-slate-500 mb-2">
                {transaction.parcela_atual}/{transaction.total_parcelas}x
              </p>
            )}

            {/* Badges de tipo e recorrência */}
            <div className="flex items-center gap-2 mb-2">
              {getTransactionTypeBadge(transaction.tipo)}
              {getRecurrenceBadge(transaction.tipo_recorrencia || 'unica')}
            </div>
          </div>
        </div>

        {/* Valor */}
        <div className="text-right flex-shrink-0 ml-3">
          <p className={cn(
            "text-base sm:text-lg font-bold",
            transaction.tipo === 'receita'
              ? 'text-emerald-600'
              : transaction.tipo === 'despesa'
                ? 'text-red-600'
                : transaction.tipo === 'despesa_cartao'
                  ? 'text-purple-600'
                  : 'text-blue-600'
          )}>
            {['despesa', 'despesa_cartao'].includes(transaction.tipo) ? '-' : '+'}
            {formatCurrency(transaction.valor)}
          </p>
        </div>
      </div>

      {/* Informações secundárias */}
      <div className="flex justify-between items-center text-xs sm:text-sm text-slate-500 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{getCategoryName(transaction)}</span>
          <span>•</span>
          <span className="truncate">{getAccountName(transaction)}</span>
        </div>
        <span className="flex-shrink-0 ml-2">{formatDate(transaction.data)}</span>
      </div>

      {/* Footer com status e ações */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {transaction.is_virtual_fixed ? (
            <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Aguardando Confirmação
            </span>
          ) : transaction.tipo === 'despesa_cartao' ? null : (
            getStatusBadge(transaction.status || 'pendente', transaction)
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex-shrink-0">
          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
};