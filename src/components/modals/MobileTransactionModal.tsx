import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Smartphone } from 'lucide-react';
import { useTransactionSaver } from '../../hooks/useTransactionSaver';
import RevenueForm from '../forms/transaction/RevenueForm';
import ExpenseForm from '../forms/transaction/ExpenseForm';
import CreditCardExpenseForm from '../forms/transaction/CreditCardExpenseForm';

type TransactionType = 'receita' | 'despesa' | 'despesa_cartao';

interface MobileTransactionModalProps {
  isOpen: boolean;
  transactionType: TransactionType | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const transactionConfig = {
  receita: {
    title: 'Nova Receita',
    icon: TrendingUp,
    gradient: 'from-emerald-400 via-green-500 to-emerald-600',
    component: RevenueForm
  },
  despesa: {
    title: 'Nova Despesa',
    icon: TrendingDown,
    gradient: 'from-rose-400 via-red-500 to-pink-600',
    component: ExpenseForm
  },
  despesa_cartao: {
    title: 'Compra no Cartão',
    icon: Smartphone,
    gradient: 'from-blue-400 via-indigo-500 to-purple-600',
    component: CreditCardExpenseForm
  }
};

/**
 *
 */
export function MobileTransactionModal({
  isOpen,
  transactionType,
  onClose,
  onSuccess
}: MobileTransactionModalProps) {
  const { handleTransactionSaved, isSubmitting } = useTransactionSaver(
    transactionType!,
    () => {
      onSuccess?.();
      onClose();
    }
  );

  // Controlar overflow do body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fechar com ESC (opcional em mobile, mas útil para debug desktop)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!transactionType || !transactionConfig[transactionType]) {
    return null;
  }

  const config = transactionConfig[transactionType];
  const FormComponent = config.component;
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/20"
        >
          {/* Modal Container - Full Screen Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.3
            }}
            className="absolute inset-0 bg-gray-50 overflow-hidden flex flex-col"
          >
            {/* Header Fixo com Gradiente */}
            <div className={`relative px-4 py-4 bg-gradient-to-r ${config.gradient} shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-white">{config.title}</h1>
                    <p className="text-xs text-white/80">Preencha os dados abaixo</p>
                  </div>
                </div>

                {/* Botão Fechar */}
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Conteúdo Scrollável */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 pb-20">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
                  <div className="p-4">
                    <FormComponent
                      onSave={handleTransactionSaved}
                      onCancel={onClose}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MobileTransactionModal;