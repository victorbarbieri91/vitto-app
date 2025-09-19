import React from 'react';
import { CreditCard, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

interface CreditCard {
  id: number;
  nome: string;
  cor: string;
  limite: string;
  ultimos_quatro_digitos?: string;
}

interface CreditCardSelectorProps {
  cards: CreditCard[];
  selectedCardId: number | null;
  onCardSelect: (cardId: number) => void;
  invoiceValues?: { [cardId: number]: number };
  currentMonth: number;
  currentYear: number;
}

const CreditCardSelector: React.FC<CreditCardSelectorProps> = ({
  cards,
  selectedCardId,
  onCardSelect,
  invoiceValues = {},
  currentMonth,
  currentYear
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return months[month - 1];
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

  const getCardNumber = (card: CreditCard) => {
    if (card.ultimos_quatro_digitos) {
      return `•••• ${card.ultimos_quatro_digitos}`;
    }
    // Fallback para cartões sem dígitos salvos
    const lastFour = card.nome.toLowerCase().includes('nubank') ? '1234' :
                    card.nome.toLowerCase().includes('inter') ? '5678' :
                    card.nome.toLowerCase().includes('itau') ? '9012' : '3456';
    return `•••• ${lastFour}`;
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="text-center">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Nenhum cartão encontrado
          </h3>
          <p className="text-slate-500">
            Adicione cartões de crédito para visualizar as faturas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-deep-blue" />
        <h3 className="text-sm font-medium text-deep-blue">
          Selecione um cartão
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {cards.map((card) => {
          const isSelected = selectedCardId === card.id;
          const invoiceValue = invoiceValues[card.id] || 0;

          return (
            <button
              key={card.id}
              onClick={() => onCardSelect(card.id)}
              className={cn(
                "relative p-3 rounded-lg transition-all duration-300 text-left min-h-[120px]",
                "bg-gradient-to-br shadow-md hover:shadow-lg",
                "transform hover:-translate-y-0.5 hover:scale-105",
                "border transition-colors",
                isSelected ? "border-white ring-1 ring-coral-400 ring-opacity-60" : "border-transparent",
                `bg-gradient-to-br ${getCardGradient(card.cor)}`
              )}
            >
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg"></div>

              {/* Card Content */}
              <div className="relative z-10 text-white h-full flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="w-4 h-4" />
                  {isSelected && (
                    <div className="w-4 h-4 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>

                {/* Card Number */}
                <div className="mb-2">
                  <div className="text-sm font-mono tracking-wide opacity-90">
                    {getCardNumber(card)}
                  </div>
                </div>

                {/* Card Name */}
                <div className="mb-2">
                  <div className="text-xs font-medium truncate opacity-95">
                    {card.nome}
                  </div>
                </div>

                {/* Invoice Value */}
                <div className="mt-auto">
                  <div className="text-xs opacity-75 mb-1">
                    {getMonthName(currentMonth)}
                  </div>
                  <div className="text-sm font-bold">
                    {formatCurrency(invoiceValue)}
                  </div>
                </div>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-lg transform rotate-12 translate-x-full hover:translate-x-[-100%] transition-transform duration-700"></div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CreditCardSelector;