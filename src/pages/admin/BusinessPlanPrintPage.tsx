import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { PrintableBusinessPlan } from '../../components/admin/business-plan/print/PrintableBusinessPlan';
import { useBusinessPlanList } from '../../hooks/admin/useBusinessPlan';
import { useAuth } from '../../store/AuthContext';
import { useIsAdmin } from '../../hooks/useAdminPermissions';

/**
 *
 */
export default function BusinessPlanPrintPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = useIsAdmin();
  const { plans, loading, error } = useBusinessPlanList();
  const [isReady, setIsReady] = useState(false);
  const navigate = useNavigate();

  const handlePrintReady = useCallback(() => {
    setIsReady(true);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Auto print when ready (optional - can be enabled)
  useEffect(() => {
    if (isReady && plans.length > 0) {
      // Small delay to ensure CSS is fully loaded
      const timer = setTimeout(() => {
        // Uncomment the line below to auto-print when page loads
        // window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReady, plans]);

  // Auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-coral-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando Business Plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Erro ao carregar dados: {error.message}</p>
          <button
            onClick={() => navigate('/admin/business-plan')}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center text-slate-600">
          <p>Nenhum dado do Business Plan disponivel</p>
          <button
            onClick={() => navigate('/admin/business-plan')}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="print-page-container">
      {/* Toolbar - Hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white shadow-md z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/business-plan')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">
              Visualizacao para impressao
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-coral-600 text-white rounded-lg hover:bg-coral-700 transition-colors"
            >
              <Printer size={18} />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Print Content */}
      <div className="print-content pt-20 pb-8">
        <PrintableBusinessPlan
          plans={plans}
          companyName="Vitto"
          onPrintReady={handlePrintReady}
        />
      </div>

      {/* Print-specific styles - Override everything */}
      <style>{`
        @media screen {
          .print-page-container {
            min-height: 100vh;
            background: #E5E7EB;
          }
        }

        @media print {
          /* Hide everything except print content */
          body * {
            visibility: hidden;
          }

          .print-page-container,
          .print-page-container .print-content,
          .print-page-container .print-content * {
            visibility: visible;
          }

          .print-page-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .print-content {
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          html {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
