import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiEffectProps {
  trigger?: boolean;
  duration?: number;
  intensity?: 'low' | 'medium' | 'high';
  colors?: string[];
  className?: string;
}

interface ConfettiParticle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
}

const defaultColors = [
  '#F87060', // Coral
  '#10b981', // Verde
  '#3b82f6', // Azul
  '#f59e0b', // Amarelo
  '#9333ea', // Roxo
  '#ef4444', // Vermelho
  '#06b6d4', // Ciano
  '#f97316'  // Laranja
];

export default function ConfettiEffect({
  trigger = false,
  duration = 3000,
  intensity = 'medium',
  colors = defaultColors,
  className = ''
}: ConfettiEffectProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [isActive, setIsActive] = useState(false);

  // Configurações baseadas na intensidade
  const getIntensitySettings = () => {
    switch (intensity) {
      case 'low':
        return { count: 20, spread: 60, velocity: 0.3 };
      case 'high':
        return { count: 80, spread: 120, velocity: 0.7 };
      default:
        return { count: 50, spread: 90, velocity: 0.5 };
    }
  };

  // Gerar partículas
  const generateParticles = () => {
    const settings = getIntensitySettings();
    const newParticles: ConfettiParticle[] = [];

    for (let i = 0; i < settings.count; i++) {
      const particle: ConfettiParticle = {
        id: `confetti-${i}-${Date.now()}`,
        x: Math.random() * 100, // Posição inicial aleatória
        y: -5, // Começar acima da tela
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4, // Tamanho entre 4-12px
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * settings.spread * 0.02,
        velocityY: Math.random() * 2 + 1, // Velocidade para baixo
      };
      newParticles.push(particle);
    }

    return newParticles;
  };

  // Ativar confetes
  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const newParticles = generateParticles();
      setParticles(newParticles);

      // Limpar após a duração
      const timer = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  if (!isActive || particles.length === 0) {
    return null;
  }

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 overflow-hidden ${className}`}>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
              rotate: particle.rotation,
              opacity: 1,
              scale: 1
            }}
            animate={{
              x: `${particle.x + particle.velocityX * 100}vw`,
              y: '110vh', // Cair para fora da tela
              rotate: particle.rotation + 720, // Girar durante a queda
              opacity: 0,
              scale: 0.5
            }}
            transition={{
              duration: duration / 1000,
              ease: [0.25, 0.46, 0.45, 0.94], // Easing natural
              opacity: { delay: (duration / 1000) * 0.7 } // Fade out no final
            }}
            className="absolute"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%', // Círculo ou quadrado
              boxShadow: `0 0 ${particle.size / 2}px ${particle.color}40`
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook para usar confetes facilmente
export function useConfetti() {
  const [trigger, setTrigger] = useState(false);

  const celebrate = (options?: {
    intensity?: 'low' | 'medium' | 'high';
    duration?: number;
    colors?: string[];
  }) => {
    setTrigger(false);
    // Pequeno delay para resetar o trigger
    setTimeout(() => setTrigger(true), 10);
    
    // Auto-reset após a duração
    const duration = options?.duration || 3000;
    setTimeout(() => setTrigger(false), duration);
  };

  return {
    trigger,
    celebrate
  };
}

// Componente de confetes específico para marcos
export function MilestoneConfetti({
  isVisible,
  onComplete
}: {
  isVisible: boolean;
  onComplete?: () => void;
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <ConfettiEffect
      trigger={isVisible}
      intensity="high"
      duration={3000}
      colors={['#F87060', '#10b981', '#f59e0b', '#9333ea']}
    />
  );
}

// Componente de confetes específico para badges
export function BadgeConfetti({
  isVisible,
  badgeColor,
  onComplete
}: {
  isVisible: boolean;
  badgeColor?: string;
  onComplete?: () => void;
}) {
  const colors = badgeColor 
    ? [badgeColor, '#ffffff', '#ffd700']
    : ['#10b981', '#ffffff', '#ffd700'];

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <ConfettiEffect
      trigger={isVisible}
      intensity="medium"
      duration={2500}
      colors={colors}
    />
  );
}