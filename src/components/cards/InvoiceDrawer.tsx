import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { ModernButton, ModernBadge } from '../ui/modern';
import InvoicePaymentModal from './InvoicePaymentModal';
import { TransactionFormModal } from '../forms/transaction/TransactionFormModal';
import CreditCardExpenseForm from '../forms/transaction/CreditCardExpenseForm';
import {
  faturaService,
  transactionService,
  Fatura,
  CreditCardWithUsage,
  FaturaTransaction,
  CreateTransactionRequest
} from '../../services/api';
import FilterChip from '../ui/FilterChip';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { getCategoryIcon } from '../../utils/getCategoryIcon';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../store/AuthContext';


// Types
interface InvoiceDrawerProps {
  card: CreditCardWithUsage | null;
  isOpen: boolean;
  onClose: () => void;
}

type SortOption = 'date' | 'value_asc' | 'value_desc';
type FilterType = 'all' | 'parceladas' | 'fixas';

// Helpers
const formatMonthYear = (date: Date) => {
    const month = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${year}`;
}

export default function InvoiceDrawer({ card, isOpen, onClose }: InvoiceDrawerProps) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [invoice, setInvoice] = useState<Fatura | null>(null);
  const [dynamicTotal, setDynamicTotal] = useState<number>(0);
  const [transactions, setTransactions] = useState<FaturaTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isTransactionFormOpen, setTransactionFormOpen] = useState(false);

  useEffect(() => {
    if (isOpen && card) {
      loadInvoiceData();
    }
  }, [isOpen, card, currentMonth]);

  const loadInvoiceData = async () => {
    if (!card) return;
    setLoading(true);
    setError(null);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      // 1. Get the fatura record
      const invoiceRes = await faturaService.findByCardAndMonth(card.id, year, month);
      if (invoiceRes.error) throw new Error(invoiceRes.error.message);
      const fatura = invoiceRes.data?.[0] || null;
      setInvoice(fatura);

      if (fatura) {
        // 2. Use RPC to get transactions by fatura period (not calendar month)
        const txRes = await faturaService.getInvoiceTransactions(fatura.id);
        if (txRes.error) throw new Error(txRes.error.message);
        setTransactions(txRes.data || []);

        // 3. Calculate dynamic total (includes virtual fixed)
        const total = (txRes.data || []).reduce((sum, t) => sum + Number(t.valor), 0);
        setDynamicTotal(total);
      } else {
        setTransactions([]);
        setDynamicTotal(0);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (formData: any) => {
    if (!card || !user) return;
    setIsSubmitting(true);
    try {
      const newTransaction: CreateTransactionRequest = {
        ...formData,
        valor: Number(formData.valor),
        user_id: user.id,
        tipo: 'despesa',
        status: 'efetivado',
        cartao_id: card.id,
        // Garantir que campos não preenchidos sejam nulos
        recorrente: formData.is_recorrente,
        parcelado: formData.is_parcelado,
        total_parcelas: formData.is_parcelado ? formData.parcelamento.total_parcelas : null,
      };
      const { error } = await transactionService.create(newTransaction);
      if (error) throw error;
      
      toast.success('Despesa adicionada!');
      setTransactionFormOpen(false);
      await loadInvoiceData();
    } catch (err: any) {
      toast.error(err.message || 'Falha ao adicionar despesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];
    if (filterType === 'parceladas') filtered = filtered.filter(t => t.total_parcelas != null);
    if (filterType === 'fixas') filtered = filtered.filter(t => t.is_fixed);
    const sorters = {
      date: (a: FaturaTransaction, b: FaturaTransaction) => new Date(b.data).getTime() - new Date(a.data).getTime(),
      value_asc: (a: FaturaTransaction, b: FaturaTransaction) => Number(a.valor) - Number(b.valor),
      value_desc: (a: FaturaTransaction, b: FaturaTransaction) => Number(b.valor) - Number(a.valor),
    };
    return filtered.sort(sorters[sortBy]);
  }, [transactions, sortBy, filterType]);

  const insights = useMemo(() => ({
    totalCount: transactions.length,
    installmentCount: transactions.filter(t => t.total_parcelas != null).length,
    recurringCount: transactions.filter(t => t.is_fixed).length,
  }), [transactions]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
    setFilterType('all');
  };
  
  const handleFilterClick = (type: FilterType) => {
    setFilterType(current => (current === type ? 'all' : type));
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const variants = { paga: 'success', fechada: 'warning', aberta: 'info' } as const;
    return <ModernBadge variant={variants[status as keyof typeof variants] || 'default'} size="sm">{status.charAt(0).toUpperCase() + status.slice(1)}</ModernBadge>;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-slate-100 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <header className="flex-shrink-0 px-4 py-3 border-b border-slate-200 bg-white/70 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-lg font-bold text-deep-blue">{card?.nome}</h2>
                        <div className="flex items-baseline space-x-2">
                            <span className="font-semibold text-base text-deep-blue">{formatCurrency(dynamicTotal)}</span>
                            {getStatusBadge(invoice?.status)}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <ModernButton variant="ghost" size="icon" onClick={() => navigateMonth('prev')} className="text-slate-500 hover:bg-slate-200"><ChevronLeft className="w-4 h-4" /></ModernButton>
                        <span className="text-sm font-semibold text-slate-700 w-16 text-center capitalize">{formatMonthYear(currentMonth)}</span>
                        <ModernButton variant="ghost" size="icon" onClick={() => navigateMonth('next')} className="text-slate-500 hover:bg-slate-200"><ChevronRight className="w-4 h-4" /></ModernButton>
                        <ModernButton variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:bg-slate-200 ml-2"><X className="w-4 h-4" /></ModernButton>
                    </div>
                </div>
            </header>
            
            {/* Content */}
            <main className="flex-1 overflow-y-auto">
              {loading ? (
                 <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-coral-500" /></div>
              ) : error ? (
                 <div className="p-6 text-center text-red-500">{error}</div>
              ) : (
                <div className="p-3 pb-20">
                  {/* Filtros compactos */}
                  <div className="flex items-center gap-2 mb-4">
                    <FilterChip
                      label={`Todos (${insights.totalCount})`}
                      isActive={filterType === 'all'}
                      onClick={() => handleFilterClick('all')}
                    />
                    <FilterChip
                      label={`Parceladas (${insights.installmentCount})`}
                      isActive={filterType === 'parceladas'}
                      onClick={() => handleFilterClick('parceladas')}
                    />
                    <FilterChip
                      label={`Fixas (${insights.recurringCount})`}
                      isActive={filterType === 'fixas'}
                      onClick={() => handleFilterClick('fixas')}
                    />
                  </div>

                  {/* Lista estilo extrato */}
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {/* Cabeçalho da tabela */}
                    <div className="flex items-center py-2 px-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      <span className="w-12">Data</span>
                      <span className="flex-1 ml-8">Descrição</span>
                      <span className="text-right">Valor</span>
                    </div>

                    {/* Lista de transações */}
                    {filteredAndSortedTransactions.length > 0 ? (
                      filteredAndSortedTransactions.map((tx, index) => (
                        <TransactionItem
                          key={tx.id}
                          transaction={tx}
                          isLast={index === filteredAndSortedTransactions.length - 1}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <p className="text-sm">Nenhum lançamento para este período.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
            
            {/* Footer */}
            <footer className="flex-shrink-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200">
                <div className="flex items-center justify-center gap-3">
                    <ModernButton 
                      size="default" 
                      onClick={() => setTransactionFormOpen(true)} 
                      className="bg-deep-blue text-white hover:bg-deep-blue/90 h-11 px-6"
                    >
                      Adicionar Despesa
                    </ModernButton>
                    <ModernButton 
                      size="default" 
                      onClick={() => setPaymentModalOpen(true)} 
                      className="h-11 px-6" 
                      variant="primary" 
                      disabled={!invoice || invoice.status === 'paga'}
                    >
                      Pagar Fatura
                    </ModernButton>
                </div>
            </footer>
          </motion.div>

          {invoice && <InvoicePaymentModal invoice={invoice} isOpen={isPaymentModalOpen} onClose={() => setPaymentModalOpen(false)} onSuccess={loadInvoiceData} />}
          <TransactionFormModal isOpen={isTransactionFormOpen} onClose={() => setTransactionFormOpen(false)} type="despesa_cartao">
            <CreditCardExpenseForm 
              onSave={handleAddExpense} 
              onCancel={() => setTransactionFormOpen(false)} 
              isSubmitting={isSubmitting} 
              defaultCardId={card?.id}
            />
          </TransactionFormModal>
        </>
      )}
    </AnimatePresence>
  );
}

const TransactionItem = ({ transaction, isLast }: { transaction: FaturaTransaction, isLast: boolean }) => {
  const transactionDate = new Date(transaction.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <div className={cn(
      "flex items-center py-2 px-3 hover:bg-slate-50/50 transition-colors",
      !isLast && "border-b border-slate-100"
    )}>
      {/* Data */}
      <span className="text-[11px] text-slate-400 w-12 flex-shrink-0 font-medium">
        {transactionDate}
      </span>

      {/* Ícone da categoria (compacto) */}
      {transaction.categoria_icone && (
        <div
          className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center mr-2"
          style={{ backgroundColor: `${transaction.categoria_cor || '#6B7280'}15` }}
        >
          {getCategoryIcon(transaction.categoria_icone, transaction.categoria_cor || '#6B7280', 14)}
        </div>
      )}

      {/* Descrição + badges */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-[13px] text-slate-700 truncate">{transaction.descricao}</span>
        {transaction.total_parcelas != null && (
          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
            {transaction.parcela_atual}/{transaction.total_parcelas}
          </span>
        )}
        {transaction.is_fixed && (
          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
            Fixa
          </span>
        )}
      </div>

      {/* Valor */}
      <span className="text-[13px] font-semibold text-slate-800 ml-3 whitespace-nowrap tabular-nums">
        {formatCurrency(Number(transaction.valor))}
      </span>
    </div>
  );
}; 