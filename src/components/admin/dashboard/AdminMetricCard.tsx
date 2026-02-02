import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AdminKPIColor } from '../../../types/admin';
import { ADMIN_KPI_COLORS } from '../../../types/admin';

interface AdminMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  color?: AdminKPIColor;
  format?: 'number' | 'currency' | 'percentage';
}

export default function AdminMetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'slate',
  format = 'number'
}: AdminMetricCardProps) {
  const formatValue = () => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value}%`;
      default:
        return new Intl.NumberFormat('pt-BR').format(value);
    }
  };

  const getChangeIndicator = () => {
    if (change === undefined || change === null) return null;

    const isPositive = change > 0;
    const isNeutral = change === 0;

    // High contrast colors for indicators on colored backgrounds
    const indicatorColor = isNeutral
      ? 'text-white/60'
      : isPositive
        ? 'text-emerald-300'
        : 'text-red-300';

    const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

    return (
      <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${indicatorColor}`}>
        <Icon size={14} />
        <span>{isPositive ? '+' : ''}{change}%</span>
        {changeLabel && (
          <span className="text-white/50 ml-1">{changeLabel}</span>
        )}
      </div>
    );
  };

  const bgColorClass = ADMIN_KPI_COLORS[color];

  return (
    <div className={`rounded-xl p-4 ${bgColorClass} shadow-sm transition-transform hover:scale-[1.02]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Label - uppercase, muted white */}
          <p className="text-[10px] font-semibold text-white/70 uppercase tracking-wider truncate">
            {title}
          </p>

          {/* Value - large, bold, white */}
          <p className="mt-1 text-3xl font-bold text-white truncate">
            {formatValue()}
          </p>

          {/* Change indicator */}
          {getChangeIndicator()}
        </div>

        {/* Icon - subtle, white */}
        {icon && (
          <div className="p-2 rounded-lg bg-white/10 text-white/80 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
