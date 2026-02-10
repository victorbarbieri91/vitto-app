import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Building2,
  Wallet,
  PiggyBank,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import type { Account } from '../../services/api/AccountService';
import { ModernButton } from '../ui/modern';
import AdjustBalanceModal from './AdjustBalanceModal';
import { getAccountColor } from '../../utils/colors';
import SwipeableCard from '../ui/SwipeableCard';
import type { SwipeAction } from '../ui/SwipeableCard';
import { useScreenDetection } from '../../hooks/useScreenDetection';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getAccountIcon = (tipo: string) => {
  const icons = {
    corrente: Building2,
    poupanca: PiggyBank,
    investimento: TrendingUp,
    carteira: Wallet,
  };
  return icons[tipo as keyof typeof icons] || Building2;
};

const getTypeLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    corrente: 'conta_corrente',
    poupanca: 'poupança',
    investimento: 'investimento',
    carteira: 'carteira',
  };
  return labels[tipo.toLowerCase()] || tipo;
};

interface AccountCompactCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onBalanceAdjusted?: () => void;
}

/**
 *
 */
export default function AccountCompactCard({
  account,
  onEdit,
  onDelete,
  onBalanceAdjusted
}: AccountCompactCardProps) {
  const navigate = useNavigate();
  const { size, isTouch, width } = useScreenDetection();
  const [adjustingAccount, setAdjustingAccount] = useState<Account | null>(null);

  const IconComponent = getAccountIcon(account.tipo);
  const accountColor = getAccountColor(account.tipo, account.cor, account.nome);
  const isMobileNav = size === 'mobile' || (isTouch && width <= 768);

  const handleViewTransactions = () => {
    navigate(`/lancamentos?conta=${account.id}`);
  };

  const handleAdjustSuccess = () => {
    onBalanceAdjusted?.();
    setAdjustingAccount(null);
  };

  // Swipe actions para mobile
  const rightSwipeActions: SwipeAction[] = [
    {
      icon: Edit,
      label: 'Editar',
      color: 'text-white',
      bgColor: 'bg-blue-500',
      onClick: () => onEdit(account),
    },
    {
      icon: Trash2,
      label: 'Excluir',
      color: 'text-white',
      bgColor: 'bg-red-500',
      onClick: () => onDelete(account),
    },
  ];

  const leftSwipeActions: SwipeAction[] = [
    {
      icon: ExternalLink,
      label: 'Lanc.',
      color: 'text-white',
      bgColor: 'bg-emerald-500',
      onClick: handleViewTransactions,
    },
  ];

  const cardContent = (
    <button
      onClick={handleViewTransactions}
      className="group relative p-4 rounded-xl transition-all duration-300 text-left shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-[1.02] border border-transparent hover:border-white/20 w-full"
      style={{ background: `linear-gradient(135deg, ${accountColor}dd, ${accountColor})` }}
    >
      {/* Overlay para profundidade */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/15 rounded-xl" />

      {/* Conteudo */}
      <div className="relative z-10 text-white h-full flex flex-col justify-between min-h-[120px]">
        {/* Header: icone + nome + acoes */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 rounded-md bg-white/15 flex-shrink-0">
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate" title={account.nome}>
                {account.nome}
              </h3>
              <p className="text-white/70 text-xs">{getTypeLabel(account.tipo)}</p>
            </div>
          </div>

          {/* Acoes no hover - apenas desktop */}
          {!isMobileNav && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(account);
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                <Edit className="w-3 h-3" />
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(account);
                }}
                className="text-white/80 hover:text-white hover:bg-red-500/30 h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </ModernButton>
            </div>
          )}
        </div>

        {/* Saldo */}
        <div className="mt-auto pt-3">
          <p className="text-white/60 text-[10px]">Saldo</p>
          <p className="text-white text-lg font-bold">
            {formatCurrency(account.saldo_atual)}
          </p>
        </div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500 rounded-xl" />
    </button>
  );

  return (
    <>
      {isMobileNav ? (
        <SwipeableCard
          rightActions={rightSwipeActions}
          leftActions={leftSwipeActions}
        >
          {cardContent}
        </SwipeableCard>
      ) : (
        cardContent
      )}

      {/* Modal de Ajuste de Saldo */}
      {adjustingAccount && (
        <AdjustBalanceModal
          account={adjustingAccount}
          isOpen={!!adjustingAccount}
          onClose={() => setAdjustingAccount(null)}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </>
  );
}
