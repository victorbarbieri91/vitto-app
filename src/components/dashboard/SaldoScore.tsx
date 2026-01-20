import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { cn } from '../../utils/cn';
import { Wallet } from 'lucide-react';
import AnimatedNumber from '../ui/modern/AnimatedNumber';

interface SaldoScoreProps {
  saldo: number;
  metaPercentual?: number;
  receitaMensal?: number;
  isLoading?: boolean;
}

const SaldoScore = ({ saldo, metaPercentual = 80, receitaMensal = 0, isLoading = false }: SaldoScoreProps) => {
  const { size } = useResponsiveClasses();

  if (isLoading) {
    return (
      <div className="bg-deep-blue rounded-xl shadow-sm h-full">
        <div className={cn("flex-1", size === 'mobile' ? 'p-3' : 'p-4')}>
          <div className="w-1/2 h-3 bg-slate-600 rounded-md animate-pulse mb-3" />
          <div className="w-3/4 h-5 bg-slate-500 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <Link to="/contas/saldo-detalhe" className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className="bg-deep-blue rounded-xl shadow-sm h-full cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className={cn("flex-1", size === 'mobile' ? 'p-3' : 'p-4')}>
          <div className="flex justify-between items-start">
            <p className={cn(
              size === 'mobile' ? 'text-[10px]' : 'text-xs',
              "font-medium leading-tight text-slate-300"
            )}>Saldo Previsto</p>
            <Wallet className={cn(
              size === 'mobile' ? 'w-3 h-3' : 'w-4 h-4',
              'text-slate-400'
            )} />
          </div>

          <div className={size === 'mobile' ? 'mt-1' : 'mt-2'}>
            <p className={cn(
              size === 'mobile' ? 'text-sm' : 'text-lg',
              "font-bold text-white"
            )}>
              <AnimatedNumber
                value={saldo}
                format={(v) => new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(v)}
              />
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default SaldoScore;
