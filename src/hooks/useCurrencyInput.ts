import { useState, useCallback } from 'react';

export function useCurrencyInput(initialValue: number = 0) {
  const [value, setValue] = useState(initialValue);

  const formatCurrency = useCallback((num: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  }, []);

  const parseCurrency = useCallback((str: string): number => {
    // Remove everything except digits
    const cleanStr = str.replace(/\D/g, '');
    // Convert to number with 2 decimal places
    return parseInt(cleanStr || '0') / 100;
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseCurrency(e.target.value);
    setValue(numericValue);
    return numericValue;
  }, [parseCurrency]);

  const displayValue = value > 0 ? formatCurrency(value) : '';

  return {
    value,
    displayValue,
    setValue,
    handleChange,
    formatCurrency,
    parseCurrency
  };
}