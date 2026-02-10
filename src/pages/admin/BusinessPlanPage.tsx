import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  FileDown,
  Loader2,
  Lightbulb,
  TrendingUp,
  Package,
  DollarSign,
  Rocket,
  BarChart2,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileEdit,
  Check,
} from 'lucide-react';
import { useBusinessPlanList } from '../../hooks/admin/useBusinessPlan';
import { useBusinessPlanPDF } from '../../hooks/admin/useBusinessPlanPDF';
import {
  SUBMODULE_INFO,
  type BusinessPlan,
  type BusinessPlanStatus,
  type BusinessPlanSubmodule,
} from '../../types/admin';

const iconMap: Record<string, React.ElementType> = {
  Lightbulb,
  TrendingUp,
  Package,
  DollarSign,
  Rocket,
  BarChart2,
  AlertTriangle,
};

const SUBMODULE_ORDER: BusinessPlanSubmodule[] = [
  'thesis',
  'market',
  'product',
  'revenue',
  'go_to_market',
  'metrics',
  'risks',
];

/**
 *
 */
export default function BusinessPlanPage() {
  const navigate = useNavigate();
  const { plans, loading, error, refetch, updateStatus } = useBusinessPlanList();
  const { generatePDF, isGenerating, error: pdfError } = useBusinessPlanPDF();
  const [activeFilter, setActiveFilter] = useState<BusinessPlanStatus | 'all'>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusChange = async (
    submodule: BusinessPlanSubmodule,
    newStatus: BusinessPlanStatus,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setUpdatingStatus(submodule);
    try {
      await updateStatus(submodule, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Order plans
  const orderedPlans = useMemo(() => {
    return SUBMODULE_ORDER
      .map(key => plans.find(p => p.submodule === key))
      .filter((p): p is BusinessPlan => p !== undefined);
  }, [plans]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    if (activeFilter === 'all') return orderedPlans;
    return orderedPlans.filter(p => p.status === activeFilter);
  }, [orderedPlans, activeFilter]);

  // Stats
  const stats = useMemo(() => {
    const draft = plans.filter(p => p.status === 'draft').length;
    const validating = plans.filter(p => p.status === 'validating').length;
    const validated = plans.filter(p => p.status === 'validated').length;
    const total = plans.length;
    const progress = total > 0
      ? Math.round(((validated * 1.0 + validating * 0.5) / total) * 100)
      : 0;
    return { draft, validating, validated, total, progress };
  }, [plans]);


  return (
    <div className="space-y-6">
      {/* Header com stats integrados */}
      <div className="bg-[#102542] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Business Plan</h1>
            <p className="text-white/60 text-sm mt-1">
              Planejamento estratégico estruturado
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => generatePDF()}
              disabled={isGenerating || loading || plans.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F87060] text-white text-sm font-medium hover:bg-[#e5635a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileDown size={16} />
                  Exportar PDF
                </>
              )}
            </button>
            <button
              onClick={refetch}
              disabled={loading}
              className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        {!loading && plans.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/60 uppercase tracking-wide">Progresso Geral</span>
              <span className="text-2xl font-bold text-[#F87060]">{stats.progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F87060] rounded-full transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>

            {/* Stats Pills */}
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.validated}</span>
                  <span className="text-white/60 ml-1">validados</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F87060]" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.validating}</span>
                  <span className="text-white/60 ml-1">em validação</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.draft}</span>
                  <span className="text-white/60 ml-1">rascunhos</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error states */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
          Erro ao carregar dados: {error.message}
        </div>
      )}
      {pdfError && (
        <div className="p-4 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-100">
          Erro ao gerar PDF: {pdfError.message}
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && plans.length > 0 && (
        <div className="flex gap-2">
          <FilterTab
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            icon={<BarChart2 size={16} />}
            label="Todos"
            count={stats.total}
          />
          <FilterTab
            active={activeFilter === 'validating'}
            onClick={() => setActiveFilter('validating')}
            icon={<Clock size={16} />}
            label="Em Validação"
            count={stats.validating}
            color="coral"
          />
          <FilterTab
            active={activeFilter === 'validated'}
            onClick={() => setActiveFilter('validated')}
            icon={<CheckCircle2 size={16} />}
            label="Validados"
            count={stats.validated}
            color="emerald"
          />
          <FilterTab
            active={activeFilter === 'draft'}
            onClick={() => setActiveFilter('draft')}
            icon={<FileEdit size={16} />}
            label="Rascunhos"
            count={stats.draft}
            color="slate"
          />
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        /* Module List */
        <div className="space-y-3">
          {filteredPlans.map((plan, index) => {
            const info = SUBMODULE_INFO[plan.submodule];
            const Icon = iconMap[info.icon];
            const isValidated = plan.status === 'validated';

            return (
              <button
                key={plan.id}
                onClick={() => navigate(`/admin/business-plan/${plan.submodule}`)}
                className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-[#F87060]/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Number + Icon */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-slate-200 w-8">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className={`
                      p-3 rounded-xl transition-colors
                      ${isValidated
                        ? 'bg-[#102542] text-white'
                        : 'bg-slate-100 text-[#102542]'}
                      group-hover:bg-[#F87060] group-hover:text-white
                    `}>
                      {isValidated ? <CheckCircle2 size={22} /> : <Icon size={22} />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900 group-hover:text-[#102542]">
                        {info.title}
                      </h3>
                      <StatusDropdown
                        status={plan.status}
                        submodule={plan.submodule}
                        isUpdating={updatingStatus === plan.submodule}
                        onStatusChange={handleStatusChange}
                      />
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                      {info.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    size={20}
                    className="text-slate-300 group-hover:text-[#F87060] group-hover:translate-x-1 transition-all"
                  />
                </div>
              </button>
            );
          })}

          {filteredPlans.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <p>Nenhum módulo encontrado com este filtro</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Filter Tab Component
function FilterTab({
  active,
  onClick,
  icon,
  label,
  count,
  color = 'slate',
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  color?: 'slate' | 'coral' | 'emerald';
}) {
  const colorClasses = {
    slate: active ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
    coral: active ? 'bg-[#F87060] text-white' : 'bg-white text-slate-600 hover:bg-red-50',
    emerald: active ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:bg-emerald-50',
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
        border transition-all
        ${active ? 'border-transparent shadow-sm' : 'border-slate-200'}
        ${colorClasses[color]}
      `}
    >
      {icon}
      <span>{label}</span>
      <span className={`
        px-1.5 py-0.5 rounded text-xs font-semibold
        ${active ? 'bg-white/20' : 'bg-slate-100'}
      `}>
        {count}
      </span>
    </button>
  );
}

// Status Dropdown Component
function StatusDropdown({
  status,
  submodule,
  isUpdating,
  onStatusChange,
}: {
  status: BusinessPlanStatus;
  submodule: BusinessPlanSubmodule;
  isUpdating: boolean;
  onStatusChange: (submodule: BusinessPlanSubmodule, status: BusinessPlanStatus, e: React.MouseEvent) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const config: Record<BusinessPlanStatus, { label: string; classes: string; dotColor: string }> = {
    draft: {
      label: 'Rascunho',
      classes: 'bg-slate-100 text-slate-600',
      dotColor: 'bg-slate-400',
    },
    validating: {
      label: 'Em Validação',
      classes: 'bg-[#F87060]/10 text-[#F87060]',
      dotColor: 'bg-[#F87060]',
    },
    validated: {
      label: 'Validado',
      classes: 'bg-emerald-100 text-emerald-700',
      dotColor: 'bg-emerald-500',
    },
  };

  const { label, classes } = config[status];
  const statuses: BusinessPlanStatus[] = ['draft', 'validating', 'validated'];

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUpdating) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (newStatus: BusinessPlanStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newStatus !== status) {
      onStatusChange(submodule, newStatus, e);
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        className={`
          px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5
          transition-all hover:ring-2 hover:ring-offset-1 hover:ring-slate-200
          ${classes}
          ${isUpdating ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
        `}
      >
        {isUpdating ? (
          <Loader2 size={10} className="animate-spin" />
        ) : null}
        {label}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={(e) => handleSelect(s, e)}
              className={`
                w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2
                hover:bg-slate-50 transition-colors
                ${s === status ? 'bg-slate-50' : ''}
              `}
            >
              <span className={`w-2 h-2 rounded-full ${config[s].dotColor}`} />
              <span className="flex-1">{config[s].label}</span>
              {s === status && (
                <Check size={12} className="text-emerald-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

