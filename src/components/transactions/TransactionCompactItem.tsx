import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Edit3,
  Trash2,
  CheckCircle,
  DollarSign,
  RotateCcw,
  CreditCard,
  Calendar,
  Tag,
  Wallet,
  Repeat,
  FileText,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { getCategoryIcon } from '../../utils/getCategoryIcon';
import { formatLocalDate } from '../../utils/format';

type Transaction = any;

interface TransactionCompactItemProps {
  transaction: Transaction;
  isExpanded: boolean;
  onToggle: () => void;
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

export const TransactionCompactItem: React.FC<TransactionCompactItemProps> = ({
  transaction,
  isExpanded,
  onToggle,
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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const isExpense = ['despesa', 'despesa_cartao'].includes(transaction.tipo);
  const isIncome = transaction.tipo === 'receita';
  const categoryName = transaction.categoria_nome || '-';
  const accountName = transaction.conta_nome || transaction.cartao_nome || '-';
  const categoryIcon = transaction.categoria_icone;
  const categoryColor = transaction.categoria_cor || '#6B7280';

  // Recurrence label
  const getRecurrenceLabel = () => {
    switch (transaction.tipo_recorrencia) {
      case 'fixa': return 'Fixa';
      case 'parcelada':
        return transaction.total_parcelas
          ? `${transaction.parcela_atual}/${transaction.total_parcelas}x`
          : 'Parcelada';
      default: return 'Unica';
    }
  };

  // Status label
  const getStatusLabel = () => {
    if (transaction.is_fatura || transaction.tipo_registro === 'fatura') {
      switch (transaction.status) {
        case 'paga': return 'Paga';
        case 'fechada': return 'Fechada';
        default: return 'Aberta';
      }
    }
    if (transaction.is_virtual_fixed) return 'Aguardando';
    switch (transaction.status) {
      case 'efetivado':
      case 'concluido':
      case 'confirmado':
        return 'Efetivada';
      case 'pendente': return 'Pendente';
      case 'cancelado': return 'Cancelado';
      default: return '-';
    }
  };

  // Can undo fixed transaction
  const canUndo = transaction.origem === 'fixo' &&
    transaction.status === 'confirmado' &&
    transaction.fixo_id &&
    Math.floor((Date.now() - new Date(transaction.data).getTime()) / (1000 * 60 * 60 * 24)) <= 30;

  // Is virtual/pending fixed
  const isVirtual = transaction.is_virtual || transaction.is_virtual_fixed ||
    (transaction.fatura_details && transaction.fatura_details.is_virtual);

  const btnClass = "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px]";

  const renderActions = () => {
    // Invoice
    if (transaction.is_fatura) {
      return (
        <div className="flex gap-2">
          {onInvoiceClick && (
            <button onClick={() => onInvoiceClick(transaction)} className={cn(btnClass, "text-purple-600 bg-purple-50 active:bg-purple-100")}>
              <CreditCard className="w-3.5 h-3.5" /> Ver fatura
            </button>
          )}
          {onDeleteInvoice && (
            <button onClick={() => onDeleteInvoice(transaction.id)} className={cn(btnClass, "text-red-600 bg-red-50 active:bg-red-100")}>
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          )}
        </div>
      );
    }

    // Virtual fixed transactions
    if (isVirtual) {
      const fixoId = transaction.fixed_transaction_id || transaction.fixo_id ||
        (transaction.fatura_details && transaction.fatura_details.fixo_id);
      return (
        <div className="flex flex-wrap gap-2">
          {onConfirmFixedTransaction && fixoId && (
            <button onClick={() => onConfirmFixedTransaction(fixoId, transaction.data)} className={cn(btnClass, "text-emerald-600 bg-emerald-50 active:bg-emerald-100")}>
              <CheckCircle className="w-3.5 h-3.5" /> Confirmar
            </button>
          )}
          {onPartialFixedTransaction && fixoId && (
            <button onClick={() => onPartialFixedTransaction(fixoId, transaction.data)} className={cn(btnClass, "text-blue-600 bg-blue-50 active:bg-blue-100")}>
              <DollarSign className="w-3.5 h-3.5" /> Parcial
            </button>
          )}
          {onEditFixedTransaction && fixoId && (
            <button onClick={() => onEditFixedTransaction(fixoId)} className={cn(btnClass, "text-coral-600 bg-coral-50 active:bg-coral-100")}>
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          )}
        </div>
      );
    }

    // Undoable fixed confirmed
    if (canUndo) {
      const fixoId = transaction.fixed_transaction_id || transaction.fixo_id;
      return (
        <div className="flex gap-2">
          {onUndoFixedTransaction && (
            <button onClick={() => onUndoFixedTransaction(transaction.id)} className={cn(btnClass, "text-blue-600 bg-blue-50 active:bg-blue-100")}>
              <RotateCcw className="w-3.5 h-3.5" /> Desfazer
            </button>
          )}
          {onEditFixedTransaction && fixoId && (
            <button onClick={() => onEditFixedTransaction(fixoId)} className={cn(btnClass, "text-coral-600 bg-coral-50 active:bg-coral-100")}>
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          )}
        </div>
      );
    }

    // Normal transactions
    return (
      <div className="flex gap-2">
        {transaction.status === 'pendente' && onActivateTransaction && (
          <button onClick={() => onActivateTransaction(transaction.id)} className={cn(btnClass, "text-emerald-600 bg-emerald-50 active:bg-emerald-100")}>
            <CheckCircle className="w-3.5 h-3.5" /> Efetivar
          </button>
        )}
        {onEditTransaction && (
          <button onClick={() => onEditTransaction(transaction)} className={cn(btnClass, "text-slate-600 bg-slate-100 active:bg-slate-200")}>
            <Edit3 className="w-3.5 h-3.5" /> Editar
          </button>
        )}
        {onDeleteTransaction && (
          <button onClick={() => onDeleteTransaction(transaction.id)} className={cn(btnClass, "text-red-600 bg-red-50 active:bg-red-100")}>
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Compact row - tappable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-slate-50 transition-colors"
      >
        {/* Category icon */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${categoryColor}15` }}
        >
          {categoryIcon ? (
            getCategoryIcon(categoryIcon, categoryColor, 16)
          ) : (
            <Tag className="w-4 h-4 text-slate-400" />
          )}
        </div>

        {/* Description + subtitle */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate leading-tight">
            {transaction.descricao}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {categoryName} · {accountName}
          </p>
        </div>

        {/* Value + chevron */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn(
            "text-sm font-semibold tabular-nums",
            isIncome ? 'text-emerald-600' : isExpense ? 'text-red-500' : 'text-slate-700'
          )}>
            {isExpense ? '-' : isIncome ? '+' : ''}
            {formatCurrency(transaction.valor)}
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 text-slate-300 transition-transform duration-200",
            isExpanded && "rotate-180"
          )} />
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 ml-11 space-y-3">
              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatLocalDate(transaction.data)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Wallet className="w-3 h-3" />
                  <span className="truncate">{accountName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Repeat className="w-3 h-3" />
                  <span>{getRecurrenceLabel()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle className="w-3 h-3" />
                  <span>{getStatusLabel()}</span>
                </div>
              </div>

              {/* Observation if exists */}
              {transaction.observacao && (
                <div className="flex items-start gap-1.5 text-xs text-slate-400">
                  <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{transaction.observacao}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-1">
                {renderActions()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
