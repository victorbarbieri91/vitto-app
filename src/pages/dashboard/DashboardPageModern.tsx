import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { cn } from '../../utils/cn';
import { 
  WelcomeHeader
} from '../../components/ui/modern';
import MonthNavigator from '../../components/ui/modern/MonthNavigator';
import SimpleMetricCard from '../../components/ui/modern/SimpleMetricCard';
import SaldoScore from '../../components/dashboard/SaldoScore';
import MiniCalendario from '../../components/dashboard/MiniCalendario';
import IntegratedChat from '../../components/chat/IntegratedChat';
import SmartFinancialChat from '../../components/chat/SmartFinancialChat';
import NewTransactionButton from '../../components/dashboard/NewTransactionButton';
import MonthTransactionsList from '../../components/dashboard/MonthTransactionsList';
import { useTransactionModal } from '../../hooks/useTransactionModal';
import { MonthlyDashboardProvider, useMonthlyDashboard } from '../../contexts/MonthlyDashboardContext';
import { useMonthNavigation } from '../../hooks/useMonthNavigation';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
} from 'lucide-react';

// Componente interno que usa o contexto mensal
function DashboardContent() {
  const { user, userProfile } = useAuth();
  const { size, classes } = useResponsiveClasses();

  // Usar o contexto mensal em vez de estado local - DEVE VIR PRIMEIRO
  const {
    consolidatedData,
    loading,
    error,
    currentMonth,
    currentYear,
    fetchMonthData,
    refreshData
  } = useMonthlyDashboard();

  const { openModal, TransactionModalComponent } = useTransactionModal(refreshData);
  
  // Navegação mensal
  const monthNavigation = useMonthNavigation(currentMonth, currentYear);

  // Handler para mudança de mês via navegação
  const handleMonthChange = (month: number, year: number) => {
    console.log(`📅 Navegando para: ${month}/${year}`);
    fetchMonthData(month, year);
  };
  
  // Mostrar erro se houver
  if (error) {
    return (
      <div className={classes.container}>
        <WelcomeHeader userName={userProfile?.nome || user?.email?.split('@')[0] || 'Usuário'} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">Erro ao carregar dados do dashboard</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleNewTransaction = (type: 'receita' | 'despesa' | 'despesa_cartao') => {
    console.log('Novo lançamento do tipo:', type);
    openModal(type);
  };


  return (
    <div className={classes.container}>
      {/* FORÇAR UPDATE */}
      {/* Header responsivo */}
      {size === 'mobile' ? (
        /* Layout mobile: elementos empilhados verticalmente */
        <div className="flex flex-col space-y-3 mb-4">
          <div className="flex-shrink-0">
            <WelcomeHeader
              userName={userProfile?.nome || user?.email?.split('@')[0] || 'Usuário'}
            />
          </div>
          <div className="flex justify-center">
            <MonthNavigator
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={handleMonthChange}
            />
          </div>
        </div>
      ) : (
        /* Layout desktop: saudação à esquerda e navegador centralizado */
        <div className="relative flex items-center mb-6">
          <div className="flex-shrink-0">
            <WelcomeHeader
              userName={userProfile?.nome || user?.email?.split('@')[0] || 'Usuário'}
            />
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <MonthNavigator
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={handleMonthChange}
            />
          </div>
        </div>
      )}

      {size === 'mobile' ? (
        /* Layout mobile reorganizado: saldo compacto + cards + chat expandido */
        <div className="flex flex-col space-y-4 min-h-[calc(100vh-120px)] pb-20">
          {/* 1. Saldo Score compacto */}
          <div className="flex-shrink-0 mb-2">
            <SaldoScore
              saldo={loading ? 0 : consolidatedData.saldoPrevisto}
              metaPercentual={consolidatedData.metaPercentual}
              receitaMensal={consolidatedData.receitaMensal}
            />
          </div>

          {/* 2. Cards financeiros compactos em grid 2x2 */}
          <div className="flex-shrink-0 px-1 mb-3">
            <div className="grid grid-cols-2 gap-2">
              <SimpleMetricCard
                title="Saldo das Contas"
                value={consolidatedData.totalSaldo}
                icon={<DollarSign className="w-3 h-3" />}
                isLoading={loading}
              />
              <SimpleMetricCard
                title="Receitas do Mês"
                value={consolidatedData.totalReceitas}
                icon={<TrendingUp className="w-3 h-3" />}
                isLoading={loading}
              />
              <SimpleMetricCard
                title="Despesas do Mês"
                value={consolidatedData.totalDespesas}
                icon={<TrendingDown className="w-3 h-3" />}
                isLoading={loading}
              />
              <SimpleMetricCard
                title="Economia"
                value={consolidatedData.economiaMes}
                icon={<Activity className="w-3 h-3" />}
                isLoading={loading}
              />
            </div>
          </div>

          {/* 3. Chat expandido - pega o espaço restante */}
          <div className="flex-1 min-h-[420px] mb-5">
            <SmartFinancialChat />
            {/* <IntegratedChat /> */}
          </div>

          {/* 4. Calendário compacto para mobile */}
          <div className="flex-shrink-0 mb-6">
            <MiniCalendario />
          </div>
        </div>
      ) : (
        /* Layout desktop/tablet original */
        <div className={cn(
          classes.grid,
          size === 'compact' ? 'h-[calc(100vh-265px)]' : 'h-[calc(100vh-220px)]'
        )}>
          {/* Primeira coluna - Saldo Score e Chat */}
          <div className={cn(
            'lg:col-span-3 flex flex-col',
            size === 'compact' ? 'gap-2' : 'gap-3'
          )}>
            <SaldoScore
              saldo={loading ? 0 : consolidatedData.saldoPrevisto}
              metaPercentual={consolidatedData.metaPercentual}
              receitaMensal={consolidatedData.receitaMensal}
            />
            <div className="flex-1 min-h-0">
              <SmartFinancialChat />
              {/* <IntegratedChat /> */}
            </div>
          </div>

          {/* Segunda coluna - Cards de métricas e Calendário */}
          <div className={cn(
            'lg:col-span-2 flex flex-col',
            size === 'compact' ? 'gap-2' : 'gap-3'
          )}>
            <div className="relative">
              <div className={classes.metricGrid}>
                <SimpleMetricCard
                  title="Saldo das Contas"
                  value={consolidatedData.totalSaldo}
                  icon={<DollarSign className={classes.iconSize} />}
                  isLoading={loading}
                />
                <SimpleMetricCard
                  title="Receitas do Mês"
                  value={consolidatedData.totalReceitas}
                  icon={<TrendingUp className={classes.iconSize} />}
                  isLoading={loading}
                />
                <SimpleMetricCard
                  title="Despesas do Mês"
                  value={consolidatedData.totalDespesas}
                  icon={<TrendingDown className={classes.iconSize} />}
                  isLoading={loading}
                />
                <SimpleMetricCard
                  title="Economia"
                  value={consolidatedData.economiaMes}
                  icon={<Activity className={classes.iconSize} />}
                  isLoading={loading}
                />
              </div>
            </div>

            {/* Calendário apenas em desktop/tablet */}
            <div className="flex-1 min-h-0">
              <MiniCalendario />
            </div>
          </div>
        </div>
      )}

      {/* Botão FAB - Novo Lançamento */}
      <NewTransactionButton
        onSelect={handleNewTransaction}
        className={cn(
          "fixed z-50",
          size === 'mobile' ? "bottom-4 right-4" : "bottom-6 right-6"
        )}
      />

      {/* Modal de Novo Lançamento */}
      <TransactionModalComponent />
    </div>
  );
}

// Componente principal que envolve com o Provider
export default function DashboardPageModern() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }
  
  return (
    <MonthlyDashboardProvider userId={user.id}>
      <DashboardContent />
    </MonthlyDashboardProvider>
  );
}
