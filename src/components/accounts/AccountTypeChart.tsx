import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData } from 'chart.js';
import type { Account } from '../../services/api/AccountService';
import { useMemo } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AccountTypeChartProps {
  accounts: Account[];
}

const ACCOUNT_TYPE_LABELS: { [key: string]: string } = {
  corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  investimento: 'Investimento',
  carteira: 'Carteira',
  outros: 'Outros',
};

const backgroundColors = [
  '#4299E1', // Azul
  '#48BB78', // Verde
  '#F56565', // Vermelho
  '#ED8936', // Laranja
  '#9F7AEA', // Roxo
  '#ECC94B', // Amarelo
];

export default function AccountTypeChart({ accounts }: AccountTypeChartProps) {
  const chartData = useMemo<ChartData<'doughnut'>>(() => {
    const dataByTipe = accounts.reduce((acc, account) => {
      const type = account.tipo || 'outros';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += account.saldo_atual;
      return acc;
    }, {} as { [key: string]: number });

    const labels = Object.keys(dataByTipe).map(type => ACCOUNT_TYPE_LABELS[type] || 'Outros');
    const data = Object.values(dataByTipe);

    return {
      labels,
      datasets: [
        {
          label: 'Saldo por Tipo de Conta',
          data,
          backgroundColor: backgroundColors.slice(0, data.length),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }, [accounts]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
            }
            return label;
          }
        }
      }
    },
  };

  return (
    <div style={{ position: 'relative', height: '150px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
