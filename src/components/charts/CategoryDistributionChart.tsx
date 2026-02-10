import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { Transaction } from '../../hooks/useTransactions';
import type { Category } from '../../hooks/useCategories';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface CategoryDistributionChartProps {
  transactions: Transaction[];
  categories: Category[];
  period: 'week' | 'month' | 'year';
}

/**
 *
 */
export default function CategoryDistributionChart({ 
  transactions, 
  categories,
  period 
}: CategoryDistributionChartProps) {
  const [chartData, setChartData] = useState<ChartData<'doughnut'>>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (!transactions.length || !categories.length) return;

    // Filtrar transações com base no período selecionado
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.data);
      const today = new Date();
      
      if (period === 'week') {
        // Últimos 7 dias
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        return transactionDate >= weekAgo && transactionDate <= today;
      } else if (period === 'month') {
        // Último mês
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        return transactionDate >= monthAgo && transactionDate <= today;
      } else if (period === 'year') {
        // Último ano
        const yearAgo = new Date();
        yearAgo.setFullYear(today.getFullYear() - 1);
        return transactionDate >= yearAgo && transactionDate <= today;
      }
      
      return false;
    });

    // Filtrar apenas despesas
    const expenses = filteredTransactions.filter(t => t.tipo === 'despesa');

    // Agrupar despesas por categoria
    const categoryTotals = expenses.reduce((acc: Record<string, number>, transaction) => {
      const categoryId = transaction.categoria_id;
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      acc[categoryId] += transaction.valor;
      return acc;
    }, {});

    // Preparar dados para o gráfico
    const categoryLabels: string[] = [];
    const categoryValues: number[] = [];
    const categoryColors: string[] = [];

    Object.entries(categoryTotals).forEach(([categoryId, total]) => {
      const categoryIdNum = parseInt(categoryId);
      const category = categories.find(c => c.id === categoryIdNum);
      if (category) {
        categoryLabels.push(category.nome);
        categoryValues.push(total);
        categoryColors.push(category.cor || '#6366F1');
      }
    });

    // Ordenar por valor (do maior para o menor)
    const sortedIndices = categoryValues
      .map((_, i) => i)
      .sort((a, b) => categoryValues[b] - categoryValues[a]);

    const sortedLabels = sortedIndices.map(i => categoryLabels[i]);
    const sortedValues = sortedIndices.map(i => categoryValues[i]);
    const sortedColors = sortedIndices.map(i => categoryColors[i]);

    // Limitar a 8 categorias e agrupar o resto como "Outros"
    const maxCategories = 8;
    if (sortedLabels.length > maxCategories) {
      const topLabels = sortedLabels.slice(0, maxCategories - 1);
      const topValues = sortedValues.slice(0, maxCategories - 1);
      const topColors = sortedColors.slice(0, maxCategories - 1);
      
      const otherValue = sortedValues.slice(maxCategories - 1).reduce((sum, val) => sum + val, 0);
      
      topLabels.push('Outros');
      topValues.push(otherValue);
      topColors.push('#CBD5E1'); // Cor cinza para "Outros"
      
      setChartData({
        labels: topLabels,
        datasets: [
          {
            data: topValues,
            backgroundColor: topColors,
            borderColor: topColors.map(color => color),
            borderWidth: 1,
          },
        ],
      });
    } else {
      setChartData({
        labels: sortedLabels,
        datasets: [
          {
            data: sortedValues,
            backgroundColor: sortedColors,
            borderColor: sortedColors.map(color => color),
            borderWidth: 1,
          },
        ],
      });
    }
  }, [transactions, categories, period]);

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw as number;
            const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => (a as number) + (b as number), 0) as number;
            const percentage = Math.round((value / total) * 100);
            
            return `${label}: ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-fontColor mb-4">
        Distribuição de Despesas por Categoria
      </h3>
      {transactions.length > 0 && categories.length > 0 ? (
        <div className="h-64">
          <Doughnut data={chartData} options={options} />
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Sem dados para exibir</p>
        </div>
      )}
    </div>
  );
}
