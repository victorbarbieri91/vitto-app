/**
 * Utilitários de formatação para o sistema
 */

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 */
export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
};

/**
 * Formata uma data no padrão brasileiro (dd/mm/yyyy)
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '--/--/----';
  }

  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formata uma data como local (resolve problema de fuso horário)
 * Para strings no formato YYYY-MM-DD, trata como data local
 */
export const formatLocalDate = (dateString: string): string => {
  if (!dateString) {
    return '--/--/----';
  }

  // Se é uma string no formato YYYY-MM-DD, criar data local
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, month - 1, day); // mês é 0-indexado

    return localDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }

  // Fallback para outros formatos
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) {
    return '--/--/----';
  }

  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

/**
 * Formata uma data no formato compacto (dd/mm)
 */
export const formatShortDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '--/--';
  }
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  });
};

/**
 * Formata um número como percentual
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  if (isNaN(value)) {
    return '0%';
  }
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formata um número para exibição compacta (1K, 1M, etc.)
 */
export const formatCompactNumber = (value: number): string => {
  if (isNaN(value)) {
    return '0';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

/**
 * Formata um dia do mês no formato "Dia X"
 */
export const formatDayOfMonth = (day: number): string => {
  if (isNaN(day) || day < 1 || day > 31) {
    return 'Dia --';
  }
  
  return `Dia ${day}`;
}; 