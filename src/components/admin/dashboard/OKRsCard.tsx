import { useEffect, useState } from 'react';
import { Target, ChevronRight, CheckCircle, Circle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminMetricsService } from '../../../services/admin/AdminMetricsService';

interface OKR {
  period: string;
  objectives: string[];
  status: 'pending' | 'in_progress' | 'achieved';
}

const STATUS_CONFIG = {
  pending: {
    icon: Circle,
    color: 'text-slate-400',
    bg: 'bg-slate-100',
    label: 'Pendente'
  },
  in_progress: {
    icon: Play,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    label: 'Em andamento'
  },
  achieved: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    label: 'Alcançado'
  }
};

export default function OKRsCard() {
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await AdminMetricsService.getOKRs();
        setOkrs(result);
      } catch (error) {
        console.error('Error fetching OKRs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-32 mb-4" />
        <div className="space-y-3">
          <div className="h-3 bg-slate-200 rounded w-full" />
          <div className="h-3 bg-slate-200 rounded w-5/6" />
          <div className="h-3 bg-slate-200 rounded w-4/6" />
        </div>
      </div>
    );
  }

  // Get current/active period (first in_progress or first pending)
  const currentOKR = okrs.find(o => o.status === 'in_progress') || okrs.find(o => o.status === 'pending') || okrs[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[#5b4b6e]" />
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            {currentOKR ? `Objetivos ${currentOKR.period}` : 'OKRs'}
          </h3>
        </div>
        <Link
          to="/admin/business-plan/metrics"
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          Editar
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        {!currentOKR || currentOKR.objectives.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <Target size={24} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Nenhum objetivo definido</p>
            <Link
              to="/admin/business-plan/metrics"
              className="text-xs text-[#2d6a6a] hover:underline mt-1"
            >
              Definir objetivos
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {currentOKR.objectives.slice(0, 4).map((objective, index) => {
              const config = STATUS_CONFIG[currentOKR.status];
              const Icon = config.icon;

              return (
                <li key={index} className="flex items-start gap-2">
                  <Icon size={16} className={`${config.color} mt-0.5 flex-shrink-0`} />
                  <span className="text-sm text-slate-700 leading-tight">
                    {objective}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer - Status */}
      {currentOKR && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Status do período</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                STATUS_CONFIG[currentOKR.status].bg
              } ${STATUS_CONFIG[currentOKR.status].color}`}
            >
              {STATUS_CONFIG[currentOKR.status].label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
