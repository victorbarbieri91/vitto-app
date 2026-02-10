import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan,
  FolderSearch,
  Zap,
  Send,
  Coins,
  TrendingUp,
  PieChart,
  Receipt,
  Target,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ThinkingIndicatorProps {
  /** Mensagem do usuário para contextualizar o pensamento */
  userMessage?: string;
}

interface ThinkingStep {
  icon: LucideIcon;
  text: string;
  color: string;
  bgColor: string;
}

// Etapas de pensamento padrão
const DEFAULT_STEPS: ThinkingStep[] = [
  { icon: Scan, text: 'Analisando', color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
  { icon: FolderSearch, text: 'Consultando dados', color: 'text-sky-500', bgColor: 'bg-sky-50' },
  { icon: Zap, text: 'Processando', color: 'text-amber-500', bgColor: 'bg-amber-50' },
  { icon: Send, text: 'Preparando resposta', color: 'text-coral-500', bgColor: 'bg-coral-50' },
];

// Etapas específicas baseadas em keywords
const CONTEXTUAL_STEPS: Record<string, ThinkingStep[]> = {
  saldo: [
    { icon: Wallet, text: 'Buscando saldos', color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { icon: Coins, text: 'Somando valores', color: 'text-amber-500', bgColor: 'bg-amber-50' },
    { icon: Send, text: 'Finalizando', color: 'text-coral-500', bgColor: 'bg-coral-50' },
  ],
  gasto: [
    { icon: Receipt, text: 'Buscando transações', color: 'text-sky-500', bgColor: 'bg-sky-50' },
    { icon: Coins, text: 'Calculando totais', color: 'text-amber-500', bgColor: 'bg-amber-50' },
    { icon: PieChart, text: 'Analisando', color: 'text-violet-500', bgColor: 'bg-violet-50' },
  ],
  categoria: [
    { icon: FolderSearch, text: 'Consultando', color: 'text-sky-500', bgColor: 'bg-sky-50' },
    { icon: PieChart, text: 'Analisando distribuição', color: 'text-violet-500', bgColor: 'bg-violet-50' },
    { icon: TrendingUp, text: 'Gerando insights', color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  ],
  transação: [
    { icon: Receipt, text: 'Buscando', color: 'text-sky-500', bgColor: 'bg-sky-50' },
    { icon: Zap, text: 'Processando', color: 'text-amber-500', bgColor: 'bg-amber-50' },
    { icon: Send, text: 'Organizando', color: 'text-coral-500', bgColor: 'bg-coral-50' },
  ],
  criar: [
    { icon: Scan, text: 'Entendendo', color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
    { icon: Receipt, text: 'Preparando', color: 'text-sky-500', bgColor: 'bg-sky-50' },
    { icon: Send, text: 'Validando', color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  ],
  meta: [
    { icon: Target, text: 'Consultando metas', color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { icon: TrendingUp, text: 'Calculando progresso', color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { icon: Zap, text: 'Recomendações', color: 'text-amber-500', bgColor: 'bg-amber-50' },
  ],
};

function getStepsForMessage(message?: string): ThinkingStep[] {
  if (!message) return DEFAULT_STEPS;

  const lowerMessage = message.toLowerCase();

  for (const [keyword, steps] of Object.entries(CONTEXTUAL_STEPS)) {
    if (lowerMessage.includes(keyword)) {
      return steps;
    }
  }

  return DEFAULT_STEPS;
}

/**
 *
 */
export function ThinkingIndicator({ userMessage }: ThinkingIndicatorProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps = getStepsForMessage(userMessage);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [steps.length]);

  const currentStep = steps[currentStepIndex];
  const Icon = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 py-3"
    >
      {/* Avatar do Vitto */}
      <img
        src="/personagem.vitto.icone.red.png"
        alt="Vitto"
        className="flex-shrink-0 w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200/60"
      />

      {/* Card de pensamento */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5"
          >
            {/* Ícone */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center',
                currentStep.bgColor
              )}
            >
              <Icon className={cn('w-4 h-4', currentStep.color)} />
            </motion.div>

            {/* Texto */}
            <span className="text-sm text-slate-600">
              {currentStep.text}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
