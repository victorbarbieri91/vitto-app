import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// CACHE INVALIDATION: Force refresh after saldo previsto logic fix - 2025-09-16
import { supabase } from '../services/supabase/client';
import { saldoService, type MetricasFinanceiras } from '../services/api/SaldoService';
import { transactionService } from '../services/api/TransactionService';
import { fixedTransactionService } from '../services/api/FixedTransactionService';
import { useTransactionContext } from '../store/TransactionContext';
import { faturaService } from '../services/api/FaturaService';

interface MonthlyDashboardData {
  conta_id: number;
  conta_nome: string;
  saldo_atual: number;
  saldo_previsto: number;
  receitas_confirmadas: number;
  despesas_confirmadas: number;
  fluxo_liquido: number;
  taxa_economia: number;
  burn_rate: number;
  tendencia_despesas: 'positivo' | 'negativo' | 'neutro';
  score_saude_financeira: number;
  media_movel_3meses: number;
  variacao_mes_anterior: number;
  status_orcamento: string;
}

// Interface para dados detalhados dos KPIs (memória de cálculo)
export interface KPIDetailData {
  // Saldo Previsto - composição
  saldoAtualTotal: number;
  receitasPendentes: number;
  despesasPendentes: number;
  receitasFixasNaoGeradas: number;
  despesasFixasNaoGeradas: number;
  faturasMes: number;

  // Receitas - composição
  receitasConfirmadas: number;

  // Despesas - composição
  despesasConfirmadas: number;

  // Contas individuais (para Saldo em Conta Corrente)
  contas: Array<{
    id: number;
    nome: string;
    saldo_atual: number;
    tipo?: string;
    cor?: string;
  }>;
}

interface MonthlyDashboardContextValue {
  // Dados
  data: MonthlyDashboardData[];
  consolidatedData: {
    totalSaldo: number;
    totalReceitas: number;
    totalDespesas: number;
    fluxoLiquido: number;
    saldoPrevisto: number;
    economiaMes: number;
    // Simplificado - removidos campos duplicados
    resultadoMes: number;
    mediaTaxaEconomia: number;
    mediaScore: number;
    // Dados de meta
    receitaMensal: number;
    metaPercentual: number;
  };

  // Dados detalhados para memória de cálculo dos KPIs
  kpiDetailData: KPIDetailData;
  
  // Estado
  loading: boolean;
  error: string | null;
  
  // Período atual
  currentMonth: number;
  currentYear: number;
  
  // Ações
  fetchMonthData: (month: number, year: number) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // Novas funções usando SaldoService
  getConsolidatedMetrics: (month?: number, year?: number) => Promise<MetricasFinanceiras>;
  getSaldoAtualTotal: () => Promise<number>;
  getSaldoPrevistoTotal: (dataLimite?: string) => Promise<number>;
  
  // Funções para gerenciar transações
  generateFixedTransactions: (month: number, year: number) => Promise<number>;
}

const MonthlyDashboardContext = createContext<MonthlyDashboardContextValue | undefined>(undefined);

interface MonthlyDashboardProviderProps {
  children: ReactNode;
  userId: string;
}

export const MonthlyDashboardProvider: React.FC<MonthlyDashboardProviderProps> = ({
  children,
  userId
}) => {
  const [data, setData] = useState<MonthlyDashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());

  // Contexto global para escutar mudanças nas transações
  const { onTransactionChange } = useTransactionContext();

  // Estados para dados de meta
  const [receitaMensal, setReceitaMensal] = useState(0);
  const [metaPercentual, setMetaPercentual] = useState(80);

  // Função para buscar dados de meta do usuário
  const fetchUserGoalData = async () => {
    try {
      const { data, error } = await supabase
        .from('app_perfil')
        .select('receita_mensal_estimada, meta_despesa_percentual')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setReceitaMensal(Number(data.receita_mensal_estimada) || 0);
        setMetaPercentual(Number(data.meta_despesa_percentual) || 80);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de meta:', error);
    }
  };

  const fetchMonthData = async (month: number, year: number) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentMonth(month);
      setCurrentYear(year);

      // Sistema de transações virtuais - não precisa gerar automaticamente
      console.log(`🔄 Sistema de transações virtuais ativo para ${month}/${year}`);
      
      // Usar SaldoService em vez da função RPC
      console.log(`🔄 Buscando dados via SaldoService para ${month}/${year}`);
      
      // Obter métricas financeiras usando o novo sistema
      const metricas = await saldoService.obterMetricasFinanceiras(month, year, userId);
      
      // Buscar todas as contas ativas do usuário
      const { data: contas, error: contasError } = await supabase
        .from('app_conta')
        .select('id, nome')
        .eq('user_id', userId)
        .eq('status', 'ativa')
        .order('nome');

      if (contasError) {
        console.error('Erro ao buscar contas:', contasError);
        setError(contasError.message);
        return;
      }

      // Para cada conta, buscar ou criar dados consolidados
      const processedData: MonthlyDashboardData[] = [];
      
      if (contas && contas.length > 0) {
        for (const conta of contas) {
          // Obter indicadores da conta para o mês
          const indicadores = await saldoService.getIndicadoresMes(month, year, conta.id);
          
          if (indicadores) {
            processedData.push({
              conta_id: conta.id,
              conta_nome: conta.nome,
              saldo_atual: Number(indicadores.saldo_atual),
              saldo_previsto: Number(indicadores.saldo_previsto),
              receitas_confirmadas: Number(indicadores.receitas_confirmadas),
              despesas_confirmadas: Number(indicadores.despesas_confirmadas),
              fluxo_liquido: Number(indicadores.fluxo_liquido),
              taxa_economia: Number(indicadores.taxa_economia),
              burn_rate: 0, // Calcular depois se necessário
              tendencia_despesas: indicadores.fluxo_liquido > 0 ? 'positivo' : 
                                 indicadores.fluxo_liquido < 0 ? 'negativo' : 'neutro',
              score_saude_financeira: Number(indicadores.score_saude_financeira),
              media_movel_3meses: Number(indicadores.saldo_atual), // Simplificado
              variacao_mes_anterior: 0, // Calcular depois se necessário
              status_orcamento: 'sem_orcamento'
            });
          } else {
            // Se não há indicadores, criar com zeros mas incluir a conta
            processedData.push({
              conta_id: conta.id,
              conta_nome: conta.nome,
              saldo_atual: 0,
              saldo_previsto: 0,
              receitas_confirmadas: 0,
              despesas_confirmadas: 0,
              fluxo_liquido: 0,
              taxa_economia: 0,
              burn_rate: 0,
              tendencia_despesas: 'neutro',
              score_saude_financeira: 50,
              media_movel_3meses: 0,
              variacao_mes_anterior: 0,
              status_orcamento: 'sem_orcamento'
            });
          }
        }
      }

      console.log(`✅ Dados carregados via SaldoService:`, processedData);
      console.log(`🎯 Dados consolidados calculados:`, {
        totalReceitas: processedData.reduce((sum, item) => sum + item.receitas_confirmadas, 0),
        totalDespesas: processedData.reduce((sum, item) => sum + item.despesas_confirmadas, 0),
        fluxoLiquido: processedData.reduce((sum, item) => sum + item.fluxo_liquido, 0)
      });
      setData(processedData);

      // Atualizar dados consolidados do dashboard para o mês específico
      await updateDashboardData(month, year);
    } catch (err) {
      console.error('Erro inesperado ao usar SaldoService:', err);
      setError('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchMonthData(currentMonth, currentYear);
  };

  // Nova função para obter métricas consolidadas usando SaldoService
  const getConsolidatedMetrics = async (month?: number, year?: number): Promise<MetricasFinanceiras> => {
    try {
      return await saldoService.obterMetricasFinanceiras(
        month || currentMonth, 
        year || currentYear, 
        userId
      );
    } catch (error) {
      console.error('Erro ao obter métricas consolidadas:', error);
      return {
        saldo_atual: 0,
        saldo_previsto: 0,
        receitas_confirmadas: 0,
        despesas_confirmadas: 0,
        receitas_pendentes: 0,
        despesas_pendentes: 0,
        fluxo_liquido: 0
      };
    }
  };

  // Função auxiliar para obter saldo atual total do usuário
  const getSaldoAtualTotal = async (): Promise<number> => {
    try {
      return await saldoService.calcularSaldoAtual(userId);
    } catch (error) {
      console.error('Erro ao calcular saldo atual total:', error);
      return 0;
    }
  };

  // Função auxiliar para obter saldo previsto total do usuário
  const getSaldoPrevistoTotal = async (dataLimite?: string): Promise<number> => {
    try {
      return await saldoService.calcularSaldoPrevisto(userId, dataLimite);
    } catch (error) {
      console.error('Erro ao calcular saldo previsto total:', error);
      return 0;
    }
  };

  // Função para gerar transações fixas - REMOVIDA: agora usa sistema virtual
  const generateFixedTransactions = async (month: number, year: number): Promise<number> => {
    console.log('🔄 Sistema de transações virtuais - geração automática desabilitada');
    return 0; // Não gera mais transações automaticamente
  };

  // Estados para dados consolidados em tempo real
  const [saldoAtualTotal, setSaldoAtualTotal] = useState(0);
  const [saldoPrevistoTotal, setSaldoPrevistoTotal] = useState(0);
  const [receitasMes, setReceitasMes] = useState(0);
  const [despesasMes, setDespesasMes] = useState(0);

  // Estados para dados detalhados dos KPIs (memória de cálculo)
  const [kpiDetailData, setKpiDetailData] = useState<KPIDetailData>({
    saldoAtualTotal: 0,
    receitasPendentes: 0,
    despesasPendentes: 0,
    receitasFixasNaoGeradas: 0,
    despesasFixasNaoGeradas: 0,
    faturasMes: 0,
    receitasConfirmadas: 0,
    despesasConfirmadas: 0,
    contas: [],
  });

  // Buscar dados consolidados do dashboard para um mês específico
  const updateDashboardData = async (month?: number, year?: number) => {
    try {
      const targetMonth = month || currentMonth;
      const targetYear = year || currentYear;

      console.log(`📊 Buscando dados do dashboard para ${targetMonth}/${targetYear} - usuário ${userId}`);

      // Auto-close faturas whose closing date has passed
      await faturaService.autoCloseInvoices(userId);

      // Usar a nova função obter_dashboard_mes para dados mensais específicos
      const { data, error } = await supabase.rpc('obter_dashboard_mes', {
        p_user_id: userId,
        p_mes: targetMonth,
        p_ano: targetYear
      });

      if (error) {
        console.error('❌ Erro ao buscar dashboard mensal:', error);

        // Fallback: tentar função original com parâmetros mensais
        console.log('🔄 Tentando função obter_dashboard_resumo como fallback...');
        const { data: fallbackData, error: fallbackError } = await supabase.rpc('obter_dashboard_resumo', {
          p_user_id: userId,
          p_mes: targetMonth,
          p_ano: targetYear
        });

        if (fallbackError) {
          console.error('❌ Erro no fallback:', fallbackError);
          return;
        }

        const indicadores = fallbackData.indicadores;
        console.log(`📊 Dados do dashboard recebidos (fallback):`, indicadores);

        setSaldoAtualTotal(Number(indicadores.saldo_atual));
        setSaldoPrevistoTotal(Number(indicadores.saldo_previsto));
        setReceitasMes(Number(indicadores.receitas_mes));
        setDespesasMes(Number(indicadores.despesas_mes));
        return;
      }

      // Usar dados da nova função obter_dashboard_mes (com lógica corrigida)
      const indicadores = data.indicadores_mes;
      console.log(`📊 NOVA LÓGICA - Dados mensais específicos recebidos para ${targetMonth}/${targetYear}:`, indicadores);
      console.log(`🔍 NOVA LÓGICA - Debug info:`, data.debug_info);
      console.log(`🎯 NOVA LÓGICA - Tipo período:`, data.tipo_periodo);

      // Usar campos corretos da RPC corrigida
      setSaldoAtualTotal(Number(indicadores.saldo_atual_total));
      setSaldoPrevistoTotal(Number(indicadores.saldo_previsto_fim_mes)); // Fórmula corrigida na RPC
      // Usar TOTAIS (confirmado + pendente + fixas) para visão completa do mês
      // O breakdown confirmado/previsto é mostrado nos subtitles dos KPIs
      setReceitasMes(Number(indicadores.total_receitas_mes)); // Receitas totais do mês
      setDespesasMes(Number(indicadores.total_despesas_mes)); // Despesas totais do mês

      console.log(`🎯 Valores interpretados:`, {
        saldoAtual: Number(indicadores.saldo_atual_total),
        saldoPrevisto: Number(indicadores.saldo_previsto_fim_mes),
        receitasTotais: Number(indicadores.total_receitas_mes),
        despesasTotais: Number(indicadores.total_despesas_mes),
        receitasConfirmadas: Number(indicadores.receitas_confirmadas),
        despesasConfirmadas: Number(indicadores.despesas_confirmadas),
      });

      // Atualizar dados detalhados para memória de cálculo dos KPIs
      const contasArray = data.contas || [];
      setKpiDetailData({
        saldoAtualTotal: Number(indicadores.saldo_atual_total) || 0,
        receitasPendentes: Number(indicadores.receitas_pendentes) || 0,
        despesasPendentes: Number(indicadores.despesas_pendentes) || 0,
        receitasFixasNaoGeradas: Number(indicadores.receitas_fixas_nao_geradas) || 0,
        despesasFixasNaoGeradas: Number(indicadores.despesas_fixas_nao_geradas) || 0,
        faturasMes: Number(indicadores.fatura_mes_atual) || 0,
        receitasConfirmadas: Number(indicadores.receitas_confirmadas) || 0,
        despesasConfirmadas: Number(indicadores.despesas_confirmadas) || 0,
        contas: contasArray.map((conta: any) => ({
          id: conta.id,
          nome: conta.nome,
          saldo_atual: Number(conta.saldo_atual) || 0,
          tipo: conta.tipo,
          cor: conta.cor,
        })),
      });

    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
    }
  };

  // Dados consolidados usando lógica financeira correta
  const consolidatedData = React.useMemo(() => {
    // ECONOMIA DO MÊS = apenas fluxo mensal (receitas - despesas) SEM saldo anterior
    const economiaMes = receitasMes - despesasMes;

    // USAR O SALDO PREVISTO JÁ CALCULADO PELA RPC (não recalcular localmente)
    // A RPC já calcula: saldo_atual + receitas_pendentes - despesas_pendentes

    return {
      // Saldos
      totalSaldo: saldoAtualTotal, // Saldo atual real das contas
      saldoPrevisto: saldoPrevistoTotal, // Usar valor já calculado pela RPC

      // Fluxos mensais (sem saldo anterior)
      totalReceitas: receitasMes, // Receitas do mês (excluindo saldo inicial)
      totalDespesas: despesasMes, // Despesas do mês
      fluxoLiquido: receitasMes - despesasMes, // Fluxo líquido mensal apenas
      economiaMes: economiaMes, // Economia = fluxo mensal (sem saldo anterior)

      // Métricas derivadas
      resultadoMes: economiaMes, // Resultado mensal = economia mensal
      mediaTaxaEconomia: receitasMes > 0 ? (economiaMes / receitasMes) * 100 : 0,
      mediaScore: economiaMes > 0 ? Math.min(100, 50 + (economiaMes / receitasMes) * 50) : 50,

      // Dados de meta
      receitaMensal: receitaMensal,
      metaPercentual: metaPercentual,
    };
  }, [saldoAtualTotal, saldoPrevistoTotal, receitasMes, despesasMes, receitaMensal, metaPercentual]);

  // Carregar dados do mês atual na inicialização
  useEffect(() => {
    if (userId) {
      fetchUserGoalData(); // Buscar dados de meta
      fetchMonthData(currentMonth, currentYear);
      // updateDashboardData já é chamado dentro de fetchMonthData
    }
  }, [userId]);

  // Atualizar dashboard quando mudar o mês
  useEffect(() => {
    if (userId) {
      updateDashboardData(currentMonth, currentYear);
    }
  }, [currentMonth, currentYear]);

  // Escutar mudanças globais nas transações e atualizar automaticamente
  useEffect(() => {
    const unsubscribe = onTransactionChange((event) => {
      console.log('[MonthlyDashboard] Recebeu notificação de mudança:', event);
      // Atualizar todos os dados do dashboard
      if (userId) {
        fetchMonthData(currentMonth, currentYear);
      }
    });

    return () => unsubscribe();
  }, [onTransactionChange, userId, currentMonth, currentYear]);

  const value: MonthlyDashboardContextValue = {
    data,
    consolidatedData,
    kpiDetailData,
    loading,
    error,
    currentMonth,
    currentYear,
    fetchMonthData,
    refreshData,
    getConsolidatedMetrics,
    getSaldoAtualTotal,
    getSaldoPrevistoTotal,
    generateFixedTransactions,
  };

  return (
    <MonthlyDashboardContext.Provider value={value}>
      {children}
    </MonthlyDashboardContext.Provider>
  );
};

export const useMonthlyDashboard = () => {
  const context = useContext(MonthlyDashboardContext);
  if (context === undefined) {
    throw new Error('useMonthlyDashboard must be used within a MonthlyDashboardProvider');
  }
  return context;
};