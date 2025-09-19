import { useState, useCallback, useMemo } from 'react';

export interface MonthNavigationState {
  currentMonth: number;
  currentYear: number;
  isCurrentMonth: boolean;
}

export const useMonthNavigation = (initialMonth?: number, initialYear?: number) => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(initialYear ?? now.getFullYear());

  const isCurrentMonth = useMemo(() => {
    return currentMonth === now.getMonth() + 1 && currentYear === now.getFullYear();
  }, [currentMonth, currentYear, now]);

  const handleMonthChange = useCallback((month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  }, []);

  const goToPrevious = useCallback(() => {
    if (currentMonth === 1) {
      handleMonthChange(12, currentYear - 1);
    } else {
      handleMonthChange(currentMonth - 1, currentYear);
    }
  }, [currentMonth, currentYear, handleMonthChange]);

  const goToNext = useCallback(() => {
    if (currentMonth === 12) {
      handleMonthChange(1, currentYear + 1);
    } else {
      handleMonthChange(currentMonth + 1, currentYear);
    }
  }, [currentMonth, currentYear, handleMonthChange]);

  const goToToday = useCallback(() => {
    handleMonthChange(now.getMonth() + 1, now.getFullYear());
  }, [handleMonthChange, now]);

  // Formatar mês para exibição
  const monthName = useMemo(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[currentMonth - 1];
  }, [currentMonth]);

  // Formatar período para APIs (YYYY-MM format)
  const apiMonth = useMemo(() => {
    return currentMonth.toString().padStart(2, '0');
  }, [currentMonth]);

  const apiPeriod = useMemo(() => {
    return `${currentYear}-${apiMonth}`;
  }, [currentYear, apiMonth]);

  return {
    // Estado atual
    currentMonth,
    currentYear,
    isCurrentMonth,
    
    // Formatação
    monthName,
    apiMonth,
    apiPeriod,
    
    // Ações
    handleMonthChange,
    goToPrevious,
    goToNext,
    goToToday,
    
    // Estado combinado
    state: {
      currentMonth,
      currentYear,
      isCurrentMonth,
    } as MonthNavigationState
  };
};