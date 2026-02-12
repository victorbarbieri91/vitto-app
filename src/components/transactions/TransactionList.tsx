import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { ModernCard, ModernButton } from '../ui/modern';
import { useAccounts } from '../../hooks/useAccounts';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../store/AuthContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { TransactionCompactItem } from './TransactionCompactItem';
import { cn } from '../../utils/cn';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { format as fnsFormat } from 'date-fns';
import 'react-day-picker/src/style.css';
import transactionService, { TransactionFilters } from '../../services/api/TransactionService';
import { fixedTransactionService } from '../../services/api/FixedTransactionService';
// A view retorna uma estrutura diferente, então vamos usar um tipo mais flexível por enquanto.
// O ideal seria gerar os tipos para a view, mas isso resolve o problema imediato.
type Transaction = any;
import {
  Search,
  Filter,
  Calendar,
  Edit3,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  RotateCcw,
  X
} from 'lucide-react';

export interface TransactionListRef {
  fetchTransactions: () => void;
}

type RecurrenceFilter = 'all' | 'fixa' | 'parcelada' | 'unica';

interface TransactionListProps {
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: number) => void;
  onConfirmFixedTransaction?: (fixedTransactionId: number, targetDate: string) => void;
  onPartialFixedTransaction?: (fixedTransactionId: number, targetDate: string) => void;
  onUndoFixedTransaction?: (transactionId: number) => void;
  onEditFixedTransaction?: (fixedTransactionId: number) => void;
  onDeleteInvoice?: (invoiceId: number) => void;
  onActivateTransaction?: (transactionId: number) => void;
  onInvoiceClick?: (transaction: Transaction) => void;
  onEfetivar?: (transaction: Transaction) => void;
  onPayInvoice?: (transaction: Transaction) => void;
  onDeleteFixedVirtual?: (transaction: Transaction, scope: 'this_month' | 'all') => void;
  onQuickAccountChange?: (transactionId: number | string, newAccountId: number, isFixed: boolean, fixedId?: number) => void;
  className?: string;
  showFilters?: boolean;
  defaultFilters?: Partial<TransactionFilters>;
  includeVirtualFixed?: boolean;
  excludeCardTransactions?: boolean;
  preloadedTransactions?: Transaction[];
  recurrenceFilter?: RecurrenceFilter;
  tipoFilter?: 'all' | 'receita' | 'despesa';
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
  onEditFixedTransaction,
  onDeleteInvoice,
  onActivateTransaction,
  onInvoiceClick,
  onEfetivar,
  onPayInvoice,
  onDeleteFixedVirtual,
  onQuickAccountChange,
  className,
  showFilters = true,
  defaultFilters = {},
  includeVirtualFixed = false,
  excludeCardTransactions = false,
  preloadedTransactions = null,
  recurrenceFilter = 'all',
  tipoFilter = 'all'
}, ref) => {
  const { user } = useAuth();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();
  const isMobile = useIsMobile();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const [dateStart, setDateStart] = useState(new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState('');
  const [activeDateField, setActiveDateField] = useState<'start' | 'end' | null>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<ExtendedFilters>({
    ...defaultFilters,
    searchText: '',
  });

  const [tempFilters, setTempFilters] = useState<ExtendedFilters>(filters);
  const [searchInput, setSearchInput] = useState('');
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  // Inline account edit
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  // Delete virtual popover
  const [deleteVirtualId, setDeleteVirtualId] = useState<string | null>(null);
  const deleteVirtualRef = useRef<HTMLDivElement>(null);

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

        // Aplicar filtros do usuário aos dados pré-carregados (client-side filtering)
        const { searchText: _searchText, ...apiFilters } = filters;

        // Filtro por tipo
        if (apiFilters.tipo) {
          data = data.filter(t => t.tipo === apiFilters.tipo);
        }

        // Filtro por conta
        if (apiFilters.conta_id) {
          data = data.filter(t => t.conta_id === parseInt(apiFilters.conta_id));
        }

        // Filtro por cartão
        if (apiFilters.cartao_id) {
          data = data.filter(t => t.cartao_id === parseInt(apiFilters.cartao_id));
        }

        // Filtro por categoria
        if (apiFilters.categoria_id) {
          data = data.filter(t => t.categoria_id === parseInt(apiFilters.categoria_id));
        }

        // Filtro por status
        if (apiFilters.status) {
          data = data.filter(t => t.status === apiFilters.status);
        }

        // Filtro por data (se especificado)
        if (apiFilters.startDate && apiFilters.endDate) {
          const startDate = new Date(apiFilters.startDate);
          const endDate = new Date(apiFilters.endDate);
          data = data.filter(t => {
            const transactionDate = new Date(t.data);
            return transactionDate >= startDate && transactionDate <= endDate;
          });
        }

        console.log('🔍 [Preloaded] Data after user filters:', data.length);
        setTransactions(data);
        setLoading(false);
        return;
      }

      const { searchText: _searchText, ...apiFilters } = filters;

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
          const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

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

      // Deduplicar por fixo_id: manter apenas 1 entrada por fixo_id
      const fixoGroups = new Map<number, any[]>();
      const nonFixed: any[] = [];
      for (const t of data) {
        if (t.fixo_id) {
          const group = fixoGroups.get(t.fixo_id) || [];
          group.push(t);
          fixoGroups.set(t.fixo_id, group);
        } else {
          nonFixed.push(t);
        }
      }
      const deduped = [...nonFixed];
      for (const [, group] of fixoGroups) {
        if (group.length === 1) {
          deduped.push(group[0]);
        } else {
          // Prioridade: real (id positivo) sobre virtual (id negativo/string)
          const real = group.filter((t: any) => typeof t.id === 'number' && t.id > 0);
          if (real.length > 0) {
            real.sort((a: any, b: any) => b.id - a.id);
            deduped.push(real[0]);
          } else {
            deduped.push(group[0]);
          }
        }
      }

      setTransactions(deduped);
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

  // Filtrar por texto e recorrencia localmente
  const filteredTransactions = useMemo(() => {
    let data = transactions;

    // Filtro por recorrencia (chips)
    if (recurrenceFilter && recurrenceFilter !== 'all') {
      data = data.filter((t: Transaction) => {
        const isFixed = t.is_virtual_fixed || t.origem === 'fixo' || t.fixo_id;
        const isInstallment = t.total_parcelas > 1 || t.parcela_atual;
        const isInvoice = t.is_fatura || t.tipo_registro === 'fatura';

        if (recurrenceFilter === 'fixa') return isFixed;
        if (recurrenceFilter === 'parcelada') return isInstallment;
        if (recurrenceFilter === 'unica') return !isFixed && !isInstallment && !isInvoice;
        return true;
      });
    }

    // Filtro por tipo (receita/despesa)
    if (tipoFilter && tipoFilter !== 'all') {
      data = data.filter((t: Transaction) => {
        if (tipoFilter === 'receita') return t.tipo === 'receita';
        if (tipoFilter === 'despesa') return t.tipo === 'despesa' || t.tipo === 'despesa_cartao' || t.is_fatura;
        return true;
      });
    }

    // Filtro por texto
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      data = data.filter((transaction: Transaction) =>
        (transaction.descricao || '').toLowerCase().includes(searchLower) ||
        (transaction.categoria_nome || '').toLowerCase().includes(searchLower) ||
        (transaction.conta_nome || '').toLowerCase().includes(searchLower)
      );
    }

    return data;
  }, [transactions, filters.searchText, recurrenceFilter, tipoFilter]);

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


  const getRecurrenceBadge = useCallback((tipoRecorrencia: 'unica' | 'fixa' | 'parcelada') => {
    const baseClass = "px-1.5 py-px rounded text-[10px] font-medium";
    switch (tipoRecorrencia) {
      case 'unica':
        return <span className={`${baseClass} bg-slate-100 text-slate-600`}>Unica</span>;
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

  const getAccountName = useCallback((transaction: Transaction) => {
    // Usar os novos campos da função SQL atualizada
    return transaction.conta_nome || transaction.cartao_nome || '-';
  }, []);

  const getCategoryName = useCallback((transaction: Transaction) => {
    return transaction.categoria_nome || transaction.categoria?.nome || '-';
  }, []);

  // Verificar se uma transação confirmada pode ser desfeita (fixas e regulares)
  const canUndoTransaction = useCallback((transaction: Transaction) => {
    // Deve estar confirmada e não ser fatura nem virtual
    if (transaction.status !== 'confirmado') return false;
    if (transaction.is_fatura) return false;
    const isVirt = transaction.is_virtual || transaction.is_virtual_fixed || transaction.fatura_details?.is_virtual;
    if (isVirt) return false;

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

  // Computed filter state for UI
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.tipo) count++;
    if (filters.conta_id) count++;
    if (filters.categoria_id) count++;
    if (filters.status) count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;
  const hasDateFilter = dateFilterApplied;

  // Close date picker on click outside
  useEffect(() => {
    if (!showDatePicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Close delete virtual popover on click outside
  useEffect(() => {
    if (!deleteVirtualId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (deleteVirtualRef.current && !deleteVirtualRef.current.contains(e.target as Node)) {
        setDeleteVirtualId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [deleteVirtualId]);

  // Apply date filter to transactions
  const applyDateFilter = useCallback(() => {
    if (dateStart || dateEnd) {
      setFilters(prev => ({
        ...prev,
        startDate: dateStart || undefined,
        endDate: dateEnd || dateStart || undefined,
      }));
      setDateFilterApplied(true);
    }
    setShowDatePicker(false);
    setActiveDateField(null);
  }, [dateStart, dateEnd]);

  const clearDateFilter = useCallback(() => {
    setDateStart(new Date().toISOString().split('T')[0]);
    setDateEnd('');
    setFilters(prev => {
      const newFilters = { ...prev };
      if ((defaultFilters as any)?.startDate) {
        (newFilters as any).startDate = (defaultFilters as any).startDate;
      } else {
        delete (newFilters as any).startDate;
      }
      if ((defaultFilters as any)?.endDate) {
        (newFilters as any).endDate = (defaultFilters as any).endDate;
      } else {
        delete (newFilters as any).endDate;
      }
      return newFilters;
    });
    setDateFilterApplied(false);
    setShowDatePicker(false);
    setActiveDateField(null);
  }, [defaultFilters]);

  // Handle single day selection from the calendar
  const handleCalendarDaySelect = useCallback((day: Date | undefined) => {
    if (!day) return;
    const dateStr = fnsFormat(day, 'yyyy-MM-dd');
    if (activeDateField === 'start') {
      setDateStart(dateStr);
    } else if (activeDateField === 'end') {
      setDateEnd(dateStr);
    }
    setActiveDateField(null);
  }, [activeDateField]);

  // Open date picker with a specific date pre-selected (from table row click)
  const openDatePickerWithDate = useCallback((dateStr: string) => {
    setDateStart(dateStr);
    setDateEnd(dateStr);
    setShowDatePicker(true);
    setActiveDateField(null);
  }, []);

  // Inline account change handler
  const handleAccountChange = useCallback((transaction: Transaction, newAccountId: string) => {
    if (!onQuickAccountChange || !newAccountId) return;
    const isFixed = transaction.is_virtual_fixed || transaction.is_virtual || transaction.origem === 'fixo';
    const fixoId = transaction.fixed_transaction_id || transaction.fixo_id;
    onQuickAccountChange(transaction.id, parseInt(newAccountId), isFixed, fixoId);
    setEditingAccountId(null);
  }, [onQuickAccountChange]);

  // Get status badge for desktop table
  const getStatusBadgeCompact = useCallback((transaction: Transaction) => {
    const baseClass = "text-[10px] px-1.5 py-0.5 rounded-md font-medium whitespace-nowrap border";

    if (transaction.is_virtual_fixed || transaction.is_virtual) {
      return <span className={`${baseClass} bg-blue-50 text-blue-700 border-blue-200`}>Previsto</span>;
    }
    if (transaction.is_fatura) {
      if (transaction.status === 'paga') return <span className={`${baseClass} bg-emerald-50 text-emerald-700 border-emerald-200`}>Paga</span>;
      return <span className={`${baseClass} bg-purple-50 text-purple-700 border-purple-200`}>Fatura</span>;
    }
    switch (transaction.status) {
      case 'efetivado':
      case 'confirmado':
      case 'concluido':
        return <span className={`${baseClass} bg-emerald-50 text-emerald-700 border-emerald-200`}>Efetivado</span>;
      case 'pendente':
        return <span className={`${baseClass} bg-amber-50 text-amber-700 border-amber-200`}>Pendente</span>;
      case 'cancelado':
        return <span className={`${baseClass} bg-red-50 text-red-700 border-red-200`}>Cancelado</span>;
      default:
        return <span className={`${baseClass} bg-slate-50 text-slate-500 border-slate-200`}>-</span>;
    }
  }, []);

  // Check if transaction is already confirmed/effectuated
  const isEffectuated = useCallback((transaction: Transaction) => {
    return ['efetivado', 'confirmado', 'concluido', 'paga'].includes(transaction.status);
  }, []);

  // Short date format: "07 fev"
  const formatDateShort = useCallback((dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barra de busca e filtros minimalista */}
      {showFilters && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar lançamentos..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-10 pl-10 pr-9 text-sm rounded-xl
                           bg-white/80 backdrop-blur-sm
                           border border-slate-200/60
                           placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-coral-500/30 focus:border-coral-400
                           hover:border-slate-300 transition-all"
                autoComplete="off"
                name="search-transactions"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full
                             text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Counter + Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-500 hidden sm:inline whitespace-nowrap">
                {filteredTransactions.length} itens
              </span>
              <button
                onClick={fetchTransactions}
                disabled={loading}
                className="h-10 w-10 flex items-center justify-center rounded-xl
                           bg-white/80 border border-slate-200/60
                           text-slate-500 hover:text-slate-700 hover:border-slate-300
                           disabled:opacity-50 transition-all"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
              {/* Date filter button */}
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-xl transition-all border",
                    hasDateFilter
                      ? "bg-coral-50 border-coral-200 text-coral-700"
                      : "bg-white/80 border-slate-200/60 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  )}
                  title="Filtrar por data"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                {hasDateFilter && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-coral-500" />
                )}
                {/* Date picker popover */}
                {showDatePicker && (
                  <div className={cn(
                    "absolute top-full mt-2 z-50 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-lg overflow-hidden",
                    isMobile ? "fixed left-4 right-4" : "right-0 w-[280px]"
                  )}>
                    <div className="px-3 pt-3 pb-2">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Filtrar por data</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 mb-0.5 block">Data inicial</label>
                          <button
                            onClick={() => setActiveDateField(activeDateField === 'start' ? null : 'start')}
                            className={cn(
                              "w-full px-2.5 py-1.5 text-xs rounded-lg border text-left transition-all",
                              activeDateField === 'start'
                                ? "border-coral-400 ring-2 ring-coral-500/20 bg-white"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            )}
                          >
                            {dateStart ? fnsFormat(new Date(dateStart + 'T00:00:00'), 'dd/MM/yyyy') : 'Selecionar'}
                          </button>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 mb-0.5 block">Data final</label>
                          <button
                            onClick={() => setActiveDateField(activeDateField === 'end' ? null : 'end')}
                            className={cn(
                              "w-full px-2.5 py-1.5 text-xs rounded-lg border text-left transition-all",
                              activeDateField === 'end'
                                ? "border-coral-400 ring-2 ring-coral-500/20 bg-white"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            )}
                          >
                            {dateEnd ? fnsFormat(new Date(dateEnd + 'T00:00:00'), 'dd/MM/yyyy') : 'Selecionar'}
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Inline calendar - shows when a date field is active */}
                    {activeDateField && (
                      <div className="border-t border-slate-100 flex justify-center py-1">
                        <DayPicker
                          mode="single"
                          selected={activeDateField === 'start' && dateStart
                            ? new Date(dateStart + 'T00:00:00')
                            : activeDateField === 'end' && dateEnd
                            ? new Date(dateEnd + 'T00:00:00')
                            : undefined
                          }
                          onSelect={handleCalendarDaySelect}
                          locale={ptBR}
                          numberOfMonths={1}
                          showOutsideDays
                          style={{
                            '--rdp-accent-color': '#F87060',
                            '--rdp-accent-background-color': '#FEF2F0',
                            '--rdp-day-height': '32px',
                            '--rdp-day-width': '32px',
                            '--rdp-day_button-height': '30px',
                            '--rdp-day_button-width': '30px',
                            '--rdp-day_button-border-radius': '8px',
                            fontSize: '13px',
                          } as React.CSSProperties}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
                      <button
                        onClick={clearDateFilter}
                        className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Limpar
                      </button>
                      <button
                        onClick={applyDateFilter}
                        disabled={!dateStart}
                        className="px-3 py-1 text-xs font-medium text-white bg-coral-500 hover:bg-coral-600 disabled:opacity-50 rounded-lg transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={cn(
                  "flex items-center gap-1.5 h-10 px-3 rounded-xl text-sm font-medium transition-all border",
                  hasActiveFilters
                    ? "bg-coral-50 border-coral-200 text-coral-700"
                    : "bg-white/80 border-slate-200/60 text-slate-600 hover:border-slate-300"
                )}
              >
                <Filter className="w-4 h-4" />
                {hasActiveFilters && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-coral-500 text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Panel - Popover elegante */}
          {showFiltersPanel && (
            <div className="p-4 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200/60 shadow-lg">
              <div className={cn(
                "grid gap-3",
                isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"
              )}>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Tipo</label>
                  <select
                    value={tempFilters.tipo || ''}
                    onChange={(e) => handleFilterChange('tipo', e.target.value)}
                    className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-coral-500 focus:ring-1 focus:ring-coral-500/20 focus:outline-none bg-white"
                  >
                    <option value="">Todos</option>
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                    <option value="despesa_cartao">Despesa no Cartao</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Conta</label>
                  <select
                    value={tempFilters.conta_id || ''}
                    onChange={(e) => handleFilterChange('conta_id', e.target.value)}
                    className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-coral-500 focus:ring-1 focus:ring-coral-500/20 focus:outline-none bg-white"
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
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Categoria</label>
                  <select
                    value={tempFilters.categoria_id || ''}
                    onChange={(e) => handleFilterChange('categoria_id', e.target.value)}
                    className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-coral-500 focus:ring-1 focus:ring-coral-500/20 focus:outline-none bg-white"
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
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Status</label>
                  <select
                    value={tempFilters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 focus:border-coral-500 focus:ring-1 focus:ring-coral-500/20 focus:outline-none bg-white"
                  >
                    <option value="">Todos</option>
                    <option value="efetivado">Efetivado</option>
                    <option value="pendente">Pendente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <button onClick={clearFilters} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                  Limpar filtros
                </button>
                <ModernButton variant="primary" size="sm" onClick={applyFilters}>
                  Aplicar
                </ModernButton>
              </div>
            </div>
          )}
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
            {isMobile ? (
              // Renderização mobile - estilo extrato bancário agrupado por data
              <div className="bg-white">
                {(() => {
                  // Agrupar transações por data
                  const groups: { label: string; dateKey: string; transactions: Transaction[] }[] = [];
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const yesterday = new Date(today);
                  yesterday.setDate(yesterday.getDate() - 1);

                  const getDateLabel = (dateStr: string) => {
                    const parts = dateStr.split('-');
                    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                    date.setHours(0, 0, 0, 0);
                    if (date.getTime() === today.getTime()) return 'Hoje';
                    if (date.getTime() === yesterday.getTime()) return 'Ontem';
                    const day = date.getDate().toString().padStart(2, '0');
                    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                    return `${day} ${months[date.getMonth()]}`;
                  };

                  paginatedTransactions.forEach((t) => {
                    const dateKey = (t.data || '').split('T')[0];
                    let group = groups.find((g) => g.dateKey === dateKey);
                    if (!group) {
                      group = { label: getDateLabel(dateKey), dateKey, transactions: [] };
                      groups.push(group);
                    }
                    group.transactions.push(t);
                  });

                  return groups.map((group) => (
                    <div key={group.dateKey}>
                      {/* Date separator - subtle Nubank style */}
                      <div className="px-4 pt-4 pb-1.5">
                        <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
                          {group.label}
                        </span>
                      </div>
                      {/* Transactions for this date */}
                      {group.transactions.map((transaction) => {
                        const key = transaction.is_virtual_fixed
                          ? `virtual-${transaction.fixed_transaction_id}-${transaction.data}`
                          : `real-${transaction.id}`;
                        return (
                          <TransactionCompactItem
                            key={key}
                            transaction={transaction}
                            isExpanded={expandedTransactionId === key}
                            onToggle={() => setExpandedTransactionId(expandedTransactionId === key ? null : key)}
                            onEditTransaction={onEditTransaction}
                            onDeleteTransaction={onDeleteTransaction}
                            onConfirmFixedTransaction={onConfirmFixedTransaction}
                            onPartialFixedTransaction={onPartialFixedTransaction}
                            onUndoFixedTransaction={onUndoFixedTransaction}
                            onEditFixedTransaction={onEditFixedTransaction}
                            onDeleteInvoice={onDeleteInvoice}
                            onActivateTransaction={onActivateTransaction}
                            onInvoiceClick={onInvoiceClick}
                            onEfetivar={onEfetivar}
                            onDeleteFixedVirtual={onDeleteFixedVirtual}
                          />
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            ) : (
              // Renderização para desktop usando tabela compacta
              <>
                {/* Header da Tabela */}
                <div className="border-b border-slate-200">
                  <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-3">Descricao</div>
                    <div className="col-span-2 hidden md:block">Categoria</div>
                    <div className="col-span-1 hidden lg:block">Conta</div>
                    <div className="col-span-1 hidden md:block">Data</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2 text-right">Valor</div>
                    <div className="col-span-2 text-center">Acoes</div>
                  </div>
                </div>

            {/* Linhas da Tabela */}
            <div>
              {paginatedTransactions.map((transaction, index) => {
                const key = transaction.is_virtual_fixed ? `virtual-${transaction.fixed_transaction_id}-${transaction.data}` : `real-${transaction.id}`;
                const isVirtual = transaction.is_virtual || transaction.is_virtual_fixed || (transaction.fatura_details && transaction.fatura_details.is_virtual);
                const isFixedOrigin = transaction.origem === 'fixo' || isVirtual;
                const alreadyEffectuated = isEffectuated(transaction);

                return (
                <div
                  key={key}
                  className={cn(
                    "grid grid-cols-12 gap-3 px-4 py-2 transition-colors",
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/40",
                    "hover:bg-coral-50/30"
                  )}
                >
                  {/* Icone + Descricao */}
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="flex-shrink-0">
                      {getTransactionIcon(transaction.tipo)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-medium text-slate-800 truncate leading-tight">
                          {transaction.descricao}
                        </p>
                        {getRecurrenceBadge(transaction.tipo_recorrencia || 'unica')}
                      </div>
                      {transaction.total_parcelas && (
                        <span className="text-[11px] text-slate-400">
                          {transaction.parcela_atual}/{transaction.total_parcelas}x
                        </span>
                      )}
                      {/* Mobile fallback info */}
                      <div className="md:hidden text-[10px] mt-0.5 flex items-center gap-1 flex-wrap">
                        <span className="text-slate-500">
                          {getCategoryName(transaction)} - {formatDateShort(transaction.data)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Categoria */}
                  <div className="col-span-2 hidden md:flex items-center min-w-0">
                    <span className="text-xs text-slate-600 truncate">
                      {getCategoryName(transaction)}
                    </span>
                  </div>

                  {/* Conta - editavel inline */}
                  <div className="col-span-1 hidden lg:flex items-center min-w-0">
                    {editingAccountId === key ? (
                      <select
                        value={transaction.conta_id || ''}
                        onChange={(e) => handleAccountChange(transaction, e.target.value)}
                        onBlur={() => setEditingAccountId(null)}
                        onKeyDown={(e) => e.key === 'Escape' && setEditingAccountId(null)}
                        autoFocus
                        className="text-[11px] border border-coral-300 rounded-lg px-1 py-0.5 w-full focus:ring-1 focus:ring-coral-500/20 focus:outline-none bg-white"
                      >
                        <option value="">-</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                      </select>
                    ) : (
                      <span
                        onClick={() => onQuickAccountChange && setEditingAccountId(key)}
                        className={cn(
                          "text-[11px] text-slate-600 truncate",
                          onQuickAccountChange && "cursor-pointer hover:text-coral-600 hover:underline"
                        )}
                        title={onQuickAccountChange ? "Clique para alterar conta" : undefined}
                      >
                        {getAccountName(transaction)}
                      </span>
                    )}
                  </div>

                  {/* Data */}
                  <div className="col-span-1 hidden md:flex items-center">
                    <button
                      onClick={() => openDatePickerWithDate(transaction.data)}
                      className="text-xs text-slate-500 hover:text-coral-600 hover:underline transition-colors cursor-pointer"
                      title="Filtrar por esta data"
                    >
                      {formatDateShort(transaction.data)}
                    </button>
                  </div>

                  {/* Status */}
                  <div className="col-span-1 flex items-center">
                    {getStatusBadgeCompact(transaction)}
                  </div>

                  {/* Valor */}
                  <div className="col-span-2 flex items-center justify-end">
                    <span className={cn(
                      "text-[13px] font-semibold tabular-nums",
                      transaction.tipo === 'receita' ? 'text-emerald-600' :
                      transaction.tipo === 'despesa' ? 'text-red-600' :
                      transaction.tipo === 'despesa_cartao' ? 'text-purple-600' :
                      'text-blue-600'
                    )}>
                      {['despesa', 'despesa_cartao'].includes(transaction.tipo) ? '-' : '+'}
                      {formatCurrency(transaction.valor)}
                    </span>
                  </div>

                  {/* Acoes - sempre visiveis */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="flex items-center gap-0.5">
                      {transaction.is_fatura ? (
                        /* Faturas: Pagar + Ver fatura + Excluir */
                        <>
                          {onPayInvoice && transaction.status !== 'paga' && (
                            <button
                              onClick={() => onPayInvoice(transaction)}
                              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Pagar fatura"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onInvoiceClick && (
                            <button
                              onClick={() => onInvoiceClick(transaction)}
                              className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Ver detalhes da fatura"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteInvoice && (
                            <button
                              onClick={() => onDeleteInvoice(transaction.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Excluir fatura"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        /* Transacoes normais/fixas/virtuais: Efetivar + Editar + Excluir */
                        <>
                          {/* Efetivar / Desfazer */}
                          {canUndoTransaction(transaction) ? (
                            <button
                              onClick={() => onUndoFixedTransaction && onUndoFixedTransaction(transaction.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Desfazer efetivacao"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => !alreadyEffectuated && onEfetivar && onEfetivar(transaction)}
                              disabled={alreadyEffectuated || !onEfetivar}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                alreadyEffectuated || !onEfetivar
                                  ? "text-slate-200 cursor-not-allowed"
                                  : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
                              )}
                              title={alreadyEffectuated ? "Ja efetivado" : "Efetivar"}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Editar */}
                          <button
                            onClick={() => {
                              if (onEditTransaction) {
                                onEditTransaction(transaction);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-coral-500 hover:bg-coral-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir - com popover de escopo para virtuais fixas */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                if (isVirtual && isFixedOrigin && onDeleteFixedVirtual) {
                                  setDeleteVirtualId(deleteVirtualId === key ? null : key);
                                } else if (!isVirtual && onDeleteTransaction) {
                                  onDeleteTransaction(transaction.id);
                                }
                              }}
                              disabled={isVirtual && !onDeleteFixedVirtual}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                isVirtual && !onDeleteFixedVirtual
                                  ? "text-slate-200 cursor-not-allowed"
                                  : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                              )}
                              title={isVirtual ? "Excluir lancamento fixo" : "Excluir"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {/* Popover de escopo para exclusao de virtual */}
                            {deleteVirtualId === key && isVirtual && onDeleteFixedVirtual && (
                              <div
                                ref={deleteVirtualRef}
                                className="absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-xl shadow-lg border border-slate-200/60 overflow-hidden"
                              >
                                <p className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                  Excluir
                                </p>
                                <button
                                  onClick={() => { onDeleteFixedVirtual(transaction, 'this_month'); setDeleteVirtualId(null); }}
                                  className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                  Somente este mes
                                </button>
                                <button
                                  onClick={() => { onDeleteFixedVirtual(transaction, 'all'); setDeleteVirtualId(null); }}
                                  className="w-full px-3 py-2 text-xs text-left text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors border-t border-slate-100"
                                >
                                  Todos os meses (desativar)
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
              </>
            )}
          </>
        )}

        {/* Paginacao Compacta */}
        {filteredTransactions.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/50">
            {isMobile ? (
              /* Paginacao mobile com selector de itens */
              <div className="flex flex-col gap-2">
                {/* Top row: count info + items per page */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Exibir:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => changeItemsPerPage(Number(e.target.value))}
                      className="border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:border-coral-500 focus:outline-none bg-white"
                    >
                      {[10, 25, 50].map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Bottom row: page navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg text-slate-400 active:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-slate-600 min-w-[3rem] text-center">
                      {currentPage}/{totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg text-slate-400 active:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Paginacao desktop completa */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">
                    {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredTransactions.length)} de {filteredTransactions.length}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Por pagina:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => changeItemsPerPage(Number(e.target.value))}
                      className="border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:border-coral-500 focus:outline-none bg-white"
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(1)}
                      disabled={currentPage === 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-0.5">
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
                            className={cn(
                              "px-2.5 py-0.5 text-xs rounded transition-colors",
                              currentPage === pageNum
                                ? 'bg-coral-500 text-white'
                                : 'text-slate-500 hover:bg-slate-100'
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => goToPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </ModernCard>
    </div>
  );
}); 