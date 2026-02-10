import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  TrendingUp,
  Package,
  DollarSign,
  Rocket,
  BarChart2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import type { BusinessPlan } from '../../../types/admin';
import { SUBMODULE_INFO } from '../../../types/admin';

const iconMap: Record<string, React.ReactNode> = {
  Lightbulb: <Lightbulb size={20} />,
  TrendingUp: <TrendingUp size={20} />,
  Package: <Package size={20} />,
  DollarSign: <DollarSign size={20} />,
  Rocket: <Rocket size={20} />,
  BarChart2: <BarChart2 size={20} />,
  AlertTriangle: <AlertTriangle size={20} />
};

interface SubmoduleCardProps {
  plan: BusinessPlan;
}

/**
 *
 */
export default function SubmoduleCard({ plan }: SubmoduleCardProps) {
  const navigate = useNavigate();
  const info = SUBMODULE_INFO[plan.submodule];

  const handleClick = () => {
    navigate(`/admin/business-plan/${plan.submodule}`);
  };

  // Calculate completion percentage based on content
  const getCompletionPercentage = () => {
    const content = plan.content as unknown as Record<string, unknown>;
    if (!content || typeof content !== 'object') return 0;

    const fields = Object.values(content);
    if (fields.length === 0) return 0;

    const filledFields = fields.filter(field => {
      if (Array.isArray(field)) return field.length > 0;
      if (typeof field === 'string') return field.trim().length > 0;
      return !!field;
    });

    return Math.round((filledFields.length / fields.length) * 100);
  };

  const completion = getCompletionPercentage();

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-coral-50 group-hover:text-coral-600 transition-colors">
          {iconMap[info.icon]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-medium text-slate-900 truncate">
              {info.title}
            </h3>
            <StatusBadge status={plan.status} size="sm" />
          </div>

          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {info.description}
          </p>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-coral-500 rounded-full transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 w-8 text-right">
              {completion}%
            </span>
          </div>
        </div>

        <ChevronRight
          size={18}
          className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0"
        />
      </div>
    </button>
  );
}
