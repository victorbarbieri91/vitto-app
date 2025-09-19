import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface Transaction {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'receita' | 'despesa';
  status: 'pendente' | 'confirmado' | 'aberta' | 'fechada' | 'paga';
  origem: string;
  tipo_especial?: string;
  tipo_registro: 'transacao' | 'fatura';
  is_fatura?: boolean;
  categoria: {
    nome: string;
    cor: string;
    icone: string;
  };
  conta_nome?: string;
  cartao_nome?: string;
}

interface MonthlyTransactionsListProps {
  transactions: Transaction[];
  loading?: boolean;
  className?: string;
}

const MonthlyTransactionsList: React.FC<MonthlyTransactionsListProps> = ({
  transactions,
  loading = false,
  className
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getTransactionIcon = (transaction: Transaction) => {
    const iconClass = "w-4 h-4";

    if (transaction.tipo_registro === 'fatura') {
      return <CreditCard className={`${iconClass} text-purple-500`} />;
    }

    switch (transaction.tipo) {
      case 'receita':
        return <TrendingUp className={`${iconClass} text-emerald-500`} />;
      case 'despesa':
        return <TrendingDown className={`${iconClass} text-red-500`} />;
      default:
        return <TrendingDown className={`${iconClass} text-slate-400`} />;
    }
  };

  const getTransactionBadge = (transaction: Transaction) => {
    const baseClass = "px-2 py-0.5 rounded-full text-xs font-medium";

    if (transaction.tipo_registro === 'fatura') {
      return <span className={`${baseClass} bg-purple-100 text-purple-700`}>Fatura</span>;
    }

    switch (transaction.tipo) {
      case 'receita':
        return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Receita</span>;
      case 'despesa':
        return <span className={`${baseClass} bg-red-100 text-red-700`}>Despesa</span>;
      default:
        return <span className={`${baseClass} bg-slate-100 text-slate-600`}>Outros</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado':
      case 'paga':
        return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case 'pendente':
      case 'aberta':
      case 'fechada':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return <Clock className="w-3 h-3 text-slate-400" />;
    }
  };

  const getStatusDisplay = (transaction: Transaction) => {
    if (transaction.is_fatura || transaction.tipo_registro === 'fatura') {
      // Para faturas: aberta/fechada/paga
      switch (transaction.status) {
        case 'aberta':
          return { text: 'Aberta', color: 'text-red-600' };
        case 'fechada':
          return { text: 'Fechada', color: 'text-yellow-600' };
        case 'paga':
          return { text: 'Paga', color: 'text-emerald-600' };
        default:
          return { text: 'Aberta', color: 'text-red-600' };
      }
    } else {
      // Para fixas e normais: pendente/efetivada
      switch (transaction.status) {
        case 'pendente':
          return { text: 'Pendente', color: 'text-yellow-600' };
        case 'confirmado':
          return { text: 'Efetivada', color: 'text-emerald-600' };
        default:
          return { text: 'Pendente', color: 'text-yellow-600' };
      }
    }
  };

  const getValueColor = (transaction: Transaction) => {
    switch (transaction.tipo) {
      case 'receita':
        return 'text-emerald-600';
      case 'despesa':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className={cn("bg-white rounded-lg border border-slate-200", className)}>
        <div className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-coral-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-slate-500">Carregando transações...</p>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className={cn("bg-white rounded-lg border border-slate-200", className)}>
        <div className="p-6 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">
            Nenhum lançamento encontrado
          </h3>
          <p className="text-slate-500">
            Não há lançamentos para este mês.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg border border-slate-200", className)}>
      <div className="px-4 py-3 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">
          Lançamentos do Mês
        </h3>
        <p className="text-sm text-slate-500">
          {transactions.length} {transactions.length === 1 ? 'lançamento' : 'lançamentos'}
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {transactions.map((transaction) => (
          <div
            key={`${transaction.tipo_registro}-${transaction.id}`}
            className="p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Ícone */}
                <div className="flex-shrink-0">
                  {getTransactionIcon(transaction)}
                </div>

                {/* Informações principais */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-900 truncate">
                      {transaction.descricao}
                    </h4>
                    {getTransactionBadge(transaction)}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>{formatDate(transaction.data)}</span>
                    <span>•</span>
                    <span>{transaction.categoria.nome}</span>
                    {transaction.conta_nome && transaction.conta_nome !== '-' && (
                      <>
                        <span>•</span>
                        <span>{transaction.conta_nome}</span>
                      </>
                    )}
                    {transaction.cartao_nome && (
                      <>
                        <span>•</span>
                        <span>{transaction.cartao_nome}</span>
                      </>
                    )}
                    {transaction.origem === 'fixo' && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600 font-medium">Fixa</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Valor e status */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className={cn("text-sm font-semibold", getValueColor(transaction))}>
                    {transaction.tipo === 'receita' ? '+' : '-'}
                    {formatCurrency(transaction.valor)}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {getStatusIcon(transaction.status)}
                    <span className={cn(
                      "text-xs",
                      getStatusDisplay(transaction).color
                    )}>
                      {getStatusDisplay(transaction).text}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicador especial para faturas */}
            {(transaction.is_fatura || transaction.tipo_registro === 'fatura') && (
              <div className="mt-2 text-xs text-purple-600 bg-purple-50 rounded px-2 py-1 inline-block">
                💳 Valor consolidado das compras do cartão
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyTransactionsList;