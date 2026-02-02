import { useEffect, useState } from 'react';
import { Lightbulb, ChevronRight, CheckCircle, Circle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminMetricsService } from '../../../services/admin/AdminMetricsService';

interface Hypothesis {
  text: string;
  validated: boolean;
}

export default function HypothesesCard() {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await AdminMetricsService.getHypotheses();
        setHypotheses(result);
      } catch (error) {
        console.error('Error fetching hypotheses:', error);
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

  const validatedCount = hypotheses.filter(h => h.validated).length;
  const totalCount = hypotheses.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Hipóteses Críticas
          </h3>
        </div>
        <Link
          to="/admin/business-plan/thesis"
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          Ver todas
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Content */}
      <div className="p-4 flex-1">
        {hypotheses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <Clock size={24} className="text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Nenhuma hipótese cadastrada</p>
            <Link
              to="/admin/business-plan/thesis"
              className="text-xs text-[#2d6a6a] hover:underline mt-1"
            >
              Adicionar hipóteses
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {hypotheses.slice(0, 4).map((hypothesis, index) => (
              <li key={index} className="flex items-start gap-2">
                {hypothesis.validated ? (
                  <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                )}
                <span
                  className={`text-sm leading-tight ${
                    hypothesis.validated ? 'text-slate-600' : 'text-slate-700'
                  }`}
                >
                  {hypothesis.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {totalCount > 0 && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {validatedCount}/{totalCount} validadas
            </span>
            <div className="flex items-center gap-1">
              {hypotheses.slice(0, 5).map((h, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    h.validated ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
