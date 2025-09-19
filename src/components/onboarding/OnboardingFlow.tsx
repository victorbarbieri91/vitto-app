import { memo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../../contexts/OnboardingContext';

import WelcomeStep from './WelcomeStep';
import PersonalStep from './PersonalStep';
import AccountStep from './AccountStep';
import IncomeStep from './IncomeStep';
import GoalStep from './GoalStep';
import CompletionStep from './CompletionStep';

const OnboardingFlow = memo(() => {
  const { currentStep, loading } = useOnboarding();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-blue via-deep-blue/90 to-coral-500/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />;
      case 'personal':
        return <PersonalStep />;
      case 'account':
        return <AccountStep />;
      case 'income':
        return <IncomeStep />;
      case 'goal':
        return <GoalStep />;
      case 'completed':
        return <CompletionStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <div key={currentStep}>
        {renderStep()}
      </div>
    </AnimatePresence>
  );
});

OnboardingFlow.displayName = 'OnboardingFlow';

export default OnboardingFlow;