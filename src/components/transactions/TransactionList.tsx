import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ModernCard, ModernButton, ModernInput } from '../ui/modern';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../store/AuthContext';
import { transactionService, TransactionFilters } from '../../services/api';
import { fixedTransactionService } from '../../services/api/FixedTransactionService';
// A view retorna uma estrutura diferente, então vamos usar um tipo mais flexível por enquanto.
// O ideal seria gerar os tipos para a view, mas isso resolve o problema imediato.
type Transaction = any;
import {
  Search,
  Filter,
  Calendar,
  Wallet,
  Tag,
  Edit3,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Download,
  Settings,
  CreditCard,
  DollarSign,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export interface TransactionListRef {
  fetchTransactions: () => void;
}

interface TransactionListProps {
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: number) => void;
  onConfirmFixedTransaction?: (fixedTransactionId: number, targetDate: string) => void;
  onPartialFixedTransaction?: (fixedTransactionId: number, targetDate: string) => void;
  onUndoFixedTransaction?: (transactionId: number) => void;
  onDeleteInvoice?: (invoiceId: number) => void;
  className?: string;
  showFilters?: boolean;
  defaultFilters?: Partial<TransactionFilters>;
  includeVirtualFixed?: boolean;
  excludeCardTransactions?: boolean;
  preloadedTransactions?: Transaction[];
}

interface ExtendedFilters extends TransactionFilters {
  searchText?: string;
  exclude_fatura_records?: boolean;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100, 200];
const DEFAULT_ITEMS_PER_PAGE = 10;

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const TransactionList = forwardRef<TransactionListRef, TransactionListProps>(({
  onEditTransaction,
  onDeleteTransaction,
  onConfirmFixedTransaction,
  onPartialFixedTransaction,
  onUndoFixedTransaction,
  onDeleteInvoice,
  className,
  showFilters = true,
  defaultFilters = {},
  includeVirtualFixed = false,
  excludeCardTransactions = false,
  preloadedTransactions = null
}, ref) => {
  const { user } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const [filters, setFilters] = useState<ExtendedFilters>({
    ...defaultFilters,
    searchText: '',
  });

  const [tempFilters, setTempFilters] = useState<ExtendedFilters>(filters);
  const [searchInput, setSearchInput] = useState('');

  // Debounce da busca para otimizar performance
  const debouncedSearch = useDebounce(searchInput, 300);

  // Atualizar filtros quando busca debounced mudar
  useEffect(() => {
    setFilters(prev => ({ ...prev, searchText: debouncedSearch }));
    setCurrentPage(1);
  }, [debouncedSearch]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      // Se há dados pré-carregados, usar eles ao invés de buscar do banco
      if (preloadedTransactions) {
        console.log('🔄 Usando dados pré-carregados:', preloadedTransactions);
        let data = [...preloadedTransactions];

        // Aplicar filtro de exclusão de transações de cartão se necessário
        if (excludeCardTransactions) {
          data = data.filter(t => t.tipo !== 'despesa_cartao');
        }

        // Aplicar filtro de exclusão de registros de fatura consolidada se necessário
        if (filters.exclude_fatura_records) {
          console.log('🔍 [Preloaded] Filtering out fatura records. Data before filter:', data.length);

          data = data.filter(t => {
            const shouldExclude = (
              t.is_fatura === true ||
              t.tipo_registro === 'fatura' ||
                            t.fatura_details?.tipo === 'fatura' ||
              t.tipo_especial === 'fatura' ||
              // Additional checks for consolidated invoice records
              (t.descricao?.match(/Fatura.*\(\d{2}\/\d{2}\)/i)) ||
              (t.tipo === 'despesa' && t.descricao?.toLowerCase()?.includes('nubank') && t.descricao?.match(/\(\d{2}\/\d{2}\)/))
            );

            if (shouldExclude) {
              console.log('🚫 [Preloaded] Excluding transaction:', {
                descricao: t.descricao,
                tipo: t.tipo,
                tipo_especial: t.tipo_especial,
                is_fatura: t.is_fatura,
                tipo_registro: t.tipo_registro,
                fatura_details: t.fatura_details
              });
            }

            return !shouldExclude;
          });

          console.log('🔍 [Preloaded] Data after fatura filter:', data.length);
        }

        setTransactions(data);
        setLoading(false);
        return;
      }

      const { searchText, ...apiFilters } = filters;

      let data;
      if (includeVirtualFixed) {
        // ✅ USAR NOVA LÓGICA HÍBRIDA
        console.log('🔄 Usando nova lógica híbrida de transações');

        // Se tem filtros de data específicos, usar função híbrida por mês
        if (apiFilters.startDate && apiFilters.endDate) {
          const startDate = new Date(apiFilters.startDate);
          const endDate = new Date(apiFilters.endDate);

          // Buscar dados híbridos para cada mês no período
          const allTransactions = [];
          let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

          while (currentDate <= endDate) {
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();

            console.log(`🔄 Buscando dados híbridos para ${month}/${year}`);
            const monthlyData = await fixedTransactionService.getHybridTransactionsForMonth(month, year);

            // Filtrar por data se necessário
            const filteredData = monthlyData.filter(t => {
              const transactionDate = new Date(t.data);
              return transactionDate >= startDate && transactionDate <= endDate;
            });

            allTransactions.push(...filteredData);

            // Próximo mês
            currentDate.setMonth(currentDate.getMonth() + 1);
          }

          data = allTransactions;
        } else {
          // Sem filtro de data, usar mês atual
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();

          console.log(`🔄 Buscando dados híbridos para mês atual: ${currentMonth}/${currentYear}`);
          data = await fixedTransactionService.getHybridTransactionsForMonth(currentMonth, currentYear);
        }

        // Aplicar filtro de exclusão de registros de fatura consolidada se necessário
        if (filters.exclude_fatura_records) {
          console.log('🔍 [Hybrid] Filtering out fatura records. Data before filter:', data.length);

          data = data.filter(t => {
            const shouldExclude = (
              t.is_fatura === true ||
              t.tipo_registro === 'fatura' ||
                            t.fatura_details?.tipo === 'fatura' ||
              t.tipo_especial === 'fatura' ||
              // Additional checks for consolidated invoice records
              (t.descricao?.match(/Fatura.*\(\d{2}\/\d{2}\)/i)) ||
              (t.tipo === 'despesa' && t.descricao?.toLowerCase()?.includes('nubank') && t.descricao?.match(/\(\d{2}\/\d{2}\)/))
            );

            if (shouldExclude) {
              console.log('🚫 [Hybrid] Excluding transaction:', {
                descricao: t.descricao,
                tipo: t.tipo,
                tipo_especial: t.tipo_especial,
                is_fatura: t.is_fatura,
                tipo_registro: t.tipo_registro,
                fatura_details: t.fatura_details
              });
            }

            return !shouldExclude;
          });

          console.log('🔍 [Hybrid] Data after fatura filter:', data.length);
        }

        console.log(`✅ Transações híbridas encontradas: ${data.length}`);
      } else {
        // Usar a função padrão que usa a view unificada
        data = await transactionService.fetchTransactions(apiFilters);
      }

      // Aplicar filtro de exclusão de registros de fatura consolidada se necessário
      if (filters.exclude_fatura_records) {
        console.log('🔍 Filtering out fatura records. Data before filter:', data.length);
        console.log('🔍 Sample transactions before filter:', data.slice(0, 3));

        data = data.filter(t => {
          const shouldExclude = (
            t.is_fatura === true ||
            t.tipo_registro === 'fatura' ||
            t.fatura_details?.tipo === 'fatura' ||
            t.tipo_especial === 'fatura' ||
            // Additional checks for consolidated invoice records with specific patterns
            (t.descricao?.match(/Fatura.*\(\d{2}\/\d{2}\)/i)) ||
            (t.tipo === 'despesa' && t.descricao?.toLowerCase()?.includes('nubank') && t.descricao?.match(/\(\d{2}\/\d{2}\)/))
            // Removed generic 'fatura' check to allow "Total da fatura de setembro" type transactions
          );

          if (shouldExclude) {
            console.log('🚫 [Main] Excluding transaction:', {
              descricao: t.descricao,
              tipo: t.tipo,
              tipo_especial: t.tipo_especial,
              is_fatura: t.is_fatura,
              tipo_registro: t.tipo_registro,
              fatura_details: t.fatura_details
            });
          }

          return !shouldExclude;
        });

        console.log('🔍 Data after fatura filter:', data.length);
      }

      setTransactions(data);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  }, [user, filters, includeVirtualFixed, preloadedTransactions, excludeCardTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Update filters when defaultFilters change
  useEffect(() => {
    setFilters(prev => ({
      ...defaultFilters,
      searchText: prev.searchText,
    }));
    setTempFilters(prev => ({
      ...defaultFilters,
      searchText: prev.searchText,
    }));
  }, [defaultFilters]);

  // Expor a função de refetch para o componente pai
  useImperativeHandle(ref, () => ({
    fetchTransactions,
  }));

  // Filtrar por texto localmente, agora usando os campos da view
  const filteredTransactions = useMemo(() => {
    if (!filters.searchText) return transactions;
    
    const searchLower = filters.searchText.toLowerCase();
    return transactions.filter((transaction: Transaction) => 
      (transaction.descricao || '').toLowerCase().includes(searchLower) ||
      (transaction.categoria_nome || '').toLowerCase().includes(searchLower) ||
      (transaction.conta_nome || '').toLowerCase().includes(searchLower)
    );
  }, [transactions, filters.searchText]);

  // Paginação otimizada
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const handleFilterChange = useCallback((field: keyof ExtendedFilters, value: string) => {
    setTempFilters(prev => ({ ...prev, [field]: value || undefined }));
  }, []);

  const applyFilters = useCallback(() => {
    setFilters(tempFilters);
    setCurrentPage(1);
    setShowFiltersPanel(false);
  }, [tempFilters]);

  const clearFilters = useCallback(() => {
    const cleared = { ...defaultFilters, searchText: '' };
    setTempFilters(cleared);
    setFilters(cleared);
    setSearchInput('');
    setCurrentPage(1);
    setShowFiltersPanel(false);
  }, [defaultFilters]);

  // Ícones otimizados (memoizados)
  const getTransactionIcon = useCallback((tipo: string) => {
    const iconClass = "w-3.5 h-3.5";
    switch (tipo) {
      case 'receita':
        return <ArrowDownLeft className={`${iconClass} text-emerald-500`} />;
      case 'despesa':
        return <ArrowUpRight className={`${iconClass} text-red-500`} />;
      case 'despesa_cartao':
        return <CreditCard className={`${iconClass} text-purple-500`} />;
      case 'transferencia':
        return <ArrowLeftRight className={`${iconClass} text-blue-500`} />;
      default:
        return <ArrowUpRight className={`${iconClass} text-slate-400`} />;
    }
  }, []);

  // Labels para tipos de transação
  const getTransactionTypeLabel = useCallback((tipo: string) => {
    switch (tipo) {
      case 'receita':
        return 'Receita';
      case 'despesa':
        return 'Despesa';
      case 'despesa_cartao':
        return 'Cartão';
      case 'transferencia':
        return 'Transferência';
      default:
        return 'Outros';
    }
  }, []);

  // Badge para tipo de transação
  const getTransactionTypeBadge = useCallback((tipo: string) => {
    const baseClass = "px-2 py-0.5 rounded-full text-xs font-medium";
    switch (tipo) {
      case 'receita':
        return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Receita</span>;
      case 'despesa':
        return <span className={`${baseClass} bg-red-100 text-red-700`}>Despesa</span>;
      case 'despesa_cartao':
        return <span className={`${baseClass} bg-purple-100 text-purple-700`}>Cartão</span>;
      case 'transferencia':
        return <span className={`${baseClass} bg-blue-100 text-blue-700`}>Transferência</span>;
      default:
        return <span className={`${baseClass} bg-slate-100 text-slate-600`}>Outros</span>;
    }
  }, []);

  const getStatusBadge = useCallback((status: string, transaction?: Transaction) => {
    const baseClass = "px-2 py-0.5 rounded-full text-xs font-medium";

    // Verificar se é fatura
    if (transaction?.is_fatura || transaction?.tipo_registro === 'fatura') {
      switch (status) {
        case 'aberta':
          return <span className={`${baseClass} bg-red-100 text-red-700`}>Aberta</span>;
        case 'fechada':
          return <span className={`${baseClass} bg-yellow-100 text-yellow-700`}>Fechada</span>;
        case 'paga':
          return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Paga</span>;
        default:
          return <span className={`${baseClass} bg-red-100 text-red-700`}>Aberta</span>;
      }
    }

    // Para transações normais e fixas
    switch (status) {
      case 'efetivado':
      case 'concluido':
      case 'confirmado':
        return <span className={`${baseClass} bg-emerald-100 text-emerald-700`}>Efetivada</span>;
      case 'pendente':
        return <span className={`${baseClass} bg-yellow-100 text-yellow-700`}>Pendente</span>;
      case 'cancelado':
        return <span className={`${baseClass} bg-red-100 text-red-700`}>Cancelado</span>;
      case 'ativo':
        return <span className={`${baseClass} bg-blue-100 text-blue-700`}>Ativo</span>;
      case 'inativo':
        return <span className={`${baseClass} bg-gray-100 text-gray-700`}>Inativo</span>;
      default:
        return <span className={`${baseClass} bg-slate-100 text-slate-600`}>-</span>;
    }
  }, []);

  const getRecurrenceBadge = useCallback((tipoRecorrencia: 'unica' | 'fixa' | 'parcelada') => {
    const baseClass = "px-2 py-0.5 rounded-full text-xs font-medium";
    switch (tipoRecorrencia) {
      case 'unica':
        return <span className={`${baseClass} bg-slate-100 text-slate-700`}>Única</span>;
      case 'fixa':
        return <span className={`${baseClass} bg-purple-100 text-purple-700`}>Fixa</span>;
      case 'parcelada':
        return <span className={`${baseClass} bg-orange-100 text-orange-700`}>Parcelada</span>;
      default:
        return <span className={`${baseClass} bg-slate-100 text-slate-600`}>-</span>;
    }
  }, []);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }, []);

  const getAccountName = useCallback((transaction: Transaction) => {
    // Usar os novos campos da função SQL atualizada
    return transaction.conta_nome || transaction.cartao_nome || '-';
  }, []);

  const getCategoryName = useCallback((transaction: Transaction) => {
    // Usar os novos campos da função SQL atualizada
    return transaction.categoria_nome || '-';
  }, []);

  // Verificar se uma transação fixa confirmada pode ser desfeita
  const canUndoFixedTransaction = useCallback((transaction: Transaction) => {
    // Verificar se é uma transação fixa confirmada
    if (transaction.origem !== 'fixo' || transaction.status !== 'confirmado' || !transaction.fixo_id) {
      return false;
    }

    // Verificar se não é muito antiga (máximo 30 dias)
    const transactionDate = new Date(transaction.data);
    const daysDiff = Math.floor((Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysDiff <= 30;
  }, []);

  // Navegação otimizada
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  }, [totalPages]);

  const changeItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header com controles em linha única otimizada */}
      {showFilters && (
        <ModernCard variant="default" className="p-4">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Busca à esquerda */}
            <div className="justify-self-start">
              <div className="relative w-80">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Descrição, categoria ou conta"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-9 pl-10 pr-4 text-sm rounded-lg border border-slate-200 bg-white
                            placeholder:text-slate-400
                            focus:outline-none focus:ring-2 focus:ring-deep-blue focus:border-transparent
                            hover:border-slate-300 transition-colors"
                  autoComplete="off"
                  name="search-transactions"
                />
              </div>
            </div>

            {/* Contador centralizado */}
            <div className="justify-self-center">
              <p className="text-sm text-slate-600">
                <span className="font-medium">{filteredTransactions.length}</span> transações
                {filters.searchText && <span className="text-slate-400"> • filtradas</span>}
              </p>
            </div>

            {/* Botões à direita */}
            <div className="justify-self-end flex items-center gap-2">
              <ModernButton
                variant="outline"
                size="sm"
                onClick={fetchTransactions}
                disabled={loading}
                className="text-slate-600 border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </ModernButton>

              <ModernButton
                variant="primary"
                size="sm"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className="bg-deep-blue hover:bg-deep-blue/90 text-white border-deep-blue"
              >
                Filtros
              </ModernButton>
            </div>
          </div>
        </ModernCard>
      )}

      {/* Painel de Filtros Compacto */}
      {showFilters && showFiltersPanel && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Data Inicial</label>
                <input
                  type="date"
                  value={tempFilters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-slate-200 focus:border-coral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Data Final</label>
                <input
                  type="date"
                  value={tempFilters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-slate-200 focus:border-coral-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Tipo</label>
                <select
                  value={tempFilters.tipo || ''}
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-slate-200 focus:border-coral-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                  <option value="despesa_cartao">Despesa no Cartão</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Conta</label>
                <select
                  value={tempFilters.conta_id || ''}
                  onChange={(e) => handleFilterChange('conta_id', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-slate-200 focus:border-coral-500 focus:outline-none"
                  disabled={accountsLoading}
                >
                  <option value="">Todas</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Categoria</label>
                <select
                  value={tempFilters.categoria_id || ''}
                  onChange={(e) => handleFilterChange('categoria_id', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-slate-200 focus:border-coral-500 focus:outline-none"
                  disabled={categoriesLoading}
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1 block">Status</label>
                <select
                  value={tempFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm rounded border border-slate-200 focus:border-coral-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="efetivado">Efetivado</option>
                  <option value="pendente">Pendente</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200">
              <ModernButton
                variant="primary"
                size="sm"
                onClick={applyFilters}
              >
                Aplicar
              </ModernButton>
              <ModernButton
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Limpar
              </ModernButton>
            </div>
          </div>
      )}

      {/* Lista de Transações - Formato Tabela Compacta */}
      <ModernCard variant="default" className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-coral-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-500">Carregando transações...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <XCircle className="w-6 h-6 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-3">{error}</p>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={fetchTransactions}
            >
              Tentar Novamente
            </ModernButton>
          </div>
        ) : paginatedTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="w-6 h-6 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">Nenhuma transação encontrada</p>
            <p className="text-slate-400 text-sm mt-1">
              Tente ajustar os filtros ou adicionar novas transações
            </p>
          </div>
        ) : (
          <>
            {/* Header da Tabela */}
            <div className="bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                <div className="col-span-1">Tipo</div>
                <div className="col-span-2">Descrição</div>
                <div className="col-span-2 hidden md:block">Categoria</div>
                <div className="col-span-1 hidden lg:block">Recorrência</div>
                <div className="col-span-2 hidden lg:block">Cartão</div>
                <div className="col-span-1 hidden md:block">Data</div>
                <div className="col-span-2 text-right">Valor</div>
                <div className="col-span-1 text-center">Ações</div>
              </div>
            </div>

            {/* Linhas da Tabela */}
            <div className="divide-y divide-slate-100">
              {paginatedTransactions.map((transaction) => (
                <div
                  key={transaction.is_virtual_fixed ? `virtual-${transaction.fixed_transaction_id}-${transaction.data}` : `real-${transaction.id}`}
                  className="grid grid-cols-12 gap-4 px-4 py-2.5 hover:bg-slate-25 transition-colors group"
                >
                  {/* Tipo */}
                  <div className="col-span-1 flex items-center">
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.tipo)}
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="col-span-2 flex items-center min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {transaction.descricao}
                      </p>
                      {transaction.total_parcelas && (
                        <p className="text-xs text-slate-500">
                          {transaction.parcela_atual}/{transaction.total_parcelas}x
                        </p>
                      )}
                      {/* Mobile: mostrar info extra */}
                      <div className="md:hidden text-xs mt-0.5 flex items-center gap-1 flex-wrap">
                        {getTransactionTypeBadge(transaction.tipo)}
                        {getRecurrenceBadge(transaction.tipo_recorrencia || 'unica')}
                        <span className="text-slate-500">
                          • {getCategoryName(transaction)} • {getAccountName(transaction)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Categoria - Hidden on mobile */}
                  <div className="col-span-2 hidden md:flex items-center min-w-0">
                    <span className="text-sm text-slate-600 truncate">
                      {getCategoryName(transaction)}
                    </span>
                  </div>

                  {/* Badge de Recorrência - Hidden on tablet and mobile */}
                  <div className="col-span-1 hidden lg:flex items-center min-w-0">
                    {getRecurrenceBadge(transaction.tipo_recorrencia || 'unica')}
                  </div>

                  {/* Cartão - Hidden on tablet and mobile */}
                  <div className="col-span-2 hidden lg:flex items-center min-w-0">
                    <span className="text-sm text-slate-600 truncate">
                      {getAccountName(transaction)}
                    </span>
                  </div>

                  {/* Data - Hidden on mobile */}
                  <div className="col-span-1 hidden md:flex items-center">
                    <span className="text-sm text-slate-600">
                      {formatDate(transaction.data)}
                    </span>
                  </div>

                  {/* Valor */}
                  <div className="col-span-2 flex items-center justify-end">
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        transaction.tipo === 'receita' 
                          ? 'text-emerald-600' 
                          : transaction.tipo === 'despesa' 
                            ? 'text-red-600' 
                            : transaction.tipo === 'despesa_cartao'
                              ? 'text-purple-600'
                              : 'text-blue-600'
                      }`}>
                        {['despesa', 'despesa_cartao'].includes(transaction.tipo) ? '-' : '+'}
                        {formatCurrency(transaction.valor)}
                      </p>
                      <div className="flex items-center justify-end mt-0.5">
                        {transaction.is_virtual_fixed
                          ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              Aguardando Confirmação
                            </span>
                          : transaction.tipo === 'despesa_cartao'
                            ? null // Não mostrar status para transações de cartão
                            : getStatusBadge(transaction.status || 'pendente', transaction)}
                      </div>
                      {/* Mobile: mostrar data */}
                      <div className="md:hidden text-xs text-slate-500 mt-0.5">
                        {formatDate(transaction.data)}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Verificar se é uma fatura */}
                      {transaction.is_fatura ? (
                        // Botão especial para excluir fatura
                        onDeleteInvoice && (
                          <button
                            onClick={() => onDeleteInvoice(transaction.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Excluir fatura e todas as transações do cartão neste mês"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : transaction.is_virtual || transaction.is_virtual_fixed || (transaction.fatura_details && transaction.fatura_details.is_virtual) ? (
                        // Botões para lançamentos fixos virtuais (pendentes)
                        <>
                          {onConfirmFixedTransaction && (
                            <button
                              onClick={() => {
                                const fixoId = transaction.fixed_transaction_id ||
                                              transaction.fixo_id ||
                                              (transaction.fatura_details && transaction.fatura_details.fixo_id);
                                if (fixoId) {
                                  onConfirmFixedTransaction(fixoId, transaction.data);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                              title="Confirmar recebimento/pagamento completo"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onPartialFixedTransaction && (
                            <button
                              onClick={() => {
                                const fixoId = transaction.fixed_transaction_id ||
                                              transaction.fixo_id ||
                                              (transaction.fatura_details && transaction.fatura_details.fixo_id);
                                if (fixoId) {
                                  onPartialFixedTransaction(fixoId, transaction.data);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                              title="Registrar recebimento/pagamento parcial"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : canUndoFixedTransaction(transaction) ? (
                        // Botões para lançamentos fixos confirmados (que podem ser desfeitos)
                        <>
                          {onUndoFixedTransaction && (
                            <button
                              onClick={() => onUndoFixedTransaction(transaction.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                              title="Desfazer confirmação e retornar ao estado pendente"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onEditTransaction && (
                            <button
                              onClick={() => onEditTransaction(transaction)}
                              className="p-1.5 text-slate-400 hover:text-coral-500 hover:bg-coral-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        // Botões padrão para transações normais
                        <>
                          {onEditTransaction && (
                            <button
                              onClick={() => onEditTransaction(transaction)}
                              className="p-1.5 text-slate-400 hover:text-coral-500 hover:bg-coral-50 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteTransaction && (
                            <button
                              onClick={() => onDeleteTransaction(transaction.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Paginação Avançada */}
        {filteredTransactions.length > 0 && (
          <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Info e controle de itens por página */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-600">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length}
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Itens por página:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => changeItemsPerPage(Number(e.target.value))}
                    className="border border-slate-200 rounded px-2 py-1 text-sm focus:border-coral-500 focus:outline-none"
                  >
                    {ITEMS_PER_PAGE_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Controles de navegação */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </ModernButton>
                  
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </ModernButton>
                  
                  <div className="flex items-center gap-1">
                    {/* Páginas numeradas (adaptativo) */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            currentPage === pageNum
                              ? 'bg-coral-500 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </ModernButton>
                  
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </ModernButton>
                </div>
              )}
            </div>
          </div>
        )}
      </ModernCard>
    </div>
  );
}); 