import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Edit3, Send } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { ImportQuestion } from '../../types/import-flow';

interface ImportQuestionCardProps {
  question: ImportQuestion;
  onAnswer: (questionId: string, answer: string | number) => void;
  disabled?: boolean;
}

/**
 *
 */
export function ImportQuestionCard({
  question,
  onAnswer,
  disabled = false
}: ImportQuestionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Resetar estado quando a pergunta muda
  useEffect(() => {
    setSelectedOption(question.resposta as string | number | null ?? null);
    setIsAnswered(!!question.resposta);
    setShowCustomInput(false);
    setCustomValue('');
  }, [question.id, question.resposta]);

  // Focar no input quando mostrar
  useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCustomInput]);

  const handleSelect = (optionId: string | number) => {
    if (disabled || isAnswered) return;

    setSelectedOption(optionId);
    setIsAnswered(true);
    onAnswer(question.id, optionId);
  };

  const handleShowCustomInput = () => {
    if (disabled || isAnswered) return;
    setShowCustomInput(true);
  };

  const handleSubmitCustom = () => {
    if (!customValue.trim() || disabled || isAnswered) return;

    setSelectedOption('custom');
    setIsAnswered(true);
    onAnswer(question.id, customValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitCustom();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl p-4',
        'bg-gradient-to-br from-slate-50 to-white',
        'border border-slate-200',
        'shadow-sm'
      )}
    >
      {/* Pergunta */}
      <p className="text-sm font-medium text-slate-700 mb-3">
        {question.pergunta}
      </p>

      {/* Opcoes */}
      <div className="space-y-2">
        {question.opcoes?.map((opcao) => {
          const isSelected = selectedOption === opcao.id;
          const isDisabled = disabled || (isAnswered && !isSelected);

          return (
            <motion.button
              key={opcao.id}
              onClick={() => handleSelect(opcao.id)}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.01 } : undefined}
              whileTap={!isDisabled ? { scale: 0.99 } : undefined}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg',
                'text-left transition-all duration-200',
                'border',
                isSelected
                  ? 'bg-coral-50 border-coral-300 text-coral-700'
                  : isDisabled
                    ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-coral-200 hover:bg-coral-50/50'
              )}
            >
              {/* Icone de selecao */}
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                  'border-2 transition-colors',
                  isSelected
                    ? 'bg-coral-500 border-coral-500'
                    : 'border-slate-300'
                )}
              >
                {isSelected && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>

              {/* Conteudo */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block">
                  {opcao.label}
                </span>
                {opcao.descricao && (
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {opcao.descricao}
                  </span>
                )}
              </div>

              {/* Seta */}
              {!isAnswered && (
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </motion.button>
          );
        })}

        {/* Opção "Outro" com input */}
        {!isAnswered && !showCustomInput && (
          <motion.button
            onClick={handleShowCustomInput}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.01 } : undefined}
            whileTap={!disabled ? { scale: 0.99 } : undefined}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg',
              'text-left transition-all duration-200',
              'border border-dashed',
              disabled
                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-white border-slate-300 text-slate-500 hover:border-coral-300 hover:text-coral-600'
            )}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-slate-300">
              <Edit3 className="w-3 h-3" />
            </div>
            <span className="text-sm font-medium">Outro (digite sua resposta)</span>
          </motion.button>
        )}

        {/* Input customizado */}
        {showCustomInput && !isAnswered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 p-2 rounded-lg border border-coral-300 bg-coral-50"
          >
            <input
              ref={inputRef}
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua resposta..."
              disabled={disabled}
              className={cn(
                'flex-1 px-3 py-2 text-sm rounded-md',
                'bg-white border border-slate-200',
                'focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent',
                'placeholder:text-slate-400'
              )}
            />
            <button
              onClick={handleSubmitCustom}
              disabled={!customValue.trim() || disabled}
              className={cn(
                'p-2 rounded-md transition-colors',
                customValue.trim() && !disabled
                  ? 'bg-coral-500 text-white hover:bg-coral-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Mostrar resposta customizada se selecionada */}
        {isAnswered && selectedOption === 'custom' && (
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-lg',
            'bg-coral-50 border border-coral-300 text-coral-700'
          )}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-coral-500 border-2 border-coral-500">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium">{customValue}</span>
          </div>
        )}
      </div>

      {/* Indicador de respondido */}
      {isAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Resposta registrada</span>
        </motion.div>
      )}
    </motion.div>
  );
}
