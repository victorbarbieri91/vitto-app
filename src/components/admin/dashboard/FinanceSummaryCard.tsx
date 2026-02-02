import { useEffect, useState } from 'react';
import { Wallet, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminFinanceService, FinanceSummary } from '../../../services/admin/AdminFinanceService';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export default function FinanceSummaryCard() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await AdminFinanceService.getSummary();
        setSummary(result);
      } catch (error) {
        console.error('Error fetching finance summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse h-full">
        <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 h-full">
        <p className="text-slate-500 text-sm">Erro ao carregar</p>
      </div>
    );
  }

  const hasData = summary.totalDespesas > 0 || summary.totalReceitas > 0;
  const isNegative = summary.saldo < 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-[#3d4f5f]" />
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Financeiro
          </h3>
        </div>
        <Link
          to="/admin/financeiro"
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          Ver detalhes
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Wallet size={24} className="mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">Nenhum lançamento</p>
            <Link
              to="/admin/financeiro"
              className="text-xs text-[#2d6a6a] hover:underline mt-1"
            >
              Registrar despesa
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Receitas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3d6b59]" />
                <span className="text-sm text-slate-600">Receitas</span>
              </div>
              <span className="text-sm font-medium text-slate-700">
                {formatCurrency(summary.totalReceitas)}
              </span>
            </div>

            {/* Despesas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b85450]" />
                <span className="text-sm text-slate-600">Despesas</span>
              </div>
              <span className="text-sm font-medium text-slate-700">
                {formatCurrency(summary.totalDespesas)}
              </span>
            </div>

            {/* Custos fixos */}
            {summary.despesasRecorrentes > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="text-sm text-slate-500">Fixos/mês</span>
                </div>
                <span className="text-sm text-slate-500">
                  {formatCurrency(summary.despesasRecorrentes)}
                </span>
              </div>
            )}

            {/* Saldo - linha separada */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Saldo</span>
              <span className={`text-sm font-bold ${isNegative ? 'text-[#b85450]' : 'text-[#3d6b59]'}`}>
                {formatCurrency(summary.saldo)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
