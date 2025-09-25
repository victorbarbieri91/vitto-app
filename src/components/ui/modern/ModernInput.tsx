import { InputHTMLAttributes, ReactNode, forwardRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';
import { inputVariants, type InputVariants } from '../../../utils/variants';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface ModernInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    InputVariants {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rightElement?: ReactNode;
  isLoading?: boolean;
}

/**
 * Input moderno inspirado no design da Crextio
 * 
 * Features:
 * - Estados visuais claros (default, error, success)
 * - Animações de focus suaves
 * - Suporte a ícones e elementos customizados
 * - Labels flutuantes opcionais
 * - Estados de loading
 * - Feedback visual de validação
 * - Acessibilidade completa
 */
const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      rightElement,
      isLoading = false,
      variant = 'default',
      size = 'md',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputVariant = error ? 'error' : variant;
    const isDisabled = disabled || isLoading;
    const isMobile = useIsMobile();

    // For mobile, detect if this is a number input
    const inputMode = props.type === 'number' || props.type === 'tel'
      ? 'numeric'
      : props.type === 'email'
        ? 'email'
        : props.type === 'url'
          ? 'url'
          : 'text';

    return (
      <div className="w-full space-y-2">
        {/* Label */}
        {label && (
          <motion.label
            htmlFor={props.id}
            className={cn(
              'block text-sm font-medium transition-colors duration-200',
              error ? 'text-danger-600' : 'text-neutral-700',
              isDisabled && 'opacity-50'
            )}
            initial={false}
            animate={{ 
              color: isFocused 
                ? error 
                  ? '#DC2626' 
                  : '#F87060'
                : error 
                  ? '#DC2626' 
                  : '#404040'
            }}
          >
            {label}
          </motion.label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              leftIcon && 'pl-10',
              (rightIcon || rightElement || isLoading) && 'pr-10',
              className
            )}
            disabled={isDisabled}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            autoComplete={isMobile ? 'off' : props.autoComplete}
            inputMode={isMobile ? inputMode : undefined}
            {...props}
          />

          {/* Right Content */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isLoading ? (
              <motion.div
                className="w-4 h-4 text-neutral-400"
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
            ) : rightElement ? (
              rightElement
            ) : rightIcon ? (
              <div className="text-neutral-400">
                {rightIcon}
              </div>
            ) : null}
          </div>

        </div>

        {/* Helper Text / Error Message */}
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-2"
          >
            {error ? (
              <>
                <svg
                  className="w-4 h-4 text-danger-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-danger-600">{error}</p>
              </>
            ) : helperText ? (
              <p className="text-sm text-neutral-500">{helperText}</p>
            ) : null}
          </motion.div>
        )}
      </div>
    );
  }
);

ModernInput.displayName = 'ModernInput';

export default ModernInput; 