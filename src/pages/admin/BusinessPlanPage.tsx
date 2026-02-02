import { RefreshCw } from 'lucide-react';
import SubmoduleCard from '../../components/admin/business-plan/SubmoduleCard';
import { useBusinessPlanList } from '../../hooks/admin/useBusinessPlan';
import { SUBMODULE_INFO } from '../../types/admin';

export default function BusinessPlanPage() {
  const { plans, loading, error, refetch } = useBusinessPlanList();

  // Order plans according to SUBMODULE_INFO order
  const orderedPlans = Object.keys(SUBMODULE_INFO).map(key =>
    plans.find(p => p.submodule === key)
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Business Plan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Planejamento estratégico estruturado
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin text-slate-400' : 'text-slate-600'} />
        </button>
      </div>

      {/* Status summary */}
      {!loading && plans.length > 0 && (
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-slate-600">
              {plans.filter(p => p.status === 'draft').length} rascunhos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-slate-600">
              {plans.filter(p => p.status === 'validating').length} em validação
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-600">
              {plans.filter(p => p.status === 'validated').length} validados
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          Erro ao carregar dados: {error.message}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        /* Submodule cards */
        <div className="grid md:grid-cols-2 gap-4">
          {orderedPlans.map(plan => plan && (
            <SubmoduleCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-slate-900 mb-2">Como usar</h3>
        <ul className="text-xs text-slate-600 space-y-1">
          <li>1. Clique em um módulo para editar seu conteúdo</li>
          <li>2. Preencha os campos e salve as alterações</li>
          <li>3. Atualize o status conforme o progresso (Rascunho → Em Validação → Validado)</li>
          <li>4. Todas as alterações são registradas no histórico</li>
        </ul>
      </div>
    </div>
  );
}
