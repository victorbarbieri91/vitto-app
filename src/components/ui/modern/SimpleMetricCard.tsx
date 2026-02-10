import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useResponsiveClasses } from '../../../hooks/useScreenDetection';
import AnimatedNumber from './AnimatedNumber';

type ColorScheme = 'blue' | 'green' | 'coral' | 'auto' | 'neutral';

interface SimpleMetricCardProps {
  title: string;
  value: number | null;
  subtitle?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
  colorScheme?: ColorScheme;
}

/**
 *
 */
export default function SimpleMetricCard({
  title,
  value,
  subtitle,
  icon,
  isLoading = false,
  className,
  onClick,
  colorScheme = 'neutral',
}: SimpleMetricCardProps) {
  const { size } = useResponsiveClasses();

  // Paleta definida pelo usuário
  const getColorClasses = () => {
    const effectiveScheme = colorScheme === 'auto'
      ? (value && value >= 0 ? 'green' : 'coral')
      : colorScheme;

    switch (effectiveScheme) {
      case 'blue':
        // Saldo das Contas - Cinza escuro
        return {
          bg: 'bg-slate-700',
          value: 'text-white',
          title: 'text-slate-300',
          icon: 'text-slate-400',
        };
      case 'green':
        // Receitas - Verde escuro
        return {
          bg: 'bg-teal-700',
          value: 'text-white',
          title: 'text-teal-100',
          icon: 'text-teal-200',
        };
      case 'coral':
        // Despesas - Coral
        return {
          bg: 'bg-coral-500',
          value: 'text-white',
          title: 'text-coral-100',
          icon: 'text-coral-200',
        };
      default:
        // Economia - Fundo branco com texto verde escuro
        return {
          bg: 'bg-white border-slate-200',
          value: 'text-teal-700',
          title: 'text-teal-600',
          icon: 'text-teal-500',
        };
    }
  };

  const colors = getColorClasses();

  if (isLoading) {
    return (
      <div className={cn(
        "rounded-xl shadow-sm border h-full",
        colors.bg,
        className
      )}>
        <div className={cn("h-full", size === 'mobile' ? 'p-3' : 'p-4')}>
          <div className="w-1/2 h-3 bg-slate-200/60 rounded-md animate-pulse mb-3" />
          <div className="w-3/4 h-5 bg-slate-100/60 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  const displayValue = value ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl shadow-sm border h-full",
        colors.bg,
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        "h-full",
        size === 'mobile' ? 'p-3' : 'p-4'
      )}>
        <div className="flex justify-between items-start">
          <p className={cn(
            size === 'mobile' ? 'text-[10px]' : 'text-xs',
            "font-medium leading-tight",
            colors.title
          )}>{title}</p>
          {icon && (
            <div className={cn(colors.icon)}>
              {icon}
            </div>
          )}
        </div>

        <div className={size === 'mobile' ? 'mt-1' : 'mt-2'}>
          <p className={cn(
            size === 'mobile' ? 'text-sm' : 'text-lg',
            "font-bold",
            colors.value
          )}>
            <AnimatedNumber
              value={displayValue}
              format={(v) => new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(v)}
            />
          </p>
          {subtitle && (
            <p className={cn(
              "text-[9px] mt-0.5 opacity-70 font-medium",
              colors.title
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
