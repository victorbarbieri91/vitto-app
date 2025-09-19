import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

type GlassVariant = 'subtle' | 'medium' | 'strong' | 'frosted';
type GlassBlur = 'sm' | 'md' | 'lg' | 'xl';

interface GlassmorphCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  children: ReactNode;
  variant?: GlassVariant;
  blur?: GlassBlur;
  border?: boolean;
  shadow?: boolean;
  className?: string;
  animate?: boolean;
}

/**
 * Card com efeito glassmorphism inspirado no design moderno da Crextio
 * 
 * Features:
 * - Múltiplas variantes de transparência
 * - Blur configurável
 * - Bordas opcionais
 * - Sombras customizáveis
 * - Animações de entrada suaves
 * - Perfeito para overlays e modais
 */
const GlassmorphCard = forwardRef<HTMLDivElement, GlassmorphCardProps>(
  (
    {
      children,
      variant = 'medium',
      blur = 'md',
      border = true,
      shadow = true,
      className,
      animate = true,
      ...props
    },
    ref
  ) => {
    // Variantes de transparência
    const glassVariants: Record<GlassVariant, string> = {
      subtle: 'bg-white/70',
      medium: 'bg-white/80',
      strong: 'bg-white/90',
      frosted: 'bg-white/95',
    };

    // Variantes de blur
    const blurVariants: Record<GlassBlur, string> = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    };

    // Classes base
    const baseClasses = cn(
      'rounded-3xl',
      glassVariants[variant],
      blurVariants[blur],
      border && 'border border-white/30',
      shadow && 'shadow-glass',
      'backdrop-saturate-150',
      className
    );

    if (animate) {
      return (
        <motion.div
          ref={ref}
          className={baseClasses}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.25, 0.25, 0, 1] // Custom easing para suavidade
          }}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {children}
      </div>
    );
  }
);

GlassmorphCard.displayName = 'GlassmorphCard';

export default GlassmorphCard;

/**
 * Componente para overlay de fundo com glassmorphism
 */
export function GlassOverlay({ 
  children, 
  onClick,
  className,
}: { 
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(
        'fixed inset-0 bg-black/20 backdrop-blur-sm z-40',
        'flex items-center justify-center p-4',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/**
 * Container glassmorphism para formulários flutuantes
 */
export function GlassFormContainer({ 
  children, 
  title,
  subtitle,
  className,
}: { 
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <GlassmorphCard
      variant="medium"
      blur="lg"
      className={cn('p-8 max-w-md w-full mx-auto', className)}
      animate
    >
      {(title || subtitle) && (
        <div className="text-center mb-6">
          {title && (
            <motion.h2
              className="text-2xl font-bold text-neutral-900 mb-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {title}
            </motion.h2>
          )}
          {subtitle && (
            <motion.p
              className="text-neutral-600"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {children}
      </motion.div>
    </GlassmorphCard>
  );
} 