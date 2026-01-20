import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccounts } from '../../hooks/useAccounts';
import type { Account, AccountFormData } from '../../services/api/AccountService';
import AccountForm from '../../components/forms/AccountForm';
import { TransferModal } from '../../components/modals/TransferModal';
import { ModernButton, ModernCard } from '../../components/ui/modern';
import AccountsDashboard from '../../components/accounts/AccountsDashboard';
import AccountCompactCard from '../../components/accounts/AccountCompactCard';
import { Plus, Building2, ArrowLeftRight } from 'lucide-react';

export default function AccountsPage() {
  const {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount
  } = useAccounts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleOpenModal = (account?: Account) => {
    setEditingAccount(account || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleTransferSuccess = () => {
    setIsTransferModalOpen(false);
  };

  const handleBalanceAdjusted = () => {
    window.location.reload();
  };

  const handleEditSubmit = async (data: AccountFormData) => {
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, data);
      } else {
        await addAccount(data);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao salvar conta:', err);
    }
  };

  const handleDelete = async (account: Account) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta ${account.nome}?`)) {
      await deleteAccount(account.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header com botões */}
      <div className="flex justify-end items-center gap-2">
        <ModernButton
          onClick={() => setIsTransferModalOpen(true)}
          variant="secondary"
          size="sm"
        >
          Transferir
        </ModernButton>
        <ModernButton
          onClick={() => handleOpenModal()}
          variant="primary"
          size="sm"
        >
          Nova Conta
        </ModernButton>
      </div>

      {/* Modal de Transferência */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={handleTransferSuccess}
      />

      {/* Modal de Criar/Editar Conta */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleCloseModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <ModernCard className="p-6">
              <h2 className="text-lg font-bold mb-4 text-deep-blue">
                {editingAccount ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              <AccountForm
                account={editingAccount || undefined}
                onSubmit={handleEditSubmit}
                onCancel={handleCloseModal}
              />
            </ModernCard>
          </motion.div>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Layout Principal: KPIs à esquerda, Contas à direita */}
      <div className="flex gap-6 lg:gap-8">
        {/* Coluna Esquerda - KPIs */}
        <div className="w-48 flex-shrink-0 hidden lg:block">
          <AccountsDashboard accounts={accounts} />
        </div>

        {/* Coluna Direita - Grid de Contas */}
        <div className="flex-1 min-w-0">
          {/* KPIs em mobile/tablet - horizontal no topo */}
          <div className="lg:hidden mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 uppercase">Saldo Total</p>
                <p className="text-lg font-bold text-white">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(
                    accounts.reduce((sum, acc) => sum + acc.saldo_atual, 0)
                  )}
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase">Contas</p>
                <p className="text-lg font-bold text-slate-700">{accounts.length}</p>
              </div>
            </div>
          </div>

          {/* Grid de Cards */}
          {!loading && accounts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3"
            >
              {accounts.map((account, index) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <AccountCompactCard
                    account={account}
                    onEdit={handleOpenModal}
                    onDelete={handleDelete}
                    onBalanceAdjusted={handleBalanceAdjusted}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && accounts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-deep-blue mb-2">
                  Nenhuma conta cadastrada
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Adicione sua primeira conta para começar a organizar suas finanças.
                </p>
                <ModernButton
                  onClick={() => handleOpenModal()}
                  variant="primary"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Criar Primeira Conta
                </ModernButton>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
