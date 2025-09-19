import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { cn } from '../../utils/cn';
import { ModernCard } from '../ui/modern';

const createChartData = (percentage: number) => [
  { name: 'Saldo', value: percentage },
  { name: 'Restante', value: 100 - percentage },
];

const COLORS = ['#F87060', '#475569'];

interface SaldoScoreProps {
  saldo: number;
  metaPercentual?: number;
  receitaMensal?: number;
}

const SaldoScore = ({ saldo, metaPercentual = 80, receitaMensal = 0 }: SaldoScoreProps) => {
  const { classes, size } = useResponsiveClasses();

  // Calcular percentual da meta de ECONOMIA
  // metaPercentual = meta de despesas (ex: 80%)
  // meta de economia = 100% - meta de despesas (ex: 20%)
  const metaEconomiaPercentual = 100 - metaPercentual;
  const metaEconomiaValor = (receitaMensal * metaEconomiaPercentual) / 100;

  // Calcular quanto do objetivo de economia foi atingido
  const percentualAtual = metaEconomiaValor > 0
    ? Math.min(100, Math.max(0, (saldo / metaEconomiaValor) * 100))
    : 0;
  const percentage = Math.round(percentualAtual);

  const data = createChartData(percentage);

  return (
    <Link to="/contas/saldo-detalhe" className="block transform transition-transform duration-300 hover:scale-[1.02]">
      <ModernCard variant="dark" className={cn(
        classes.padding, 
        'h-full',
        size === 'compact' ? 'min-h-[100px]' : ''
      )}>
        <div className={cn(
          'flex flex-col sm:flex-row sm:justify-between sm:items-center',
          size === 'compact' ? 'gap-2' : 'gap-4 sm:gap-0'
        )}>
          <div className="flex-1">
            <h2 className={cn(classes.textBase, 'font-bold text-slate-200 mb-2')}>Saldo Previsto do Mês</h2>
            <p className={cn(
              classes.textLg === 'text-base' ? 'text-2xl' : 
              classes.textLg === 'text-lg' ? 'text-3xl' : 'text-4xl',
              'font-bold text-white'
            )}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
            </p>
          </div>

          <div className="w-full sm:w-28 text-center">
            <div className="h-16 sm:h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={30}
                    outerRadius={40}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className={cn(classes.textSm, 'text-slate-300 mt-1')}>
              {percentage}% da meta de economia
            </p>
          </div>
        </div>
      </ModernCard>
    </Link>
  );
};

export default SaldoScore;
