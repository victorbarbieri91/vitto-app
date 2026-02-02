import { useEffect, useState } from 'react';
import { Calendar, ChevronRight, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AgendaService } from '../../../services/admin/AgendaService';
import type { AgendaTask, TaskPriority } from '../../../types/admin';

const PRIORITY_STYLES: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-slate-500' },
  medium: { label: 'Média', color: 'text-blue-500' },
  high: { label: 'Alta', color: 'text-amber-500' },
  urgent: { label: 'Urgente', color: 'text-red-500' }
};

function formatDeadline(deadline: string | null): string {
  if (!deadline) return 'Sem prazo';

  const date = new Date(deadline + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Venceu ${Math.abs(diffDays)}d atrás`;
  } else if (diffDays === 0) {
    return 'Hoje';
  } else if (diffDays === 1) {
    return 'Amanhã';
  } else {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}

interface TaskItemProps {
  task: AgendaTask;
  isOverdue?: boolean;
}

function TaskItem({ task, isOverdue }: TaskItemProps) {
  const priorityStyle = PRIORITY_STYLES[task.priority];

  return (
    <div className="flex items-start gap-2 py-2">
      <div
        className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
          isOverdue ? 'bg-red-500' : 'bg-slate-300'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
            {formatDeadline(task.deadline)}
          </span>
          <span className="text-slate-300">|</span>
          <span className={`text-xs ${priorityStyle.color}`}>
            {priorityStyle.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AgendaPreview() {
  const [overdue, setOverdue] = useState<AgendaTask[]>([]);
  const [thisWeek, setThisWeek] = useState<AgendaTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overdueResult, upcomingResult] = await Promise.all([
          AgendaService.getOverdue(),
          AgendaService.getUpcomingDeadlines()
        ]);
        setOverdue(overdueResult);
        setThisWeek(upcomingResult);
      } catch (error) {
        console.error('Error fetching agenda:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-24 mb-4" />
            <div className="space-y-3">
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-3 bg-slate-200 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Overdue Column */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Atrasadas ({overdue.length})
            </h3>
          </div>
        </div>
        <div className="p-4">
          {overdue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertTriangle size={20} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Nenhuma tarefa atrasada</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {overdue.slice(0, 3).map(task => (
                <TaskItem key={task.id} task={task} isOverdue />
              ))}
              {overdue.length > 3 && (
                <Link
                  to="/admin/agenda?filter=overdue"
                  className="block pt-3 text-xs text-slate-500 hover:text-slate-700 text-center"
                >
                  + {overdue.length - 3} mais
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* This Week Column */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Esta Semana ({thisWeek.length})
            </h3>
          </div>
          <Link
            to="/admin/agenda"
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            Ver agenda
            <ChevronRight size={14} />
          </Link>
        </div>
        <div className="p-4">
          {thisWeek.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Clock size={20} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Sem tarefas esta semana</p>
              <Link
                to="/admin/agenda"
                className="text-xs text-[#2d6a6a] hover:underline mt-1"
              >
                Adicionar tarefa
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {thisWeek.slice(0, 3).map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
              {thisWeek.length > 3 && (
                <Link
                  to="/admin/agenda"
                  className="block pt-3 text-xs text-slate-500 hover:text-slate-700 text-center"
                >
                  + {thisWeek.length - 3} mais
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
