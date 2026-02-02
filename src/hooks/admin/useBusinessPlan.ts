import { useState, useEffect, useCallback } from 'react';
import { BusinessPlanService } from '../../services/admin/BusinessPlanService';
import { useAuth } from '../../store/AuthContext';
import type {
  BusinessPlan,
  BusinessPlanHistory,
  BusinessPlanSubmodule,
  BusinessPlanContent
} from '../../types/admin';

interface UseBusinessPlanListReturn {
  plans: BusinessPlan[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useBusinessPlanList(): UseBusinessPlanListReturn {
  const [plans, setPlans] = useState<BusinessPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BusinessPlanService.getAll();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch business plans'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, loading, error, refetch: fetchPlans };
}

interface UseBusinessPlanSubmoduleReturn {
  plan: BusinessPlan | null;
  history: BusinessPlanHistory[];
  loading: boolean;
  historyLoading: boolean;
  error: Error | null;
  updateContent: (content: BusinessPlanContent, changeSummary?: string) => Promise<void>;
  updateStatus: (status: 'draft' | 'validating' | 'validated') => Promise<void>;
  refetch: () => Promise<void>;
}

export function useBusinessPlanSubmodule(submodule: BusinessPlanSubmodule): UseBusinessPlanSubmoduleReturn {
  const { user } = useAuth();
  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [history, setHistory] = useState<BusinessPlanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BusinessPlanService.getBySubmodule(submodule);
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch plan'));
    } finally {
      setLoading(false);
    }
  }, [submodule]);

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const data = await BusinessPlanService.getHistory(submodule);
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [submodule]);

  useEffect(() => {
    fetchPlan();
    fetchHistory();
  }, [fetchPlan, fetchHistory]);

  const updateContent = useCallback(async (content: BusinessPlanContent, changeSummary?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updated = await BusinessPlanService.update(submodule, { content }, user.id, changeSummary);
      setPlan(updated);
      fetchHistory();
    } catch (err) {
      throw err;
    }
  }, [submodule, user, fetchHistory]);

  const updateStatus = useCallback(async (status: 'draft' | 'validating' | 'validated') => {
    if (!user) throw new Error('User not authenticated');

    try {
      const updated = await BusinessPlanService.updateStatus(submodule, status, user.id);
      setPlan(updated);
    } catch (err) {
      throw err;
    }
  }, [submodule, user]);

  return {
    plan,
    history,
    loading,
    historyLoading,
    error,
    updateContent,
    updateStatus,
    refetch: fetchPlan
  };
}
