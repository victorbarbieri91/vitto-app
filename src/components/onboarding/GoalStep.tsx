import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, ArrowRight, ArrowLeft, Percent } from 'lucide-react';
import ModernCard from '../ui/modern/ModernCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useOnboarding } from '../../contexts/OnboardingContext';

const GoalStep = memo(() => {
  const { nextStep, previousStep, updateOnboardingData, onboardingData } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPercentage, setSelectedPercentage] = useState(onboardingData.goalInfo?.meta_percentual || 80);
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualValue, setManualValue] = useState(selectedPercentage.toString());

  const receita = onboardingData.goalInfo?.receita_mensal || onboardingData.personalInfo?.receita_mensal || 0;

  const recommendedOptions = [
    { value: 60, label: '60%', description: 'Mais conservador' },
    { value: 80, label: '80%', description: 'Recomendado' },
    { value: 90, label: '90%', description: 'Mais flexível' }
  ];

  const handlePercentageSelect = (value: number) => {
    setSelectedPercentage(value);
    setIsManualInput(false);
    setManualValue(value.toString());
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (parseInt(value) <= 100 || value === '') {
      setManualValue(value);
      if (value && parseInt(value) > 0) {
        setSelectedPercentage(parseInt(value));
      }
    }
  };

  const onSubmit = async () => {
    setIsSubmitting(true);

    // Update onboarding data
    updateOnboardingData({
      goalInfo: {
        meta_percentual: selectedPercentage,
        receita_mensal: receita
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
              <Target className="w-6 h-6 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl font-bold text-deep-blue mb-2"
            >
              Quanto você quer gastar?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-slate-600"
            >
              Escolha o percentual da sua renda para gastos mensais
            </motion.p>
          </div>

          {/* Percentage Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="space-y-3"
          >
            {/* Recommended Options */}
            <div className="grid grid-cols-3 gap-2">
              {recommendedOptions.map((option, index) => (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                  onClick={() => handlePercentageSelect(option.value)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedPercentage === option.value && !isManualInput
                      ? 'bg-gradient-to-r from-coral-500 to-coral-600 text-white border-coral-500'
                      : 'bg-white/80 text-deep-blue border-slate-200 hover:border-coral-500'
                  }`}
                >
                  <div className="text-lg font-bold">{option.label}</div>
                  <div className="text-xs opacity-80">{option.description}</div>
                </motion.button>
              ))}
            </div>

            {/* Manual Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="relative"
            >
              <label className="block text-sm font-semibold text-deep-blue mb-2">
                Ou defina manualmente
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Ex: 75"
                    value={manualValue}
                    onChange={handleManualInput}
                    onFocus={() => setIsManualInput(true)}
                    className="pr-8"
                  />
                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Digite um valor entre 1 e 100
              </p>
            </motion.div>

            {/* Current Selection Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.3, type: 'spring' }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-md border border-white/50 shadow-lg p-4"
            >
              {/* Background decoration */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-coral-500/15 to-coral-600/15 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-deep-blue/10 to-deep-blue/15 rounded-full blur-2xl" />

              <div className="relative z-10">
                {/* Main percentage display */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold bg-gradient-to-r from-coral-500 to-coral-600 bg-clip-text text-transparent">
                      {selectedPercentage}%
                    </span>
                    <span className="text-xs font-medium text-slate-600">para gastos</span>
                  </div>
                </div>

                {/* Visual bar */}
                <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-coral-500 to-coral-600 rounded-full"
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${100 - selectedPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                    className="absolute right-0 top-0 h-full bg-gradient-to-r from-deep-blue to-deep-blue/80 rounded-full"
                    style={{ left: `${selectedPercentage}%` }}
                  />
                </div>

                {/* Details */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-coral-500 to-coral-600" />
                    <span className="text-slate-600">Gastos mensais</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-deep-blue to-deep-blue/80" />
                    <span className="text-slate-600">{100 - selectedPercentage}% poupança</span>
                  </div>
                </div>

                {/* Amount display if income is set */}
                {receita > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.3 }}
                    className="mt-2 pt-2 border-t border-slate-200/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Meta mensal:</span>
                      <span className="text-sm font-semibold text-deep-blue">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receita * selectedPercentage / 100)}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>

          {/* Navigation buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex gap-4 pt-4"
          >
            <Button
              type="button"
              variant="outline"
              onClick={previousStep}
              className="flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>

            <Button
              onClick={onSubmit}
              disabled={isSubmitting || selectedPercentage <= 0 || selectedPercentage > 100}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                'Salvando...'
              ) : (
                <>
                  Finalizar configuração
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
                initial={{ width: '66%' }}
                animate={{ width: '83%' }}
                transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                className="bg-gradient-to-r from-coral-500 to-coral-600 h-2 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Etapa 5 de 6</p>
          </motion.div>
        </motion.div>
      </ModernCard>
    </div>
  );
});

GoalStep.displayName = 'GoalStep';

export default GoalStep;