import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { ModernCard } from '../ui/modern';

interface MonthlyTotalsProps {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
  totalTransacoes: number;
  isLoading?: boolean;
  currentMonth: number;
  currentYear: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MonthlyTotals: React.FC<MonthlyTotalsProps> = ({
  totalReceitas,
  totalDespesas,
  saldoLiquido,
  totalTransacoes,
  isLoading = false,
  currentMonth,
  currentYear
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getSaldoColor = () => {
    if (saldoLiquido > 0) return 'text-emerald-600';
    if (saldoLiquido < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  const getSaldoIcon = () => {
    if (saldoLiquido > 0) return <TrendingUp className="w-5 h-5 text-emerald-500" />;
    if (saldoLiquido < 0) return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <DollarSign className="w-5 h-5 text-slate-500" />;
  };

  if (isLoading) {
    return (
      <ModernCard className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-slate-200 rounded w-48"></div>
            <div className="h-4 bg-slate-200 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-6 bg-slate-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-deep-blue" />
          <h3 className="text-xl font-semibold text-deep-blue">
            Resumo de {MONTHS[currentMonth - 1]} {currentYear}
          </h3>
        </div>
        <div className="text-sm text-slate-500">
          {totalTransacoes} transação{totalTransacoes !== 1 ? 'ões' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Receitas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-slate-600">Receitas</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalReceitas)}
          </div>
        </div>

        {/* Despesas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-slate-600">Despesas</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalDespesas)}
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getSaldoIcon()}
            <span className="text-sm font-medium text-slate-600">Saldo Líquido</span>
          </div>
          <div className={`text-2xl font-bold ${getSaldoColor()}`}>
            {formatCurrency(saldoLiquido)}
          </div>
        </div>

        {/* Balanço Visual */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-deep-blue" />
            <span className="text-sm font-medium text-slate-600">Situação</span>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-slate-600">
              {saldoLiquido > 0 ? 'Superávit' : saldoLiquido < 0 ? 'Déficit' : 'Equilibrado'}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  saldoLiquido > 0 ? 'bg-emerald-500' :
                  saldoLiquido < 0 ? 'bg-red-500' : 'bg-slate-400'
                }`}
                style={{
                  width: `${Math.min(100, Math.abs(saldoLiquido / Math.max(totalReceitas, totalDespesas, 1)) * 100)}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </ModernCard>
  );
};

export default MonthlyTotals;