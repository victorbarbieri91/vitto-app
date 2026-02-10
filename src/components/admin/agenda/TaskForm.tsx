import { useForm } from 'react-hook-form';
import { X, Save, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type {
  AgendaTask,
  CreateTaskInput,
  TaskPriority,
  BusinessPlanSubmodule
} from '../../../types/admin';
import { PRIORITY_INFO, SUBMODULE_INFO } from '../../../types/admin';

interface TaskFormProps {
  task?: AgendaTask | null;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  onClose: () => void;
}

/**
 *
 */
export default function TaskForm({ task, onSubmit, onClose }: TaskFormProps) {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateTaskInput>({
    defaultValues: task ? {
      title: task.title,
      description: task.description || '',
      deadline: task.deadline || '',
      priority: task.priority,
      linked_submodule: task.linked_submodule || undefined,
      tags: task.tags || []
    } : {
      priority: 'medium'
    }
  });

  const handleFormSubmit = async (data: CreateTaskInput) => {
    setSaving(true);
    try {
      await onSubmit(data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className={labelClass}>Título *</label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              className={inputClass}
              placeholder="O que precisa ser feito?"
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Descrição</label>
            <textarea
              {...register('description')}
              rows={3}
              className={inputClass}
              placeholder="Detalhes adicionais (opcional)"
            />
          </div>

          {/* Deadline and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prazo</label>
              <input
                {...register('deadline')}
                type="date"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Prioridade</label>
              <select {...register('priority')} className={inputClass}>
                {(Object.keys(PRIORITY_INFO) as TaskPriority[]).map(priority => (
                  <option key={priority} value={priority}>
                    {PRIORITY_INFO[priority].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linked submodule */}
          <div>
            <label className={labelClass}>Vincular ao Business Plan</label>
            <select {...register('linked_submodule')} className={inputClass}>
              <option value="">Nenhum</option>
              {(Object.keys(SUBMODULE_INFO) as BusinessPlanSubmodule[]).map(sub => (
                <option key={sub} value={sub}>
                  {SUBMODULE_INFO[sub].title}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-medium rounded-lg hover:bg-coral-600 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {task ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
