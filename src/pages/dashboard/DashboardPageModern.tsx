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
  const { openModal, TransactionModalComponent } = useTransactionModal();
  
  // Usar o contexto mensal em vez de estado local
  const {
    consolidatedData,
    loading,
    error,
    currentMonth,
    currentYear,
    fetchMonthData,
    refreshData
  } = useMonthlyDashboard();
  
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
      {/* Header com saudação à esquerda e navegador centralizado */}
      <div className="relative flex items-center mb-6">
        {/* Saudação à esquerda */}
        <div className="flex-shrink-0">
          <WelcomeHeader 
            userName={userProfile?.nome || user?.email?.split('@')[0] || 'Usuário'} 
          />
        </div>
        
        {/* Navegador centralizado na página */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <MonthNavigator
            currentMonth={currentMonth}
            currentYear={currentYear}
            onMonthChange={handleMonthChange}
          />
        </div>
      </div>

      <div className={cn(
        classes.grid,
        size === 'compact' ? 'h-[calc(100vh-265px)]' : 'h-[calc(100vh-220px)]' // Ajuste final para compact
      )}>
        <div className={cn(
          size === 'mobile' ? 'col-span-1' : 'lg:col-span-3',
          'flex flex-col',
          size === 'compact' ? 'gap-2' : 'gap-3'
        )}>
          <SaldoScore
            saldo={loading ? 0 : consolidatedData.saldoPrevisto}
            metaPercentual={consolidatedData.metaPercentual}
            receitaMensal={consolidatedData.receitaMensal}
          />
          <div className="flex-1 min-h-0">
            <IntegratedChat />
          </div>
        </div>

        <div className={cn(
          size === 'mobile' ? 'col-span-1' : 'lg:col-span-2',
          'flex flex-col',
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


          <div className="flex-1 min-h-0">
            <MiniCalendario />
          </div>
        </div>
      </div>

      {/* Botão FAB - Novo Lançamento */}
      <NewTransactionButton 
        onSelect={handleNewTransaction}
        className="fixed bottom-6 right-6 z-50"
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
