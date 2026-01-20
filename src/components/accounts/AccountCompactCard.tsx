import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MoreVertical,
  Edit,
  Trash2,
  Calculator,
  ExternalLink,
  Building2,
  Wallet,
  PiggyBank,
  TrendingUp
} from 'lucide-react';
import type { Account } from '../../services/api/AccountService';
import AdjustBalanceModal from './AdjustBalanceModal';
import { getAccountColor } from '../../utils/colors';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Ícones por tipo de conta
const getAccountIcon = (tipo: string) => {
  const icons = {
    corrente: Building2,
    poupanca: PiggyBank,
    investimento: TrendingUp,
    carteira: Wallet,
  };
  return icons[tipo as keyof typeof icons] || Building2;
};

// Labels amigáveis para tipo de conta
const getTypeLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    corrente: 'Conta Corrente',
    poupanca: 'Poupança',
    investimento: 'Investimento',
    carteira: 'Carteira',
  };
  return labels[tipo.toLowerCase()] || tipo;
};

interface AccountCompactCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onBalanceAdjusted?: () => void;
}

export default function AccountCompactCard({
  account,
  onEdit,
  onDelete,
  onBalanceAdjusted
}: AccountCompactCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [adjustingAccount, setAdjustingAccount] = useState<Account | null>(null);

  const IconComponent = getAccountIcon(account.tipo);
  const accountColor = getAccountColor(account.tipo, account.cor);

  const handleViewTransactions = () => {
    navigate(`/lancamentos?conta=${account.id}`);
  };

  const handleOpenAdjustModal = () => {
    setAdjustingAccount(account);
    setShowMenu(false);
  };

  const handleCloseAdjustModal = () => {
    setAdjustingAccount(null);
  };

  const handleAdjustSuccess = () => {
    onBalanceAdjusted?.();
    setAdjustingAccount(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => {
          setIsHovered(false);
          setShowMenu(false);
        }}
        className="relative group"
      >
        <div className="relative rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 bg-white">
          {/* Header com nome - fundo colorido */}
          <div
            className="px-3 py-2.5"
            style={{ backgroundColor: accountColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="p-1 rounded-md bg-white/20 flex-shrink-0">
                  <IconComponent className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className="font-semibold text-sm text-white truncate"
                    title={account.nome}
                  >
                    {account.nome}
                  </h3>
                  <p className="text-[10px] text-white/70 truncate">
                    {getTypeLabel(account.tipo)}
                  </p>
                </div>
              </div>

              {/* Menu de ações */}
              <div className="relative">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  className="p-1 rounded-md hover:bg-white/20 transition-colors"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreVertical className="w-4 h-4 text-white/80" />
                </motion.button>

                {/* Dropdown menu */}
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 top-7 z-20 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 overflow-hidden"
                  >
                    <button
                      onClick={handleViewTransactions}
                      className="w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver Extrato
                    </button>
                    <button
                      onClick={handleOpenAdjustModal}
                      className="w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Calculator className="w-3 h-3" />
                      Ajustar Saldo
                    </button>
                    <button
                      onClick={() => {
                        onEdit(account);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={() => {
                        onDelete(account);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Corpo do card - saldo */}
          <div className="px-3 py-2">
            <p
              className={`text-sm font-semibold tracking-tight ${
                account.saldo_atual >= 0 ? 'text-slate-700' : 'text-red-500'
              }`}
            >
              {formatCurrency(account.saldo_atual)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modal de Ajuste de Saldo */}
      {adjustingAccount && (
        <AdjustBalanceModal
          account={adjustingAccount}
          isOpen={!!adjustingAccount}
          onClose={handleCloseAdjustModal}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </>
  );
}
