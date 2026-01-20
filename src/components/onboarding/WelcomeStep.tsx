import { memo } from 'react';
import { motion } from 'framer-motion';
import { Rocket, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import ModernCard from '../ui/modern/ModernCard';
import Button from '../ui/Button';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../store/AuthContext';

const WelcomeStep = memo(() => {
  const { nextStep } = useOnboarding();
  const { userProfile } = useAuth();

  const userName = userProfile?.nome || 'Usuário';

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue via-deep-blue/90 to-coral-500/20 flex items-center justify-center p-4">
      <ModernCard
        variant="glass"
        padding="lg"
        className="w-full max-w-lg text-center"
        animate={true}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Header with animated icons */}
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
              className="relative mx-auto w-16 h-16 mb-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-coral-500 to-coral-600 rounded-full flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>

              {/* Floating sparkles */}
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-coral-400" />
              </motion.div>

              <motion.div
                animate={{
                  rotate: -360,
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }
                }}
                className="absolute -bottom-1 -left-1"
              >
                <Sparkles className="w-4 h-4 text-coral-300" />
              </motion.div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl font-bold mb-3"
            >
              <span className="text-deep-blue">Bem-vindo, </span>
              <span className="text-coral-500">{userName}!</span>
            </motion.h1>
          </div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-3"
          >
            <p className="text-slate-600">
              Configure sua conta em <strong className="text-coral-500">2 minutos</strong>
            </p>
          </motion.div>

          {/* Features flow with arrows */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex items-center justify-center gap-2"
          >
            {[
              { icon: '💰', title: 'Conta' },
              { icon: '📊', title: 'Renda' },
              { icon: '🎯', title: 'Meta' }
            ].map((feature, index) => (
              <div key={index} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + (index * 0.1), duration: 0.4 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                  className="p-3 text-center"
                >
                  <div className="text-2xl mb-0.5">{feature.icon}</div>
                  <h3 className="font-semibold text-deep-blue text-sm">{feature.title}</h3>
                </motion.div>

                {/* Arrow between items */}
                {index < 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.3 + (index * 0.1), duration: 0.3 }}
                    className="mx-2"
                  >
                    <ChevronRight className="w-4 h-4 text-coral-500" />
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>

          {/* Action button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex justify-center"
          >
            <Button
              onClick={nextStep}
              className="group px-8 py-3 bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-2">
                Vamos começar!
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </motion.div>

          {/* Progress indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="pt-4 border-t border-slate-200"
          >
            <p className="text-xs text-slate-400 mb-2">Progresso</p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '16%' }}
                transition={{ delay: 1.6, duration: 0.8, ease: 'easeOut' }}
                className="bg-gradient-to-r from-coral-500 to-coral-600 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Etapa 1 de 6</p>
          </motion.div>
        </motion.div>
      </ModernCard>
    </div>
  );
});

WelcomeStep.displayName = 'WelcomeStep';

export default WelcomeStep;