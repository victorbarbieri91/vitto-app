import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { categoryService } from '../../services/api/CategoryService';

interface CategoryDistribution {
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

interface DivisaoCategoriaCardProps {
  className?: string;
}

export default function DivisaoCategoriaCard({ className }: DivisaoCategoriaCardProps) {
  const { size } = useResponsiveClasses();
  const isMobile = size === 'mobile';

  const [data, setData] = useState<CategoryDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const distribution = await categoryService.getExpenseDistributionByCategory('month');
        setData(distribution);
      } catch (error) {
        console.error('Erro ao buscar distribuicao:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = useMemo(() => {
    // Limitar a top 5 categorias
    const top5 = data.slice(0, 5);
    return top5.map(item => ({
      name: item.categoryName,
      value: item.amount,
      percentage: item.percentage,
      color: item.categoryColor || '#6B7280'
    }));
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3">
          <p className="font-semibold text-slate-800">{item.name}</p>
          <p className="text-sm text-slate-600">{formatCurrency(item.value)}</p>
          <p className="text-xs text-slate-500">{item.percentage.toFixed(1)}% do total</p>
        </div>
      );
    }
    return null;
  };

  // Estilo padrao consistente com outros cards
  const cardStyle = 'bg-white border border-slate-200 rounded-xl shadow-sm h-full flex flex-col';
  const headerStyle = 'px-4 py-3 border-b border-slate-100 flex items-center gap-2';

  if (isLoading) {
    return (
      <div className={cn(cardStyle, className)}>
        <div className={headerStyle}>
          <PieChartIcon className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Despesas por Categoria</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-32 h-32 rounded-full bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className={cn(cardStyle, className)}>
        <div className={headerStyle}>
          <PieChartIcon className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-slate-700 text-sm">Despesas por Categoria</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400">
          <PieChartIcon className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Sem despesas no periodo</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(cardStyle, 'overflow-hidden', className)}
    >
      <div className={headerStyle}>
        <PieChartIcon className="w-4 h-4 text-slate-400" />
        <h3 className="font-medium text-slate-700 text-sm">Despesas por Categoria</h3>
      </div>

      <div className="flex-1 flex flex-col min-h-0 p-3">
        {/* Layout: Gráfico à esquerda, Legenda à direita */}
        <div className="flex items-center gap-3 flex-1 min-h-0">
          {/* Gráfico */}
          <div className="flex-shrink-0 w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={48}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda compacta */}
          <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
            {chartData.slice(0, 4).map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-2"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-medium text-slate-700 truncate flex-1 min-w-0">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-500 flex-shrink-0">
                  {item.percentage.toFixed(0)}%
                </span>
              </motion.div>
            ))}
            {chartData.length > 4 && (
              <p className="text-[10px] text-slate-400 pl-4">
                +{chartData.length - 4} outras
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
