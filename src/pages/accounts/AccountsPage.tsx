import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccounts } from '../../hooks/useAccounts';
import type { Account, AccountFormData } from '../../services/api/AccountService';
import AccountForm from '../../components/forms/AccountForm';
import { TransferModal } from '../../components/modals/TransferModal';
import { ModernButton, ModernCard } from '../../components/ui/modern';
import AccountCompactCard from '../../components/accounts/AccountCompactCard';
import { Plus, Building2, TrendingUp, Landmark, ArrowLeftRight } from 'lucide-react';

/**
 *
 */
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

  const stats = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return { highestBalanceAccount: null, accountCount: 0 };
    }
    const sorted = [...accounts].sort((a, b) => b.saldo_atual - a.saldo_atual);
    return {
      highestBalanceAccount: sorted[0],
      accountCount: accounts.length,
    };
  }, [accounts]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
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

      {/* Header com Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Maior Saldo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg hidden md:flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-white/80 text-sm">Maior Saldo</span>
          </div>
          {stats.highestBalanceAccount ? (
            <div>
              <p className="text-xl font-bold">{formatCurrency(stats.highestBalanceAccount.saldo_atual)}</p>
              <p className="text-xs text-white/50 mt-1">{stats.highestBalanceAccount.nome}</p>
            </div>
          ) : (
            <p className="text-xl font-bold text-white/50">--</p>
          )}
        </motion.div>

        {/* Quantidade de Contas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg hidden md:flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-white/80 text-sm">Contas Ativas</span>
          </div>
          <div>
            <p className="text-xl font-bold">{stats.accountCount}</p>
            <p className="text-xs text-white/70 mt-1">
              {stats.accountCount === 1 ? 'conta cadastrada' : 'contas cadastradas'}
            </p>
          </div>
        </motion.div>

        {/* Botão Transferir */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => setIsTransferModalOpen(true)}
          className="bg-slate-50 hover:bg-slate-100 rounded-xl p-5 border-2 border-dashed border-slate-200 hover:border-teal-300 transition-all group flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 bg-teal-100 group-hover:bg-teal-200 rounded-lg flex items-center justify-center transition-colors">
            <ArrowLeftRight className="w-5 h-5 text-teal-600" />
          </div>
          <span className="text-sm font-medium text-slate-600 group-hover:text-teal-600 transition-colors">
            Transferir
          </span>
        </motion.button>

        {/* Botão Nova Conta */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => handleOpenModal()}
          className="bg-slate-50 hover:bg-slate-100 rounded-xl p-5 border-2 border-dashed border-slate-200 hover:border-slate-400 transition-all group flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 bg-slate-200 group-hover:bg-slate-300 rounded-lg flex items-center justify-center transition-colors">
            <Plus className="w-5 h-5 text-slate-600" />
          </div>
          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
            Nova Conta
          </span>
        </motion.button>
      </div>

      {/* Grid de Contas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Minhas Contas</h2>
          <span className="text-sm text-slate-500">
            {accounts.length} {accounts.length === 1 ? 'conta' : 'contas'}
          </span>
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
  );
}
