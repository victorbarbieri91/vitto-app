import type { BusinessPlanStatus } from '../../../types/admin';
import { STATUS_INFO } from '../../../types/admin';

interface StatusBadgeProps {
  status: BusinessPlanStatus;
  size?: 'sm' | 'md';
}

/**
 *
 */
export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const info = STATUS_INFO[status];

  const colorClasses = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${colorClasses[info.color as keyof typeof colorClasses]} ${sizeClasses[size]}`}
    >
      {info.label}
    </span>
  );
}
