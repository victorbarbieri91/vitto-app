import { RefreshCw } from 'lucide-react';
import AdminKPIGrid from '../../components/admin/dashboard/AdminKPIGrid';
import BusinessPlanStatus from '../../components/admin/dashboard/BusinessPlanStatus';
import HypothesesCard from '../../components/admin/dashboard/HypothesesCard';
import OKRsCard from '../../components/admin/dashboard/OKRsCard';
import AgendaPreview from '../../components/admin/dashboard/AgendaPreview';
import FinanceSummaryCard from '../../components/admin/dashboard/FinanceSummaryCard';
import { useAdminMetrics } from '../../hooks/admin/useAdminMetrics';

export default function AdminDashboardPage() {
  const { metrics, loading, refetch } = useAdminMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gestão estratégica do produto
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          title="Atualizar métricas"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin text-slate-400' : 'text-slate-600'} />
        </button>
      </div>

      {/* Section 1: Pulso do Produto (8 KPIs) */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Pulso do Produto
        </h2>
        <AdminKPIGrid metrics={metrics} loading={loading} />
      </section>

      {/* Section 2: Business Plan & Finance (side by side) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BusinessPlanStatus />
        <FinanceSummaryCard />
      </section>

      {/* Section 3 & 4: Hypotheses & OKRs (side by side) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HypothesesCard />
        <OKRsCard />
      </section>

      {/* Section 5: Agenda Preview */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Agenda Crítica
        </h2>
        <AgendaPreview />
      </section>
    </div>
  );
}
