import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccounts } from '../../hooks/useAccounts';
import type { Account, AccountFormData } from '../../services/api/AccountService';
import AccountForm from '../../components/forms/AccountForm';
import { TransferForm } from '../../components/forms/TransferForm';
import { ModernButton } from '../../components/ui/modern';
import { ModernCard } from '../../components/ui/modern';
import AccountsDashboard from '../../components/accounts/AccountsDashboard';
import AccountBankCard from '../../components/accounts/AccountBankCard';
import { DollarSign, Edit, Plus, Trash2, Zap, Building2 } from 'lucide-react';

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
    // Recarregar dados das contas após ajuste de saldo
    // O hook useAccounts já tem um mecanismo interno de refresh
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

  const renderAccountCard = (account: Account) => (
    <ModernCard key={account.id} className="group relative p-6 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <Link to={`/contas/${account.id}`} className="block">
            <h3 className="font-semibold text-lg text-deep-blue group-hover:text-white transition-colors duration-300">{account.nome}</h3>
            <p className="text-sm text-slate-500 group-hover:text-slate-200 transition-colors duration-300 capitalize">{account.tipo}</p>
          </Link>
          <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white/20 transition-colors duration-300">
            <DollarSign className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors duration-300" />
          </div>
        </div>
        <p className={`text-3xl font-bold mt-4 ${getBalanceColor(account.saldo_atual)} group-hover:text-white transition-colors duration-300`}>
          {formatCurrency(account.saldo_atual)}
        </p>
      </div>
      <div className="absolute top-4 right-4 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ModernButton size="sm" variant="ghost" className="p-2 h-auto" onClick={(e) => { e.preventDefault(); handleOpenModal(account); }}>
          <Edit className="w-4 h-4 text-slate-500 group-hover:text-white" />
        </ModernButton>
        <ModernButton size="sm" variant="ghost" className="p-2 h-auto" onClick={(e) => { e.preventDefault(); handleDelete(account); }}>
          <Trash2 className="w-4 h-4 text-red-500 group-hover:text-white" />
        </ModernButton>
      </div>
    </ModernCard>
  );

  const renderSkeletonCard = () => (
    <ModernCard className="p-6">
      <div className="animate-pulse flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2 mt-2"></div>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
          </div>
          <div className="h-8 bg-slate-200 rounded w-1/3 mt-4"></div>
        </div>
      </div>
    </ModernCard>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8"></div>
          <div className="h-5"></div>
        </div>
        <div className="flex items-center gap-3">
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
            Adicionar Conta
          </ModernButton>
        </div>
      </div>

      <AccountsDashboard accounts={accounts} />

      {isTransferModalOpen && (
         <ModernCard variant="glass" className="fixed inset-0 z-40 flex justify-center items-center">
            <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <ModernCard className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-deep-blue">Nova Transferência</h2>
                    <TransferForm
                        onSuccess={handleTransferSuccess}
                        onCancel={() => setIsTransferModalOpen(false)}
                    />
                </ModernCard>
            </div>
         </ModernCard>
      )}

      {isModalOpen && (
         <ModernCard variant="glass" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <ModernCard className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-deep-blue">
                        {editingAccount ? 'Editar Conta' : 'Nova Conta'}
                    </h2>
                    <AccountForm
                        account={editingAccount || undefined}
                        onSubmit={handleEditSubmit}
                        onCancel={handleCloseModal}
                    />
                </ModernCard>
            </div>
         </ModernCard>
      )}

      {error && (
        <ModernCard variant="default" className="bg-red-50 border-red-200 p-4">
            <p className="text-red-700">{error}</p>
        </ModernCard>
      )}
      
      {/* Grid de Cards dos Bancos */}
      {!loading && accounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <AccountBankCard
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="aspect-[3/2] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && accounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-deep-blue mb-2">
              Bem-vindo ao seu banco digital
            </h3>
            <p className="text-slate-500 mb-8">
              Comece criando sua primeira conta para organizar suas finanças com estilo.
            </p>
            <ModernButton
              onClick={() => handleOpenModal()}
              variant="primary"
              className="bg-coral-500 hover:bg-coral-600 text-white px-8 py-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Conta
            </ModernButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}
