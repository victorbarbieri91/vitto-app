import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../store/AuthContext';
import onboardingService, { OnboardingData, OnboardingStatus } from '../services/api/OnboardingService';

export type OnboardingStep = 'welcome' | 'personal' | 'account' | 'income' | 'goal' | 'completed';

type OnboardingContextType = {
  // Status
  status: OnboardingStatus | null;
  currentStep: OnboardingStep;
  loading: boolean;
  isOnboardingRequired: boolean;

  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: OnboardingStep) => void;

  // Data management
  onboardingData: Partial<OnboardingData>;
  updateOnboardingData: (stepData: Partial<OnboardingData>) => void;

  // Actions
  startOnboarding: () => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  skipOnboarding: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STEP_ORDER: OnboardingStep[] = ['welcome', 'personal', 'account', 'income', 'goal', 'completed'];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({});

  // Determine if onboarding is required
  const isOnboardingRequired = Boolean(
    user &&
    userProfile &&
    status &&
    !status.completed &&
    !authLoading
  );

  // Load onboarding status when user changes
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

      // Set current step based on status
      if (onboardingStatus) {
        if (onboardingStatus.completed) {
          setCurrentStep('completed');
        } else {
          const stepIndex = Math.max(0, Math.min(onboardingStatus.currentStep - 1, STEP_ORDER.length - 2));
          setCurrentStep(STEP_ORDER[stepIndex]);
        }
      }
    } catch (error) {
      console.error('Error loading onboarding status:', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load status when user changes
  useEffect(() => {
    loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  // Navigation functions
  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStepName = STEP_ORDER[currentIndex + 1];
      setCurrentStep(nextStepName);

      // Update backend step if not completed
      if (nextStepName !== 'completed') {
        onboardingService.updateStep(currentIndex + 2).catch(console.error);
      }
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStepName = STEP_ORDER[currentIndex - 1];
      setCurrentStep(prevStepName);

      // Update backend step
      onboardingService.updateStep(currentIndex).catch(console.error);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
    const stepIndex = STEP_ORDER.indexOf(step);
    if (stepIndex >= 0 && step !== 'completed') {
      onboardingService.updateStep(stepIndex + 1).catch(console.error);
    }
  }, []);

  // Data management
  const updateOnboardingData = useCallback((stepData: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({
      ...prev,
      ...stepData
    }));
  }, []);

  // Actions
  const startOnboarding = useCallback(async (): Promise<boolean> => {
    try {
      const success = await onboardingService.startOnboarding();
      if (success) {
        await loadOnboardingStatus();
      }
      return success;
    } catch (error) {
      console.error('Error starting onboarding:', error);
      return false;
    }
  }, [loadOnboardingStatus]);

  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    try {
      // Validate required data
      if (!onboardingData.personalInfo || !onboardingData.accountInfo || !onboardingData.goalInfo) {
        throw new Error('Dados incompletos para finalizar onboarding');
      }

      const success = await onboardingService.completeOnboarding(onboardingData as OnboardingData);
      if (success) {
        setCurrentStep('completed');
        await loadOnboardingStatus();
      }
      return success;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  }, [onboardingData, loadOnboardingStatus]);

  const skipOnboarding = useCallback(async (): Promise<boolean> => {
    try {
      // For now, we'll just mark as completed with default values
      const defaultData: OnboardingData = {
        personalInfo: {
          nome: userProfile?.nome || user?.email?.split('@')[0] || 'Usuário',
          receita_mensal: 3000 // Default income
        },
        accountInfo: {
          nome: 'Conta Principal',
          tipo: 'conta_corrente',
          saldo_inicial: 0
        },
        goalInfo: {
          meta_percentual: 80,
          receita_mensal: 3000
        }
      };

      const success = await onboardingService.completeOnboarding(defaultData);
      if (success) {
        setCurrentStep('completed');
        await loadOnboardingStatus();
      }
      return success;
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      return false;
    }
  }, [user, userProfile, loadOnboardingStatus]);

  const refreshStatus = useCallback(async () => {
    await loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  const value: OnboardingContextType = {
    // Status
    status,
    currentStep,
    loading: loading || authLoading,
    isOnboardingRequired,

    // Navigation
    nextStep,
    previousStep,
    goToStep,

    // Data management
    onboardingData,
    updateOnboardingData,

    // Actions
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
    refreshStatus,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}