import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useGoalsService } from '../../hooks/useGoalsService';
import FinancialGoalCard from './FinancialGoalCard';
import type { FinancialGoal } from './FinancialGoalCard';
import { cn } from '../../utils/cn';

interface FinancialGoalsSummaryProps {
  onAddGoal?: () => void;
  onEditGoal?: (goal: FinancialGoal) => void;
  className?: string;
}

/**
 *
 */
export default function FinancialGoalsSummary({ onAddGoal, onEditGoal, className }: FinancialGoalsSummaryProps) {
  const { goals, loading } = useGoalsService();
  const [isExpanded, setIsExpanded] = useState(true);

  // Filtrar metas em andamento (não concluídas)
  const activeGoals = goals.filter(goal => goal.valor_atual < goal.valor_meta);

  // Filtrar metas concluídas
  const completedGoals = goals.filter(goal => goal.valor_atual >= goal.valor_meta);

  return (
    <div className={cn(
      "bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-coral-500" />
          <h2 className="text-lg font-semibold text-deep-blue">Metas Financeiras</h2>
          {goals.length > 0 && (
            <span className="text-xs bg-coral-500/20 text-coral-600 px-2 py-0.5 rounded-full">
              {activeGoals.length} ativa{activeGoals.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onAddGoal && (
            <button
              onClick={onAddGoal}
              className="p-1.5 rounded-lg bg-coral-500/20 hover:bg-coral-500/30 text-coral-600 transition-colors"
              title="Nova Meta"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-deep-blue" />
            ) : (
              <ChevronDown className="w-5 h-5 text-deep-blue" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white/20 rounded-lg p-3">
                    <div className="h-4 bg-white/30 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-3 text-sm">Nenhuma meta cadastrada</p>
                {onAddGoal && (
                  <button
                    onClick={onAddGoal}
                    className="text-sm px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-lg transition-colors"
                  >
                    Criar Primeira Meta
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {activeGoals.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-2">Em andamento</h3>
                    <div className="space-y-2">
                      {activeGoals.slice(0, 3).map(goal => (
                        <FinancialGoalCard
                          key={goal.id}
                          goal={goal}
                          onEdit={onEditGoal}
                          variant="compact"
                        />
                      ))}
                      {activeGoals.length > 3 && (
                        <button className="w-full text-xs text-coral-500 hover:text-coral-600 py-1">
                          Ver mais {activeGoals.length - 3} metas
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {completedGoals.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <h3 className="text-xs font-medium text-green-600 mb-2">
                      Concluídas ({completedGoals.length})
                    </h3>
                    <div className="space-y-2">
                      {completedGoals.slice(0, 2).map(goal => (
                        <FinancialGoalCard
                          key={goal.id}
                          goal={goal}
                          onEdit={onEditGoal}
                          variant="compact"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumo quando colapsado */}
      {!isExpanded && goals.length > 0 && (
        <div className="text-sm text-gray-600">
          {activeGoals.length} em andamento, {completedGoals.length} concluída{completedGoals.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
