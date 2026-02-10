import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import TaskCard from '../../components/admin/agenda/TaskCard';
import TaskForm from '../../components/admin/agenda/TaskForm';
import TaskFilters from '../../components/admin/agenda/TaskFilters';
import { useAgenda } from '../../hooks/admin/useAgenda';
import type { AgendaTask, CreateTaskInput, UpdateTaskInput } from '../../types/admin';

/**
 *
 */
export default function AgendaPage() {
  const {
    tasks,
    loading,
    error,
    statusCounts,
    filters,
    setFilters,
    createTask,
    updateTask,
    deleteTask,
    refetch
  } = useAgenda();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<AgendaTask | null>(null);

  const handleCreateTask = async (data: CreateTaskInput) => {
    await createTask(data);
  };

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (editingTask) {
      await updateTask(editingTask.id, data as UpdateTaskInput);
    }
  };

  const handleStatusChange = async (id: number, status: AgendaTask['status']) => {
    await updateTask(id, { status });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await deleteTask(id);
    }
  };

  const handleEdit = (task: AgendaTask) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestão de tarefas administrativas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin text-slate-400' : 'text-slate-600'} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-medium rounded-lg hover:bg-coral-600 transition-colors"
          >
            <Plus size={18} />
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Filters */}
      <TaskFilters
        filters={filters}
        onFilterChange={setFilters}
        statusCounts={statusCounts}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          Erro: {error.message}
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-500 mb-4">
            {filters.status || filters.priority || filters.search
              ? 'Nenhuma tarefa encontrada com esses filtros'
              : 'Nenhuma tarefa criada ainda'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-medium rounded-lg hover:bg-coral-600 transition-colors"
          >
            <Plus size={18} />
            Criar primeira tarefa
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Task form modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
