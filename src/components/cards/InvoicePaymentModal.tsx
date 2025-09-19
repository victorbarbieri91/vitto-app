import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, Save, Loader2, CheckCircle } from 'lucide-react';
import { 
  ModernCard, 
  ModernButton, 
  ModernInput, 
  ModernSelect,
  GlassFormContainer
} from '../ui/modern';
import { Fatura } from '../../services/api';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { automationService, InvoicePaymentRequest } from '../../services/api/AutomationService';
import { cn } from '../../utils/cn';

interface InvoicePaymentModalProps {
  invoice: Fatura & {
    cartao?: {
      nome: string;
      cor?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvoicePaymentModal({
  invoice,
  isOpen,
  onClose,
  onSuccess
}: InvoicePaymentModalProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    valor_pago: '',
    data_pagamento: '',
    conta_id: '',
    categoria_id: ''
  });

  // Resetar form quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setFormData({
        valor_pago: invoice.valor_total.toString(),
        data_pagamento: new Date().toISOString().split('T')[0],
        conta_id: '',
        categoria_id: ''
      });
      setError(null);
    }
  }, [isOpen, invoice]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.valor_pago || !formData.data_pagamento || !formData.conta_id) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const valorPago = parseFloat(formData.valor_pago);
    if (isNaN(valorPago) || valorPago <= 0) {
      setError('Valor pago deve ser um número positivo');
      return;
    }

    if (valorPago > invoice.valor_total) {
      setError('Valor pago não pode ser maior que o valor da fatura');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const paymentRequest: InvoicePaymentRequest = {
        fatura_id: invoice.id,
        valor_pago: valorPago,
        data_pagamento: formData.data_pagamento,
        conta_id: formData.conta_id,
        categoria_id: formData.categoria_id || undefined
      };

      const result = await automationService.payInvoice(paymentRequest);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Erro ao processar pagamento');
      }
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      setError('Erro inesperado ao processar pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const accountOptions = accounts.map(account => ({
    value: account.id,
    label: account.nome
  }));

  const categoryOptions = [
    { value: '', label: 'Selecionar categoria (opcional)' },
    ...categories
      .filter(cat => cat.tipo === 'despesa')
      .map(category => ({
        value: category.id,
        label: category.nome
      }))
  ];

  if (!isOpen) return null;

  return (
    <GlassFormContainer>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md mx-auto"
      >
        <ModernCard className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                style={{ backgroundColor: invoice.cartao?.cor || '#F87060' }}
              >
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-deep-blue">
                  Pagar Fatura
                </h2>
                <p className="text-sm text-slate-500">
                  {invoice.cartao?.nome} - {invoice.mes}/{invoice.ano}
                </p>
              </div>
            </div>
            <ModernButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </ModernButton>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Info da fatura */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600">Valor da Fatura</span>
                <span className="text-lg font-bold text-deep-blue">
                  {formatCurrency(invoice.valor_total)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Vencimento</span>
                <span className="text-sm font-medium text-deep-blue">
                  {new Date(invoice.data_vencimento).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Valor pago */}
              <ModernInput
                label="Valor a Pagar"
                type="number"
                step="0.01"
                min="0"
                max={invoice.valor_total.toString()}
                value={formData.valor_pago}
                onChange={(e) => handleInputChange('valor_pago', e.target.value)}
                placeholder="0,00"
                required
              />

              {/* Data do pagamento */}
              <ModernInput
                label="Data do Pagamento"
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => handleInputChange('data_pagamento', e.target.value)}
                required
              />

              {/* Conta */}
              <ModernSelect
                label="Conta para Débito"
                value={formData.conta_id}
                onChange={(value) => handleInputChange('conta_id', value)}
                options={accountOptions}
                required
                loading={accountsLoading}
                placeholder="Selecione uma conta"
              />

              {/* Categoria */}
              <ModernSelect
                label="Categoria"
                value={formData.categoria_id}
                onChange={(value) => handleInputChange('categoria_id', value)}
                options={categoryOptions}
                loading={categoriesLoading}
                placeholder="Selecione uma categoria (opcional)"
              />

              {/* Botões */}
              <div className="flex space-x-3 pt-4">
                <ModernButton
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancelar
                </ModernButton>
                <ModernButton
                  type="submit"
                  variant="primary"
                  className="flex-1 bg-coral-500 hover:bg-coral-600 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Pagar Fatura
                    </>
                  )}
                </ModernButton>
              </div>
            </form>
          </div>
        </ModernCard>
      </motion.div>
    </GlassFormContainer>
  );
} 