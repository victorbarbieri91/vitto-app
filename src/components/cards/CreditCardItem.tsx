import React from 'react';
import { CreditCard as CreditCardIcon, Edit, Trash2 } from 'lucide-react';
import { ModernButton } from '../ui/modern';
import { CreditCardWithUsage } from '../../services/api';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

interface CreditCardItemProps {
  card: CreditCardWithUsage;
  onEdit?: (card: CreditCardWithUsage) => void;
  onDelete?: (card: CreditCardWithUsage) => void;
  onViewInvoices?: (card: CreditCardWithUsage) => void;
  className?: string;
}

export default function CreditCardItem({
  card,
  onEdit,
  onDelete,
  onViewInvoices,
  className
}: CreditCardItemProps) {
  const navigate = useNavigate();

  const getUsagePercentage = () => {
    if (card.limite <= 0) return 0;
    return Math.min((card.limite_usado / card.limite) * 100, 100);
  };

  const limiteDisponivel = Math.max(0, card.limite - card.limite_usado);
  const percentualUsado = getUsagePercentage();

  const getMonthName = (month?: number) => {
    const currentMonth = month || new Date().getMonth();
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return months[currentMonth];
  };

  const getCardGradient = (cor: string) => {
    const colorMap: { [key: string]: string } = {
      '#F87060': 'from-coral-400 via-coral-500 to-coral-600',
      '#102542': 'from-deep-blue-400 via-deep-blue-500 to-deep-blue-600',
      '#8B5CF6': 'from-purple-400 via-purple-500 to-purple-600',
      '#10B981': 'from-emerald-400 via-emerald-500 to-emerald-600',
      '#F59E0B': 'from-amber-400 via-amber-500 to-amber-600',
      '#22C55E': 'from-green-400 via-green-500 to-green-600',
      '#EC4899': 'from-pink-400 via-pink-500 to-pink-600',
      '#06B6D4': 'from-cyan-400 via-cyan-500 to-cyan-600',
      '#EF4444': 'from-red-400 via-red-500 to-red-600',
      '#000000': 'from-gray-800 via-gray-900 to-black',
      '#1F2937': 'from-gray-700 via-gray-800 to-gray-900',
    };

    return colorMap[cor] || 'from-slate-400 via-slate-500 to-slate-600';
  };

  const getCardNumber = (card: CreditCardWithUsage) => {
    if (card.ultimos_quatro_digitos) {
      return `•••• ${card.ultimos_quatro_digitos}`;
    }
    // Fallback para cartões sem dígitos salvos
    const lastFour = card.nome.toLowerCase().includes('nubank') ? '1234' :
                    card.nome.toLowerCase().includes('inter') ? '5678' :
                    card.nome.toLowerCase().includes('itau') ? '9012' : '3456';
    return `•••• ${lastFour}`;
  };

  const handleViewInvoices = () => {
    if (onViewInvoices) {
      onViewInvoices(card);
    } else {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      navigate(`/transactions?type=cartao&card_id=${card.id}&month=${currentMonth}-${currentYear}`);
    }
  };

  return (
    <button
      onClick={handleViewInvoices}
      className={cn(
        "group relative p-4 rounded-lg transition-all duration-300 text-left",
        "bg-gradient-to-br shadow-md hover:shadow-lg",
        "transform hover:-translate-y-0.5 hover:scale-[1.02]",
        "border border-transparent hover:border-white/20",
        "aspect-[2/1] w-full",
        `bg-gradient-to-br ${getCardGradient(card.cor || '#F87060')}`,
        className
      )}
    >
      {/* Card Background Effect */}
      <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg"></div>

      {/* Card Content */}
      <div className="relative z-10 text-white h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="w-4 h-4" />
            <div>
              <h3 className="font-semibold text-sm">{card.nome}</h3>
              <p className="text-white/80 text-xs">
                {getCardNumber(card)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                <Edit className="w-3 h-3" />
              </ModernButton>
            )}
            {onDelete && (
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card);
                }}
                className="text-white/80 hover:text-white hover:bg-red-500/30 h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </ModernButton>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex items-end justify-between">
          {/* Left: Fatura and Dates */}
          <div className="space-y-1">
            <div>
              <p className="text-white/80 text-[10px]">Fatura {getMonthName()}</p>
              <p className="text-white text-base font-bold">
                {formatCurrency(card.fatura_atual)}
              </p>
            </div>
            <div className="flex gap-3 text-[10px]">
              <div>
                <p className="text-white/70">Fecha</p>
                <p className="text-white font-medium">Dia {card.dia_fechamento}</p>
              </div>
              <div>
                <p className="text-white/70">Vence</p>
                <p className="text-white font-medium">Dia {card.dia_vencimento}</p>
              </div>
            </div>
          </div>

          {/* Right: Action Button */}
          <ModernButton
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewInvoices();
            }}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 text-xs px-2 py-1 h-7"
          >
            Ver Faturas
          </ModernButton>
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-lg transform rotate-12 translate-x-full hover:translate-x-[-100%] transition-transform duration-700"></div>
    </button>
  );
} 