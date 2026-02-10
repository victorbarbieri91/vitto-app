/**
 * InteractiveButtons - Botões de opção interativos no chat
 */

import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  Repeat,
  Wallet,
  Check,
  X,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type { ButtonsElement, InteractiveButton } from '../../../types/central-ia';
import { cn } from '../../../utils/cn';

interface InteractiveButtonsProps {
  element: ButtonsElement;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

// Mapeamento de ícones
const iconMap: Record<string, React.ReactNode> = {
  transacoes: <FileSpreadsheet className="w-4 h-4" />,
  transacoes_fixas: <Repeat className="w-4 h-4" />,
  patrimonio: <Wallet className="w-4 h-4" />,
  confirm: <Check className="w-4 h-4" />,
  cancel: <X className="w-4 h-4" />,
  next: <ArrowRight className="w-4 h-4" />,
  continue: <ChevronRight className="w-4 h-4" />,
};

/**
 *
 */
export function InteractiveButtons({
  element,
  onSelect,
  disabled = false,
}: InteractiveButtonsProps) {
  const getButtonStyles = (variant: InteractiveButton['variant'] = 'secondary') => {
    const baseStyles =
      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all';

    const variants = {
      primary:
        'bg-coral-500 text-white hover:bg-coral-600 shadow-sm hover:shadow-md',
      secondary:
        'bg-white text-slate-700 border border-slate-200 hover:border-coral-300 hover:bg-coral-50',
      outline:
        'bg-transparent text-slate-600 border border-slate-300 hover:bg-slate-50',
      danger:
        'bg-red-500 text-white hover:bg-red-600',
    };

    return cn(
      baseStyles,
      variants[variant],
      disabled && 'opacity-50 cursor-not-allowed'
    );
  };

  return (
    <div className="mt-3">
      {element.question && (
        <p className="text-sm text-slate-600 mb-3">{element.question}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {element.buttons.map((button, index) => (
          <motion.button
            key={button.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => !disabled && !button.disabled && onSelect(button.value)}
            disabled={disabled || button.disabled}
            className={getButtonStyles(button.variant)}
          >
            {button.icon && iconMap[button.icon]}
            {button.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
