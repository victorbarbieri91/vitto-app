import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  DollarSign, 
  CreditCard as CreditCardIcon, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MoreHorizontal 
} from 'lucide-react';
import { ModernCard, ModernButton, ModernBadge } from '../ui/modern';
import { Fatura } from '../../services/api';
import { cn } from '../../utils/cn';

interface InvoiceItemProps {
  invoice: Fatura & {
    cartao?: {
      nome: string;
      limite: number;
      cor?: string;
    };
  };
  onView?: (invoice: Fatura) => void;
  onPay?: (invoice: Fatura) => void;
  className?: string;
}

export default function InvoiceItem({
  invoice,
  onView,
  onPay,
  className
}: InvoiceItemProps) {
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paga':
        return 'success';
      case 'fechada':
        return 'warning';
      case 'aberta':
        return 'info';
      case 'parcial':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paga':
        return <CheckCircle className="w-4 h-4" />;
      case 'fechada':
        return <AlertCircle className="w-4 h-4" />;
      case 'aberta':
        return <Clock className="w-4 h-4" />;
      case 'parcial':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paga':
        return 'Paga';
      case 'fechada':
        return 'Fechada';
      case 'aberta':
        return 'Aberta';
      case 'parcial':
        return 'Parcial';
      default:
        return status;
    }
  };

  const isOverdue = () => {
    if (invoice.status === 'paga') return false;
    const today = new Date();
    const dueDate = new Date(invoice.data_vencimento);
    return dueDate < today;
  };

  const getDaysUntilDue = () => {
    const today = new Date();
    const dueDate = new Date(invoice.data_vencimento);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const cardColor = invoice.cartao?.cor || '#F87060';

  return (
    <ModernCard
      variant="default"
      padding="lg"
      hover
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-white to-slate-50',
        'border-l-4 transition-all duration-300 hover:shadow-lg',
        isOverdue() && 'border-red-500 bg-red-50',
        className
      )}
      style={{
        borderLeftColor: isOverdue() ? '#EF4444' : cardColor
      }}
    >
      {/* Header com cartão e status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: cardColor }}
          >
            <CreditCardIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-deep-blue">
              {invoice.cartao?.nome || 'Cartão'}
            </h3>
            <p className="text-sm text-slate-500">
              {invoice.mes}/{invoice.ano}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <ModernBadge 
            variant={getStatusColor(invoice.status)} 
            size="sm"
            className="flex items-center space-x-1"
          >
            {getStatusIcon(invoice.status)}
            <span>{getStatusLabel(invoice.status)}</span>
          </ModernBadge>
        </div>
      </div>

      {/* Valor da fatura */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Valor da Fatura</span>
          {isOverdue() && (
            <span className="text-xs text-red-600 font-medium">Em atraso</span>
          )}
        </div>
        <p className="text-2xl font-bold text-deep-blue">
          {formatCurrency(invoice.valor_total)}
        </p>
      </div>

      {/* Informações de data */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center space-x-2 text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Vencimento</span>
          </div>
          <p className="font-semibold text-deep-blue">
            {formatDate(invoice.data_vencimento)}
          </p>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-3">
          <div className="flex items-center space-x-2 text-slate-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">
              {invoice.status === 'paga' ? 'Pago em' : 'Status'}
            </span>
          </div>
          <p className="font-semibold text-deep-blue">
            {invoice.data_pagamento 
              ? formatDate(invoice.data_pagamento)
              : getDaysUntilDue() >= 0 
                ? `${getDaysUntilDue()} dias`
                : `${Math.abs(getDaysUntilDue())} dias atraso`
            }
          </p>
        </div>
      </div>

      {/* Alerta de vencimento */}
      {!isOverdue() && getDaysUntilDue() <= 7 && invoice.status !== 'paga' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center space-x-2 text-yellow-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Vence em {getDaysUntilDue()} {getDaysUntilDue() === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex space-x-2">
          {onView && (
            <ModernButton
              variant="outline"
              size="sm"
              onClick={() => onView(invoice)}
              className="flex-1 text-deep-blue border-deep-blue hover:bg-deep-blue hover:text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Detalhes
            </ModernButton>
          )}
          
          {onPay && invoice.status !== 'paga' && (
            <ModernButton
              variant="primary"
              size="sm"
              onClick={() => onPay(invoice)}
              className="flex-1 bg-coral-500 hover:bg-coral-600 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Pagar
            </ModernButton>
          )}

          <ModernButton
            variant="ghost"
            size="sm"
            className="px-3 text-slate-500 hover:text-deep-blue"
          >
            <MoreHorizontal className="w-4 h-4" />
          </ModernButton>
        </div>
      </div>
    </ModernCard>
  );
} 