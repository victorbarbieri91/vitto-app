import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard } from 'lucide-react';
import CurrencyInput from '../ui/CurrencyInput';
import { ModernButton } from '../ui/modern';
import { Fatura } from '../../services/api';
import { useAccounts } from '../../hooks/useAccounts';
import { automationService, InvoicePaymentRequest } from '../../services/api/AutomationService';
import { toast } from 'react-hot-toast';

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

  const [valorPago, setValorPago] = useState<number | undefined>(undefined);
  const [dataPagamento, setDataPagamento] = useState('');
  const [contaId, setContaId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setValorPago(invoice.valor_total);
      setDataPagamento(new Date().toISOString().split('T')[0]);
      setContaId('');
      setIsSubmitting(false);
    }
  }, [isOpen, invoice]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleSubmit = async () => {
    if (!valorPago || valorPago <= 0 || !contaId) {
      toast.error('Preencha o valor e selecione a conta');
      return;
    }

    if (valorPago > invoice.valor_total) {
      toast.error('Valor não pode ser maior que a fatura');
      return;
    }

    try {
      setIsSubmitting(true);

      const paymentRequest: InvoicePaymentRequest = {
        fatura_id: String(invoice.id),
        valor_pago: valorPago,
        data_pagamento: dataPagamento,
        conta_id: String(contaId),
      };

      const result = await automationService.payInvoice(paymentRequest);

      if (result.success) {
        toast.success('Fatura paga com sucesso!');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Erro ao processar pagamento');
      }
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      toast.error('Erro ao processar pagamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-400 to-purple-600 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-white" />
                  <h2 className="text-sm font-semibold text-white">
                    Pagar Fatura
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-0.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Invoice info */}
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-xs font-medium text-slate-800">
                  {invoice.cartao?.nome || 'Cartão'} - {invoice.mes}/{invoice.ano}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-slate-500">
                    Valor: <span className="font-semibold text-slate-700">{formatCurrency(invoice.valor_total)}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Venc: <span className="font-medium text-slate-700">{formatDate(invoice.data_vencimento)}</span>
                  </p>
                </div>
              </div>

              {/* Valor a pagar */}
              <CurrencyInput
                label="Valor a pagar"
                value={valorPago}
                onChange={(v) => setValorPago(v)}
                required
              />

              {/* Data do pagamento */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Data do pagamento
                </label>
                <input
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-coral-500 focus:ring-coral-500/20 transition-all duration-200"
                />
              </div>

              {/* Conta para debito */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Conta para débito
                </label>
                <select
                  value={contaId}
                  onChange={(e) => setContaId(e.target.value)}
                  disabled={accountsLoading}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-coral-500 focus:ring-coral-500/20 transition-all duration-200"
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.nome}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <ModernButton
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancelar
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  disabled={!valorPago || valorPago <= 0 || !contaId || isSubmitting}
                  className="flex-1"
                >
                  Pagar
                </ModernButton>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
