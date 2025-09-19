import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Edit,
  Trash2,
  Calculator,
  TrendingUp,
  Building2,
  Wallet,
  PiggyBank,
  Settings,
  ExternalLink
} from 'lucide-react';
import { ModernButton } from '../ui/modern';
import type { Account } from '../../services/api/AccountService';
import AdjustBalanceModal from './AdjustBalanceModal';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// const getBalanceColor = (balance: number) => {
//   if (balance > 0) return 'text-emerald-400';
//   if (balance < 0) return 'text-red-400';
//   return 'text-slate-400';
// };

// Sistema de identidade visual para cada tipo de conta
const getBankStyle = (tipo: string) => {
  const styles = {
    corrente: {
      icon: Building2,
      name: 'Banco',
      gradient: 'from-blue-500 via-blue-600 to-indigo-700',
      accent: 'bg-blue-100',
      border: 'border-blue-200'
    },
    poupanca: {
      icon: PiggyBank,
      name: 'Poupança',
      gradient: 'from-emerald-500 via-emerald-600 to-green-700',
      accent: 'bg-emerald-100',
      border: 'border-emerald-200'
    },
    investimento: {
      icon: TrendingUp,
      name: 'Investimentos',
      gradient: 'from-purple-500 via-purple-600 to-violet-700',
      accent: 'bg-purple-100',
      border: 'border-purple-200'
    },
    carteira: {
      icon: Wallet,
      name: 'Carteira',
      gradient: 'from-amber-500 via-orange-500 to-red-600',
      accent: 'bg-amber-100',
      border: 'border-amber-200'
    }
  };

  return styles[tipo as keyof typeof styles] || styles.corrente;
};


interface AccountBankCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onBalanceAdjusted?: () => void;
}

export default function AccountBankCard({
  account,
  onEdit,
  onDelete,
  onBalanceAdjusted
}: AccountBankCardProps) {
  const navigate = useNavigate();
  const [adjustingAccount, setAdjustingAccount] = useState<Account | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const bankStyle = getBankStyle(account.tipo);
  const IconComponent = bankStyle.icon;

  const handleOpenAdjustModal = () => {
    setAdjustingAccount(account);
  };

  const handleCloseAdjustModal = () => {
    setAdjustingAccount(null);
  };

  const handleAdjustSuccess = () => {
    onBalanceAdjusted?.();
    setAdjustingAccount(null);
  };

  const handleViewTransactions = () => {
    navigate(`/lancamentos?conta=${account.id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative"
      >
        <div className={`
          relative overflow-hidden rounded-2xl
          bg-gradient-to-br ${bankStyle.gradient}
          shadow-lg hover:shadow-xl
          border border-white/10
          transition-all duration-300
          aspect-[3/2] min-h-[200px]
        `}>
          {/* Textura de fundo sutil */}
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>

          {/* Efeito de brilho */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Conteúdo do card */}
          <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">

            {/* Header - Nome da conta */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg tracking-wide">
                    {account.nome}
                  </h3>
                  <p className="text-sm text-white/70 capitalize">
                    {account.tipo.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Botão de configurações - só aparece no hover */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                className="flex items-center gap-1"
              >
                <ModernButton
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={() => onEdit(account)}
                >
                  <Settings className="w-4 h-4" />
                </ModernButton>
              </motion.div>
            </div>

            {/* Saldo principal */}
            <div className="my-4">
              <p className="text-sm text-white/70 mb-1">Saldo atual</p>
              <p className="text-3xl font-bold tracking-tight">
                {formatCurrency(account.saldo_atual)}
              </p>

              {/* Saldo inicial */}
              <div className="mt-2">
                <div className="text-xs text-white/60">
                  Saldo inicial: {formatCurrency(account.saldo_inicial)}
                </div>
              </div>
            </div>


            {/* Ações rápidas */}
            <div className="flex items-center justify-between">
              <ModernButton
                size="sm"
                variant="ghost"
                onClick={handleViewTransactions}
                className="h-8 px-3 text-white/80 hover:text-white hover:bg-white/20 text-xs"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Ver Extrato
              </ModernButton>

              <div className="flex items-center gap-1">
                <ModernButton
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={handleOpenAdjustModal}
                  title="Ajustar saldo"
                >
                  <Calculator className="w-3 h-3" />
                </ModernButton>

                <ModernButton
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
                  onClick={() => onEdit(account)}
                  title="Editar conta"
                >
                  <Edit className="w-3 h-3" />
                </ModernButton>

                <ModernButton
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white/80 hover:text-red-300 hover:bg-red-500/20"
                  onClick={() => onDelete(account)}
                  title="Excluir conta"
                >
                  <Trash2 className="w-3 h-3" />
                </ModernButton>
              </div>
            </div>
          </div>

          {/* Padrão decorativo sutil */}
          <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5">
            <IconComponent className="w-full h-full" />
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