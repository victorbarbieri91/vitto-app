import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../store/AuthContext';
import onboardingService, { OnboardingStatus } from '../services/api/OnboardingService';

type OnboardingContextType = {
  status: OnboardingStatus | null;
  loading: boolean;
  isOnboardingRequired: boolean;
  refreshStatus: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/**
 * Provider simplificado - apenas verifica se o usuario precisa fazer a entrevista inicial.
 * O fluxo de entrevista em si e gerenciado pelo useInterview hook.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const isOnboardingRequired = Boolean(
    user &&
    userProfile &&
    status &&
    !status.completed &&
    !authLoading
  );

  const loadOnboardingStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const onboardingStatus = await onboardingService.getOnboardingStatus();
      setStatus(onboardingStatus);
    } catch (error) {
      console.error('Error loading onboarding status:', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  const refreshStatus = useCallback(async () => {
    await loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  const value: OnboardingContextType = {
    status,
    loading: loading || authLoading,
    isOnboardingRequired,
    refreshStatus,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook para acessar o estado de onboarding.
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
