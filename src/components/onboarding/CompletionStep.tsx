import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import ModernCard from '../ui/modern/ModernCard';
import Button from '../ui/Button';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../store/AuthContext';

const CompletionStep = memo(() => {
  const { onboardingData, completeOnboarding, refreshStatus } = useOnboarding();
  const { userProfile } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const userName = userProfile?.nome || onboardingData.personalInfo?.nome || 'Usuário';

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const success = await completeOnboarding();
      if (success) {
        setIsCompleted(true);
        await refreshStatus();

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.replace('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };


  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-deep-blue via-deep-blue/90 to-coral-500/20 flex items-center justify-center p-4">
        <ModernCard
          variant="glass"
          padding="xl"
          className="w-full max-w-2xl text-center"
          animate={true}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Success Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="relative mx-auto w-24 h-24 mb-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>

              {/* Celebration sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360],
                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 40, 0],
                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 40, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: 0.5 + (i * 0.1),
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <Sparkles className="w-4 h-4 text-coral-400" />
                </motion.div>
              ))}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold text-deep-blue mb-4"
            >
              🎉 Parabéns, {userName}!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg text-slate-600 mb-6"
            >
              Sua conta foi configurada com sucesso!
              <br />
              Redirecionando para o dashboard...
            </motion.p>

            {/* Loading animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
            </motion.div>
          </motion.div>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue via-deep-blue/90 to-coral-500/20 flex items-center justify-center p-4">
      <ModernCard
        variant="glass"
        padding="xl"
        className="w-full max-w-md"
        animate={true}
      >
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="mx-auto w-12 h-12 bg-gradient-to-r from-coral-500 to-coral-600 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-6 h-6 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl font-bold text-deep-blue mb-2"
            >
              Tudo pronto, {userName}!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-slate-600"
            >
              Vamos revisar suas configurações e finalizar sua conta
            </motion.p>
          </div>



          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center pt-4"
          >
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center gap-3">
                {isCompleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Finalizando configuração...
                  </>
                ) : (
                  <>
                    Acessar meu dashboard
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </span>
            </Button>
          </motion.div>

          {/* Progress indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="pt-4 border-t border-slate-200"
          >
            <p className="text-xs text-slate-400 mb-2">Progresso</p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <motion.div
                initial={{ width: '83%' }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                className="bg-gradient-to-r from-coral-500 to-coral-600 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Etapa 6 de 6 - Concluído!</p>
          </motion.div>
        </motion.div>
      </ModernCard>
    </div>
  );
});

CompletionStep.displayName = 'CompletionStep';

export default CompletionStep;