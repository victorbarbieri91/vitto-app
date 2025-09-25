import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownLeft, Wallet, Sparkles, Zap } from 'lucide-react';
import { useIsMobile } from '../../../hooks/useIsMobile';

type TransactionModalType = 'receita' | 'despesa' | 'despesa_cartao';

interface ModalConfig {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  accent: string;
}

const modalConfigs: Record<TransactionModalType, ModalConfig> = {
  receita: {
    title: 'Nova Receita',
    icon: ArrowUpRight,
    gradient: 'from-emerald-400 via-green-500 to-emerald-600',
    accent: 'emerald',
  },
  despesa: {
    title: 'Nova Despesa',
    icon: ArrowDownLeft,
    gradient: 'from-rose-400 via-red-500 to-pink-600',
    accent: 'red',
  },
  despesa_cartao: {
    title: 'Compra no Cartão',
    icon: Wallet,
    gradient: 'from-blue-400 via-indigo-500 to-purple-600',
    accent: 'blue',
  },
};

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionModalType;
  children: React.ReactNode;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  type,
  children,
}) => {
  const config = modalConfigs[type];
  const isMobile = useIsMobile();
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Detectar quando um input está focado
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      // Pequeno delay para evitar flicker
      setTimeout(() => {
        const activeElement = document.activeElement;
        if (!(activeElement instanceof HTMLInputElement) && !(activeElement instanceof HTMLTextAreaElement)) {
          setIsInputFocused(false);
        }
      }, 100);
    };

    if (isOpen && isMobile) {
      document.addEventListener('focusin', handleFocusIn);
      document.addEventListener('focusout', handleFocusOut);
    }

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isOpen, isMobile]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={isMobile ? false : { opacity: 0 }}
          animate={isMobile ? false : { opacity: 1 }}
          exit={isMobile ? false : { opacity: 0 }}
          className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${isMobile && isInputFocused ? 'pointer-events-none' : ''}`}
          onClick={isMobile && isInputFocused ? undefined : onClose}
          onTouchStart={(e) => {
            if (isMobile && isInputFocused) {
              e.stopPropagation();
            }
          }}
        >
          <motion.div
            initial={isMobile ? false : { scale: 0.95, opacity: 0, y: 20 }}
            animate={isMobile ? false : { scale: 1, opacity: 1, y: 0 }}
            exit={isMobile ? false : { scale: 0.95, opacity: 0, y: 20 }}
            transition={isMobile ? undefined : { type: 'spring', stiffness: 400, damping: 25 }}
            className={`relative w-full max-w-4xl max-h-[95vh] overflow-hidden ${isMobile ? 'will-change-auto' : ''} ${isMobile && isInputFocused ? 'pointer-events-auto' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Container principal com glassmorphism */}
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              {/* Header minimalista */}
              <div className={`relative px-6 py-3 bg-gradient-to-r ${config.gradient}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{config.title}</h2>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Conteúdo com scroll quando necessário */}
              <div className="p-6 max-h-[calc(95vh-120px)] overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 