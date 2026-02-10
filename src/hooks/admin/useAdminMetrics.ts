import { useState, useEffect, useCallback } from 'react';
import { AdminMetricsService } from '../../services/admin/AdminMetricsService';
import type { AdminMetrics } from '../../types/admin';

interface UseAdminMetricsReturn {
  metrics: AdminMetrics | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 *
 */
export function useAdminMetrics(): UseAdminMetricsReturn {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminMetricsService.getMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refetch: fetchMetrics };
}

interface UseUserGrowthReturn {
  data: Array<{ month: string; users: number }>;
  loading: boolean;
  error: Error | null;
}

/**
 *
 */
export function useUserGrowth(months: number = 6): UseUserGrowthReturn {
  const [data, setData] = useState<Array<{ month: string; users: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await AdminMetricsService.getUserGrowth(months);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch user growth'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [months]);

  return { data, loading, error };
}
