import { useState, useCallback } from 'react';
import { TransactionService } from '../services/api/TransactionService';

export type TransactionChartData = {
  labels: string[];
  incomeData: number[];
  expenseData: number[];
};

export type Period = 'week' | 'month' | 'year' | 'custom';

/**
 *
 */
export function useTransactionChart() {
  const [chartData, setChartData] = useState<TransactionChartData>({
    labels: [],
    incomeData: [],
    expenseData: []
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const transactionService = new TransactionService();

  const fetchChartData = useCallback(async (period: Period, startDate?: string, endDate?: string) => {
    console.log(`[useTransactionChart] Iniciando fetchChartData com período: ${period}`);
    console.time('chart-data-fetch');
    setIsLoading(true);
    setError(null);
    
    try {
      let data: TransactionChartData;
      
      if (period === 'custom' && startDate && endDate) {
        console.log(`[useTransactionChart] Buscando dados para intervalo personalizado: ${startDate} até ${endDate}`);
        data = await transactionService.getChartDataForDateRange(startDate, endDate);
      } else if (period !== 'custom') {
        console.log(`[useTransactionChart] Buscando dados para período: ${period}`);
        data = await transactionService.getChartData(period);
      } else {
        console.error('[useTransactionChart] Erro: período personalizado sem datas definidas');
        throw new Error('Datas de início e fim são necessárias para período personalizado');
      }
      
      console.log('[useTransactionChart] Dados recebidos:', data);
      setChartData(data);
      console.log('[useTransactionChart] Estado do chartData atualizado');
    } catch (err) {
      console.error('[useTransactionChart] ERRO AO BUSCAR DADOS DO GRÁFICO:', err);
      setError(err instanceof Error ? err : new Error('Erro ao buscar dados do gráfico'));
    } finally {
      console.log('[useTransactionChart] Finalizando (setIsLoading(false))');
      setIsLoading(false);
      console.timeEnd('chart-data-fetch');
    }
  }, []);

  return {
    chartData,
    isLoading,
    error,
    fetchChartData
  };
}
