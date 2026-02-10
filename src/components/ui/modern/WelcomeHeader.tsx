import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { useResponsiveClasses } from '../../../hooks/useScreenDetection';

interface WelcomeHeaderProps {
  userName: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

const WelcomeHeader = memo(({ userName, subtitle, rightContent, className }: WelcomeHeaderProps) => {
  const { classes } = useResponsiveClasses();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const greeting = getGreeting();
  const displayName = userName || 'Usuário';

  return (
    <div className={cn(
      'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
      className
    )}>
      <div className="flex-1">
        <motion.h1
          className={cn(classes.textLg, "font-semibold mb-1")}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="text-deep-blue">{greeting}, </span>
          <span className="text-coral-500">{displayName}</span>
        </motion.h1>
        
        {subtitle && (
          <motion.p
            className={cn(classes.textSm, "text-slate-500")}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {rightContent && (
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        >
          {rightContent}
        </motion.div>
      )}
    </div>
  );
});

WelcomeHeader.displayName = 'WelcomeHeader';

export default WelcomeHeader;

/**
 *
 */
export function DateTimeDisplay({ className }: { className?: string }) {
  const { classes } = useResponsiveClasses();
  const now = new Date();
  const dateString = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={cn('text-right', className)}>
      <p className={cn(classes.textSm, "font-medium text-neutral-700 capitalize")}>
        {dateString}
      </p>
      <p className={cn(classes.textSm === 'text-xs' ? 'text-xs' : 'text-xs', "text-neutral-500")}>
        Última atualização: {now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>
  );
}

/**
 *
 */
export function PeriodDisplay({ 
  period, 
  customRange,
  className 
}: { 
  period: string;
  customRange?: { startDate: string; endDate: string };
  className?: string;
}) {
  const { classes } = useResponsiveClasses();
  
  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'Esta semana';
      case 'month':
        return 'Este mês';
      case 'year':
        return 'Este ano';
      case 'custom':
        if (customRange) {
          const start = new Date(customRange.startDate).toLocaleDateString('pt-BR');
          const end = new Date(customRange.endDate).toLocaleDateString('pt-BR');
          return `${start} - ${end}`;
        }
        return 'Período customizado';
      default:
        return 'Este mês';
    }
  };

  return (
    <div className={cn('text-right', className)}>
      <p className={cn(classes.textSm, "font-medium text-neutral-700")}>
        Visualizando:
      </p>
      <p className={cn(classes.textSm === 'text-xs' ? 'text-xs' : 'text-xs', "text-neutral-500")}>
        {getPeriodLabel()}
      </p>
    </div>
  );
}
