import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { DataRequest, FieldDefinition } from '../../types/central-ia';

interface DataCollectionModalProps {
  isOpen: boolean;
  dataRequest: DataRequest | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 *
 */
export function DataCollectionModal({
  isOpen,
  dataRequest,
  onSubmit,
  onCancel,
  isLoading,
}: DataCollectionModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form quando dataRequest muda
  useEffect(() => {
    if (dataRequest) {
      const initialData: Record<string, unknown> = {};
      dataRequest.fields.forEach((field) => {
        if (field.defaultValue !== undefined) {
          initialData[field.name] = field.defaultValue;
        }
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [dataRequest]);

  if (!dataRequest) return null;

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpa erro quando campo é preenchido
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    const newErrors: Record<string, string> = {};
    dataRequest.fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = 'Este campo é obrigatório';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 bg-blue-50">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Informações Adicionais
                  </h3>
                  <p className="text-sm text-gray-500">{dataRequest.context}</p>
                </div>
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4 mb-6">
                  {dataRequest.fields.map((field) => (
                    <FormField
                      key={field.name}
                      field={field}
                      value={formData[field.name]}
                      error={errors[field.name]}
                      onChange={(value) => handleChange(field.name, value)}
                      disabled={isLoading}
                    />
                  ))}
                </div>

                {/* Botões */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-xl',
                      'bg-gray-100 text-gray-700 font-medium',
                      'hover:bg-gray-200 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2',
                      'px-4 py-2.5 rounded-xl',
                      'bg-coral-500 text-white font-medium',
                      'hover:bg-coral-600 transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Continuar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface FormFieldProps {
  field: FieldDefinition;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function FormField({ field, value, error, onChange, disabled }: FormFieldProps) {
  const baseInputClass = cn(
    'w-full px-4 py-2.5 rounded-xl',
    'bg-gray-50 border',
    'text-sm text-gray-900 placeholder-gray-400',
    'focus:outline-none focus:ring-2 transition-all',
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-coral-300 focus:ring-coral-100',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.type === 'select' && field.options ? (
        <div className="relative">
          <select
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(baseInputClass, 'appearance-none pr-10')}
          >
            <option value="">Selecione...</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      ) : field.type === 'currency' ? (
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            R$
          </span>
          <input
            type="number"
            value={value as number || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            disabled={disabled}
            placeholder={field.placeholder || '0,00'}
            step="0.01"
            min="0"
            className={cn(baseInputClass, 'pl-10')}
          />
        </div>
      ) : field.type === 'date' ? (
        <input
          type="date"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={baseInputClass}
        />
      ) : field.type === 'number' ? (
        <input
          type="number"
          value={value as number || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          disabled={disabled}
          placeholder={field.placeholder}
          className={baseInputClass}
        />
      ) : (
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={field.placeholder}
          className={baseInputClass}
        />
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
