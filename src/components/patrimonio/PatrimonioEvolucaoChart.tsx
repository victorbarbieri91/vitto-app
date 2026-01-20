import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import type { EvolucaoPatrimonial } from '../../types/patrimonio';

interface PatrimonioEvolucaoChartProps {
  dados: EvolucaoPatrimonial[];
  isLoading?: boolean;
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function PatrimonioEvolucaoChart({
  dados,
  isLoading = false
}: PatrimonioEvolucaoChartProps) {
  const { size } = useResponsiveClasses();
  const isMobile = size === 'mobile';

  const chartData = useMemo(() => {
    return dados.map(item => ({
      ...item,
      label: `${MESES_ABREV[item.mes - 1]}/${String(item.ano).slice(2)}`,
      mesAno: `${item.mes}/${item.ano}`
    }));
  }, [dados]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calcular variacao total do periodo
  const variacaoTotal = useMemo(() => {
    if (dados.length < 2) return { valor: 0, percentual: 0 };
    const primeiro = dados[0];
    const ultimo = dados[dados.length - 1];
    const valor = ultimo.patrimonio_total - primeiro.patrimonio_total;
    const percentual = primeiro.patrimonio_total > 0
      ? (valor / primeiro.patrimonio_total) * 100
      : 0;
    return { valor, percentual };
  }, [dados]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-800">{label}</p>
          <p className="text-sm text-deep-blue font-medium">
            {formatCurrencyFull(data.patrimonio_total)}
          </p>
          {data.variacao_mensal !== 0 && (
            <p className={cn(
              "text-xs",
              data.variacao_mensal > 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {data.variacao_mensal > 0 ? '+' : ''}{formatCurrencyFull(data.variacao_mensal)}
              {' '}({data.variacao_percentual > 0 ? '+' : ''}{data.variacao_percentual.toFixed(1)}%)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4 animate-pulse" />
        <div className="h-48 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Evolucao Patrimonial</h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <p className="text-sm">Sem dados historicos</p>
          <p className="text-xs mt-1">O historico sera preenchido automaticamente</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
    >
      {/* Header com titulo e variacao */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Evolucao Patrimonial</h3>

        {variacaoTotal.valor !== 0 && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            variacaoTotal.valor > 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          )}>
            {variacaoTotal.valor > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {variacaoTotal.percentual > 0 ? '+' : ''}{variacaoTotal.percentual.toFixed(1)}% no periodo
            </span>
          </div>
        )}
      </div>

      {/* Grafico */}
      <div className={cn("w-full", isMobile ? "h-48" : "h-64")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#102542" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#102542" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="patrimonio_total"
              stroke="#102542"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPatrimonio)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
