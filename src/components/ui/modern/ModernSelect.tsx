import React, { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '../../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';

const selectVariants = cva(
  'w-full appearance-none bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'focus:border-slate-400 focus:ring-slate-400/10',
        error: 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, VariantProps<typeof selectVariants> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
}

const ModernSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, wrapperClassName, variant, ...props }, ref) => {
    const computedVariant = error ? 'error' : variant;

    return (
      <div className={cn('relative w-full', wrapperClassName)}>
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(selectVariants({ variant: computedVariant, className }))}
            ref={ref}
            {...props}
          />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

ModernSelect.displayName = 'ModernSelect';

export default ModernSelect; 