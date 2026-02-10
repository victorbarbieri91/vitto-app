import { Calendar, Tag, Link2, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useState } from 'react';
import type { AgendaTask } from '../../../types/admin';
import { PRIORITY_INFO, TASK_STATUS_INFO, SUBMODULE_INFO } from '../../../types/admin';

interface TaskCardProps {
  task: AgendaTask;
  onEdit: (task: AgendaTask) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: AgendaTask['status']) => void;
}

/**
 *
 */
export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const priorityInfo = PRIORITY_INFO[task.priority];
  const statusInfo = TASK_STATUS_INFO[task.status];

  const isOverdue = task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== 'completed' &&
    task.status !== 'cancelled';

  const priorityColors = {
    low: 'border-l-slate-400',
    medium: 'border-l-blue-400',
    high: 'border-l-amber-400',
    urgent: 'border-l-red-400'
  };

  return (
    <div className={`bg-white rounded-lg border border-slate-200 border-l-4 ${priorityColors[task.priority]} p-4 hover:shadow-sm transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title and status */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium truncate ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
              {task.title}
            </h3>
            <span className={`text-xs px-1.5 py-0.5 rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {/* Deadline */}
            {task.deadline && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                <Calendar size={12} />
                {new Date(task.deadline).toLocaleDateString('pt-BR')}
                {isOverdue && <span className="text-red-600 font-medium">(Atrasada)</span>}
              </span>
            )}

            {/* Priority */}
            <span className={`flex items-center gap-1 text-${priorityInfo.color}-600`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-${priorityInfo.color}-500`}></span>
              {priorityInfo.label}
            </span>

            {/* Linked submodule */}
            {task.linked_submodule && (
              <span className="flex items-center gap-1">
                <Link2 size={12} />
                {SUBMODULE_INFO[task.linked_submodule]?.title}
              </span>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag size={12} />
                {task.tags.slice(0, 2).join(', ')}
                {task.tags.length > 2 && ` +${task.tags.length - 2}`}
              </span>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded hover:bg-slate-100 transition-colors"
          >
            <MoreVertical size={16} className="text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                {/* Status options */}
                <div className="px-2 py-1 text-xs font-medium text-slate-400 uppercase">
                  Alterar Status
                </div>
                {(['pending', 'in_progress', 'completed', 'cancelled'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => { onStatusChange(task.id, status); setMenuOpen(false); }}
                    disabled={task.status === status}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed ${task.status === status ? 'text-coral-600' : 'text-slate-700'}`}
                  >
                    {TASK_STATUS_INFO[status].label}
                  </button>
                ))}

                <div className="border-t border-slate-100 my-1" />

                {/* Edit */}
                <button
                  onClick={() => { onEdit(task); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit size={14} /> Editar
                </button>

                {/* Delete */}
                <button
                  onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
