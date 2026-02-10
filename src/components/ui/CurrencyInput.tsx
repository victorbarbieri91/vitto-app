import React, { useState, useEffect, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(({
  value,
  onChange,
  label,
  error,
  required,
  className,
  disabled,
  placeholder = 'R$ 0,00',
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Formata número para exibição em Real Brasileiro
  const formatCurrency = (val: number | undefined): string => {
    if (val === undefined || val === null || isNaN(val)) return '';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Atualiza o valor exibido quando o prop value muda
  useEffect(() => {
    if (!isFocused) {
      if (value !== undefined && value !== null && value > 0) {
        setDisplayValue(formatCurrency(value));
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused]);

  const formatRealTimeDisplay = (value: string): string => {
    // Remove tudo exceto números
    const numbersOnly = value.replace(/\D/g, '');

    if (!numbersOnly) return '';

    // Converte para centavos
    const cents = parseInt(numbersOnly, 10);
    const reais = cents / 100;

    // Formata como moeda brasileira
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(reais);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (input === '') {
      setDisplayValue('');
      onChange?.(undefined);
      return;
    }

    // Remove tudo exceto números
    const numbersOnly = input.replace(/\D/g, '');

    if (!numbersOnly) {
      setDisplayValue('');
      onChange?.(undefined);
      return;
    }

    // Formata em tempo real
    const formatted = formatRealTimeDisplay(input);
    setDisplayValue(formatted);

    // Converte para número (centavos para reais)
    const cents = parseInt(numbersOnly, 10);
    const numericValue = cents / 100;

    if (numericValue >= 0) {
      onChange?.(numericValue);
    }
  };

  const handleFocus = (_e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // A formatação em tempo real já cuida da exibição
  };

  const handleBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // A formatação já está aplicada em tempo real
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "w-full px-4 py-3 rounded-2xl border bg-white text-slate-900",
            "focus:outline-none focus:ring-2 transition-all duration-200",
            "placeholder:text-slate-400",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
              : "border-slate-200 focus:border-coral-500 focus:ring-coral-500/20",
            disabled && "bg-slate-50 text-slate-500 cursor-not-allowed",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;