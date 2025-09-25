import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Wallet } from 'lucide-react';
import { useTransactionSaver } from '../../hooks/useTransactionSaver';
import CreditCardExpenseForm from '../../components/forms/transaction/CreditCardExpenseForm';

const NewCreditCardExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { handleTransactionSaved, isSubmitting } = useTransactionSaver('despesa_cartao', () => {
    // Callback após salvar - volta para dashboard
    navigate('/dashboard');
  });

  const handleCancel = () => {
    navigate(-1); // Volta para página anterior
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header idêntico ao modal - mesmo gradiente azul */}
      <div className="relative px-6 py-3 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Compra no Cartão</h1>
          </div>

          {/* Botão X idêntico ao modal */}
          <button
            onClick={handleCancel}
            className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Container principal com mesmo padding do modal */}
      <div className="p-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6">
            {/* Reutilização exata do CreditCardExpenseForm */}
            <CreditCardExpenseForm
              onSave={handleTransactionSaved}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCreditCardExpensePage;