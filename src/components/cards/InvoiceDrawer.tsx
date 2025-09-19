import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  Repeat,
  Copy,
  Plus
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
  Transaction,
  Category,
  CreateTransactionRequest
} from '../../services/api';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      const [invoiceRes, transactionsRes] = await Promise.all([
        faturaService.findByCardAndMonth(card.id, year, month),
        transactionService.listByCardAndMonth(card.id, year, month),
      ]);
      if (invoiceRes.error) throw new Error(invoiceRes.error.message);
      setInvoice(invoiceRes.data?.[0] || null);
      if (transactionsRes.error) throw new Error(transactionsRes.error.message);
      setTransactions(transactionsRes.data || []);
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
    if (filterType === 'parceladas') filtered = filtered.filter(t => t.parcelado);
    if (filterType === 'fixas') filtered = filtered.filter(t => t.recorrente);
    const sorters = {
      date: (a: Transaction, b: Transaction) => new Date(b.data).getTime() - new Date(a.data).getTime(),
      value_asc: (a: Transaction, b: Transaction) => a.valor - b.valor,
      value_desc: (a: Transaction, b: Transaction) => b.valor - a.valor,
    };
    return filtered.sort(sorters[sortBy]);
  }, [transactions, sortBy, filterType]);

  const insights = useMemo(() => ({
    totalCount: transactions.length,
    installmentCount: transactions.filter(t => t.parcelado).length,
    recurringCount: transactions.filter(t => t.recorrente).length,
    biggestPurchase: transactions.reduce((max, t) => t.valor > max.valor ? t : max, { valor: 0 } as Transaction)
  }), [transactions]);
  
  const groupedTransactions = useMemo(() => {
    return filteredAndSortedTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
      if (!acc[date]) acc[date] = [];
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [filteredAndSortedTransactions]);

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
                            <span className="font-semibold text-base text-deep-blue">{formatCurrency(invoice?.valor_total || 0)}</span>
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
                <div className="p-4 pb-24">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <InsightCard 
                      label="Lançamentos" 
                      value={insights.totalCount} 
                      isActive={filterType === 'all'} 
                      onClick={() => handleFilterClick('all')}
                    />
                    <InsightCard 
                      label="Parceladas" 
                      value={insights.installmentCount} 
                      isActive={filterType === 'parceladas'} 
                      onClick={() => handleFilterClick('parceladas')}
                    />
                    <InsightCard 
                      label="Fixas" 
                      value={insights.recurringCount} 
                      isActive={filterType === 'fixas'} 
                      onClick={() => handleFilterClick('fixas')}
                    />
                    <InsightCard 
                      label="Maior Compra" 
                      value={formatCurrency(insights.biggestPurchase.valor)} 
                      description={insights.biggestPurchase.descricao} 
                      isStatic
                    />
                  </div>

                  <div className="space-y-4">
                    {Object.keys(groupedTransactions).length > 0 ? (
                      Object.entries(groupedTransactions).map(([date, dailyTransactions]) => (
                        <div key={date}>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">{date}</p>
                          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
                             {dailyTransactions.map((tx, index) => (
                              <TransactionItem key={tx.id} transaction={tx} isLast={index === dailyTransactions.length - 1} />
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 text-slate-400">
                        <p className="font-medium">Nenhum lançamento para este período.</p>
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

const InsightCard = ({ label, value, description, isActive, isStatic, onClick }: any) => (
    <div
      className={cn(
        'p-3 rounded-xl transition-all duration-200 border cursor-pointer',
        isActive 
          ? 'bg-coral-500/10 border-coral-500/30 shadow-sm' 
          : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-slate-300'
      )}
      onClick={onClick}
    >
      <p className="text-xs text-slate-600 font-semibold truncate">{label}</p>
      <p className={cn(
        "text-xl font-bold mt-1 transition-colors",
        isActive ? 'text-coral-600' : 'text-deep-blue'
      )}>
        {value}
      </p>
      {isStatic && description && (
        <p className="text-xs text-slate-400 truncate mt-1">{description}</p>
      )}
    </div>
);

const TransactionItem = ({ transaction, isLast }: { transaction: Transaction, isLast: boolean }) => {
  const category = transaction.categoria as Category | undefined;
  return (
    <div className={cn("flex items-center p-3", !isLast && "border-b border-slate-200/80")}>
      {category && (
          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center mr-4" style={{ backgroundColor: `${category.cor}20` }}>
            {getCategoryIcon(category.icone, `${category.cor}`)}
          </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-deep-blue truncate">{transaction.descricao}</p>
        <div className="flex items-center space-x-2 mt-1">
           {transaction.parcelado && <ModernBadge variant="info" size="xs">Parcela {transaction.parcela_atual}/{transaction.total_parcelas}</ModernBadge>}
           {transaction.recorrente && <ModernBadge variant="warning" size="xs">Fixa</ModernBadge>}
        </div>
      </div>
      <span className="font-semibold text-deep-blue ml-4 whitespace-nowrap">{formatCurrency(transaction.valor)}</span>
    </div>
  );
}; 