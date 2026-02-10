import { HTMLAttributes, ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { cardVariants, type CardVariants } from '../../../utils/variants';

interface ModernCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>,
    CardVariants {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  animate?: boolean;
}

/**
 * Card moderno inspirado no design da Crextio
 * 
 * Features:
 * - Variantes com glassmorphism (glass, glass-strong)
 * - Cards de métricas com gradientes (metric-primary, metric-success, etc.)
 * - Animações suaves de hover
 * - Sombras personalizadas
 * - Padding configurável
 * - Suporte completo a acessibilidade
 */
const ModernCard = forwardRef<HTMLDivElement, ModernCardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      animate = true,
      className,
      ...props
    },
    ref
  ) => {
    const baseAnimations = {
      initial: animate ? { opacity: 0, y: 20 } : undefined,
      animate: animate ? { opacity: 1, y: 0 } : undefined,
      transition: animate ? { duration: 0.3, ease: 'easeOut' } : undefined,
    };

    const hoverAnimations = hover ? {
      whileHover: { scale: 1.02, y: -2 },
      transition: { duration: 0.2 }
    } : {};

    if (animate) {
      return (
        <motion.div
          ref={ref}
          className={cn(
            cardVariants({ variant, padding, hover }),
            className
          )}
          {...baseAnimations}
          {...hoverAnimations}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, padding, hover }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModernCard.displayName = 'ModernCard';

export default ModernCard; 