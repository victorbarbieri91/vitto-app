import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Account } from '../../services/api/AccountService';
import { AnimatedNumber } from '../ui/modern';
import { Banknote, Landmark, TrendingUp, TrendingDown } from 'lucide-react';

interface AccountsDashboardProps {
  accounts: Account[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCurrencyFull = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
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
    <div className="flex flex-col gap-2">
      {/* Saldo Total - Cinza escuro */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-slate-700 rounded-xl p-3 shadow-sm"
      >
        <div className="flex justify-between items-start mb-1">
          <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wide">
            Saldo Total
          </p>
          <Banknote className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <AnimatedNumber
          value={stats.totalBalance}
          className="text-lg font-bold text-white"
          format={formatCurrency}
          duration={1500}
        />
      </motion.div>

      {/* Número de Contas - Branco */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="bg-white rounded-xl p-3 shadow-sm border border-slate-200"
      >
        <div className="flex justify-between items-start mb-1">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            Contas
          </p>
          <Landmark className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <p className="text-lg font-bold text-slate-800">{stats.accountCount}</p>
      </motion.div>

      {/* Maior Saldo - Verde/Teal */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="bg-teal-700 rounded-xl p-3 shadow-sm"
      >
        <div className="flex justify-between items-start mb-1">
          <p className="text-[10px] font-medium text-teal-100 uppercase tracking-wide">
            Maior Saldo
          </p>
          <TrendingUp className="w-3.5 h-3.5 text-teal-200" />
        </div>
        <p
          className="text-sm font-semibold text-white truncate mb-0.5"
          title={stats.highestBalanceAccount?.nome}
        >
          {stats.highestBalanceAccount?.nome || '-'}
        </p>
        <p className="text-xs text-teal-100">
          {formatCurrencyFull(stats.highestBalanceAccount?.saldo_atual || 0)}
        </p>
      </motion.div>

      {/* Menor Saldo - Coral */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="bg-coral-500 rounded-xl p-3 shadow-sm"
      >
        <div className="flex justify-between items-start mb-1">
          <p className="text-[10px] font-medium text-coral-100 uppercase tracking-wide">
            Menor Saldo
          </p>
          <TrendingDown className="w-3.5 h-3.5 text-coral-200" />
        </div>
        <p
          className="text-sm font-semibold text-white truncate mb-0.5"
          title={stats.lowestBalanceAccount?.nome}
        >
          {stats.lowestBalanceAccount?.nome || '-'}
        </p>
        <p className="text-xs text-coral-100">
          {formatCurrencyFull(stats.lowestBalanceAccount?.saldo_atual || 0)}
        </p>
      </motion.div>
    </div>
  );
};

export default AccountsDashboard;
