/**
 * Utility functions for credit card form and date calculations
 */

export interface SmartClosingResult {
  closingDay: number;
  isCalculated: boolean;
  periodPreview: string;
}

/**
 * Calculate smart closing day based on due day (7 days before)
 * @param dueDay - The due day (1-31)
 * @returns The calculated closing day
 */
export function calculateSmartClosingDay(dueDay: number): number {
  if (!dueDay || dueDay < 1 || dueDay > 31) {
    return 1;
  }

  let closingDay = dueDay - 7;

  // If negative, go to previous month (assume 30 days for simplicity)
  if (closingDay <= 0) {
    closingDay = 30 + closingDay;
  }

  // Ensure it's within valid range
  return Math.max(1, Math.min(31, closingDay));
}

/**
 * Generate a preview of the invoice period
 * @param closingDay - Closing day of the month
 * @param dueDay - Due day of the month
 * @returns Formatted period string
 */
export function generatePeriodPreview(closingDay: number, dueDay: number): string {
  if (!closingDay || !dueDay) {
    return '';
  }

  // If due day is less than closing day, it means due is next month
  if (dueDay < closingDay) {
    return `${closingDay.toString().padStart(2, '0')}/Jan a ${dueDay.toString().padStart(2, '0')}/Fev`;
  } else {
    // Same month scenario (unusual but possible)
    return `${closingDay.toString().padStart(2, '0')}/Jan a ${dueDay.toString().padStart(2, '0')}/Jan`;
  }
}

/**
 * Get smart closing calculation result with preview
 * @param dueDay - The due day
 * @returns Complete result with closing day, calculation flag, and preview
 */
export function getSmartClosingResult(dueDay: number): SmartClosingResult {
  const closingDay = calculateSmartClosingDay(dueDay);
  const periodPreview = generatePeriodPreview(closingDay, dueDay);

  return {
    closingDay,
    isCalculated: true,
    periodPreview
  };
}

/**
 * Validate that closing and due days are valid
 * @param closingDay - Closing day
 * @param dueDay - Due day
 * @returns Object with validation result and error message if any
 */
export function validateCreditCardDates(closingDay: number, dueDay: number): {
  isValid: boolean;
  error?: string;
} {
  if (!closingDay || closingDay < 1 || closingDay > 31) {
    return {
      isValid: false,
      error: 'Dia de fechamento deve estar entre 1 e 31'
    };
  }

  if (!dueDay || dueDay < 1 || dueDay > 31) {
    return {
      isValid: false,
      error: 'Dia de vencimento deve estar entre 1 e 31'
    };
  }

  return { isValid: true };
}

/**
 * Calculate days between closing and due (considering month change)
 * @param closingDay - Closing day
 * @param dueDay - Due day
 * @returns Number of days between closing and due
 */
export function calculateDaysBetween(closingDay: number, dueDay: number): number {
  if (dueDay >= closingDay) {
    // Same month
    return dueDay - closingDay;
  } else {
    // Due is next month
    return (30 - closingDay) + dueDay;
  }
}