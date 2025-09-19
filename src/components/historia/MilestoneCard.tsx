import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Circle, 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock,
  MapPin,
  Award,
  Star,
  Zap,
  Heart,
  Gift,
  Shield
} from 'lucide-react';
import ModernCard from '../ui/modern/ModernCard';
import { formatCurrency } from '../../utils/format';
import type { Marco, EventoTimeline } from '../../types/historia';

interface MilestoneCardProps {
  marco: Marco | EventoTimeline;
  onComplete?: (id: string) => void;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'interactive';
}

// Mapeamento de ícones por slug
const iconesPorSlug: Record<string, any> = {
  'welcome': Gift,
  'wallet': Target,
  'receipt': Circle,
  'calendar': Calendar,
  'trending-up': TrendingUp,
  'tags': Star,
  'target': Target,
  'message-circle': Heart,
  'pie-chart': Circle,
  'credit-card': Award,
  'shield': Shield,
  'dollar-sign': TrendingUp,
  'calendar-check': Calendar,
  'trophy': Award,
  'check-circle': CheckCircle,
  'default': MapPin
};

export default function MilestoneCard({ 
  marco, 
  onComplete, 
  onClick, 
  className = '',
  variant = 'default'
}: MilestoneCardProps) {
  const isCompleted = marco.status === 'concluido';
  const hasTarget = marco.valor_alvo && marco.valor_alvo > 0;
  const progress = hasTarget ? (marco.valor_atual / marco.valor_alvo) * 100 : 0;
  const isSystemMilestone = 'categoria' in marco && marco.categoria === 'sistema';

  const IconeMarco = iconesPorSlug[marco.icon_slug || 'default'] || MapPin;

  const handleClick = () => {
    onClick?.();
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted && onComplete) {
      onComplete(marco.id);
    }
  };

  // Cores baseadas no status e categoria
  const getCoresPorStatus = () => {
    if (isCompleted) {
      return {
        border: 'border-green-200',
        background: 'bg-gradient-to-br from-green-50 to-green-100',
        text: 'text-green-800',
        icon: 'text-green-600',
        button: 'bg-green-500 hover:bg-green-600'
      };
    }
    
    if (isSystemMilestone) {
      return {
        border: 'border-coral-200',
        background: 'bg-gradient-to-br from-coral-50 to-coral-100',
        text: 'text-coral-800',
        icon: 'text-coral-600',
        button: 'bg-coral-500 hover:bg-coral-600'
      };
    }
    
    return {
      border: 'border-blue-200',
      background: 'bg-gradient-to-br from-blue-50 to-blue-100',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      button: 'bg-blue-500 hover:bg-blue-600'
    };
  };

  const cores = getCoresPorStatus();

  // Animação de entrada
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  // Animação de hover
  const hoverVariants = {
    hover: {
      scale: 1.02,
      y: -4,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={className}
    >
      <motion.div
        variants={hoverVariants}
        className={`
          relative overflow-hidden rounded-2xl border-2 ${cores.border} ${cores.background} 
          cursor-pointer transition-all duration-300 hover:shadow-lg
          ${variant === 'compact' ? 'p-4' : 'p-6'}
        `}
        onClick={handleClick}
      >
        {/* Indicador de conclusão */}
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
          >
            <CheckCircle className="h-5 w-5 text-white" />
          </motion.div>
        )}

        {/* Header do marco */}
        <div className="flex items-start gap-4 mb-4">
          {/* Ícone do marco */}
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
            className={`
              flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
              ${isCompleted ? 'bg-green-500' : 'bg-white/60'}
              ${isCompleted ? 'text-white' : cores.icon}
            `}
          >
            <IconeMarco className="h-6 w-6" />
          </motion.div>

          {/* Conteúdo do marco */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${cores.text} text-lg leading-tight`}>
              {marco.nome || ('titulo' in marco ? marco.titulo : 'Marco')}
            </h3>
            
            {marco.descricao && (
              <p className="text-slate-600 text-sm mt-1 line-clamp-2">
                {marco.descricao}
              </p>
            )}

            {/* Categoria e data */}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(marco.data_evento || marco.created_at).toLocaleDateString('pt-BR')}
              </span>
              
              {isSystemMilestone && (
                <span className="px-2 py-1 bg-white/60 rounded-full text-coral-600 font-medium">
                  Sistema
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progresso (se houver meta quantitativa) */}
        {hasTarget && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-600">Progresso</span>
              <span className="text-sm font-medium text-slate-700">
                {formatCurrency(marco.valor_atual)} / {formatCurrency(marco.valor_alvo)}
              </span>
            </div>
            
            <div className="w-full bg-white/60 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-2 rounded-full ${
                  progress >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-coral-500 to-coral-600'
                }`}
              />
            </div>
            
            <div className="text-right mt-1">
              <span className="text-xs text-slate-500">
                {Math.round(progress)}% concluído
              </span>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-green-600 text-sm font-medium"
              >
                <CheckCircle className="h-4 w-4" />
                Concluído
              </motion.div>
            ) : (
              <span className="text-sm text-slate-600">
                {hasTarget ? `${Math.round(progress)}% concluído` : 'Pendente'}
              </span>
            )}
          </div>

          {/* Botão de completar */}
          {!isCompleted && onComplete && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleComplete}
              className={`
                px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors
                ${cores.button}
              `}
            >
              {hasTarget && progress < 100 ? 'Atualizar' : 'Concluir'}
            </motion.button>
          )}
        </div>

        {/* Efeito de brilho para marcos próximos */}
        {!isCompleted && (
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.02, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          />
        )}
      </motion.div>
    </motion.div>
  );
}