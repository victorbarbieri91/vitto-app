/**
 * Smart Invoice Period Detection
 *
 * Mirrors the database function calcular_periodo_fatura() exactly:
 * - If transactionDay >= diaFechamento -> next month's fatura
 * - If transactionDay < diaFechamento  -> current month's fatura
 *
 * Uses the TRANSACTION DATE (not today) as reference.
 */

export const NOMES_MESES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function formatFaturaLabel(mes: number, ano: number): string {
  return `Fatura de ${NOMES_MESES[mes - 1]} ${ano}`;
}

/**
 * Determines which fatura (month/year) a credit card transaction belongs to.
 * Mirrors the database function calcular_periodo_fatura() exactly.
 *
 * @param dataTransacao - The date of the purchase (YYYY-MM-DD string or Date)
 * @param diaFechamento - The card's closing day (1-31)
 * @returns { mes, ano, label }
 */
export function determinarFaturaInteligente(
  dataTransacao: string | Date,
  diaFechamento: number
): { mes: number; ano: number; label: string } {
  const data = typeof dataTransacao === 'string' ? new Date(dataTransacao + 'T12:00:00') : dataTransacao;
  const diaTransacao = data.getDate();
  const mesTransacao = data.getMonth() + 1; // getMonth() is 0-indexed
  const anoTransacao = data.getFullYear();

  // Matches DB: IF v_dia_transacao >= v_dia_fechamento THEN next month
  if (diaTransacao >= diaFechamento) {
    const proximoMes = mesTransacao === 12 ? 1 : mesTransacao + 1;
    const proximoAno = mesTransacao === 12 ? anoTransacao + 1 : anoTransacao;
    return { mes: proximoMes, ano: proximoAno, label: formatFaturaLabel(proximoMes, proximoAno) };
  } else {
    return { mes: mesTransacao, ano: anoTransacao, label: formatFaturaLabel(mesTransacao, anoTransacao) };
  }
}
