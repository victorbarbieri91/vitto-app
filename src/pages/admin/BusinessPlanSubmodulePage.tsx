import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, History, CheckCircle, Clock, FileEdit, Eye, Pencil } from 'lucide-react';
import { useState } from 'react';
import SubmoduleEditor from '../../components/admin/business-plan/SubmoduleEditor';
import SubmoduleViewer from '../../components/admin/business-plan/SubmoduleViewer';
import HistoryTimeline from '../../components/admin/business-plan/HistoryTimeline';
import StatusBadge from '../../components/admin/business-plan/StatusBadge';
import { useBusinessPlanSubmodule } from '../../hooks/admin/useBusinessPlan';
import {
  SUBMODULE_INFO,
  type BusinessPlanSubmodule as SubmoduleType,
  type BusinessPlanStatus
} from '../../types/admin';

/**
 *
 */
export default function BusinessPlanSubmodulePage() {
  const { submodule } = useParams<{ submodule: SubmoduleType }>();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const {
    plan,
    history,
    loading,
    historyLoading,
    error,
    updateContent,
    updateStatus
  } = useBusinessPlanSubmodule(submodule as SubmoduleType);

  if (!submodule || !SUBMODULE_INFO[submodule as SubmoduleType]) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Submódulo não encontrado</p>
        <button
          onClick={() => navigate('/admin/business-plan')}
          className="mt-4 text-coral-600 hover:text-coral-700"
        >
          Voltar
        </button>
      </div>
    );
  }

  const info = SUBMODULE_INFO[submodule as SubmoduleType];

  const handleStatusChange = async (newStatus: BusinessPlanStatus) => {
    try {
      await updateStatus(newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/admin/business-plan')}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition-colors mt-0.5"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{info.title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{info.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {plan && <StatusBadge status={plan.status} />}

          {/* View/Edit Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setIsEditMode(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !isEditMode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Eye size={14} />
              Visualizar
            </button>
            <button
              onClick={() => setIsEditMode(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isEditMode
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Pencil size={14} />
              Editar
            </button>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg border transition-colors ${showHistory ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
          >
            <History size={18} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Status actions - only show in edit mode */}
      {plan && isEditMode && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 mr-2">Alterar status:</span>
          <button
            onClick={() => handleStatusChange('draft')}
            disabled={plan.status === 'draft'}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${plan.status === 'draft' ? 'bg-slate-200 text-slate-500' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            <FileEdit size={12} /> Rascunho
          </button>
          <button
            onClick={() => handleStatusChange('validating')}
            disabled={plan.status === 'validating'}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${plan.status === 'validating' ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            <Clock size={12} /> Em Validação
          </button>
          <button
            onClick={() => handleStatusChange('validated')}
            disabled={plan.status === 'validated'}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${plan.status === 'validated' ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            <CheckCircle size={12} /> Validado
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          Erro: {error.message}
        </div>
      )}

      {/* Main content */}
      <div className="flex gap-6">
        {/* Editor */}
        <div className={`bg-white rounded-lg border border-slate-200 p-6 transition-all ${showHistory ? 'flex-1' : 'w-full'}`}>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : plan ? (
            isEditMode ? (
              <SubmoduleEditor
                submodule={submodule as SubmoduleType}
                content={plan.content}
                onSave={updateContent}
              />
            ) : (
              <SubmoduleViewer
                submodule={submodule as SubmoduleType}
                content={plan.content}
              />
            )
          ) : (
            <p className="text-slate-500 text-center py-8">
              Dados não encontrados
            </p>
          )}
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="w-80 bg-white rounded-lg border border-slate-200 p-4 flex-shrink-0">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <History size={16} /> Histórico
            </h3>
            <HistoryTimeline history={history} loading={historyLoading} />
          </div>
        )}
      </div>
    </div>
  );
}
