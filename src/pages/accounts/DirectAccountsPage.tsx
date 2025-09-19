import { useState } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import type { Account, AccountFormData } from '../../services/api/AccountService';
import AccountForm from '../../components/forms/AccountForm';
import Button from '../../components/ui/Button';

// Função auxiliar para formatar moeda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Função auxiliar para determinar a cor do saldo
const getBalanceColor = (balance: number): string => {
  if (balance > 0) return 'text-green-600';
  if (balance < 0) return 'text-red-600';
  return 'text-gray-600';
};

export default function DirectAccountsPage() {
  const { 
    accounts, 
    accountGroups, 
    loading, 
    error, 
    addAccount, 
    updateAccount, 
    deleteAccount 
  } = useAccounts();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Handlers
  const handleOpenModal = (account?: Account) => {
    setEditingAccount(account || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleSubmit = async (data: AccountFormData) => {
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

  // Renderização
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Minhas Contas (Direct)</h1>
        <Button 
          onClick={() => handleOpenModal()} 
          variant="primary"
        >
          Nova Conta
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center my-8">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!loading && accounts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">Você ainda não possui contas cadastradas.</p>
          <Button 
            onClick={() => handleOpenModal()} 
            variant="primary"
          >
            Criar Primeira Conta
          </Button>
        </div>
      )}

      {!loading && accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <div 
              key={account.id} 
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-lg">{account.nome}</h3>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
                  {account.tipo}
                </span>
              </div>
              
              <p className={`text-xl font-bold mt-2 ${getBalanceColor(account.saldo_atual)}`}>
                {formatCurrency(account.saldo_atual)}
              </p>
              
              <div className="flex justify-end mt-4 space-x-2">
                <button 
                  onClick={() => handleOpenModal(account)}
                  className="text-primary hover:text-primary-dark text-sm font-medium"
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(account)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para adicionar/editar conta */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            
            <AccountForm
              account={editingAccount || undefined}
              accountGroups={accountGroups}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
              isSubmitting={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
