import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ModernButton } from '../ui/modern';

interface ConfirmDeleteInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  invoiceDetails: {
    cartaoNome: string;
    mes: number;
    ano: number;
    valor: number;
  } | null;
}

const ConfirmDeleteInvoiceModal: React.FC<ConfirmDeleteInvoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  invoiceDetails
}) => {
  if (!isOpen || !invoiceDetails) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Confirmar Exclusão de Fatura
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                ⚠️ Atenção: Esta ação é irreversível!
              </p>
              <p className="text-sm text-red-700">
                Ao excluir esta fatura, <strong>todas as transações do cartão {invoiceDetails.cartaoNome}</strong> do
                mês de <strong>{getMonthName(invoiceDetails.mes)}/{invoiceDetails.ano}</strong> serão
                excluídas permanentemente.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">
                Detalhes da Fatura:
              </h4>
              <dl className="space-y-1">
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-600">Cartão:</dt>
                  <dd className="font-medium text-slate-900">{invoiceDetails.cartaoNome}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-600">Período:</dt>
                  <dd className="font-medium text-slate-900">
                    {getMonthName(invoiceDetails.mes)}/{invoiceDetails.ano}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-slate-600">Valor Total:</dt>
                  <dd className="font-medium text-red-600">
                    {formatCurrency(invoiceDetails.valor)}
                  </dd>
                </div>
              </dl>
            </div>

            <p className="text-sm text-slate-600">
              Tem certeza de que deseja continuar?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex gap-3 justify-end">
            <ModernButton
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </ModernButton>
            <ModernButton
              variant="primary"
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700 border-red-600"
            >
              Sim, excluir tudo
            </ModernButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteInvoiceModal;