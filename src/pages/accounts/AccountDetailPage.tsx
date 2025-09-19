import { useParams } from 'react-router-dom';
import { useAccountDetail } from '../../hooks/useAccountDetail';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Funções auxiliares (poderiam ser movidas para um arquivo de utils)
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getTransactionColor = (type: string) => {
  if (type === 'receita') return 'text-green-500';
  if (type === 'despesa') return 'text-red-500';
  return 'text-gray-500';
};

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { account, transactions, loading, error } = useAccountDetail(id);

  if (loading) {
    return <div className="text-center mt-10">Carregando detalhes da conta...</div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Erro: {error}</div>;
  }

  if (!account) {
    return <div className="text-center mt-10">Conta não encontrada.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Cabeçalho da Conta */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <h1 className="text-2xl font-bold">{account.nome}</h1>
        <p className="text-gray-500">Saldo Atual</p>
        <p className={`text-3xl font-bold ${account.saldo_atual >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
          {formatCurrency(account.saldo_atual)}
        </p>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Histórico de Transações</h2>
        {transactions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {transactions.map(tx => (
              <li key={tx.id} className="py-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {/* Ícone da categoria - placeholder */}
                    <span className="text-xl">{tx.app_categoria?.icone || '💸'}</span>
                  </div>
                  <div>
                    <p className="font-medium">{tx.descricao || tx.app_categoria?.nome || 'Transação'}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(tx.data), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <p className={`font-bold ${getTransactionColor(tx.tipo)}`}>
                  {tx.tipo === 'despesa' ? '-' : ''}{formatCurrency(tx.valor)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Nenhuma transação encontrada para esta conta.</p>
        )}
      </div>
    </div>
  );
}
