import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useResponsiveClasses } from '../../../hooks/useScreenDetection';
import AnimatedNumber from './AnimatedNumber';
import ModernCard from './ModernCard';

type TrendType = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon?: ReactNode;
  isLoading?: boolean;
  animate?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  change,
  icon,
  isLoading = false,
  animate = true,
  className,
  onClick,
}: MetricCardProps) {
  const { classes } = useResponsiveClasses();
  const trend: TrendType = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  if (isLoading) {
    return (
      <div className={cn(classes.padding, "rounded-3xl bg-white/60", className)}>
        <div className={cn("w-1/2 bg-slate-200 rounded-md animate-pulse", classes.textSm === 'text-xs' ? 'h-3 mb-2' : 'h-4 mb-3')}></div>
        <div className={cn("w-3/4 bg-slate-200 rounded-md animate-pulse", classes.textLg === 'text-base' ? 'h-6 mb-2' : 'h-8 mb-3')}></div>
        <div className={cn("w-1/4 bg-slate-200 rounded-md animate-pulse", classes.textSm === 'text-xs' ? 'h-2' : 'h-3')}></div>
      </div>
    );
  }

  const TrendIndicator = () => {
    if (trend === 'neutral' || change === undefined) return null;
    
    const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500';
    const trendIcon = trend === 'up' ? '' : '';
    
    return (
      <div className={cn('flex items-center font-semibold', classes.textSm, trendColor, 'group-hover:text-deep-blue')}>
        <span>{trendIcon}</span>
        <span>{Math.abs(change)}%</span>
      </div>
    );
  };

  return (
    <ModernCard
      variant="metric-interactive"
      padding="md"
      className={cn(
        classes.padding,
        onClick && 'cursor-pointer', 
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start text-slate-500 group-hover:text-deep-blue transition-colors duration-300">
        <p className={cn(classes.textSm, "font-medium")}>{title}</p>
        {icon}
      </div>
      
      <div className="mt-2">
        <p className={cn(classes.textLg, "font-bold text-deep-blue group-hover:text-deep-blue transition-colors duration-300")}>
          {typeof value === 'number' ? (
            <AnimatedNumber 
              value={value} 
              format={(v) => new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(v)}
            />
          ) : value}
        </p>
        {subtitle && (
          <p className={cn(classes.textSm, "text-slate-400 mt-1")}>
            {subtitle}
          </p>
        )}
        <TrendIndicator />
      </div>
    </ModernCard>
  );
}
