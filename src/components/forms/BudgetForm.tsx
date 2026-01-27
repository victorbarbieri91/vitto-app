import { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign, Tag } from 'lucide-react';
import type { Budget, NewBudget, Category } from '../../services/api';
import { ModernCard, ModernButton, ModernInput, ModernSelect } from '../ui/modern';
import { cn } from '../../utils/cn';

interface BudgetFormProps {
  budget?: Budget;
  categories: Category[];
  onSave: (budget: NewBudget) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const BUDGET_SUGGESTIONS = [
  { label: 'Conservador (5-10%)', multiplier: 0.075 },
  { label: 'Moderado (10-15%)', multiplier: 0.125 },
  { label: 'Flexível (15-20%)', multiplier: 0.175 },
];

export default function BudgetForm({ 
  budget, 
  categories,
  onSave, 
  onCancel, 
  isLoading = false 
}: BudgetFormProps) {
  const currentDate = new Date();
  const [formData, setFormData] = useState<NewBudget>({
    categoria_id: 0,
    mes: currentDate.getMonth() + 1,
    ano: currentDate.getFullYear(),
    valor: 0,
    tipo: 'despesa'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [estimatedIncome, setEstimatedIncome] = useState(5000); // Default estimate

  useEffect(() => {
    if (budget) {
      setFormData({
        categoria_id: budget.categoria_id,
        mes: budget.mes,
        ano: budget.ano,
        valor: budget.valor,
        tipo: budget.tipo || 'despesa'
      });
    }
  }, [budget]);

  const handleChange = (field: keyof NewBudget, value: string | number) => {
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

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.categoria_id);
  };

  const getPercentageOfIncome = () => {
    if (formData.valor > 0 && estimatedIncome > 0) {
      return ((formData.valor / estimatedIncome) * 100).toFixed(1);
    }
    return '0';
  };

  const getSuggestionLabel = () => {
    const percentage = parseFloat(getPercentageOfIncome());
    if (percentage <= 5) return 'Muito Conservador';
    if (percentage <= 10) return 'Conservador';
    if (percentage <= 15) return 'Moderado';
    if (percentage <= 20) return 'Flexível';
    return 'Acima do Recomendado';
  };

  const getSuggestionColor = () => {
    const percentage = parseFloat(getPercentageOfIncome());
    if (percentage <= 15) return 'text-green-600';
    if (percentage <= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.categoria_id === 0) {
      newErrors.categoria_id = 'Selecione uma categoria';
    }
    
    if (formData.valor <= 0) {
      newErrors.valor = 'O valor do orçamento deve ser maior que zero';
    }
    
    if (formData.mes < 1 || formData.mes > 12) {
      newErrors.mes = 'Mês inválido';
    }
    
    if (formData.ano < 2020 || formData.ano > 2030) {
      newErrors.ano = 'Ano deve estar entre 2020 e 2030';
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

  const handleSuggestionClick = (multiplier: number) => {
    const suggestedValue = estimatedIncome * multiplier;
    handleChange('valor', Math.round(suggestedValue));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const categoryOptions = categories
    .filter(cat => cat.tipo === 'despesa')
    .map(cat => ({
      value: cat.id.toString(),
      label: cat.nome,
      icon: cat.icone,
      color: cat.cor
    }));

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
                  {budget ? 'Editar Orçamento' : 'Novo Orçamento'}
                </h2>
                <p className="text-sm text-slate-500">
                  {budget ? 'Altere os dados do seu orçamento' : 'Configure um novo orçamento para sua categoria'}
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
          {(formData.categoria_id > 0 || formData.valor > 0) && (
            <ModernCard variant="glass" className="mb-6 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: getSelectedCategory()?.cor || '#64748b' }}
                  >
                    {getSelectedCategory()?.icone || '💰'}
                  </div>
                  <div>
                    <p className="font-medium text-deep-blue">
                      {getSelectedCategory()?.nome || 'Selecione uma categoria'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {monthNames[formData.mes - 1]} de {formData.ano}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-coral-500">
                    {formatCurrency(formData.valor)}
                  </p>
                  <p className={cn("text-sm font-medium", getSuggestionColor())}>
                    {getPercentageOfIncome()}% da renda • {getSuggestionLabel()}
                  </p>
                </div>
              </div>
            </ModernCard>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Categoria */}
            <ModernSelect
              label="Categoria"
              value={formData.categoria_id.toString()}
              onChange={(value) => handleChange('categoria_id', parseInt(value))}
              options={[
                { value: '0', label: 'Selecione uma categoria...' },
                ...categoryOptions
              ]}
              error={errors.categoria_id}
              leftIcon={<Tag className="w-4 h-4" />}
            />

            {/* Período */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ModernSelect
                label="Mês"
                value={formData.mes.toString()}
                onChange={(value) => handleChange('mes', parseInt(value))}
                options={monthNames.map((month, index) => ({
                  value: (index + 1).toString(),
                  label: month
                }))}
                error={errors.mes}
                leftIcon={<Calendar className="w-4 h-4" />}
              />

              <ModernInput
                label="Ano"
                type="number"
                value={formData.ano.toString()}
                onChange={(e) => handleChange('ano', parseInt(e.target.value))}
                placeholder="2024"
                min="2020"
                max="2030"
                error={errors.ano}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
            </div>

            {/* Valor */}
            <ModernInput
              label="Valor do Orçamento"
              type="number"
              value={formData.valor || ''}
              onChange={(e) => handleChange('valor', parseFloat(e.target.value) || 0)}
              placeholder="0,00"
              step="0.01"
              min="0"
              error={errors.valor}
              leftIcon={<DollarSign className="w-4 h-4" />}
            />

            {/* Sugestões de Valor */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Sugestões baseadas na renda
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {BUDGET_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion.multiplier)}
                    className="p-3 border border-slate-200 rounded-xl hover:border-coral-500 hover:bg-coral-50 transition-all text-left"
                  >
                    <div className="font-medium text-sm text-deep-blue">
                      {suggestion.label}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatCurrency(estimatedIncome * suggestion.multiplier)}
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Income Estimator */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                <label className="text-xs font-medium text-slate-600 mb-2 block">
                  Renda mensal estimada (para cálculo de sugestões)
                </label>
                <input
                  type="number"
                  value={estimatedIncome}
                  onChange={(e) => setEstimatedIncome(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-coral-500"
                  placeholder="5000,00"
                  step="100"
                  min="0"
                />
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
                {budget ? 'Atualizar Orçamento' : 'Criar Orçamento'}
              </ModernButton>
            </div>
          </form>
        </div>
      </ModernCard>
    </div>
  );
} 