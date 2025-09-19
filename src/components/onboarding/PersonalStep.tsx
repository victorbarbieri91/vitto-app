import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ModernCard from '../ui/modern/ModernCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useAuth } from '../../store/AuthContext';

const personalSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres')
});

type PersonalFormData = z.infer<typeof personalSchema>;

const PersonalStep = memo(() => {
  const { nextStep, previousStep, updateOnboardingData, onboardingData } = useOnboarding();
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      nome: onboardingData.personalInfo?.nome || userProfile?.nome || ''
    },
    mode: 'onChange'
  });

  const onSubmit = async (data: PersonalFormData) => {
    setIsSubmitting(true);

    // Update onboarding data
    updateOnboardingData({
      personalInfo: {
        ...data,
        receita_mensal: onboardingData.personalInfo?.receita_mensal
      }
    });

    // Move to next step
    nextStep();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-deep-blue via-deep-blue/90 to-coral-500/20 flex items-center justify-center p-4">
      <ModernCard
        variant="glass"
        padding="lg"
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
              className="mx-auto w-12 h-12 bg-gradient-to-r from-coral-500 to-coral-600 rounded-full flex items-center justify-center mb-3"
            >
              <User className="w-6 h-6 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl font-bold text-deep-blue mb-1"
            >
              Dados pessoais
            </motion.h1>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Nome Field */}
            <div>
              <label className="block text-sm font-semibold text-deep-blue mb-2">
                Como você gostaria de ser chamado?
              </label>
              <Input
                {...register('nome')}
                placeholder="Seu nome"
                error={errors.nome?.message}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                Este nome aparecerá no seu dashboard
              </p>
            </div>



            {/* Navigation buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={previousStep}
                className="flex items-center gap-2 px-6 py-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Salvando...'
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.form>

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
                initial={{ width: '16%' }}
                animate={{ width: '33%' }}
                transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                className="bg-gradient-to-r from-coral-500 to-coral-600 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Etapa 2 de 6</p>
          </motion.div>
        </motion.div>
      </ModernCard>
    </div>
  );
});

PersonalStep.displayName = 'PersonalStep';

export default PersonalStep;