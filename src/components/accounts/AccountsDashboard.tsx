import { useMemo } from 'react';
import type { Account } from '../../services/api/AccountService';
import { ModernCard, AnimatedNumber } from '../ui/modern';
import { Banknote, Landmark, TrendingDown, TrendingUp } from 'lucide-react';

interface AccountsDashboardProps {
  accounts: Account[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
};

// Função utilitária para padronizar o roxo
const getAccountColor = (cor?: string) => {
  if (!cor) return '#102542';
  const roxos = ['#a259cf', '#8e44ad', '#9b59b6', '#7c3aed', '#6d28d9', '#8b5cf6', '#a78bfa'];
  if (roxos.includes(cor.toLowerCase())) return '#9A279E';
  return cor;
};

const AccountsDashboard = ({ accounts }: AccountsDashboardProps) => {
  const stats = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return {
        totalBalance: 0,
        accountCount: 0,
        highestBalanceAccount: null,
        lowestBalanceAccount: null,
      };
    }

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.saldo_atual, 0);
    const accountCount = accounts.length;

    const sortedAccounts = [...accounts].sort((a, b) => b.saldo_atual - a.saldo_atual);
    const highestBalanceAccount = sortedAccounts[0];
    const lowestBalanceAccount = sortedAccounts[sortedAccounts.length - 1];

    return {
      totalBalance,
      accountCount,
      highestBalanceAccount,
      lowestBalanceAccount,
    };
  }, [accounts]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Saldo Total */}
      <ModernCard variant="metric" className="p-5 bg-white border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Saldo Total</h3>
          <Banknote className="w-5 h-5 text-slate-400" />
        </div>
        <AnimatedNumber
          value={stats.totalBalance}
          className="text-3xl font-bold text-deep-blue tracking-tight"
          format={formatCurrency}
          duration={2000}
        />
      </ModernCard>

      {/* Total de Contas */}
      <ModernCard variant="metric" className="p-5 bg-white border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total de Contas</h3>
          <Landmark className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-3xl font-bold text-deep-blue tracking-tight">{stats.accountCount}</p>
      </ModernCard>

      {/* Maior Saldo */}
      <ModernCard variant="metric" className="p-5 bg-white border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Maior Saldo</h3>
          <TrendingUp className="w-5 h-5 text-slate-400" />
        </div>
        <div className="min-w-0 overflow-hidden">
          <p className="text-xl font-bold truncate text-deep-blue tracking-tight mb-1 max-w-full min-w-0" title={stats.highestBalanceAccount?.nome}>
            {stats.highestBalanceAccount?.nome || '-'}
          </p>
          <p className="text-sm font-medium text-slate-500">{formatCurrency(stats.highestBalanceAccount?.saldo_atual || 0)}</p>
        </div>
      </ModernCard>

      {/* Menor Saldo */}
      <ModernCard variant="metric" className="p-5 bg-white border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Menor Saldo</h3>
          <TrendingDown className="w-5 h-5 text-slate-400" />
        </div>
        <div className="min-w-0 overflow-hidden">
          <p className="text-xl font-bold truncate text-deep-blue tracking-tight mb-1 max-w-full min-w-0" title={stats.lowestBalanceAccount?.nome}>
            {stats.lowestBalanceAccount?.nome || '-'}
          </p>
          <p className="text-sm font-medium text-slate-500">{formatCurrency(stats.lowestBalanceAccount?.saldo_atual || 0)}</p>
        </div>
      </ModernCard>
    </div>
  );
};

export default AccountsDashboard;
