import { useGoalsService } from '../../hooks/useGoalsService';
import FinancialGoalCard from './FinancialGoalCard';
import type { FinancialGoal } from './FinancialGoalCard';
import Button from '../ui/Button';

interface FinancialGoalsSummaryProps {
  onAddGoal?: () => void;
  onEditGoal?: (goal: FinancialGoal) => void;
}

export default function FinancialGoalsSummary({ onAddGoal, onEditGoal }: FinancialGoalsSummaryProps) {
  const { goals, loading } = useGoalsService();

  // Filtrar metas em andamento (não concluídas)
  const activeGoals = goals.filter(goal => goal.valor_atual < goal.valor_meta);
  
  // Filtrar metas concluídas
  const completedGoals = goals.filter(goal => goal.valor_atual >= goal.valor_meta);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-fontColor">Metas Financeiras</h2>
        {onAddGoal && (
          <Button
            onClick={onAddGoal}
            className="text-sm px-3 py-1"
          >
            Nova Meta
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Você ainda não tem metas financeiras.</p>
          {onAddGoal && (
            <Button
              onClick={onAddGoal}
              className="text-sm"
            >
              Criar Primeira Meta
            </Button>
          )}
        </div>
      ) : (
        <div>
          {activeGoals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Em andamento</h3>
              <div className="space-y-4">
                {activeGoals.slice(0, 3).map(goal => (
                  <FinancialGoalCard 
                    key={goal.id} 
                    goal={goal} 
                    onEdit={onEditGoal}
                  />
                ))}
                {activeGoals.length > 3 && (
                  <div className="text-center mt-2">
                    <button className="text-sm text-primary hover:text-primary-dark">
                      Ver mais {activeGoals.length - 3} metas
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {completedGoals.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Concluídas</h3>
              <div className="space-y-4">
                {completedGoals.slice(0, 2).map(goal => (
                  <FinancialGoalCard 
                    key={goal.id} 
                    goal={goal} 
                    onEdit={onEditGoal}
                  />
                ))}
                {completedGoals.length > 2 && (
                  <div className="text-center mt-2">
                    <button className="text-sm text-primary hover:text-primary-dark">
                      Ver mais {completedGoals.length - 2} metas concluídas
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
