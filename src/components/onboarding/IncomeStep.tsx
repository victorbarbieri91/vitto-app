import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ModernCard from '../ui/modern/ModernCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CurrencyInput from '../ui/CurrencyInput';
import { useOnboarding } from '../../contexts/OnboardingContext';

const incomeSchema = z.object({
  receita_mensal: z.number().min(0, 'Receita deve ser positiva')
});

type IncomeFormData = z.infer<typeof incomeSchema>;

const IncomeStep = memo(() => {
  const { nextStep, previousStep, updateOnboardingData, onboardingData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      receita_mensal: onboardingData.personalInfo?.receita_mensal || onboardingData.goalInfo?.receita_mensal || 0
    },
    mode: 'onChange'
  });

  const watchedData = watch();

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true);

    // Update both personal info and goal info with the income
    updateOnboardingData({
      personalInfo: {
        ...onboardingData.personalInfo,
        receita_mensal: data.receita_mensal
      },
      goalInfo: {
        ...onboardingData.goalInfo,
        receita_mensal: data.receita_mensal,
        meta_percentual: onboardingData.goalInfo?.meta_percentual || 80
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
              <DollarSign className="w-6 h-6 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl font-bold text-deep-blue mb-2"
            >
              Qual sua renda mensal?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-slate-600"
            >
              Esta informação nos ajuda a criar metas inteligentes para seus gastos
            </motion.p>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Income Input */}
            <div>
              <label className="block text-sm font-semibold text-deep-blue mb-3">
                Renda mensal total (líquida)
              </label>
              <CurrencyInput
                value={watchedData.receita_mensal}
                onChange={(value) => setValue('receita_mensal', value || 0)}
                error={errors.receita_mensal?.message}
                placeholder="R$ 0,00"
              />
              <p className="text-xs text-slate-500 mt-2">
                Digite o valor que você recebe mensalmente após descontos
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
                disabled={!isValid || isSubmitting || watchedData.receita_mensal <= 0}
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
                initial={{ width: '50%' }}
                animate={{ width: '66%' }}
                transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                className="bg-gradient-to-r from-coral-500 to-coral-600 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Etapa 4 de 6</p>
          </motion.div>
        </motion.div>
      </ModernCard>
    </div>
  );
});

IncomeStep.displayName = 'IncomeStep';

export default IncomeStep;