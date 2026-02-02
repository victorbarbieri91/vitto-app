import { Search, X } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '../../../types/admin';
import { TASK_STATUS_INFO, PRIORITY_INFO } from '../../../types/admin';
import { TaskFilters as TaskFiltersType } from '../../../services/admin/AgendaService';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFilterChange: (filters: TaskFiltersType) => void;
  statusCounts: Record<TaskStatus, number>;
}

export default function TaskFilters({ filters, onFilterChange, statusCounts }: TaskFiltersProps) {
  const handleStatusClick = (status: TaskStatus) => {
    if (filters.status === status) {
      onFilterChange({ ...filters, status: undefined });
    } else {
      onFilterChange({ ...filters, status });
    }
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TaskPriority | '';
    onFilterChange({ ...filters, priority: value || undefined });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasFilters = filters.status || filters.priority || filters.search;

  return (
    <div className="space-y-4">
      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TASK_STATUS_INFO) as TaskStatus[]).map(status => {
          const info = TASK_STATUS_INFO[status];
          const count = statusCounts[status] || 0;
          const isActive = filters.status === status;

          return (
            <button
              key={status}
              onClick={() => handleStatusClick(status)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? `bg-${info.color}-100 text-${info.color}-700 ring-2 ring-${info.color}-500 ring-offset-1`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? `bg-${info.color}-500` : 'bg-slate-400'}`} />
              {info.label}
              <span className={`text-xs ${isActive ? `text-${info.color}-600` : 'text-slate-400'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and priority filter */}
      <div className="flex gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
          />
        </div>

        {/* Priority filter */}
        <select
          value={filters.priority || ''}
          onChange={handlePriorityChange}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent"
        >
          <option value="">Todas prioridades</option>
          {(Object.keys(PRIORITY_INFO) as TaskPriority[]).map(priority => (
            <option key={priority} value={priority}>
              {PRIORITY_INFO[priority].label}
            </option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={14} />
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
