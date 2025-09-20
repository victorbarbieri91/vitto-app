import { ReactNode } from 'react';
import { cn } from '../../../utils/cn';
import { useResponsiveClasses } from '../../../hooks/useScreenDetection';
import AnimatedNumber from './AnimatedNumber';
import ModernCard from './ModernCard';

interface SimpleMetricCardProps {
  title: string;
  value: number | null;
  icon?: ReactNode;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function SimpleMetricCard({
  title,
  value,
  icon,
  isLoading = false,
  className,
  onClick,
}: SimpleMetricCardProps) {
  const { classes, size } = useResponsiveClasses();
  
  if (isLoading) {
    return (
      <div className={cn(classes.padding, "rounded-3xl bg-white/60", className)}>
        <div className={cn("w-1/2 bg-slate-200 rounded-md animate-pulse", classes.textSm === 'text-xs' ? 'h-3 mb-2' : 'h-4 mb-3')}></div>
        <div className={cn("w-3/4 bg-slate-200 rounded-md animate-pulse", classes.textLg === 'text-base' ? 'h-6 mb-2' : 'h-8 mb-3')}></div>
        <div className={cn("w-1/4 bg-slate-200 rounded-md animate-pulse", classes.textSm === 'text-xs' ? 'h-2' : 'h-3')}></div>
      </div>
    );
  }

  // Garantir que sempre temos um número válido
  const displayValue = value ?? 0;

  return (
    <ModernCard
      variant="metric-interactive"
      padding={size === 'mobile' ? 'sm' : 'md'}
      className={cn(
        size === 'mobile' ? 'p-2' : classes.padding,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start text-slate-500 group-hover:text-deep-blue transition-colors duration-300">
        <p className={cn(
          size === 'mobile' ? 'text-[10px]' : classes.textSm,
          "font-medium leading-tight"
        )}>{title}</p>
        {icon && <div className="group-hover:text-deep-blue transition-colors duration-300">{icon}</div>}
      </div>

      <div className={size === 'mobile' ? 'mt-1' : 'mt-3'}>
        <p className={cn(
          size === 'mobile' ? 'text-xs' : classes.textLg,
          "font-bold text-deep-blue transition-colors duration-300"
        )}>
          <AnimatedNumber
            value={displayValue}
            format={(v) => new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: size === 'mobile' ? 0 : 2,
              maximumFractionDigits: size === 'mobile' ? 0 : 2,
            }).format(v)}
          />
        </p>
      </div>
    </ModernCard>
  );
}