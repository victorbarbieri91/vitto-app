import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { OnboardingFlow } from '../../components/onboarding';

/**
 *
 */
export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const { status, loading: onboardingLoading, startOnboarding } = useOnboarding();

  // Start onboarding process if user is authenticated and no status yet
  useEffect(() => {
    if (user && !onboardingLoading && !status) {
      startOnboarding();
    }
  }, [user, onboardingLoading, status, startOnboarding]);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if onboarding is already completed
  if (!onboardingLoading && status?.completed) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading while checking status
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-blue via-deep-blue/90 to-coral-500/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto mb-4"></div>
          <p className="text-white">Carregando configuração inicial...</p>
        </div>
      </div>
    );
  }

  return <OnboardingFlow />;
}