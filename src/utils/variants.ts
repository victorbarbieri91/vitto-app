import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Variantes para botões modernos
 */
export const buttonVariants = cva(
  // Classe base
  'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-medium hover:shadow-large focus:ring-primary-500 transform hover:-translate-y-0.5',
        secondary: 'bg-white text-primary-500 border-2 border-primary-500 hover:bg-primary-50 active:bg-primary-100 shadow-soft hover:shadow-medium focus:ring-primary-500',
        outline: 'bg-transparent text-neutral-700 border border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 shadow-soft hover:shadow-medium focus:ring-neutral-500',
        ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus:ring-neutral-500',
        success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700 shadow-medium hover:shadow-large focus:ring-success-500',
        warning: 'bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 shadow-medium hover:shadow-large focus:ring-warning-500',
        danger: 'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 shadow-medium hover:shadow-large focus:ring-danger-500',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        xl: 'h-16 px-10 text-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

/**
 * Variantes para cards modernos
 */
export const cardVariants = cva(
  // Classe base
  'rounded-3xl border transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-white border-neutral-100 shadow-soft hover:shadow-medium',
        glass: 'bg-white/80 backdrop-blur-sm border-white/20 shadow-glass',
        'glass-strong': 'bg-white/90 backdrop-blur-md border-white/30 shadow-glass',
        metric: 'bg-gradient-to-br from-white to-neutral-50 border-neutral-100 shadow-soft hover:shadow-medium hover:-translate-y-1',
        'metric-primary': 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 shadow-soft hover:shadow-medium hover:-translate-y-1',
        'metric-success': 'bg-gradient-to-br from-success-50 to-success-100 border-success-200 shadow-soft hover:shadow-medium hover:-translate-y-1',
        'metric-warning': 'bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200 shadow-soft hover:shadow-medium hover:-translate-y-1',
        'metric-danger': 'bg-gradient-to-br from-danger-50 to-danger-100 border-danger-200 shadow-soft hover:shadow-medium hover:-translate-y-1',
        'dark': 'bg-deep-blue border-transparent shadow-lg text-white',
        'metric-interactive': 'group bg-white border-neutral-100 shadow-soft hover:shadow-xl hover:scale-[1.03] hover:bg-coral-500 hover:border-coral-500 transition-all duration-300',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      hover: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: false,
    },
  }
);

/**
 * Variantes para inputs modernos
 */
export const inputVariants = cva(
  // Classe base
  'w-full rounded-xl border-2 px-4 py-3 text-base transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500',
        error: 'bg-white border-danger-300 text-neutral-900 placeholder:text-neutral-400 focus:border-danger-500',
        success: 'bg-white border-success-300 text-neutral-900 placeholder:text-neutral-400 focus:border-success-500',
      },
      size: {
        sm: 'h-10 px-3 text-sm',
        md: 'h-12 px-4 text-base',
        lg: 'h-14 px-5 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// Exportar tipos para TypeScript
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type CardVariants = VariantProps<typeof cardVariants>;
export type InputVariants = VariantProps<typeof inputVariants>; 