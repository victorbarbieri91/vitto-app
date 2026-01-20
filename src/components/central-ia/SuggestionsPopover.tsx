import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, TrendingUp, Target, Calendar, Repeat, PiggyBank, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SuggestionsPopoverProps {
  onSelectSuggestion: (suggestion: string) => void;
}

interface SuggestionCategory {
  title: string;
  icon: React.ReactNode;
  color: string;
  suggestions: string[];
}

const SUGGESTION_CATEGORIES: SuggestionCategory[] = [
  {
    title: 'Análise',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-blue-500 bg-blue-50',
    suggestions: [
      'Qual categoria mais consome meu orçamento?',
      'Compare meus gastos deste mês com os últimos 3 meses',
      'Qual dia da semana eu mais gasto dinheiro?',
    ],
  },
  {
    title: 'Metas',
    icon: <Target className="w-4 h-4" />,
    color: 'text-emerald-500 bg-emerald-50',
    suggestions: [
      'Estou no caminho certo para minhas metas?',
      'Quanto preciso economizar por mês para atingi-las?',
      'Se eu mantiver esse ritmo, quanto terei no final do ano?',
    ],
  },
  {
    title: 'Economia',
    icon: <PiggyBank className="w-4 h-4" />,
    color: 'text-amber-500 bg-amber-50',
    suggestions: [
      'Onde posso economizar este mês sem sacrifícios?',
      'Quais gastos recorrentes eu poderia eliminar?',
      'Qual foi meu maior gasto impulsivo este mês?',
    ],
  },
  {
    title: 'Agenda',
    icon: <Calendar className="w-4 h-4" />,
    color: 'text-purple-500 bg-purple-50',
    suggestions: [
      'Quais contas vencem nos próximos 7 dias?',
      'Quais categorias estão acima do orçamento?',
      'Como está minha saúde financeira geral?',
    ],
  },
];

export function SuggestionsPopover({ onSelectSuggestion }: SuggestionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2.5 rounded-xl transition-all duration-200',
          'hover:bg-amber-50 text-gray-400 hover:text-amber-500',
          isOpen && 'bg-amber-50 text-amber-500'
        )}
        title="Sugestões de perguntas"
      >
        <Lightbulb className="w-5 h-5" />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute left-0 bottom-full mb-2 w-80 sm:w-96',
              'bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/60',
              'overflow-hidden z-50'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50/80 to-orange-50/80">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-slate-700">Sugestões Inteligentes</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Categories */}
            <div className="max-h-80 overflow-y-auto p-2">
              {SUGGESTION_CATEGORIES.map((category, categoryIndex) => (
                <div key={category.title} className={cn(categoryIndex > 0 && 'mt-2')}>
                  {/* Category Header */}
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <span className={cn('p-1 rounded-md', category.color)}>
                      {category.icon}
                    </span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {category.title}
                    </span>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-1">
                    {category.suggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-xl',
                          'text-sm text-slate-600 hover:text-slate-900',
                          'hover:bg-slate-50 transition-colors',
                          'flex items-start gap-2'
                        )}
                      >
                        <span className="text-slate-300 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">
                Clique em uma sugestão para usar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
