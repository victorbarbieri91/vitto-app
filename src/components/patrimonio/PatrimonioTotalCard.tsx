import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Wallet } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import AnimatedNumber from '../ui/modern/AnimatedNumber';

interface PatrimonioTotalCardProps {
  patrimonioTotal: number;
  patrimonioLiquido: number;
  totalDividas: number;
  variacaoMes: number;
  variacaoPercentual: number;
  quantidadeAtivos: number;
  isLoading?: boolean;
  onClick?: () => void;
}

export default function PatrimonioTotalCard({
  patrimonioTotal,
  patrimonioLiquido,
  totalDividas,
  variacaoMes,
  variacaoPercentual,
  quantidadeAtivos,
  isLoading = false,
  onClick
}: PatrimonioTotalCardProps) {
  const { size } = useResponsiveClasses();
  const isMobile = size === 'mobile';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTrendIcon = () => {
    if (variacaoMes > 0) return <TrendingUp className="w-4 h-4" />;
    if (variacaoMes < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (variacaoMes > 0) return 'text-emerald-600 bg-emerald-50';
    if (variacaoMes < 0) return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-50';
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-deep-blue via-deep-blue/95 to-deep-blue/90 p-6 shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-1/3" />
          <div className="h-10 bg-white/20 rounded w-2/3" />
          <div className="flex gap-4">
            <div className="h-6 bg-white/20 rounded w-24" />
            <div className="h-6 bg-white/20 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.01 } : undefined}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "rounded-2xl bg-gradient-to-br from-deep-blue via-deep-blue/95 to-deep-blue/90 shadow-xl overflow-hidden",
        onClick && "cursor-pointer",
        isMobile ? "p-4" : "p-6"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-white/70 text-sm font-medium">Patrimonio Total</span>
        </div>

        {/* Badge de variacao */}
        <div className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
          getTrendColor()
        )}>
          {getTrendIcon()}
          <span>{variacaoPercentual >= 0 ? '+' : ''}{variacaoPercentual.toFixed(1)}%</span>
        </div>
      </div>

      {/* Valor Principal */}
      <div className="mb-6">
        <p className={cn(
          "font-bold text-white",
          isMobile ? "text-2xl" : "text-4xl"
        )}>
          <AnimatedNumber
            value={patrimonioTotal}
            format={formatCurrency}
          />
        </p>
        <p className="text-white/50 text-sm mt-1">
          {variacaoMes >= 0 ? '+' : ''}{formatCurrency(variacaoMes)} este mes
        </p>
      </div>

      {/* Metricas Secundarias */}
      <div className={cn(
        "grid gap-4 pt-4 border-t border-white/10",
        isMobile ? "grid-cols-2" : "grid-cols-3"
      )}>
        {/* Patrimonio Liquido */}
        <div>
          <p className="text-white/50 text-xs mb-1">Patrimonio Liquido</p>
          <p className="text-white font-semibold text-sm">
            {formatCurrency(patrimonioLiquido)}
          </p>
        </div>

        {/* Dividas */}
        {totalDividas > 0 && (
          <div>
            <p className="text-white/50 text-xs mb-1">Dividas</p>
            <p className="text-coral-400 font-semibold text-sm">
              -{formatCurrency(totalDividas)}
            </p>
          </div>
        )}

        {/* Quantidade de Ativos */}
        <div>
          <p className="text-white/50 text-xs mb-1">Ativos</p>
          <p className="text-white font-semibold text-sm">
            {quantidadeAtivos} {quantidadeAtivos === 1 ? 'item' : 'itens'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
