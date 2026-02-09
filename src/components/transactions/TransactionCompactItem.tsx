import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Trash2,
  CheckCircle,
  RotateCcw,
  CreditCard,
  XCircle,
  Power,
} from 'lucide-react';
import { cn } from '../../utils/cn';
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
  onEfetivar?: (transaction: Transaction) => void;
  onDeleteFixedVirtual?: (transaction: Transaction, scope: 'this_month' | 'all') => void;
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
  onEfetivar,
  onDeleteFixedVirtual,
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
  const isCard = transaction.tipo === 'despesa_cartao';
  const categoryName = transaction.categoria_nome || '';
  const accountName = transaction.conta_nome || transaction.cartao_nome || '';

  // Subtitle - only non-empty parts
  const subtitleParts = [categoryName, accountName].filter(Boolean);
  const subtitle = subtitleParts.join(' · ');

  // Recurrence label
  const getRecurrenceLabel = () => {
    switch (transaction.tipo_recorrencia) {
      case 'fixa': return 'Fixa';
      case 'parcelada':
        return transaction.total_parcelas
          ? `Parcela ${transaction.parcela_atual}/${transaction.total_parcelas}`
          : 'Parcelada';
      default: return 'Unica';
    }
  };

  // Status info
  const getStatusInfo = (): { label: string; color: string; badgeClass: string } => {
    if (transaction.is_fatura || transaction.tipo_registro === 'fatura') {
      switch (transaction.status) {
        case 'paga': return { label: 'Paga', color: 'text-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        case 'fechada': return { label: 'Fechada', color: 'text-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
        default: return { label: 'Aberta', color: 'text-red-500', badgeClass: 'bg-red-50 text-red-700 border-red-200' };
      }
    }
    if (transaction.is_virtual_fixed) return { label: 'Previsto', color: 'text-blue-500', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    switch (transaction.status) {
      case 'efetivado':
      case 'concluido':
      case 'confirmado':
        return { label: 'Efetivada', color: 'text-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'pendente': return { label: 'Pendente', color: 'text-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'cancelado': return { label: 'Cancelado', color: 'text-red-500', badgeClass: 'bg-red-50 text-red-700 border-red-200' };
      default: return { label: '', color: '', badgeClass: '' };
    }
  };

  const canUndo = transaction.origem === 'fixo' &&
    transaction.status === 'confirmado' &&
    transaction.fixo_id &&
    Math.floor((Date.now() - new Date(transaction.data).getTime()) / (1000 * 60 * 60 * 24)) <= 30;

  const isVirtual = transaction.is_virtual || transaction.is_virtual_fixed ||
    (transaction.fatura_details && transaction.fatura_details.is_virtual);

  const statusInfo = getStatusInfo();
  const isPending = transaction.status === 'pendente' || isVirtual;

  const btnClass = "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors active:scale-95";

  const alreadyEffectuated = ['efetivado', 'confirmado', 'concluido', 'paga'].includes(transaction.status);
  const isFixedOrigin = transaction.origem === 'fixo' || isVirtual;

  const renderActions = () => {
    // Faturas: Ver fatura + Excluir
    if (transaction.is_fatura) {
      return (
        <>
          {onInvoiceClick && (
            <button onClick={(e) => { e.stopPropagation(); onInvoiceClick(transaction); }} className={cn(btnClass, "text-purple-600 bg-purple-50")}>
              <CreditCard className="w-3.5 h-3.5" /> Ver fatura
            </button>
          )}
          {onDeleteInvoice && (
            <button onClick={(e) => { e.stopPropagation(); onDeleteInvoice(transaction.id); }} className={cn(btnClass, "text-red-500 bg-red-50")}>
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </button>
          )}
        </>
      );
    }

    // Transacoes normais/fixas/virtuais: mesma logica do desktop
    return (
      <>
        {/* 1. Efetivar / Desfazer */}
        {canUndo ? (
          onUndoFixedTransaction && (
            <button onClick={(e) => { e.stopPropagation(); onUndoFixedTransaction(transaction.id); }} className={cn(btnClass, "text-blue-600 bg-blue-50")}>
              <RotateCcw className="w-3.5 h-3.5" /> Desfazer
            </button>
          )
        ) : !alreadyEffectuated && onEfetivar ? (
          <button onClick={(e) => { e.stopPropagation(); onEfetivar(transaction); }} className={cn(btnClass, "text-emerald-600 bg-emerald-50")}>
            <CheckCircle className="w-3.5 h-3.5" /> Efetivar
          </button>
        ) : null}

        {/* 2. Editar */}
        {onEditTransaction && (
          <button onClick={(e) => { e.stopPropagation(); onEditTransaction(transaction); }} className={cn(btnClass, "text-slate-600 bg-slate-100")}>
            <Edit3 className="w-3.5 h-3.5" /> Editar
          </button>
        )}

        {/* 3. Excluir - virtual fixa: 2 opcoes de escopo; normal: botao simples */}
        {isVirtual && isFixedOrigin && onDeleteFixedVirtual ? (
          <>
            <button onClick={(e) => { e.stopPropagation(); onDeleteFixedVirtual(transaction, 'this_month'); }} className={cn(btnClass, "text-red-500 bg-red-50")}>
              <XCircle className="w-3.5 h-3.5" /> Cancelar mes
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteFixedVirtual(transaction, 'all'); }} className={cn(btnClass, "text-red-600 bg-red-50")}>
              <Power className="w-3.5 h-3.5" /> Desativar
            </button>
          </>
        ) : !isVirtual && onDeleteTransaction ? (
          <button onClick={(e) => { e.stopPropagation(); onDeleteTransaction(transaction.id); }} className={cn(btnClass, "text-red-500 bg-red-50")}>
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        ) : null}
      </>
    );
  };

  return (
    <div
      className={cn(
        "transition-colors cursor-pointer",
        isExpanded ? "bg-slate-50/60" : "active:bg-slate-50/80"
      )}
      onClick={onToggle}
    >
      {/* Main row - clean style: thin color bar + description + value */}
      <div className="flex items-center px-4 py-2.5 gap-3">
        {/* Left: thin color indicator */}
        <div
          className={cn(
            "w-[3px] self-stretch rounded-full flex-shrink-0 min-h-[32px]",
            isIncome ? "bg-emerald-500" : isCard ? "bg-purple-400" : isExpense ? "bg-red-400" : "bg-slate-200"
          )}
        />

        {/* Center: description + category */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-tight truncate text-slate-800">
            {transaction.descricao}
          </p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Status badge on main row for notable statuses */}
        {(isPending || transaction.status === 'cancelado') && statusInfo.label && (
          <span className={cn(
            "text-[9px] px-1 py-px rounded font-medium border flex-shrink-0",
            statusInfo.badgeClass
          )}>
            {statusInfo.label}
          </span>
        )}

        {/* Right: value */}
        <div className="flex-shrink-0 text-right pl-2">
          <p className={cn(
            "text-sm font-semibold tabular-nums whitespace-nowrap",
            isIncome ? "text-emerald-600" : isExpense ? "text-red-500" : "text-slate-700"
          )}>
            {isExpense ? '- ' : isIncome ? '+ ' : ''}
            {formatCurrency(transaction.valor)}
          </p>
          {transaction.tipo_recorrencia === 'parcelada' && transaction.total_parcelas && (
            <p className="text-[10px] text-slate-400 mt-px">
              {transaction.parcela_atual}/{transaction.total_parcelas}x
            </p>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {/* Thin divider */}
              <div className="border-t border-slate-100 mb-2" />

              {/* Details as simple inline text */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mb-2.5">
                <span>{formatLocalDate(transaction.data)}</span>
                <span className="text-slate-200">|</span>
                <span>{getRecurrenceLabel()}</span>
                {statusInfo.label && (
                  <>
                    <span className="text-slate-200">|</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium border", statusInfo.badgeClass)}>
                      {statusInfo.label}
                    </span>
                  </>
                )}
              </div>

              {/* Observation */}
              {transaction.observacao && (
                <p className="text-[11px] text-slate-300 mb-2.5 line-clamp-2 italic">
                  {transaction.observacao}
                </p>
              )}

              {/* Actions row */}
              <div className="flex flex-wrap gap-2">
                {renderActions()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
