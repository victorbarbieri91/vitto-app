import { ModernCard } from '../ui/modern';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { cn } from '../../utils/cn';

const UltimaAtividade = () => {
  const { classes } = useResponsiveClasses();
  
  const atividades = [
    {
      id: 1,
      tipo: 'receita',
      descricao: 'Salário Janeiro',
      valor: 7500.00,
      data: '2025-01-15',
      categoria: 'Trabalho'
    },
    {
      id: 2,
      tipo: 'despesa',
      descricao: 'Supermercado',
      valor: -285.50,
      data: '2025-01-14',
      categoria: 'Alimentação'
    },
    {
      id: 3,
      tipo: 'despesa',
      descricao: 'Gasolina',
      valor: -180.00,
      data: '2025-01-13',
      categoria: 'Transporte'
    },
    {
      id: 4,
      tipo: 'receita',
      descricao: 'Freelance',
      valor: 1200.00,
      data: '2025-01-12',
      categoria: 'Extra'
    },
  ];

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(valor));
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <ModernCard variant="dark" className={classes.padding}>
      <h3 className={cn(classes.textBase, 'font-bold text-slate-200 mb-4')}>Última Atividade</h3>
      
      <div className="space-y-3">
        {atividades.map((atividade) => (
          <div 
            key={atividade.id} 
            className={cn(
              'flex items-center justify-between bg-slate-700/50 rounded-xl hover:bg-slate-700/70 transition-colors duration-200',
              classes.padding === 'p-3' ? 'p-2' : 'p-3'
            )}
          >
            <div className="flex-1 min-w-0">
              <p className={cn(classes.textSm, 'font-medium text-white truncate')}>
                {atividade.descricao}
              </p>
              <p className={cn(classes.textSm === 'text-xs' ? 'text-xs' : 'text-xs', 'text-slate-400')}>
                {atividade.categoria}  {formatarData(atividade.data)}
              </p>
            </div>
            
            <div className="flex-shrink-0 text-right ml-2">
              <p className={cn(
                classes.textSm, 
                'font-bold',
                atividade.tipo === 'receita' ? 'text-green-400' : 'text-red-400'
              )}>
                {atividade.tipo === 'receita' ? '+' : '-'} {formatarValor(atividade.valor)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ModernCard>
  );
};

export default UltimaAtividade;
