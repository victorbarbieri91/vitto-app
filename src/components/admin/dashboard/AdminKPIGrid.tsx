import {
  Users,
  UserPlus,
  Activity,
  ArrowRightLeft,
  TrendingUp,
  CheckCircle,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import AdminMetricCard from './AdminMetricCard';
import type { AdminMetrics, AdminKPIColor } from '../../../types/admin';

interface AdminKPIGridProps {
  metrics: AdminMetrics | null;
  loading?: boolean;
}

// Configuration for 8 SaaS-focused KPIs
const KPI_CONFIG: Array<{
  key: keyof AdminMetrics;
  title: string;
  color: AdminKPIColor;
  icon: React.ReactNode;
  format: 'number' | 'percentage' | 'currency';
}> = [
  {
    key: 'totalUsers',
    title: 'Usuários Total',
    color: 'coral',
    icon: <Users size={20} />,
    format: 'number'
  },
  {
    key: 'activeUsers7d',
    title: 'Ativos 7d',
    color: 'teal',
    icon: <Activity size={20} />,
    format: 'number'
  },
  {
    key: 'newUsers7d',
    title: 'Novos 7d',
    color: 'emerald',
    icon: <UserPlus size={20} />,
    format: 'number'
  },
  {
    key: 'retentionRate',
    title: 'Retenção',
    color: 'indigo',
    icon: <TrendingUp size={20} />,
    format: 'percentage'
  },
  {
    key: 'activationRate',
    title: 'Ativação',
    color: 'purple',
    icon: <CheckCircle size={20} />,
    format: 'percentage'
  },
  {
    key: 'aiSessions7d',
    title: 'Sessões IA 7d',
    color: 'slate',
    icon: <MessageSquare size={20} />,
    format: 'number'
  },
  {
    key: 'transactions7d',
    title: 'Transações 7d',
    color: 'slate',
    icon: <ArrowRightLeft size={20} />,
    format: 'number'
  },
  {
    key: 'mrr',
    title: 'MRR',
    color: 'emerald',
    icon: <DollarSign size={20} />,
    format: 'currency'
  }
];

export default function AdminKPIGrid({ metrics, loading }: AdminKPIGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-slate-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
        Erro ao carregar métricas. Verifique sua conexão.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {KPI_CONFIG.map((kpi) => (
        <AdminMetricCard
          key={kpi.key}
          title={kpi.title}
          value={metrics[kpi.key]}
          icon={kpi.icon}
          color={kpi.color}
          format={kpi.format}
        />
      ))}
    </div>
  );
}
