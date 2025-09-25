import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ModernCard from '../ui/modern/ModernCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CurrencyInput from '../ui/CurrencyInput';
import { useOnboarding } from '../../contexts/OnboardingContext';

const accountSchema = z.object({
  nome: z.string().min(1, 'Nome da conta é obrigatório').min(2, 'Nome da conta deve ter pelo menos 2 caracteres'),
  tipo: z.enum(['conta_corrente', 'conta_poupanca', 'carteira', 'investimento'], {
    errorMap: () => ({ message: 'Selecione um tipo de conta' })
  }),
  saldo_inicial: z.number({ required_error: 'Saldo inicial é obrigatório' }).min(0, 'Saldo deve ser positivo ou zero')
});

type AccountFormData = z.infer<typeof accountSchema>;

const AccountStep = memo(() => {
  const { nextStep, previousStep, updateOnboardingData, onboardingData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);


  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      nome: onboardingData.accountInfo?.nome || '',
      tipo: 'conta_corrente',
      saldo_inicial: onboardingData.accountInfo?.saldo_inicial || 0
    },
    mode: 'onChange'
  });

  const watchedData = watch();

  const onSubmit = async (data: AccountFormData) => {
    setIsSubmitting(true);

    // Update onboarding data
    updateOnboardingData({
      accountInfo: data
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
              <CreditCard className="w-6 h-6 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl font-bold text-deep-blue mb-2"
            >
              Configure sua conta
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-slate-600"
            >
              Adicione sua conta principal para começar a controlar suas finanças
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
            {/* Account Name */}
            <div>
              <label className="block text-sm font-semibold text-deep-blue mb-2">
                Nome da conta
              </label>
              <Input
                {...register('nome')}
                placeholder="Conta Principal"
                error={errors.nome?.message}
                className="w-full"
              />
            </div>


            {/* Initial Balance */}
            <div>
              <label className="block text-sm font-semibold text-deep-blue mb-2">
                Saldo atual da conta
              </label>
              <CurrencyInput
                value={watchedData.saldo_inicial}
                onChange={(value) => setValue('saldo_inicial', value || 0)}
                error={errors.saldo_inicial?.message}
                placeholder="R$ 0,00"
              />
              <p className="text-xs text-slate-500 mt-1">
                Digite o valor que você tem atualmente nesta conta
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
                initial={{ width: '33%' }}
                animate={{ width: '50%' }}
                transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                className="bg-gradient-to-r from-coral-500 to-coral-600 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Etapa 3 de 6</p>
          </motion.div>
        </motion.div>
      </ModernCard>
    </div>
  );
});

AccountStep.displayName = 'AccountStep';

export default AccountStep;