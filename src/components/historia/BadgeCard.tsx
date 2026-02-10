import { motion } from 'framer-motion';
import { 
  Award, 
  Star, 
  Trophy, 
  Shield, 
  Crown, 
  Target,
  TrendingUp,
  PiggyBank,
  Calendar,
  FolderOpen,
  Zap,
  Heart,
  Medal,
  Gift
} from 'lucide-react';
import type { Badge, EventoTimeline } from '../../types/historia';

interface BadgeCardProps {
  badge: Badge | EventoTimeline;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'celebration';
}

// Mapeamento de ícones por slug
const iconesPorSlug: Record<string, any> = {
  'award': Award,
  'star': Star,
  'trophy': Trophy,
  'shield': Shield,
  'crown': Crown,
  'target': Target,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  'calendar-days': Calendar,
  'folder': FolderOpen,
  'zap': Zap,
  'heart': Heart,
  'medal': Medal,
  'gift': Gift,
  'default': Award
};

/**
 *
 */
export default function BadgeCard({ 
  badge, 
  onClick, 
  className = '',
  variant = 'default'
}: BadgeCardProps) {
  const IconeBadge = iconesPorSlug[badge.icon_slug || 'default'] || Award;
  const nome = badge.nome || ('nome' in badge ? badge.nome : 'Badge');
  const descricao = badge.descricao;
  const cor = badge.cor || '#10b981';
  const dataDesbloqueio = badge.unlocked_at || badge.created_at;

  const handleClick = () => {
    onClick?.();
  };

  // Animações
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const hoverVariants = {
    hover: {
      scale: 1.05,
      y: -8,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
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
          relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300
          ${variant === 'compact' ? 'p-4' : 'p-6'}
          ${variant === 'celebration' ? 'ring-4 ring-offset-2' : ''}
        `}
        style={{
          background: `linear-gradient(135deg, ${cor}15, ${cor}25)`,
          border: `2px solid ${cor}40`,
          ...(variant === 'celebration' && {
            '--tw-ring-color': cor + '60'
          })
        }}
        onClick={handleClick}
      >
        {/* Efeito de brilho */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Conteúdo principal */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Ícone da badge */}
          <motion.div
            variants={pulseVariants}
            animate={variant === 'celebration' ? 'pulse' : ''}
            className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${variant === 'celebration' ? 'w-20 h-20' : ''}
            `}
            style={{
              background: `linear-gradient(135deg, ${cor}, ${cor}cc)`,
              boxShadow: `0 8px 32px ${cor}40`
            }}
          >
            <IconeBadge 
              className={`text-white ${variant === 'celebration' ? 'h-10 w-10' : 'h-8 w-8'}`} 
            />
          </motion.div>

          {/* Nome da badge */}
          <h3 className={`font-bold mb-2 ${variant === 'celebration' ? 'text-xl' : 'text-lg'}`}>
            {nome}
          </h3>

          {/* Descrição */}
          {descricao && (
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              {descricao}
            </p>
          )}

          {/* Data de desbloqueio */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="h-3 w-3" />
            <span>
              Desbloqueado em {new Date(dataDesbloqueio).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Partículas decorativas */}
        {variant === 'celebration' && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ backgroundColor: cor }}
                animate={{
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * 100 - 50],
                  opacity: [1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`
                }}
              />
            ))}
          </>
        )}

        {/* Selo de conquista */}
        <div className="absolute -top-2 -right-2">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.3
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${cor}, ${cor}cc)`,
              boxShadow: `0 4px 12px ${cor}40`
            }}
          >
            <Trophy className="h-4 w-4 text-white" />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}