import { Clock } from 'lucide-react';
import type { BusinessPlanHistory } from '../../../types/admin';

interface HistoryTimelineProps {
  history: BusinessPlanHistory[];
  loading?: boolean;
}

/**
 *
 */
export default function HistoryTimeline({ history, loading }: HistoryTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Clock size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma alteração registrada</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-200" />

      <ul className="space-y-4">
        {history.map((item, index) => (
          <li key={item.id} className="relative pl-8">
            {/* Timeline dot */}
            <div className={`absolute left-1.5 w-3 h-3 rounded-full ${index === 0 ? 'bg-coral-500' : 'bg-slate-300'} ring-2 ring-white`} />

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-slate-700">
                  {item.change_summary || 'Atualização do conteúdo'}
                </span>
                <time className="text-xs text-slate-400">
                  {new Date(item.changed_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </time>
              </div>

              <p className="text-xs text-slate-500">
                Versão atualizada
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
