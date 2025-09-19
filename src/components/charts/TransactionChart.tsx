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
import type { Transaction } from '../../hooks/useTransactions';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TransactionChartProps {
  transactions: Transaction[];
  period: 'week' | 'month' | 'year';
}

export default function TransactionChart({ transactions, period }: TransactionChartProps) {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    if (!transactions.length) return;

    // Preparar dados com base no período selecionado
    const prepareData = () => {
      let labels: string[] = [];
      let incomeData: number[] = [];
      let expenseData: number[] = [];
      
      // Filtrar transações para incluir apenas receitas e despesas (não transferências)
      const filteredTransactions = transactions.filter(
        t => t.tipo === 'receita' || t.tipo === 'despesa'
      );

      if (period === 'week') {
        // Últimos 7 dias
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        labels = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - 6 + i);
          return days[d.getDay()];
        });

        // Inicializar arrays com zeros
        incomeData = Array(7).fill(0);
        expenseData = Array(7).fill(0);

        // Preencher dados
        filteredTransactions.forEach(t => {
          const date = new Date(t.data);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 6) {
            const index = 6 - diffDays;
            if (t.tipo === 'receita') {
              incomeData[index] += t.valor;
            } else {
              expenseData[index] += t.valor;
            }
          }
        });
      } else if (period === 'month') {
        // Últimos 30 dias em semanas
        labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        
        // Inicializar arrays com zeros
        incomeData = Array(4).fill(0);
        expenseData = Array(4).fill(0);
        
        // Preencher dados
        filteredTransactions.forEach(t => {
          const date = new Date(t.data);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 30) {
            const weekIndex = Math.floor(diffDays / 7);
            if (weekIndex < 4) {
              if (t.tipo === 'receita') {
                incomeData[3 - weekIndex] += t.valor;
              } else {
                expenseData[3 - weekIndex] += t.valor;
              }
            }
          }
        });
      } else if (period === 'year') {
        // Últimos 12 meses
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        labels = [...Array(12)].map((_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - 11 + i);
          return months[d.getMonth()];
        });
        
        // Inicializar arrays com zeros
        incomeData = Array(12).fill(0);
        expenseData = Array(12).fill(0);
        
        // Preencher dados
        filteredTransactions.forEach(t => {
          const date = new Date(t.data);
          const today = new Date();
          const diffMonths = (today.getFullYear() - date.getFullYear()) * 12 + today.getMonth() - date.getMonth();
          
          if (diffMonths < 12) {
            const index = 11 - diffMonths;
            if (t.tipo === 'receita') {
              incomeData[index] += t.valor;
            } else {
              expenseData[index] += t.valor;
            }
          }
        });
      }

      return {
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
    };

    setChartData(prepareData());
  }, [transactions, period]);

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
          // Corrigindo a tipagem do callback para aceitar string | number
          callback: function(tickValue: string | number) {
            // Garantir que estamos lidando com um número
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
      {transactions.length > 0 ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Sem dados para exibir</p>
        </div>
      )}
    </div>
  );
}
