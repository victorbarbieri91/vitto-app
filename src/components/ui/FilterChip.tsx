import { cn } from '../../utils/cn';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
  className?: string;
  activeClassName?: string;
}

/**
 *
 */
export default function FilterChip({ label, isActive, onClick, count, className, activeClassName }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        isActive
          ? (activeClassName || 'bg-coral-500 text-white shadow-sm')
          : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50',
        className
      )}
    >
      {count !== undefined ? `${label} (${count})` : label}
    </button>
  );
}
