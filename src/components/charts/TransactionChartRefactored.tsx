import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TransactionChartRefactoredProps {
  labels: string[];
  incomeData: number[];
  expenseData: number[];
  period: 'week' | 'month' | 'year';
}

/**
 *
 */
export default function TransactionChartRefactored({
  labels,
  incomeData,
  expenseData,
  period
}: TransactionChartRefactoredProps) {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    // Preparar dados do gráfico
    const data = {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
        },
      ],
    };
    
    setChartData(data);
  }, [labels, incomeData, expenseData]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: period === 'week' 
          ? 'Receitas e Despesas da Semana' 
          : period === 'month' 
            ? 'Receitas e Despesas do Mês' 
            : 'Receitas e Despesas do Ano',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(tickValue: string | number) {
            const value = Number(tickValue);
            if (isNaN(value)) return tickValue;
            
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      {labels.length > 0 ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Sem dados para exibir</p>
        </div>
      )}
    </div>
  );
}
