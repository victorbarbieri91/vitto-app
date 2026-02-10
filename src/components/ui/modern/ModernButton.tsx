import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { buttonVariants, type ButtonVariants } from '../../../utils/variants';

interface ModernButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    ButtonVariants {
  children: ReactNode;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  icon?: ReactNode; // Alias para leftIcon para compatibilidade
  asChild?: boolean;
}

/**
 * Botão moderno inspirado no design da Crextio
 * 
 * Features:
 * - Variantes tipadas (primary, secondary, ghost, outline, success, warning, danger)
 * - Tamanhos responsivos (sm, md, lg, xl)
 * - Animações suaves com hover effects
 * - Estados de loading com spinner
 * - Suporte a ícones esquerda/direita
 * - Acessibilidade completa
 */
const ModernButton = forwardRef<HTMLButtonElement, ModernButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      icon,
      className,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    // Use icon como alias para leftIcon se fornecido
    const finalLeftIcon = leftIcon || icon;

    return (
      <motion.button
        ref={ref}
        type={type}
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          className
        )}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.1 }}
        {...props}
      >
        <div className="flex items-center justify-center space-x-2">
          {/* Ícone à esquerda ou spinner de loading */}
          {isLoading ? (
            <motion.div
              className="w-4 h-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </motion.div>
          ) : finalLeftIcon ? (
            <span className="flex-shrink-0">{finalLeftIcon}</span>
          ) : null}

          {/* Conteúdo do botão */}
          <span className={cn(
            'whitespace-nowrap',
            isLoading && 'opacity-70'
          )}>
            {children}
          </span>

          {/* Ícone à direita */}
          {rightIcon && !isLoading && (
            <span className="flex-shrink-0">{rightIcon}</span>
          )}
        </div>
      </motion.button>
    );
  }
);

ModernButton.displayName = 'ModernButton';

export default ModernButton; 