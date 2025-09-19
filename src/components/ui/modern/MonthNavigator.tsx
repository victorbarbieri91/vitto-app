import { memo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useResponsiveClasses } from '../../../hooks/useScreenDetection';

interface MonthNavigatorProps {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  className?: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MonthNavigator = memo(({ currentMonth, currentYear, onMonthChange, className }: MonthNavigatorProps) => {
  const { classes } = useResponsiveClasses();
  const currentDate = new Date();
  const isCurrentMonth = currentMonth === currentDate.getMonth() + 1 && currentYear === currentDate.getFullYear();

  const handlePrevious = () => {
    if (currentMonth === 1) {
      onMonthChange(12, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const handleNext = () => {
    if (currentMonth === 12) {
      onMonthChange(1, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

  const handleToday = () => {
    const now = new Date();
    onMonthChange(now.getMonth() + 1, now.getFullYear());
  };

  return (
    <motion.div
      className={cn(
        'flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg p-1.5 border border-white/20',
        className
      )}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
    >
      {/* Previous Button */}
      <motion.button
        onClick={handlePrevious}
        className={cn(
          'p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-all duration-200',
          'text-deep-blue hover:text-coral-500 border border-white/10 hover:border-coral-200'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronLeft className="w-4 h-4" />
      </motion.button>

      {/* Month/Year Display - Clicável para voltar ao mês atual */}
      <motion.button
        onClick={handleToday}
        className={cn(
          'flex items-center gap-2 px-2.5 py-1.5 rounded-md',
          isCurrentMonth ? 'bg-white/20' : 'bg-white/20 hover:bg-white/30 cursor-pointer',
          'transition-all duration-200 min-w-0'
        )}
        whileHover={!isCurrentMonth ? { scale: 1.02 } : {}}
        whileTap={!isCurrentMonth ? { scale: 0.98 } : {}}
        disabled={isCurrentMonth}
      >
        <Calendar className="w-4 h-4 text-deep-blue flex-shrink-0" />
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'text-sm font-semibold text-deep-blue'
          )}>
            {MONTHS[currentMonth - 1]}
          </span>
          <span className="text-sm font-semibold text-deep-blue">
            {currentYear}
          </span>
        </div>
      </motion.button>

      {/* Next Button */}
      <motion.button
        onClick={handleNext}
        className={cn(
          'p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-all duration-200',
          'text-deep-blue hover:text-coral-500 border border-white/10 hover:border-coral-200'
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
});

MonthNavigator.displayName = 'MonthNavigator';

export default MonthNavigator;