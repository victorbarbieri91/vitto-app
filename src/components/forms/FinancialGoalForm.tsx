import { useState, useEffect } from 'react';
import { X, Target, Calendar, TrendingUp } from 'lucide-react';
import type { FinancialGoal, NewFinancialGoal } from '../../services/api';
import { ModernCard, ModernButton, ModernInput } from '../ui/modern';
import { cn } from '../../utils/cn';

interface FinancialGoalFormProps {
  goal?: FinancialGoal;
  onSave: (goal: NewFinancialGoal) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const GOAL_COLORS = [
  { name: 'Coral', value: '#F87060' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Laranja', value: '#f59e0b' },
];

export default function FinancialGoalForm({ 
  goal, 
  onSave, 
  onCancel, 
  isLoading = false 
}: FinancialGoalFormProps) {
  const [formData, setFormData] = useState<NewFinancialGoal>({
    titulo: '',
    descricao: '',
    valor_meta: 0,
    valor_atual: 0,
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    cor: '#F87060'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (goal) {
      setFormData({
        titulo: goal.titulo,
        descricao: goal.descricao || '',
        valor_meta: goal.valor_meta,
        valor_atual: goal.valor_atual,
        data_inicio: goal.data_inicio,
        data_fim: goal.data_fim,
        cor: goal.cor || '#F87060'
      });
    }
  }, [goal]);

  const handleChange = (field: keyof NewFinancialGoal, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro para este campo quando alterado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const progressPercentage = formData.valor_meta > 0 
    ? Math.round((formData.valor_atual / formData.valor_meta) * 100) 
    : 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'O título é obrigatório';
    }
    
    if (formData.valor_meta <= 0) {
      newErrors.valor_meta = 'O valor da meta deve ser maior que zero';
    }
    
    if (formData.valor_atual < 0) {
      newErrors.valor_atual = 'O valor atual não pode ser negativo';
    }
    
    if (formData.valor_atual > formData.valor_meta) {
      newErrors.valor_atual = 'O valor atual não pode ser maior que o valor da meta';
    }
    
    if (!formData.data_inicio) {
      newErrors.data_inicio = 'A data de início é obrigatória';
    }
    
    if (!formData.data_fim) {
      newErrors.data_fim = 'A data de fim é obrigatória';
    } else if (formData.data_inicio && formData.data_fim <= formData.data_inicio) {
      newErrors.data_fim = 'A data de fim deve ser posterior à data de início';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <ModernCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-coral-500 rounded-xl">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-deep-blue">
                  {goal ? 'Editar Meta' : 'Nova Meta Financeira'}
                </h2>
                <p className="text-sm text-slate-500">
                  {goal ? 'Altere os dados da sua meta' : 'Configure sua nova meta financeira'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Preview */}
          {(formData.titulo || formData.valor_meta > 0) && (
            <ModernCard variant="glass" className="mb-6 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: formData.cor }}
                  />
                  <div>
                    <p className="font-medium text-deep-blue">
                      {formData.titulo || 'Nova Meta'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(formData.valor_atual)} de {formatCurrency(formData.valor_meta)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-coral-500">
                    {progressPercentage}%
                  </p>
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-coral-500 transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </ModernCard>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <ModernInput
              label="Título da Meta"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              placeholder="Ex: Férias, Carro Novo, Reserva de Emergência..."
              error={errors.titulo}
              leftIcon={<Target className="w-4 h-4" />}
            />

            {/* Descrição */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                placeholder="Descreva sua meta financeira..."
                rows={3}
                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-coral-500 focus:ring-4 focus:ring-coral-500/10 transition-all"
              />
            </div>

            {/* Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModernInput
                label="Valor da Meta"
                type="number"
                value={formData.valor_meta || ''}
                onChange={(e) => handleChange('valor_meta', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                step="0.01"
                min="0"
                error={errors.valor_meta}
                leftIcon={<span className="text-sm font-medium text-slate-500">R$</span>}
              />

              <ModernInput
                label="Valor Atual"
                type="number"
                value={formData.valor_atual || ''}
                onChange={(e) => handleChange('valor_atual', parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                step="0.01"
                min="0"
                error={errors.valor_atual}
                leftIcon={<TrendingUp className="w-4 h-4" />}
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModernInput
                label="Data de Início"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => handleChange('data_inicio', e.target.value)}
                error={errors.data_inicio}
                leftIcon={<Calendar className="w-4 h-4" />}
              />

              <ModernInput
                label="Data de Fim"
                type="date"
                value={formData.data_fim}
                onChange={(e) => handleChange('data_fim', e.target.value)}
                error={errors.data_fim}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
            </div>

            {/* Cor */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Cor da Meta
              </label>
              <div className="flex flex-wrap gap-2">
                {GOAL_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange('cor', color.value)}
                    className={cn(
                      "w-10 h-10 rounded-xl border-2 transition-all",
                      formData.cor === color.value
                        ? "border-slate-400 scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <ModernButton
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isLoading}
              >
                Cancelar
              </ModernButton>
              <ModernButton
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={isLoading}
              >
                {goal ? 'Atualizar Meta' : 'Criar Meta'}
              </ModernButton>
            </div>
          </form>
        </div>
      </ModernCard>
    </div>
  );
}
