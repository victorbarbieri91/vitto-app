import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Smartphone } from 'lucide-react';
import { cn } from '../../utils/cn';

type TransactionType = 'receita' | 'despesa' | 'despesa_cartao';

interface TransactionTypeOption {
  id: TransactionType;
  label: string;
  icon: React.ReactNode;
  gradient: string;
}

const transactionTypes: TransactionTypeOption[] = [
  {
    id: 'receita',
    label: 'Receita',
    icon: <TrendingUp className="w-5 h-5" />,
    gradient: 'from-emerald-500 to-green-600'
  },
  {
    id: 'despesa',
    label: 'Despesa',
    icon: <TrendingDown className="w-5 h-5" />,
    gradient: 'from-red-500 to-rose-600'
  },
  {
    id: 'despesa_cartao',
    label: 'Cartão',
    icon: <Smartphone className="w-5 h-5" />,
    gradient: 'from-blue-500 to-indigo-600'
  }
];

interface NewTransactionButtonProps {
  onSelect: (type: TransactionType) => void;
  className?: string;
}

export default function NewTransactionButton({ onSelect, className }: NewTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type: TransactionType) => {
    setIsOpen(false);
    onSelect(type);
  };

  return (
    <div className={cn("relative", className)}>
      {/* FAB Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className={cn(
          "group relative flex items-center justify-center",
          "w-16 h-16 rounded-full",
          "bg-coral-500 hover:bg-coral-600",
          "text-white shadow-lg hover:shadow-xl",
          "transition-all duration-200 transform hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-coral-300 focus:ring-offset-2"
        )}
      >
        <Plus className={cn(
          "w-6 h-6 transition-transform duration-200",
          isOpen && "rotate-45"
        )} />
        
        {/* Tooltip */}
        <div className={cn(
          "absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2",
          "px-2 py-1 text-xs text-white bg-slate-900 rounded-lg whitespace-nowrap",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "pointer-events-none"
        )}>
          Novo Lançamento
        </div>
      </button>

      {/* Menu Dropdown Moderno com Fundo Escuro */}
      {isOpen && (
        <>
          {/* Overlay para fechar */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            className={cn(
              "absolute bottom-full mb-4 right-0 z-20",
              "w-48 bg-deep-blue/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-700/30",
              "p-2 animate-in slide-in-from-bottom-2 duration-300"
            )}
            onMouseLeave={() => setIsOpen(false)}
          >
            {transactionTypes.map((type, index) => (
              <button
                key={type.id}
                onClick={() => handleSelect(type.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl",
                  "hover:bg-white/10 transition-all duration-200",
                  "text-left group relative overflow-hidden",
                  "border border-transparent hover:border-white/20"
                )}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                {/* Fundo gradiente sutil */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-200",
                  `bg-gradient-to-r ${type.gradient}`
                )} />

                {/* Ícone com gradiente */}
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl",
                  `bg-gradient-to-br ${type.gradient}`,
                  "text-white shadow-lg group-hover:shadow-xl transition-shadow duration-200"
                )}>
                  {type.icon}
                </div>

                {/* Conteúdo */}
                <div className="relative flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white group-hover:text-blue-100 transition-colors duration-200">
                    {type.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}