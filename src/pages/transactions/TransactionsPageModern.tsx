import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TransactionList, TransactionListRef } from '../../components/transactions/TransactionList';
import { MonthNavigator } from '../../components/ui/modern';
import FilterChip from '../../components/ui/FilterChip';
import { fixedTransactionService, FixedTransactionWithDetails } from '../../services/api/FixedTransactionService';
import transactionService from '../../services/api/TransactionService';
import { Tag, XCircle } from 'lucide-react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../store/AuthContext';
import { useTransactionContext } from '../../store/TransactionContext';
import InvoicePaymentModal from '../../components/cards/InvoicePaymentModal';
import ConfirmDeleteInvoiceModal from '../../components/modals/ConfirmDeleteInvoiceModal';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
import EfetivarModal from '../../components/transactions/EfetivarModal';
import type { EfetivarData } from '../../components/transactions/EfetivarModal';
import TransactionEditModal from '../../components/transactions/TransactionEditModal';
import type { EditTransactionData } from '../../components/transactions/TransactionEditModal';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';

export type RecurrenceFilter = 'all' | 'fixa' | 'parcelada' | 'unica';

/**
 *
 */
export default function TransactionsPageModern() {
  const { user } = useAuth();
  const { onTransactionChange } = useTransactionContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const transactionListRef = useRef<TransactionListRef>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Efetivar modal state
  const [efetivarTransaction, setEfetivarTransaction] = useState<any>(null);
  const [isEfetivarModalOpen, setIsEfetivarModalOpen] = useState(false);

  // Edit modal state
  const [editModalTransaction, setEditModalTransaction] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete confirmation modal state
  const [deleteTransactionId, setDeleteTransactionId] = useState<number | null>(null);
  const [deleteTransactionDesc, setDeleteTransactionDesc] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Invoice payment/delete modals
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] = useState<any>(null);
  const [isDeleteInvoiceModalOpen, setIsDeleteInvoiceModalOpen] = useState(false);

  // Monthly transactions state (from dashboard - single source of truth)
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([]);
  const [_monthlyLoading, setMonthlyLoading] = useState(false);

  // Fixed transactions state (for edit/adjustment modals)
  const [_fixedTransactions, setFixedTransactions] = useState<FixedTransactionWithDetails[]>([]);


  // Month navigation state
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  // Category filter state (from pie chart click)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Recurrence filter (chips)
  const [recurrenceFilter, setRecurrenceFilter] = useState<RecurrenceFilter>('all');

  // Tipo filter (receita/despesa chips)
  const [tipoFilter, setTipoFilter] = useState<'all' | 'receita' | 'despesa'>('all');

  // Process URL params
  useEffect(() => {
    const month = searchParams.get('month');
    const categoria = searchParams.get('categoria');

    // Redirect old card URLs to /cartoes
    const type = searchParams.get('type');
    const cardId = searchParams.get('card_id');
    if (type === 'cartao' && cardId) {
      navigate(`/cartoes?card_id=${cardId}${month ? `&month=${month}` : ''}`, { replace: true });
      return;
    }

    if (month) {
      const [monthNum, yearNum] = month.split('-');
      if (monthNum && yearNum) {
        setCurrentMonth(parseInt(monthNum));
        setCurrentYear(parseInt(yearNum));
      }
    }

    if (categoria) {
      setCategoryFilter(categoria);
    } else {
      setCategoryFilter(null);
    }
  }, [searchParams, navigate]);

  // Clear category filter
  const clearCategoryFilter = () => {
    setCategoryFilter(null);
    navigate('/lancamentos');
  };

  // Handle month navigation
  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  // Generate date filters for current month
  const getDateFilters = () => {
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
    const filters: any = { startDate, endDate };

    if (categoryFilter) {
      filters.categoria_id = categoryFilter;
    }

    return filters;
  };

  // === SINGLE DATA SOURCE: obter_dashboard_mes ===
  const loadData = async () => {
    if (!user) return;

    setMonthlyLoading(true);
    try {
      const { data, error } = await supabase.rpc('obter_dashboard_mes', {
        p_user_id: user.id,
        p_mes: currentMonth,
        p_ano: currentYear
      });

      if (error) throw error;

      const result = data as any;
      const realTransactions = result?.transacoes_mes || [];

      // Injetar faturas como itens na lista (seguindo padrao do ProximasTransacoesCard)
      let faturaItems: any[] = [];
      try {
        // 1. Buscar cartoes do usuario
        const { data: cards } = await supabase
          .from('app_cartao_credito')
          .select('id, dia_fechamento, nome')
          .eq('user_id', user.id);

        const cardIds = (cards || []).map((c: any) => c.id);

        if (cardIds.length > 0) {
          // 2. Buscar faturas do mes (aberta ou fechada, nao paga)
          const { data: faturas } = await supabase
            .from('app_fatura')
            .select('id, mes, ano, status, data_vencimento, cartao_id, app_cartao_credito(nome)')
            .in('cartao_id', cardIds)
            .eq('mes', currentMonth)
            .eq('ano', currentYear)
            .in('status', ['aberta', 'fechada']);

          if (faturas && faturas.length > 0) {
            // 3. Calcular valor DINAMICO para cada fatura via RPC
            const totals = await Promise.all(
              faturas.map(f => supabase.rpc('calcular_valor_total_fatura', { p_fatura_id: f.id }))
            );

            faturas.forEach((f: any, i) => {
              const total = Number(totals[i].data) || 0;

              // 4. Nao mostrar se valor = 0
              if (total <= 0) return;

              // 5. Nao mostrar se ja existe pagamento desta fatura nas transacoes reais
              const cartaoNome = f.app_cartao_credito?.nome || 'Cartao';
              const hasPagamento = realTransactions.some((t: any) =>
                t.tipo_especial === 'pagamento_fatura' ||
                (t.descricao?.toLowerCase().includes('pagamento fatura') && t.descricao?.includes(`(${f.mes}/${f.ano})`)) ||
                (t.descricao?.toLowerCase().includes('fatura') && t.descricao?.toLowerCase().includes(cartaoNome.toLowerCase()) && t.descricao?.includes(`(${f.mes}/${f.ano})`))
              );
              if (hasPagamento) return;

              const vencimento = new Date(f.data_vencimento);
              const statusVencimento = vencimento < new Date() ? 'vencida'
                : vencimento <= new Date(Date.now() + 7 * 86400000) ? 'proxima' : 'futura';

              // Calcular período do ciclo da fatura para exibir ao usuário
              const card = cards?.find((c: any) => c.id === f.cartao_id);
              const diaFechamento = card?.dia_fechamento || 1;
              // Fatura mês X cobre: dia_fechamento do mês X-1 até dia_fechamento-1 do mês X
              const cicloInicio = new Date(f.ano, f.mes - 2, diaFechamento); // mês anterior, dia do fechamento
              const cicloFim = new Date(f.ano, f.mes - 1, diaFechamento - 1); // mês da fatura, dia antes do fechamento

              const formatCicloDate = (d: Date) => {
                const dia = String(d.getDate()).padStart(2, '0');
                const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                return `${dia}/${meses[d.getMonth()]}`;
              };

              faturaItems.push({
                id: `fatura-${f.id}`,
                descricao: `Fatura ${cartaoNome} (${f.mes}/${f.ano})`,
                valor: total,
                data: f.data_vencimento,
                tipo: 'despesa',
                status: f.status === 'paga' ? 'confirmado' : 'pendente',
                is_fatura: true,
                fatura_details: {
                  id: f.id,
                  cartao_nome: cartaoNome,
                  mes: f.mes,
                  ano: f.ano,
                  valor_total: total,
                  data_vencimento: f.data_vencimento,
                  status: f.status,
                  status_vencimento: statusVencimento,
                  ciclo_inicio: cicloInicio.toISOString().split('T')[0],
                  ciclo_fim: cicloFim.toISOString().split('T')[0],
                  ciclo_texto: `Ciclo: ${formatCicloDate(cicloInicio)} - ${formatCicloDate(cicloFim)}`,
                },
                categoria: { nome: 'Fatura Cartao', cor: '#8B5CF6', icone: 'credit-card' },
                conta_nome: '-',
              });
            });
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar faturas:', e);
      }

      // Gerar transacoes virtuais para regras fixas sem transacao real neste mes
      let virtualTransactions: any[] = [];
      try {
        const allVirtual = await transactionService.getVirtualFixedTransactions(currentMonth, currentYear);
        // Remover despesas de cartão virtuais - já estão incluídas no valor da fatura consolidada
        virtualTransactions = allVirtual.filter((t: any) => t.tipo !== 'despesa_cartao');
      } catch (e) {
        console.warn('Erro ao gerar transacoes virtuais:', e);
      }

      // Mergear reais + faturas + virtuais (deduplicacao abaixo vai eliminar duplicatas)
      const transactions = [...realTransactions, ...faturaItems, ...virtualTransactions];

      // Deduplicar: para cada fixo_id, manter apenas 1 entrada por mes
      // Prioridade: transacao real (id > 0) sobre virtual (id < 0), e id maior sobre menor
      const fixoGroups = new Map<number, any[]>();
      const nonFixed: any[] = [];

      for (const t of transactions) {
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
          // Multiplos com mesmo fixo_id: manter o real (id > 0) mais recente
          const real = group.filter((t: any) => typeof t.id === 'number' && t.id > 0);
          if (real.length > 0) {
            // Manter o com maior ID (mais recente)
            real.sort((a: any, b: any) => b.id - a.id);
            deduped.push(real[0]);
          } else {
            // Todos virtuais: manter o primeiro
            deduped.push(group[0]);
          }
        }
      }

      setMonthlyTransactions(deduped);
    } catch (error) {
      console.error('Erro ao carregar transacoes:', error);
      setMonthlyTransactions([]);
    } finally {
      setMonthlyLoading(false);
    }
  };

  // Load fixed transactions list (for edit modal lookup)
  const loadFixedTransactions = async () => {
    try {
      const transactionsData = await fixedTransactionService.list();
      setFixedTransactions(transactionsData);
    } catch (error) {
      console.error('Erro ao carregar transacoes fixas:', error);
    }
  };

  // Load data on mount and month change
  useEffect(() => {
    loadData();
    loadFixedTransactions();
  }, [currentMonth, currentYear, user]);

  // Listen for global transaction changes
  useEffect(() => {
    const unsubscribe = onTransactionChange(() => {
      loadData();
      loadFixedTransactions();
    });
    return () => unsubscribe();
  }, [onTransactionChange]);

  // === TRANSACTION HANDLERS ===

  const handleEditTransaction = (transaction: any) => {
    setEditModalTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDeleteTransaction = (transactionId: number) => {
    const tx = monthlyTransactions.find((t: any) => t.id === transactionId);
    setDeleteTransactionId(transactionId);
    setDeleteTransactionDesc(tx?.descricao || '');
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteTransactionId) return;
    try {
      setIsSubmitting(true);
      const { error } = await transactionService.delete(deleteTransactionId.toString());
      if (error) throw new Error(error.message || 'Erro ao excluir');
      toast.success('Lancamento excluido');
      setIsDeleteModalOpen(false);
      setDeleteTransactionId(null);
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir transacao:', error);
      toast.error(error.message || 'Erro ao excluir transacao');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opens EfetivarModal for any transaction type
  const handleOpenEfetivar = (transaction: any) => {
    setEfetivarTransaction(transaction);
    setIsEfetivarModalOpen(true);
  };

  // Process effectuation (full or partial) from EfetivarModal
  const handleEfetivarConfirm = async (transaction: any, data: EfetivarData) => {
    try {
      setIsSubmitting(true);
      const isVirtual = transaction.is_virtual_fixed || transaction.is_virtual || transaction.fatura_details?.is_virtual;
      const fixoId = transaction.fixed_transaction_id || transaction.fixo_id || transaction.fatura_details?.fixo_id;
      const valorOriginal = Number(transaction.valor);
      const valorChanged = data.valorRecebido !== valorOriginal;

      if (isVirtual && fixoId) {
        // Virtual fixed transaction: create real transaction linked to the fixed rule
        const createData: any = {
          descricao: transaction.descricao,
          valor: data.valorRecebido,
          data: data.dataRecebimento,
          tipo: transaction.tipo,
          categoria_id: transaction.categoria_id || transaction.categoria?.id,
          conta_id: transaction.conta_id || undefined,
          cartao_id: transaction.cartao_id || undefined,
          status: 'confirmado' as const,
          fixo_id: fixoId,
          origem: 'fixo',
        };
        await transactionService.create(createData);
      } else {
        // Regular transaction: update status + value if changed
        if (valorChanged) {
          await transactionService.update(String(transaction.id), { valor: data.valorRecebido, data: data.dataRecebimento });
        }
        await transactionService.updateStatus(String(transaction.id), 'confirmado');
      }

      // Create remainder transaction if partial AND user opted in
      if (data.isParcial && data.criarRestante && data.valorRestante && data.valorRestante > 0) {
        const remainderData: any = {
          descricao: transaction.descricao,
          valor: data.valorRestante,
          data: data.dataVencimentoRestante || data.dataRecebimento,
          tipo: transaction.tipo,
          categoria_id: transaction.categoria_id || transaction.categoria?.id,
          conta_id: transaction.conta_id || undefined,
          cartao_id: transaction.cartao_id || undefined,
          status: 'pendente' as const,
        };
        await transactionService.create(remainderData);
      }

      toast.success(data.isParcial ? 'Efetivacao parcial realizada!' : 'Lancamento efetivado!');
      loadData();
    } catch (error: any) {
      console.error('Erro ao efetivar:', error);
      toast.error(error.message || 'Erro ao efetivar lancamento');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // === UNDO HANDLER (fixed + regular) ===

  const handleUndoTransaction = async (transactionId: number) => {
    if (!user) return;
    try {
      // Check if this is a fixed transaction by looking at monthlyTransactions
      const tx = monthlyTransactions.find((t: any) => t.id === transactionId);
      const isFixed = tx && (tx.origem === 'fixo' && tx.fixo_id);

      if (isFixed) {
        // Fixed transaction: delete the real record so the virtual reappears
        const { error } = await transactionService.delete(String(transactionId));
        if (error) throw new Error(error.message || 'Erro ao desfazer');
        toast.success('Efetivação desfeita!');
      } else {
        // Regular transaction: change status back to pendente
        await transactionService.updateStatus(String(transactionId), 'pendente');
        toast.success('Lançamento voltou para pendente');
      }
      loadData();
    } catch (error) {
      console.error('Erro ao desfazer:', error);
      toast.error('Erro ao desfazer efetivacao');
    }
  };

  // === DELETE FIXED VIRTUAL HANDLER ===

  const handleDeleteFixedVirtual = async (transaction: any, scope: 'this_month' | 'all') => {
    try {
      const fixoId = transaction.fixed_transaction_id || transaction.fixo_id || transaction.fatura_details?.fixo_id;
      if (!fixoId) {
        toast.error('Lancamento fixo nao identificado');
        return;
      }

      if (scope === 'all') {
        // Deactivate the fixed rule directly via supabase
        const { error } = await supabase
          .from('app_transacoes_fixas')
          .update({ ativo: false })
          .eq('id', fixoId)
          .eq('user_id', user!.id);
        if (error) throw error;
        toast.success('Lancamento fixo desativado');
      } else {
        // Create a confirmed+cancelled real transaction to block the virtual for this month
        const { error } = await supabase
          .from('app_transacoes')
          .insert({
            user_id: user!.id,
            descricao: transaction.descricao,
            valor: transaction.valor,
            data: transaction.data,
            tipo: transaction.tipo,
            categoria_id: transaction.categoria_id,
            conta_id: transaction.conta_id || null,
            cartao_id: transaction.cartao_id || null,
            status: 'cancelado',
            fixo_id: fixoId,
            origem: 'fixo',
          });
        if (error) throw error;
        toast.success('Lancamento cancelado para este mes');
      }
      loadData();
    } catch (error: any) {
      console.error('Erro ao excluir lancamento fixo:', error);
      toast.error(error.message || 'Erro ao excluir');
    }
  };

  // Handle save from TransactionEditModal (unified edit for all types)
  const handleEditModalSave = async (transaction: any, data: EditTransactionData) => {
    try {
      setIsSubmitting(true);
      const fixoId = transaction.fixed_transaction_id || transaction.fixo_id || transaction.fatura_details?.fixo_id;

      if (data.scope === 'from_now' && fixoId) {
        // Update the fixed rule (affects all future months)
        await fixedTransactionService.update(fixoId, {
          descricao: data.descricao,
          valor: data.valor,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id,
        });
        toast.success('Lancamento fixo atualizado para este mes em diante');
      } else if (data.scope === 'this_month' && fixoId) {
        // Query DB by fixo_id + month to find the real record
        // Usar formato YYYY-MM-DD direto para evitar problemas de fuso horario com toISOString()
        const [year, month] = data.data.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        const monthStartStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const monthEndStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const { data: existingRows } = await supabase
          .from('app_transacoes')
          .select('id')
          .eq('fixo_id', fixoId)
          .eq('user_id', user!.id)
          .gte('data', monthStartStr)
          .lte('data', monthEndStr)
          .neq('status', 'cancelado')
          .limit(1);

        if (existingRows && existingRows.length > 0) {
          // Real transaction exists: update it (nulls are stripped by TransactionService.update)
          const { error: updateError } = await transactionService.update(String(existingRows[0].id), {
            descricao: data.descricao,
            valor: data.valor,
            data: data.data,
            categoria_id: data.categoria_id,
            conta_id: data.conta_id,
          });
          if (updateError) throw updateError;
        } else {
          // No real transaction: fetch fixed rule for required fields, then create
          const fixedRule = await fixedTransactionService.getById(fixoId);
          if (!fixedRule) throw new Error('Regra fixa nao encontrada');

          const resolvedCategoriaId = data.categoria_id || fixedRule.categoria_id;
          const resolvedContaId = data.conta_id || fixedRule.conta_id;

          if (!resolvedCategoriaId) {
            throw new Error('Categoria nao encontrada. Selecione uma categoria.');
          }
          if (!resolvedContaId && fixedRule.tipo !== 'despesa_cartao') {
            throw new Error('Conta nao encontrada. Selecione uma conta.');
          }

          const { error: createError } = await transactionService.create({
            descricao: data.descricao,
            valor: data.valor,
            data: data.data,
            tipo: fixedRule.tipo as 'receita' | 'despesa' | 'despesa_cartao',
            categoria_id: resolvedCategoriaId,
            conta_id: resolvedContaId || undefined,
            cartao_id: fixedRule.cartao_id || undefined,
            status: 'pendente' as const,
            fixo_id: fixoId,
            origem: 'fixo',
          });
          if (createError) throw createError;
        }
        toast.success('Lancamento ajustado para este mes');
      } else {
        // Regular transaction (no fixo_id): update directly (nulls stripped by service)
        const { error: updateError } = await transactionService.update(String(transaction.id), {
          descricao: data.descricao,
          valor: data.valor,
          data: data.data,
          categoria_id: data.categoria_id,
          conta_id: data.conta_id,
        });
        if (updateError) throw updateError;
        toast.success('Lancamento atualizado');
      }

      await loadFixedTransactions();
      loadData();
    } catch (error: any) {
      console.error('Erro ao salvar edicao:', error);
      toast.error(error.message || 'Erro ao salvar alteracoes');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // === INVOICE HANDLERS ===

  const handlePayInvoice = (invoice: any) => {
    const faturaDetails = invoice.fatura_details || {};
    setSelectedInvoiceForPayment({
      id: invoice.id,
      cartao_id: invoice.cartao_id,
      mes: faturaDetails.mes,
      ano: faturaDetails.ano,
      valor_total: invoice.valor,
      status: invoice.status,
      data_vencimento: invoice.data,
      cartao: {
        nome: faturaDetails.cartao_nome,
        cor: faturaDetails.cartao_cor
      }
    });
    setIsPaymentModalOpen(true);
  };

  const handleDeleteInvoice = (transaction: any) => {
    const faturaDetails = transaction.fatura_details || {};
    setSelectedInvoiceForDelete({
      id: transaction.id,
      cartaoNome: faturaDetails.cartao_nome || 'Cartao',
      mes: faturaDetails.mes || currentMonth,
      ano: faturaDetails.ano || currentYear,
      valor: transaction.valor || 0
    });
    setIsDeleteInvoiceModalOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!selectedInvoiceForDelete || !user) return;
    try {
      const { data, error } = await supabase.rpc('excluir_fatura_completa', {
        p_fatura_id: selectedInvoiceForDelete.id,
        p_user_id: user.id
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast.success(`Fatura de ${selectedInvoiceForDelete.cartaoNome} excluida com sucesso!`);
        loadData();
      } else {
        toast.error(result?.error || 'Erro ao excluir fatura');
      }
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      toast.error('Erro ao excluir fatura');
    } finally {
      setIsDeleteInvoiceModalOpen(false);
      setSelectedInvoiceForDelete(null);
    }
  };

  // Navigate to cards module when clicking invoice in extract
  const handleInvoiceClick = (transaction: any) => {
    const cartaoId = transaction.cartao_id || transaction.fatura_details?.cartao_id;
    if (cartaoId) {
      navigate(`/cartoes?card_id=${cartaoId}`);
    }
  };

  const handleQuickAccountChange = async (transactionId: number | string, newAccountId: number, isFixed: boolean, fixedId?: number) => {
    try {
      if (isFixed && fixedId) {
        await fixedTransactionService.update(fixedId, { conta_id: newAccountId });
        toast.success('Conta atualizada para todos os meses');
      } else {
        await transactionService.update(String(transactionId), { conta_id: newAccountId });
        toast.success('Conta atualizada');
      }
      loadData();
    } catch (error) {
      console.error('Erro ao alterar conta:', error);
      toast.error('Erro ao alterar conta');
    }
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex justify-center">
        <MonthNavigator
          currentMonth={currentMonth}
          currentYear={currentYear}
          onMonthChange={handleMonthChange}
        />
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <FilterChip
          label="Todas"
          isActive={recurrenceFilter === 'all'}
          onClick={() => setRecurrenceFilter('all')}
        />
        <FilterChip
          label="Fixas"
          isActive={recurrenceFilter === 'fixa'}
          onClick={() => setRecurrenceFilter(recurrenceFilter === 'fixa' ? 'all' : 'fixa')}
        />
        <FilterChip
          label="Parceladas"
          isActive={recurrenceFilter === 'parcelada'}
          onClick={() => setRecurrenceFilter(recurrenceFilter === 'parcelada' ? 'all' : 'parcelada')}
        />
        <FilterChip
          label="Unicas"
          isActive={recurrenceFilter === 'unica'}
          onClick={() => setRecurrenceFilter(recurrenceFilter === 'unica' ? 'all' : 'unica')}
        />
      </div>

      {/* Filtro Receitas/Despesas - toggle segmentado à esquerda */}
      <div className="flex justify-start px-1">
        <div className="inline-flex items-center bg-slate-100 rounded-xl p-0.5 gap-0.5">
          <button
            onClick={() => setTipoFilter('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              tipoFilter === 'all'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Todos
          </button>
          <button
            onClick={() => setTipoFilter(tipoFilter === 'receita' ? 'all' : 'receita')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              tipoFilter === 'receita'
                ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-300'
                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
            )}
          >
            Receitas
          </button>
          <button
            onClick={() => setTipoFilter(tipoFilter === 'despesa' ? 'all' : 'despesa')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
              tipoFilter === 'despesa'
                ? 'bg-red-400 text-white shadow-sm ring-2 ring-red-300'
                : 'text-red-500 bg-red-50 hover:bg-red-100'
            )}
          >
            Despesas
          </button>
        </div>
      </div>

      {/* Category Filter Indicator */}
      {categoryFilter && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-coral-50 border border-coral-200 rounded-full">
            <Tag className="w-3.5 h-3.5 text-coral-500" />
            <span className="text-sm text-coral-700">Filtrado por categoria</span>
            <button
              onClick={clearCategoryFilter}
              className="p-0.5 hover:bg-coral-100 rounded-full transition-colors"
            >
              <XCircle className="w-4 h-4 text-coral-500" />
            </button>
          </div>
        </div>
      )}

      {/* Consolidated Transaction List */}
      <div className="space-y-3">
        <TransactionList
          ref={transactionListRef}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUndoFixedTransaction={handleUndoTransaction}
          onDeleteInvoice={handleDeleteInvoice}
          onInvoiceClick={handleInvoiceClick}
          onEfetivar={handleOpenEfetivar}
          onPayInvoice={handlePayInvoice}
          onDeleteFixedVirtual={handleDeleteFixedVirtual}
          onQuickAccountChange={handleQuickAccountChange}
          showFilters={true}
          defaultFilters={getDateFilters()}
          includeVirtualFixed={true}
          excludeCardTransactions={true}
          preloadedTransactions={monthlyTransactions}
          recurrenceFilter={recurrenceFilter}
          tipoFilter={tipoFilter}
        />
      </div>

      {/* Edit Transaction Modal (unified) */}
      <TransactionEditModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditModalTransaction(null); }}
        transaction={editModalTransaction}
        onSave={handleEditModalSave}
      />

      {/* Confirm Delete Transaction Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTransactionId(null); }}
        onConfirm={confirmDeleteTransaction}
        description={`Deseja excluir "${deleteTransactionDesc}"? Esta acao nao pode ser desfeita.`}
        isLoading={isSubmitting}
      />

      {/* Efetivar Modal */}
      <EfetivarModal
        isOpen={isEfetivarModalOpen}
        onClose={() => { setIsEfetivarModalOpen(false); setEfetivarTransaction(null); }}
        transaction={efetivarTransaction}
        onConfirm={handleEfetivarConfirm}
      />

      {/* Invoice Payment Modal */}
      {selectedInvoiceForPayment && (
        <InvoicePaymentModal
          invoice={selectedInvoiceForPayment}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoiceForPayment(null);
          }}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoiceForPayment(null);
            loadData();
          }}
        />
      )}

      {/* Confirm Delete Invoice Modal */}
      <ConfirmDeleteInvoiceModal
        isOpen={isDeleteInvoiceModalOpen}
        onClose={() => {
          setIsDeleteInvoiceModalOpen(false);
          setSelectedInvoiceForDelete(null);
        }}
        onConfirm={confirmDeleteInvoice}
        invoiceDetails={selectedInvoiceForDelete}
      />

    </div>
  );
}
