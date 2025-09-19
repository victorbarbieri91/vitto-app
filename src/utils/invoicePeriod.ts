import { CreditCard } from '../services/api/CreditCardService';

export interface InvoicePeriod {
  startDate: string;
  endDate: string;
  displayMonth: number;
  displayYear: number;
}

/**
 * Calculate the invoice period for a credit card given a display month/year
 *
 * Logic: If closing day is 10th, then:
 * - October 2024 invoice covers purchases from Sept 11 to Oct 10
 * - November 2024 invoice covers purchases from Oct 11 to Nov 10
 *
 * @param card Credit card with closing day
 * @param displayMonth Month being displayed (1-12)
 * @param displayYear Year being displayed
 * @returns Object with start and end dates for the invoice period
 */
export function getInvoicePeriod(
  card: CreditCard,
  displayMonth: number,
  displayYear: number
): InvoicePeriod {
  const closingDay = card.dia_fechamento;

  // Calculate the end date (closing day of display month)
  const endDate = new Date(displayYear, displayMonth - 1, closingDay);

  // Calculate the start date (day after closing day of previous month)
  const startDate = new Date(displayYear, displayMonth - 1, closingDay + 1);
  startDate.setMonth(startDate.getMonth() - 1);

  // Format dates as YYYY-MM-DD for database queries
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    displayMonth,
    displayYear
  };
}

/**
 * Get SQL WHERE clause for filtering transactions by invoice period
 */
export function getInvoicePeriodFilter(
  card: CreditCard,
  displayMonth: number,
  displayYear: number
): { startDate: string; endDate: string } {
  const period = getInvoicePeriod(card, displayMonth, displayYear);
  return {
    startDate: period.startDate,
    endDate: period.endDate
  };
}

/**
 * Check if a transaction date falls within an invoice period
 */
export function isTransactionInInvoicePeriod(
  transactionDate: string,
  card: CreditCard,
  displayMonth: number,
  displayYear: number
): boolean {
  const period = getInvoicePeriod(card, displayMonth, displayYear);
  const txDate = new Date(transactionDate);
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);

  return txDate >= startDate && txDate <= endDate;
}

/**
 * Format period for display
 */
export function formatInvoicePeriod(period: InvoicePeriod): string {
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);

  const formatDay = (date: Date) => date.getDate().toString().padStart(2, '0');
  const formatMonth = (date: Date) => (date.getMonth() + 1).toString().padStart(2, '0');

  return `${formatDay(startDate)}/${formatMonth(startDate)} a ${formatDay(endDate)}/${formatMonth(endDate)}`;
}