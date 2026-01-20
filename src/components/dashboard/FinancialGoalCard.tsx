import { useState } from 'react';
import { Target, Calendar, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import type { FinancialGoal } from '../../services/api';
import { ModernCard, ModernButton, ProgressRing } from '../ui/modern';
import { cn } from '../../utils/cn';

interface FinancialGoalCardProps {
  goal?: FinancialGoal;
  onEdit?: (goal: FinancialGoal) => void;
  onDelete?: (goalId: number) => void;
  onAddProgress?: (goalId: number, amount: number) => void;
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function FinancialGoalCard({
  goal,
  onEdit,
  onDelete,
  onAddProgress,
  isLoading = false,
  variant = 'default'
}: FinancialGoalCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [addingProgress, setAddingProgress] = useState(false);
  const [progressAmount, setProgressAmount] = useState('');

  if (!goal) {
    // Empty state - create new goal
    return (
      <ModernCard 
        variant="glass" 
        className="border-2 border-dashed border-slate-300 hover:border-coral-500 transition-colors cursor-pointer group"
        onClick={() => onEdit?.(undefined as any)}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-slate-100 group-hover:bg-coral-100 rounded-xl mx-auto flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6 text-slate-400 group-hover:text-coral-500 transition-colors" />
          </div>
          <h3 className="font-medium text-slate-600 group-hover:text-deep-blue transition-colors">
            Nova Meta
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Configure sua próxima meta financeira
          </p>
        </div>
      </ModernCard>
    );
  }

  const progress = goal.valor_meta > 0 ? (goal.valor_atual / goal.valor_meta) * 100 : 0;
  const isCompleted = progress >= 100;
  const remainingValue = Math.max(0, goal.valor_meta - goal.valor_atual);
  
  // Calculate days remaining
  const today = new Date();
  const endDate = new Date(goal.data_fim);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;
  const isUrgent = daysRemaining <= 30 && daysRemaining > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = () => {
    if (isCompleted) return 'text-green-600';
    if (isOverdue) return 'text-red-600';
    if (isUrgent) return 'text-yellow-600';
    return 'text-slate-600';
  };

  const getProgressColor = () => {
    if (isCompleted) return '#10b981';
    if (progress >= 80) return '#f59e0b';
    return goal.cor || '#F87060';
  };

  const handleAddProgress = () => {
    const amount = parseFloat(progressAmount);
    if (amount > 0 && onAddProgress) {
      onAddProgress(goal.id, amount);
      setProgressAmount('');
      setAddingProgress(false);
    }
  };

  if (variant === 'compact') {
    return (
      <ModernCard className="p-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: goal.cor }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-deep-blue truncate">{goal.titulo}</p>
            <p className="text-sm text-slate-500">
              {formatCurrency(goal.valor_atual)} / {formatCurrency(goal.valor_meta)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-coral-500">{Math.round(progress)}%</p>
          </div>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard 
      className={cn(
        "group hover:scale-[1.02] transition-all duration-300",
        isCompleted && "ring-2 ring-green-200",
        isOverdue && "ring-2 ring-red-200"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${goal.cor}20` }}
            >
              <Target 
                className="w-6 h-6"
                style={{ color: goal.cor }}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-deep-blue">{goal.titulo}</h3>
              {goal.descricao && (
                <p className="text-sm text-slate-500 mt-1">{goal.descricao}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit?.(goal)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="Editar meta"
              >
                <Edit className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={() => onDelete?.(goal.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir meta"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-4">
          <ProgressRing
            value={Math.min(progress, 100)}
            size="md"
            color={getProgressColor()}
            centerContent={
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: getProgressColor() }}>
                  {Math.round(progress)}%
                </div>
              </div>
            }
          />
          
          <div className="flex-1">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm text-slate-500">Progresso</span>
              <span className="text-sm font-medium text-deep-blue">
                {formatCurrency(goal.valor_atual)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: getProgressColor()
                }}
              />
            </div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs text-slate-400">Meta: {formatCurrency(goal.valor_meta)}</span>
              {!isCompleted && (
                <span className="text-xs text-slate-400">
                  Faltam: {formatCurrency(remainingValue)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status and Date Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">
              {formatDate(goal.data_inicio)} - {formatDate(goal.data_fim)}
            </span>
          </div>
          
          <div className={cn("text-sm font-medium", getStatusColor())}>
            {isCompleted ? (
              '✅ Concluída'
            ) : isOverdue ? (
              `${Math.abs(daysRemaining)} dias em atraso`
            ) : isUrgent ? (
              `${daysRemaining} dias restantes`
            ) : (
              `${daysRemaining} dias restantes`
            )}
          </div>
        </div>

        {/* Quick Add Progress */}
        {!isCompleted && !addingProgress && (
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => setAddingProgress(true)}
            className="w-full"
            leftIcon={<TrendingUp className="w-4 h-4" />}
          >
            Adicionar Progresso
          </ModernButton>
        )}

        {addingProgress && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                placeholder="R$ 0,00"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-coral-500"
                step="0.01"
                min="0"
              />
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleAddProgress}
                disabled={!progressAmount || parseFloat(progressAmount) <= 0}
              >
                Adicionar
              </ModernButton>
            </div>
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={() => {
                setAddingProgress(false);
                setProgressAmount('');
              }}
              className="w-full"
            >
              Cancelar
            </ModernButton>
          </div>
        )}
      </div>
    </ModernCard>
  );
}
