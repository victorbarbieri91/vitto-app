import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusinessPlanList } from './useBusinessPlan';

interface UseBusinessPlanPDFOptions {
  companyName?: string;
  version?: string;
}

interface UseBusinessPlanPDFReturn {
  generatePDF: () => void;
  isGenerating: boolean;
  error: Error | null;
  plans: ReturnType<typeof useBusinessPlanList>['plans'];
  loading: boolean;
}

export function useBusinessPlanPDF(
  _options: UseBusinessPlanPDFOptions = {}
): UseBusinessPlanPDFReturn {
  const { plans, loading } = useBusinessPlanList();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  const generatePDF = useCallback(() => {
    if (plans.length === 0) {
      setError(new Error('Nenhum dado do Business Plan disponivel'));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Navigate to the print page
      navigate('/admin/business-plan/print');
    } catch (err) {
      console.error('Error navigating to print page:', err);
      setError(err instanceof Error ? err : new Error('Erro ao abrir pagina de impressao'));
    } finally {
      setIsGenerating(false);
    }
  }, [plans, navigate]);

  return {
    generatePDF,
    isGenerating,
    error,
    plans,
    loading,
  };
}

export default useBusinessPlanPDF;
// PDF Export Hook v2.0 - HTML Print Approach
