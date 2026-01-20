import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '../../utils/cn';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import type { PatrimonioPorCategoria, CategoriaAtivo } from '../../types/patrimonio';
import { CATEGORIAS_METADATA } from '../../types/patrimonio';

interface PatrimonioPizzaChartProps {
  dados: PatrimonioPorCategoria[];
  isLoading?: boolean;
  onCategoriaClick?: (categoria: CategoriaAtivo) => void;
}

export default function PatrimonioPizzaChart({
  dados,
  isLoading = false,
  onCategoriaClick
}: PatrimonioPizzaChartProps) {
  const { size } = useResponsiveClasses();
  const isMobile = size === 'mobile';

  const chartData = useMemo(() => {
    return dados.map(item => ({
      name: CATEGORIAS_METADATA[item.categoria]?.nome || item.categoria,
      value: item.valor_total,
      percentual: item.percentual,
      quantidade: item.quantidade_ativos,
      categoria: item.categoria,
      color: CATEGORIAS_METADATA[item.categoria]?.corHex || '#6B7280'
    }));
  }, [dados]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">{formatCurrency(data.value)}</p>
          <p className="text-xs text-slate-500">{data.percentual.toFixed(1)}% do total</p>
          <p className="text-xs text-slate-400">{data.quantidade} ativo(s)</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLegend = () => (
    <div className={cn(
      "grid gap-2 mt-4",
      isMobile ? "grid-cols-2" : "grid-cols-4"
    )}>
      {chartData.map((item, index) => (
        <motion.div
          key={item.categoria}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onCategoriaClick?.(item.categoria as CategoriaAtivo)}
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg transition-colors",
            onCategoriaClick && "cursor-pointer hover:bg-slate-50"
          )}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-700 truncate">{item.name}</p>
            <p className="text-[10px] text-slate-500">{item.percentual.toFixed(1)}%</p>
          </div>
        </motion.div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4 animate-pulse" />
        <div className="flex justify-center">
          <div className="w-48 h-48 rounded-full bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Distribuicao por Categoria</h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <p className="text-sm">Nenhum ativo cadastrado</p>
          <p className="text-xs mt-1">Adicione ativos para ver a distribuicao</p>
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
      <h3 className="text-sm font-semibold text-slate-800 mb-4">Distribuicao por Categoria</h3>

      <div className={cn("w-full", isMobile ? "h-48" : "h-64")}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 40 : 60}
              outerRadius={isMobile ? 70 : 90}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              onClick={(data) => onCategoriaClick?.(data.categoria as CategoriaAtivo)}
              style={{ cursor: onCategoriaClick ? 'pointer' : 'default' }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {renderCustomLegend()}
    </motion.div>
  );
}
