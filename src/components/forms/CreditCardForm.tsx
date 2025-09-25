import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard as CreditCardIcon, Save, Loader2 } from 'lucide-react';
import {
  ModernCard,
  ModernButton,
  ModernInput,
  ModernSelect,
  GlassFormContainer
} from '../ui/modern';
import CurrencyInput from '../ui/CurrencyInput';
import { 
  CreditCardWithUsage, 
  CreateCreditCardRequest, 
  UpdateCreditCardRequest 
} from '../../services/api';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import {
  calculateSmartClosingDay,
  getSmartClosingResult,
  validateCreditCardDates,
  calculateDaysBetween
} from '../../utils/creditCardHelpers';
import DayPicker from '../ui/DayPicker';

interface CreditCardFormProps {
  card?: CreditCardWithUsage;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCreditCardRequest | UpdateCreditCardRequest) => Promise<void>;
  isLoading?: boolean;
}

interface FormData {
  nome: string;
  limite: string;
  dia_fechamento: string;
  dia_vencimento: string;
  cor: string;
  icone: string;
  ultimos_quatro_digitos: string;
  fechamento_manual: boolean; // Track if user manually edited closing day
}

const cardColors = [
  { name: 'Coral', value: '#F87060' },
  { name: 'Azul', value: '#102542' },
  { name: 'Verde', value: '#22C55E' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Laranja', value: '#F59E0B' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Preto', value: '#000000' },
  { name: 'Cinza Escuro', value: '#1F2937' },
];

const cardIcons = [
  { name: 'Cartão', value: 'card' },
  { name: 'Estrela', value: 'star' },
  { name: 'Diamante', value: 'diamond' },
  { name: 'Coração', value: 'heart' },
];

export default function CreditCardForm({
  card,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: CreditCardFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    limite: '',
    dia_fechamento: '',
    dia_vencimento: '',
    cor: '#F87060',
    icone: 'card',
    ultimos_quatro_digitos: '',
    fechamento_manual: false
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    if (card) {
      setFormData({
        nome: card.nome,
        limite: card.limite.toString(),
        dia_fechamento: card.dia_fechamento.toString(),
        dia_vencimento: card.dia_vencimento.toString(),
        cor: card.cor || '#F87060',
        icone: card.icone || 'card',
        ultimos_quatro_digitos: card.ultimos_quatro_digitos || '',
        fechamento_manual: true // Existing cards are considered manually set
      });
    } else {
      setFormData({
        nome: '',
        limite: '',
        dia_fechamento: '',
        dia_vencimento: '',
        cor: '#F87060',
        icone: 'card',
        ultimos_quatro_digitos: '',
        fechamento_manual: false
      });
    }
    setErrors({});
  }, [card, isOpen]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle due date change with smart closing calculation
  const handleDueDateChange = (dueDay: string) => {
    const newDueDay = parseInt(dueDay);

    setFormData(prev => {
      const newFormData = { ...prev, dia_vencimento: dueDay };

      // Only auto-calculate if not manually set and due day is valid
      if (!prev.fechamento_manual && !isNaN(newDueDay) && newDueDay >= 1 && newDueDay <= 31) {
        const smartClosing = calculateSmartClosingDay(newDueDay);
        newFormData.dia_fechamento = smartClosing.toString();
      }

      return newFormData;
    });

    // Clear due date errors
    if (errors.dia_vencimento) {
      setErrors(prev => ({ ...prev, dia_vencimento: undefined }));
    }
  };

  // Handle manual closing day change
  const handleClosingDateChange = (closingDay: string) => {
    setFormData(prev => ({
      ...prev,
      dia_fechamento: closingDay,
      fechamento_manual: true // Mark as manually edited
    }));

    if (errors.dia_fechamento) {
      setErrors(prev => ({ ...prev, dia_fechamento: undefined }));
    }
  };

  // Reset to smart calculation
  const resetToSmartCalculation = () => {
    if (formData.dia_vencimento) {
      const dueDay = parseInt(formData.dia_vencimento);
      if (!isNaN(dueDay)) {
        const smartClosing = calculateSmartClosingDay(dueDay);
        setFormData(prev => ({
          ...prev,
          dia_fechamento: smartClosing.toString(),
          fechamento_manual: false
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Validar nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validar limite
    if (!formData.limite) {
      newErrors.limite = 'Limite é obrigatório';
    } else {
      const limite = parseFloat(formData.limite);
      if (isNaN(limite) || limite <= 0) {
        newErrors.limite = 'Limite deve ser um valor positivo';
      }
    }

    // Validate credit card dates using helper function
    const closingDay = parseInt(formData.dia_fechamento);
    const dueDay = parseInt(formData.dia_vencimento);

    if (!formData.dia_vencimento) {
      newErrors.dia_vencimento = 'Dia de vencimento é obrigatório';
    } else if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      newErrors.dia_vencimento = 'Dia deve estar entre 1 e 31';
    }

    if (!formData.dia_fechamento) {
      newErrors.dia_fechamento = 'Dia de fechamento é obrigatório';
    } else if (isNaN(closingDay) || closingDay < 1 || closingDay > 31) {
      newErrors.dia_fechamento = 'Dia deve estar entre 1 e 31';
    }

    // Additional validation using helper (if both dates are valid)
    if (!newErrors.dia_fechamento && !newErrors.dia_vencimento) {
      const validation = validateCreditCardDates(closingDay, dueDay);
      if (!validation.isValid) {
        newErrors.dia_fechamento = validation.error;
      }
    }

    // Validar últimos 4 dígitos (opcional)
    if (formData.ultimos_quatro_digitos && !/^\d{4}$/.test(formData.ultimos_quatro_digitos)) {
      newErrors.ultimos_quatro_digitos = 'Deve conter exatamente 4 números';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const submitData: CreateCreditCardRequest | UpdateCreditCardRequest = {
        nome: formData.nome.trim(),
        limite: parseFloat(formData.limite),
        dia_fechamento: parseInt(formData.dia_fechamento),
        dia_vencimento: parseInt(formData.dia_vencimento),
        cor: formData.cor,
        icone: formData.icone,
        ultimos_quatro_digitos: formData.ultimos_quatro_digitos || undefined
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100">
          {/* Header compacto */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {card ? 'Editar Cartão' : 'Novo Cartão'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-5 gap-4 p-4">
              {/* Preview compacto do cartão - col 1-2 */}
              <div className="col-span-2">
                <div
                  className="w-full aspect-[1.6/1] rounded-xl text-white shadow-lg relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${formData.cor} 0%, ${formData.cor}E6 100%)`
                  }}
                >
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-full"></div>
                    <div className="absolute bottom-3 left-3 w-12 h-12 bg-white/10 rounded-full"></div>
                  </div>

                  <div className="relative p-3 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-5 h-5 bg-white/30 rounded flex items-center justify-center mb-2">
                        <CreditCardIcon className="w-3 h-3 text-white" />
                      </div>
                      <h3 className="font-bold text-sm text-white truncate">
                        {formData.nome || 'Meu Cartão'}
                      </h3>
                      <p className="text-white/70 text-xs">
                        ••••  ••••  ••••  {formData.ultimos_quatro_digitos || '1234'}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/80 text-xs">
                        {formData.limite ? formatCurrency(parseFloat(formData.limite)) : 'R$ 0,00'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Seleção de cores compacta */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Cor
                  </label>
                  <div className="flex gap-1">
                    {cardColors.slice(0, 5).map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleInputChange('cor', color.value)}
                        className={cn(
                          'w-6 h-6 rounded-lg border transition-all',
                          formData.cor === color.value
                            ? 'border-slate-400 scale-110'
                            : 'border-slate-200 hover:scale-105'
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {cardColors.slice(5).map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleInputChange('cor', color.value)}
                        className={cn(
                          'w-6 h-6 rounded-lg border transition-all',
                          formData.cor === color.value
                            ? 'border-slate-400 scale-110'
                            : 'border-slate-200 hover:scale-105'
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Formulário - col 3-5 */}
              <div className="col-span-3 space-y-3">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nome do Cartão
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: Mastercard Nubank"
                    className={cn(
                      'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
                      'focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500',
                      errors.nome ? 'border-red-300' : 'border-slate-200'
                    )}
                  />
                  {errors.nome && (
                    <p className="text-xs text-red-500 mt-1">{errors.nome}</p>
                  )}
                </div>

                {/* Últimos 4 Dígitos */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Últimos 4 Dígitos (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.ultimos_quatro_digitos}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      handleInputChange('ultimos_quatro_digitos', value);
                    }}
                    placeholder="1234"
                    maxLength={4}
                    className={cn(
                      'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
                      'focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500',
                      errors.ultimos_quatro_digitos ? 'border-red-300' : 'border-slate-200'
                    )}
                  />
                  {errors.ultimos_quatro_digitos && (
                    <p className="text-xs text-red-500 mt-1">{errors.ultimos_quatro_digitos}</p>
                  )}
                </div>

                {/* Limite */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Limite
                  </label>
                  <CurrencyInput
                    value={formData.limite ? parseFloat(formData.limite) : undefined}
                    onChange={(value) => handleInputChange('limite', value?.toString() || '')}
                    error={errors.limite}
                    className="text-sm py-2"
                  />
                </div>

                {/* Datas - UI simplificada */}
                <div className="space-y-3">
                  {/* Vencimento */}
                  <DayPicker
                    value={formData.dia_vencimento ? parseInt(formData.dia_vencimento) : undefined}
                    onChange={(day) => handleDueDateChange(day?.toString() || '')}
                    label="Vencimento"
                    placeholder="Selecione o dia"
                    error={errors.dia_vencimento}
                  />

                  {/* Fechamento - só aparece depois do vencimento */}
                  {formData.dia_vencimento && (
                    <DayPicker
                      value={formData.dia_fechamento ? parseInt(formData.dia_fechamento) : undefined}
                      onChange={(day) => handleClosingDateChange(day?.toString() || '')}
                      label="Fechamento"
                      placeholder="Selecione o dia"
                      error={errors.dia_fechamento}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Footer com botões */}
            <div className="flex gap-2 p-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-coral-500 rounded-lg hover:bg-coral-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 mr-2" />
                    {card ? 'Salvar' : 'Criar'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
} 
