import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData } from 'chart.js';
import type { Account, AccountGroup } from '../../services/api/AccountService';
import { useMemo } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AccountGroupChartProps {
  accounts: Account[];
  accountGroups: AccountGroup[];
}

const backgroundColors = [
  '#63B3ED', // Azul Claro
  '#68D391', // Verde Claro
  '#F6AD55', // Laranja Claro
  '#FC8181', // Vermelho Claro
  '#B794F4', // Roxo Claro
  '#F6E05E', // Amarelo Claro
];

export default function AccountGroupChart({ accounts, accountGroups }: AccountGroupChartProps) {
  const chartData = useMemo<ChartData<'doughnut'>>(() => {
    const groupMap = new Map(accountGroups.map(g => [g.id, g.nome]));

    const dataByGroup = accounts.reduce((acc, account) => {
      const groupName = groupMap.get(account.grupo_conta_id as number) || 'Sem Grupo';

      if (!acc[groupName]) {
        acc[groupName] = 0;
      }
      acc[groupName] += account.saldo_atual;
      return acc;
    }, {} as { [key: string]: number });

    const labels = Object.keys(dataByGroup);
    const data = Object.values(dataByGroup);

    return {
      labels,
      datasets: [
        {
          label: 'Saldo por Grupo',
          data,
          backgroundColor: backgroundColors.slice(0, data.length),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    };
  }, [accounts, accountGroups]);

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
