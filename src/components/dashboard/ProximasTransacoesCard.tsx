import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  CreditCard,
  CalendarClock
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase/client';

interface ProximaTransacao {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa' | 'despesa_cartao';
  categoria_nome: string;
}

type PeriodFilter = 'today' | 'tomorrow' | '3days' | '7days' | '30days';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string; days: number }[] = [
  { value: 'today', label: 'Hoje', days: 0 },
  { value: 'tomorrow', label: 'Amanha', days: 1 },
  { value: '3days', label: '3 dias', days: 3 },
  { value: '7days', label: '7 dias', days: 7 },
  { value: '30days', label: '30 dias', days: 30 },
];

interface ProximasTransacoesCardProps {
  className?: string;
  limit?: number;
}

export default function ProximasTransacoesCard({ className, limit = 5 }: ProximasTransacoesCardProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<ProximaTransacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('7days');

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      try {
        setLoading(true);

        const periodConfig = PERIOD_OPTIONS.find(p => p.value === selectedPeriod);
        const daysToAdd = periodConfig?.days ?? 7;

        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysToAdd);
        const futureStr = futureDate.toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('app_transacoes')
          .select(`
            id,
            descricao,
            valor,
            data,
            tipo,
            app_categoria(nome)
          `)
          .eq('user_id', user.id)
          .eq('status', 'pendente')
          .gte('data', today)
          .lte('data', futureStr)
          .order('data', { ascending: true })
          .limit(limit);

        if (error) throw error;

        const processed: ProximaTransacao[] = (data || []).map((t: any) => ({
          id: t.id,
          descricao: t.descricao,
          valor: Number(t.valor),
          data: t.data,
          tipo: t.tipo,
          categoria_nome: t.app_categoria?.nome || 'Sem categoria',
        }));

        setTransactions(processed);
      } catch (err) {
        console.error('Erro ao buscar proximas transacoes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user, limit, selectedPeriod]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanha';
    if (diffDays <= 7) return `${diffDays}d`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getTypeStyles = (tipo: ProximaTransacao['tipo']) => {
    switch (tipo) {
      case 'receita':
        return {
          icon: <ArrowUpCircle className="w-3.5 h-3.5" />,
          color: 'text-emerald-600',
          bg: 'bg-emerald-500/20',
        };
      case 'despesa_cartao':
        return {
          icon: <CreditCard className="w-3.5 h-3.5" />,
          color: 'text-purple-600',
          bg: 'bg-purple-500/20',
        };
      default:
        return {
          icon: <ArrowDownCircle className="w-3.5 h-3.5" />,
          color: 'text-coral-600',
          bg: 'bg-coral-500/20',
        };
    }
  };

  // Estilo padrao consistente com outros cards
  const cardStyle = 'bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col';
  const headerStyle = 'px-4 py-3 border-b border-slate-100 flex items-center gap-2';

  // Header com filtros reutilizavel
  const renderHeader = (showCount = true) => (
    <div className="px-4 py-2 border-b border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Proximos Lancamentos</h3>
        </div>
        {showCount && (
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {transactions.length}
          </span>
        )}
      </div>

      {/* Filtro de periodo */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {PERIOD_OPTIONS.map(option => (
          <button
            key={option.value}
            onClick={() => setSelectedPeriod(option.value)}
            className={cn(
              "px-2 py-1 text-[10px] font-medium rounded-md transition-colors whitespace-nowrap",
              selectedPeriod === option.value
                ? "bg-deep-blue text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={cn(cardStyle, className)}>
        {renderHeader(false)}
        <div className="p-3 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <div className={cn(cardStyle, className)}>
        {renderHeader(false)}
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="p-3 rounded-full bg-slate-100 mb-2">
            <Clock className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-slate-600 text-sm font-medium">Tudo em dia!</p>
          <p className="text-slate-400 text-xs">Nenhum lancamento pendente</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(cardStyle, className)}>
      {renderHeader(true)}

      {/* Lista */}
      <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {transactions.map((transaction, index) => {
            const styles = getTypeStyles(transaction.tipo);

            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className={cn('p-1.5 rounded-lg', styles.bg, styles.color)}>
                  {styles.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {transaction.descricao}
                  </p>
                </div>

                <div className="text-right flex items-center gap-2">
                  <p className={cn('text-xs font-semibold', styles.color)}>
                    {transaction.tipo === 'receita' ? '+' : '-'}{formatCurrency(transaction.valor)}
                  </p>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {formatRelativeDate(transaction.data)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
