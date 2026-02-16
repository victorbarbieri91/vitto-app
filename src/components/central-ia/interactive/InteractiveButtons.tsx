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

export function InteractiveButtons({
  element,
  onSelect,
  disabled = false,
}: InteractiveButtonsProps) {
  const hasSelection = !!element.selectedValue;

  const getButtonStyles = (button: InteractiveButton) => {
    const baseStyles =
      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all';

    // Se já tem seleção, mostrar estado de seleção
    if (hasSelection) {
      const isSelected = button.value === element.selectedValue;
      if (isSelected) {
        return cn(
          baseStyles,
          'bg-coral-500 text-white shadow-sm ring-2 ring-coral-300/50'
        );
      }
      // Botões não selecionados ficam faded
      return cn(
        baseStyles,
        'bg-slate-50 text-slate-400 border border-slate-100 cursor-default'
      );
    }

    // Sem seleção: estilo normal clicável
    const variant = button.variant || 'primary';
    const variants = {
      primary:
        'bg-coral-500 text-white hover:bg-coral-600 shadow-sm hover:shadow-md active:scale-95',
      secondary:
        'bg-white text-slate-700 border border-slate-200 hover:border-coral-300 hover:bg-coral-50 active:scale-95',
      outline:
        'bg-transparent text-slate-600 border border-slate-300 hover:bg-slate-50 active:scale-95',
      danger:
        'bg-red-500 text-white hover:bg-red-600 active:scale-95',
    };

    return cn(
      baseStyles,
      variants[variant],
      disabled && 'opacity-50 cursor-not-allowed'
    );
  };

  return (
    <div className="mt-3 pt-2 border-t border-slate-100/60">
      {element.question && (
        <p className="text-sm text-slate-600 mb-3">{element.question}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {element.buttons.map((button, index) => {
          const isSelected = hasSelection && button.value === element.selectedValue;
          const isDisabledBySelection = hasSelection && !isSelected;

          return (
            <motion.button
              key={button.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.2 }}
              onClick={() => !disabled && !hasSelection && !button.disabled && onSelect(button.value)}
              disabled={disabled || isDisabledBySelection || button.disabled}
              className={getButtonStyles(button)}
            >
              {isSelected && <Check className="w-4 h-4" />}
              {!isSelected && button.icon && iconMap[button.icon]}
              {button.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
