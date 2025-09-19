import React, { useState } from 'react';
import { ModernCard } from '../ui/modern';
import { ModernButton } from '../ui/modern';
import { ModernBadge } from '../ui/modern';
import { faturaService, PayInvoiceRequest } from '../../services/api';
import { Fatura } from '../../types/supabase';

interface FaturaCardProps {
  fatura: Fatura & {
    cartao?: {
      nome: string;
      cor?: string;
      icone?: string;
    };
  };
  onPaymentSuccess?: () => void;
  onViewDetails?: (faturaId: number) => void;
  className?: string;
}

export const FaturaCard: React.FC<FaturaCardProps> = ({
  fatura,
  onPaymentSuccess,
  onViewDetails,
  className = '',
}) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'paga': return 'success';
      case 'fechada': return 'warning';
      case 'aberta': return 'neutral';
      case 'vencida': return 'error';
      case 'parcial': return 'warning';
      default: return 'neutral';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'paga': return 'Paga';
      case 'fechada': return 'Fechada';
      case 'aberta': return 'Aberta';
      case 'vencida': return 'Vencida';
      case 'parcial': return 'Pago Parcial';
      default: return status;
    }
  };

  const isOverdue = (): boolean => {
    if (fatura.status === 'paga') return false;
    const today = new Date();
    const dueDate = new Date(fatura.data_vencimento);
    return today > dueDate;
  };

  const getDaysUntilDue = (): number => {
    const today = new Date();
    const dueDate = new Date(fatura.data_vencimento);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePayment = async (contaId: number, valorPago?: number) => {
    try {
      setIsProcessingPayment(true);
      
      const request: PayInvoiceRequest = {
        faturaId: fatura.id,
        contaId: contaId,
        valorPago: valorPago,
      };

      await faturaService.payInvoice(request);
      onPaymentSuccess?.();
      setIsPaymentModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Erro ao processar pagamento');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const cardColor = fatura.cartao?.cor || '#F87060';
  const cardIcon = fatura.cartao?.icone || 'card';
  const overdue = isOverdue();
  const daysUntilDue = getDaysUntilDue();

  return (
    <ModernCard variant="default" className={`p-0 overflow-hidden ${className}`}>
      {/* Header colorido do cartão */}
      <div 
        className="h-20 p-4 text-white relative overflow-hidden"
        style={{ backgroundColor: cardColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        <div className="relative z-10 flex items-center justify-between h-full">
          <div>
            <div className="font-bold text-lg">
              {fatura.cartao?.nome || 'Cartão'}
            </div>
            <div className="text-xs opacity-90">
              {fatura.mes.toString().padStart(2, '0')}/{fatura.ano}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ion-icon name={cardIcon} size="small"></ion-icon>
            <ModernBadge 
              variant={getStatusVariant(fatura.status)} 
              size="sm"
              className="bg-white/20 text-white border-white/30"
            >
              {getStatusText(fatura.status)}
            </ModernBadge>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="p-4">
        {/* Valor e vencimento */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-slate-500 mb-1">Valor da fatura</div>
            <div className="text-2xl font-bold text-deep-blue">
              {formatCurrency(Number(fatura.valor_total))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500 mb-1">Vencimento</div>
            <div className={`text-sm font-semibold ${overdue ? 'text-red-600' : 'text-slate-700'}`}>
              {formatDate(fatura.data_vencimento)}
            </div>
            {!overdue && fatura.status !== 'paga' && (
              <div className="text-xs text-slate-500">
                {daysUntilDue > 0 ? `${daysUntilDue} dias` : 'Vence hoje'}
              </div>
            )}
            {overdue && fatura.status !== 'paga' && (
              <div className="text-xs text-red-600 font-medium">
                Vencida há {Math.abs(daysUntilDue)} dias
              </div>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="space-y-2 mb-4">
          {fatura.data_pagamento && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Data do pagamento:</span>
              <span className="font-medium text-green-600">
                {formatDate(fatura.data_pagamento)}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Status:</span>
            <ModernBadge variant={getStatusVariant(fatura.status)} size="sm">
              {getStatusText(fatura.status)}
            </ModernBadge>
          </div>
        </div>

        {/* Alertas */}
        {overdue && fatura.status !== 'paga' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <ion-icon name="warning" className="text-red-500" size="small"></ion-icon>
              <span className="text-red-700 text-sm font-medium">
                Fatura vencida! Evite juros e multas.
              </span>
            </div>
          </div>
        )}

        {daysUntilDue <= 7 && daysUntilDue > 0 && fatura.status !== 'paga' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <ion-icon name="time" className="text-yellow-600" size="small"></ion-icon>
              <span className="text-yellow-700 text-sm">
                Vence em {daysUntilDue} {daysUntilDue === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3">
          {onViewDetails && (
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(fatura.id)}
              icon="eye"
              className="flex-1"
            >
              Ver Detalhes
            </ModernButton>
          )}

          {fatura.status !== 'paga' && (
            <ModernButton
              variant={overdue ? 'error' : 'primary'}
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              icon="card"
              className="flex-1"
            >
              {overdue ? 'Pagar Agora' : 'Pagar'}
            </ModernButton>
          )}
        </div>
      </div>

      {/* Modal de pagamento simplificado */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-deep-blue">
                Confirmar Pagamento
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <ion-icon name="close" size="small"></ion-icon>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="text-sm text-slate-500 mb-1">Valor a pagar</div>
                <div className="text-xl font-bold text-deep-blue">
                  {formatCurrency(Number(fatura.valor_total))}
                </div>
              </div>

              <div className="text-sm text-slate-600">
                <p>
                  O pagamento será debitado da sua conta principal.
                  Esta ação não pode ser desfeita.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <ModernButton
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={isProcessingPayment}
                  className="flex-1"
                >
                  Cancelar
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={() => handlePayment(1)} // TODO: Implementar seleção de conta
                  isLoading={isProcessingPayment}
                  disabled={isProcessingPayment}
                  className="flex-1"
                >
                  Confirmar Pagamento
                </ModernButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModernCard>
  );
}; 
