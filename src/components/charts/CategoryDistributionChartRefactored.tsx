import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface CategoryDistribution {
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

interface CategoryDistributionChartRefactoredProps {
  distributionData: CategoryDistribution[];
  period: 'week' | 'month' | 'year';
}

export default function CategoryDistributionChartRefactored({
  distributionData,
  period
}: CategoryDistributionChartRefactoredProps) {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (!distributionData.length) return;

    // Preparar dados para o gráfico
    const data = {
      labels: distributionData.map(item => item.categoryName),
      datasets: [
        {
          data: distributionData.map(item => item.amount),
          backgroundColor: distributionData.map(item => item.categoryColor),
          borderColor: distributionData.map(item => item.categoryColor),
          borderWidth: 1,
        },
      ],
    };

    setChartData(data);
  }, [distributionData]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = distributionData[context.dataIndex]?.percentage.toFixed(1) || 0;
            
            return `${label}: ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(value)} (${percentage}%)`;
          }
        }
      },
      title: {
        display: true,
        text: period === 'week' 
          ? 'Despesas da Semana por Categoria' 
          : period === 'month' 
            ? 'Despesas do Mês por Categoria' 
            : 'Despesas do Ano por Categoria',
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      {distributionData.length > 0 ? (
        <div>
          <Doughnut data={chartData} options={options} />
          
          <div className="mt-4">
            {distributionData.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between my-2">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.categoryColor }}
                  ></div>
                  <span className="text-sm">{item.categoryName}</span>
                </div>
                <div className="flex space-x-4">
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(item.amount)}
                  </span>
                  <span className="text-sm text-gray-500 w-16 text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Sem dados para exibir</p>
        </div>
      )}
    </div>
  );
}
