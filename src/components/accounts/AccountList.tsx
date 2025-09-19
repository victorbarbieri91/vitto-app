import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModernCard, ModernButton } from '../ui/modern';
import { Edit, Trash2, Calculator } from 'lucide-react';
import type { Account } from '../../services/api/AccountService';
import AdjustBalanceModal from './AdjustBalanceModal';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getBalanceColor = (balance: number) => {
  if (balance > 0) return 'text-green-500';
  if (balance < 0) return 'text-red-500';
  return 'text-slate-500';
};

// Função utilitária para padronizar o roxo
const getAccountColor = (cor?: string) => {
  if (!cor) return '#F87060';
  const roxos = ['#a259cf', '#8e44ad', '#9b59b6', '#7c3aed', '#6d28d9', '#8b5cf6', '#a78bfa'];
  if (roxos.includes(cor.toLowerCase())) return '#9A279E';
  return cor;
};

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
  onBalanceAdjusted?: () => void; // Callback para atualizar dados após ajuste
}

export default function AccountList({ accounts, onEdit, onDelete, onBalanceAdjusted }: AccountListProps) {
  const navigate = useNavigate();
  const [adjustingAccount, setAdjustingAccount] = useState<Account | null>(null);

  const handleOpenAdjustModal = (account: Account) => {
    setAdjustingAccount(account);
  };

  const handleCloseAdjustModal = () => {
    setAdjustingAccount(null);
  };

  const handleAdjustSuccess = () => {
    onBalanceAdjusted?.();
    setAdjustingAccount(null);
  };

  if (!accounts.length) return null;

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <ModernCard key={account.id} className="p-4 group hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-2 h-12 rounded-full bg-gradient-to-b from-coral-400 to-coral-600"></div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-deep-blue truncate text-base">
                  {account.nome}
                </h3>
                <p className="text-sm text-slate-500 capitalize">{account.tipo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={`text-lg font-bold ${getBalanceColor(account.saldo_atual)}`}>
                  {formatCurrency(account.saldo_atual)}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-deep-blue bg-slate-100 border border-slate-200 transition-colors hover:bg-slate-200"
                  onClick={() => navigate(`/lancamentos?conta=${account.id}`)}
                  type="button"
                >
                  Ver Lançamentos
                </button>

                <ModernButton
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8"
                  aria-label="Ajustar Saldo"
                  onClick={() => handleOpenAdjustModal(account)}
                  title="Ajustar saldo manualmente"
                >
                  <Calculator className="w-4 h-4 text-blue-500" />
                </ModernButton>

                <ModernButton
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8"
                  aria-label="Editar"
                  onClick={() => onEdit(account)}
                >
                  <Edit className="w-4 h-4 text-slate-500" />
                </ModernButton>

                <ModernButton
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8"
                  aria-label="Excluir"
                  onClick={() => onDelete(account)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </ModernButton>
              </div>
            </div>
          </div>
        </ModernCard>
      ))}

      {/* Modal de Ajuste de Saldo */}
      {adjustingAccount && (
        <AdjustBalanceModal
          account={adjustingAccount}
          isOpen={!!adjustingAccount}
          onClose={handleCloseAdjustModal}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  );
} 