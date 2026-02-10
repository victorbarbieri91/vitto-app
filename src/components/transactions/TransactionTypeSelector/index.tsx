import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Plus,
} from 'lucide-react';

type TransactionType = 'receita' | 'despesa' | 'despesa_cartao';

interface TransactionTypeOption {
  type: TransactionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
}

const transactionTypes: TransactionTypeOption[] = [
  {
    type: 'receita',
    label: 'Receita',
    icon: TrendingUp,
    description: 'Registre uma entrada de dinheiro.',
    color: 'text-green-500',
    bgColor: 'hover:bg-green-50',
  },
  {
    type: 'despesa',
    label: 'Despesa',
    icon: TrendingDown,
    description: 'Registre uma saída de dinheiro.',
    color: 'text-red-500',
    bgColor: 'hover:bg-red-50',
  },
  {
    type: 'despesa_cartao',
    label: 'Despesa no Cartão',
    icon: CreditCard,
    description: 'Registre uma compra no cartão.',
    color: 'text-blue-500',
    bgColor: 'hover:bg-blue-50',
  },
];

interface TransactionTypeSelectorProps {
  onSelect: (type: TransactionType) => void;
}

const TransactionTypeSelector: React.FC<TransactionTypeSelectorProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className={`
          group relative flex items-center justify-center gap-3 px-6 py-3
          bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700
          text-white font-semibold text-sm rounded-xl
          shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02]
          focus:outline-none focus:ring-2 focus:ring-coral-300 focus:ring-offset-2
          ${isOpen ? 'ring-2 ring-coral-300 ring-offset-2' : ''}
        `}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          <Plus className="w-5 h-5" />
        </motion.div>
        <span>Novo Lançamento</span>

        {/* Subtle active indicator */}
        {isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"
          />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay para fechar */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu dropdown moderno */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute right-0 mt-3 w-72 origin-top-right z-20"
            >
              <div className="bg-deep-blue/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-700/30 overflow-hidden">
                <div className="p-3">
                  {transactionTypes.map((item, index) => (
                    <motion.button
                      key={item.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      onClick={() => {
                        onSelect(item.type);
                        setIsOpen(false);
                      }}
                      className="w-full text-left flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-white/10 group border border-transparent hover:border-white/20"
                    >
                      {/* Ícone com gradiente */}
                      <div className={`
                        relative flex items-center justify-center w-12 h-12 rounded-xl
                        ${item.type === 'receita' ? 'bg-gradient-to-br from-emerald-500 to-green-600' : ''}
                        ${item.type === 'despesa' ? 'bg-gradient-to-br from-red-500 to-rose-600' : ''}
                        ${item.type === 'despesa_cartao' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : ''}
                        text-white shadow-lg group-hover:shadow-xl transition-shadow duration-200
                      `}>
                        <item.icon className="w-6 h-6" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white group-hover:text-blue-100 transition-colors duration-200">
                          {item.label}
                        </p>
                        <p className="text-sm text-blue-200 group-hover:text-blue-100 transition-colors duration-200">
                          {item.description}
                        </p>
                      </div>

                      {/* Indicador de hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionTypeSelector; 