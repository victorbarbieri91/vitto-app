import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { categoryService } from '../../services/api/CategoryService';
import { useMonthlyDashboard } from '../../contexts/MonthlyDashboardContext';

interface CategoryDistribution {
  categoryId: number | null;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

interface DivisaoCategoriaCardProps {
  className?: string;
}

// Função para formatar valor como moeda completa
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Função para formatar valor compacto (para o centro do gráfico)
const formatCompactCurrency = (value: number) => {
  if (value >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      notation: 'compact',
    }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Custom active shape for hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))', cursor: 'pointer' }}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#1e293b" fontSize={10} fontWeight={500}>
        {payload.name.length > 10 ? payload.name.substring(0, 10) + '...' : payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize={9}>
        {formatCompactCurrency(payload.value)}
      </text>
    </g>
  );
};

export default function DivisaoCategoriaCard({ className }: DivisaoCategoriaCardProps) {
  const { size } = useResponsiveClasses();
  const navigate = useNavigate();
  const { currentMonth, currentYear } = useMonthlyDashboard();

  const [data, setData] = useState<CategoryDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showPercentage, setShowPercentage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Usa o mês e ano selecionados no dashboard para dados precisos
        const distribution = await categoryService.getExpenseDistributionForMonth(currentMonth, currentYear);
        setData(distribution);
      } catch (error) {
        console.error('Erro ao buscar distribuicao:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentMonth, currentYear]);

  const chartData = useMemo(() => {
    // Limitar a top 5 categorias
    const top5 = data.slice(0, 5);
    return top5.map(item => ({
      id: item.categoryId,
      name: item.categoryName,
      value: item.amount,
      percentage: item.percentage,
      color: item.categoryColor || '#6B7280'
    }));
  }, [data]);


  // Handle click on pie segment
  const handlePieClick = (data: any, index: number) => {
    const categoryId = chartData[index]?.id;
    if (categoryId) {
      // Navigate to transactions page with category filter
      navigate(`/lancamentos?categoria=${categoryId}&month=${currentMonth}-${currentYear}`);
    }
  };

  // Handle mouse enter/leave for active shape
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  // Handle legend click
  const handleLegendClick = (categoryId: number | null) => {
    if (categoryId) {
      navigate(`/lancamentos?categoria=${categoryId}&month=${currentMonth}-${currentYear}`);
    }
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
        <h3 className="font-medium text-slate-700 text-sm flex-1">Despesas por Categoria</h3>
        <div className="flex items-center bg-slate-100 rounded p-0.5">
          <button
            onClick={() => setShowPercentage(false)}
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium transition-all",
              !showPercentage
                ? "bg-white text-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-500"
            )}
          >
            R$
          </button>
          <button
            onClick={() => setShowPercentage(true)}
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium transition-all",
              showPercentage
                ? "bg-white text-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-500"
            )}
          >
            %
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center min-h-0 px-4 py-3">
        {/* Mobile: stacked (pie em cima, legenda embaixo) | Desktop: side-by-side */}
        <div className={cn(
          "w-full",
          size === 'mobile'
            ? "flex flex-col items-center gap-2"
            : "flex items-center gap-4 max-w-[320px]"
        )}>
          {/* Grafico */}
          <div className={cn(
            "flex-shrink-0",
            size === 'mobile' ? "w-[100px] h-[100px]" : "w-[90px] h-[90px]"
          )}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={size === 'mobile' ? 28 : 25}
                  outerRadius={size === 'mobile' ? 46 : 42}
                  paddingAngle={2}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  onClick={handlePieClick}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda */}
          <div className={cn(
            "flex flex-col gap-1 min-w-0",
            size === 'mobile' ? "w-full" : "flex-1 justify-center"
          )}>
            {chartData.slice(0, 5).map((item, index) => (
              <motion.button
                key={item.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleLegendClick(item.id)}
                className={cn(
                  "flex items-center gap-2 rounded transition-colors cursor-pointer text-left",
                  size === 'mobile'
                    ? "py-1 px-2 active:bg-slate-50"
                    : "py-0.5 px-1 hover:bg-slate-50"
                )}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className={cn(
                  "text-slate-600 truncate flex-1 min-w-0",
                  size === 'mobile' ? "text-xs" : "text-[10px]"
                )}>
                  {item.name}
                </span>
                <span className={cn(
                  "text-slate-700 font-semibold whitespace-nowrap",
                  size === 'mobile' ? "text-xs" : "text-[10px]"
                )}>
                  {showPercentage ? `${item.percentage.toFixed(1)}%` : formatCurrency(item.value)}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
