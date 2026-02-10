import { motion } from 'framer-motion';
import { Target, Award, TrendingUp, BookOpen } from 'lucide-react';
import ModernCard from '../ui/modern/ModernCard';
import { useHistoriaService } from '../../hooks/useHistoriaService';
import { useScreenDetection } from '../../hooks/useScreenDetection';

const JourneyDashboard = () => {
  const { resumo } = useHistoriaService();
  const { size } = useScreenDetection();

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const cardData = [
    {
      title: 'Marcos Concluídos',
      value: resumo?.marcos_concluidos || 0,
      subtext: `de ${resumo?.total_marcos || 0} marcos`,
      Icon: Target
    },
    {
      title: 'Badges Conquistadas',
      value: resumo?.total_badges || 0,
      subtext: 'conquistas desbloqueadas',
      Icon: Award
    },
    {
      title: 'Progresso Geral',
      value: `${resumo?.percentual_conclusao || 0}%`,
      subtext: 'da sua jornada',
      Icon: TrendingUp
    },
    {
      title: 'Marcos Pendentes',
      value: resumo?.marcos_pendentes || 0,
      subtext: 'objetivos restantes',
      Icon: BookOpen
    }
  ];

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
      }}
      initial="hidden"
      animate="visible"
      className={`grid gap-4 ${
        size === 'mobile' 
          ? 'grid-cols-2' 
          : 'grid-cols-2'
      }`}
    >
      {cardData.map(({ title, value, subtext, Icon }) => (
        <motion.div key={title} variants={itemVariants}>
          <ModernCard 
            variant="metric-interactive" 
            padding="md"
            className="group h-full"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 group-hover:text-deep-blue transition-colors">
                  {title}
                </p>
                <p className="text-2xl font-bold text-deep-blue group-hover:text-white transition-colors">
                  {value}
                </p>
                <p className="text-xs text-slate-400 group-hover:text-white/70 transition-colors">
                  {subtext}
                </p>
              </div>
              <Icon className="h-8 w-8 text-slate-400 group-hover:text-white transition-colors" />
            </div>
          </ModernCard>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default JourneyDashboard; 