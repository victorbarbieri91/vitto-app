import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { ModernCard, ModernButton, ModernBadge } from '../ui/modern';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';
import { getCategoryIcon } from '../../utils/getCategoryIcon';

export interface InvoiceTransaction {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria?: {
    id: string;
    nome: string;
    cor: string;
    icone: string;
  };
  parcela_atual?: number;
  total_parcelas?: number;
  observacoes?: string;
}

export interface InvoiceCardProps {
  id: string;
  cartaoNome: string;
  cartaoCor?: string;
  mes: number;
  ano: number;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'aberta' | 'fechada' | 'paga';
  transacoesCount: number;
  transactions?: InvoiceTransaction[];
  onLoadTransactions?: (faturaId: string) => Promise<InvoiceTransaction[]>;
  onPayInvoice?: (faturaId: string) => void;
  onViewDetails?: (faturaId: string) => void;
}

export default function InvoiceCard({
  id,
  cartaoNome,
  cartaoCor = '#F87060',
  mes,
  ano,
  valor,
  dataVencimento,
  dataPagamento,
  status,
  transacoesCount,
  transactions: initialTransactions = [],
  onLoadTransactions,
  onPayInvoice,
  onViewDetails
}: InvoiceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [transactions, setTransactions] = useState<InvoiceTransaction[]>(initialTransactions);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const handleToggleExpand = async () => {
    if (!isExpanded && transactions.length === 0 && onLoadTransactions) {
      setIsLoadingTransactions(true);
      try {
        const loadedTransactions = await onLoadTransactions(id);
        setTransactions(loadedTransactions);
      } catch (error) {
        console.error('Erro ao carregar transações:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'paga':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'fechada':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      paga: 'success',
      fechada: 'warning',
      aberta: 'info'
    } as const;

    const labels = {
      paga: 'Paga',
      fechada: 'Fechada',
      aberta: 'Em aberto'
    };

    return (
      <ModernBadge
        variant={variants[status] || 'default'}
        size="sm"
        className="ml-2"
      >
        {labels[status]}
      </ModernBadge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatMonthYear = () => {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[mes - 1]}/${ano}`;
  };

  return (
    <ModernCard className="overflow-hidden">
      {/* Header da Fatura */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={handleToggleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Esquerda - Info do Cartão */}
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: cartaoCor }}
            >
              <CreditCard className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center">
                <h3 className="font-semibold text-deep-blue">
                  Fatura {cartaoNome}
                </h3>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {formatMonthYear()} • {transacoesCount} lançamentos
              </p>
            </div>
          </div>

          {/* Centro - Datas */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <p className="text-xs text-slate-500">Vencimento</p>
              <p className="text-sm font-medium text-deep-blue">
                {formatDate(dataVencimento)}
              </p>
            </div>
            {dataPagamento && (
              <div className="text-center">
                <p className="text-xs text-slate-500">Pagamento</p>
                <p className="text-sm font-medium text-emerald-600">
                  {formatDate(dataPagamento)}
                </p>
              </div>
            )}
          </div>

          {/* Direita - Valor e Ações */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-xs text-slate-500">Valor Total</p>
              <p className="text-xl font-bold text-deep-blue">
                {formatCurrency(valor)}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {status === 'fechada' && onPayInvoice && (
                <ModernButton
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPayInvoice(id);
                  }}
                  className="bg-coral-500 hover:bg-coral-600"
                >
                  Pagar
                </ModernButton>
              )}

              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Expansível */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-slate-200"
          >
            <div className="p-4 bg-slate-50/50">
              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Transações da Fatura
                  </p>
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/50"
                    >
                      <div className="flex items-center space-x-3">
                        {transaction.categoria && (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${transaction.categoria.cor}20` }}
                          >
                            {getCategoryIcon(transaction.categoria.icone, transaction.categoria.cor)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-deep-blue">
                            {transaction.descricao}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-slate-500">
                              {formatDate(transaction.data)}
                            </p>
                            {transaction.parcela_atual && transaction.total_parcelas && (
                              <ModernBadge variant="info" size="xs">
                                {transaction.parcela_atual}/{transaction.total_parcelas}
                              </ModernBadge>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="font-semibold text-deep-blue">
                        {formatCurrency(transaction.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma transação encontrada</p>
                </div>
              )}

              {onViewDetails && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(id)}
                    className="w-full"
                  >
                    Ver Detalhes Completos
                  </ModernButton>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModernCard>
  );
}