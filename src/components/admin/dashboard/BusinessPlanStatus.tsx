import { useEffect, useState } from 'react';
import { FileText, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminMetricsService } from '../../../services/admin/AdminMetricsService';

interface BusinessPlanData {
  total: number;
  validated: number;
  validating: number;
  draft: number;
  progress: number;
  nextFocus: { submodule: string; title: string } | null;
}

export default function BusinessPlanStatus() {
  const [data, setData] = useState<BusinessPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await AdminMetricsService.getBusinessPlanStatus();
        setData(result);
      } catch (error) {
        console.error('Error fetching business plan status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-32 mb-4" />
        <div className="h-3 bg-slate-200 rounded w-full mb-6" />
        <div className="h-4 bg-slate-200 rounded w-48" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-slate-500 text-sm">Erro ao carregar status do Business Plan</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Business Plan
          </h3>
        </div>
        <Link
          to="/admin/business-plan"
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
        >
          Ver detalhes
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Progresso</span>
          <span className="text-sm font-semibold text-slate-900">{data.progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2d6a6a] rounded-full transition-all duration-500"
            style={{ width: `${data.progress}%` }}
          />
        </div>
      </div>

      {/* Status badges */}
      <div className="px-4 pb-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Validado: {data.validated}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-slate-600">Validando: {data.validating}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          <span className="text-slate-600">Rascunho: {data.draft}</span>
        </div>
      </div>

      {/* Next focus */}
      {data.nextFocus && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-500" />
            <span className="text-xs text-slate-500">Próximo foco:</span>
            <Link
              to={`/admin/business-plan/${data.nextFocus.submodule}`}
              className="text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              {data.nextFocus.title}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
