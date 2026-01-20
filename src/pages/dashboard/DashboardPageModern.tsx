import { motion } from 'framer-motion';
import { useAuth } from '../../store/AuthContext';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { cn } from '../../utils/cn';
import {
  WelcomeHeader
} from '../../components/ui/modern';
import MonthNavigator from '../../components/ui/modern/MonthNavigator';
import SimpleMetricCard from '../../components/ui/modern/SimpleMetricCard';
import SaldoScore from '../../components/dashboard/SaldoScore';
import DivisaoCategoriaCard from '../../components/dashboard/DivisaoCategoriaCard';
import FluxoMensalChart from '../../components/dashboard/FluxoMensalChart';
import ProximasTransacoesCard from '../../components/dashboard/ProximasTransacoesCard';
import AlertaInteligenteCard from '../../components/dashboard/AlertaInteligenteCard';
import NewTransactionButton from '../../components/dashboard/NewTransactionButton';
import { useTransactionModal } from '../../hooks/useTransactionModal';
import { MonthlyDashboardProvider, useMonthlyDashboard } from '../../contexts/MonthlyDashboardContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity
} from 'lucide-react';

// Animacoes escalonadas
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

// Componente interno que usa o contexto mensal
function DashboardContent() {
  const { user, userProfile } = useAuth();
  const { size, classes } = useResponsiveClasses();

  // Usar o contexto mensal
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

  // Handler para mudanca de mes via navegacao
  const handleMonthChange = (month: number, year: number) => {
    console.log(`Navegando para: ${month}/${year}`);
    fetchMonthData(month, year);
  };

  // Mostrar erro se houver
  if (error) {
    return (
      <div className={classes.container}>
        <WelcomeHeader userName={userProfile?.nome || user?.email?.split('@')[0] || 'Usuario'} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">Erro ao carregar dados do dashboard</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleNewTransaction = (type: 'receita' | 'despesa' | 'despesa_cartao') => {
    console.log('Novo lancamento do tipo:', type);
    openModal(type);
  };

  return (
    <motion.div
      className={classes.container}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header responsivo */}
      {size === 'mobile' ? (
        /* Layout mobile: elementos empilhados verticalmente */
        <motion.div variants={itemVariants} className="flex flex-col space-y-3 mb-4">
          <div className="flex-shrink-0">
            <WelcomeHeader
              userName={userProfile?.nome || user?.email?.split('@')[0] || 'Usuario'}
              rightContent={null}
            />
          </div>
          <div className="flex justify-center">
            <MonthNavigator
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={handleMonthChange}
            />
          </div>
        </motion.div>
      ) : (
        /* Layout desktop: saudacao a esquerda e navegador centralizado */
        <motion.div variants={itemVariants} className="relative flex items-center mb-6">
          <div className="flex-shrink-0">
            <WelcomeHeader
              userName={userProfile?.nome || user?.email?.split('@')[0] || 'Usuario'}
              rightContent={null}
            />
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <MonthNavigator
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={handleMonthChange}
            />
          </div>
        </motion.div>
      )}

      {size === 'mobile' ? (
        /* ============================================
           LAYOUT MOBILE - KPIs em grid, depois cards
           ============================================ */
        <div className="flex flex-col space-y-4 pb-24">
          {/* 5 KPIs - Grid 3 + 2 */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <SaldoScore
                saldo={consolidatedData.saldoPrevisto || 0}
                isLoading={loading}
              />
              <SimpleMetricCard
                title="Saldo Contas"
                value={consolidatedData.totalSaldo}
                icon={<DollarSign className="w-3 h-3" />}
                isLoading={loading}
                colorScheme="blue"
              />
              <SimpleMetricCard
                title="Receitas"
                value={consolidatedData.totalReceitas}
                icon={<TrendingUp className="w-3 h-3" />}
                isLoading={loading}
                colorScheme="green"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SimpleMetricCard
                title="Despesas"
                value={consolidatedData.totalDespesas}
                icon={<TrendingDown className="w-3 h-3" />}
                isLoading={loading}
                colorScheme="coral"
              />
              <SimpleMetricCard
                title="Economia"
                value={consolidatedData.economiaMes}
                icon={<Activity className="w-3 h-3" />}
                isLoading={loading}
                colorScheme="neutral"
              />
            </div>
          </motion.div>

          {/* Alerta Inteligente */}
          <motion.div variants={itemVariants}>
            <AlertaInteligenteCard />
          </motion.div>

          {/* Proximas Transacoes */}
          <motion.div variants={itemVariants}>
            <ProximasTransacoesCard limit={3} />
          </motion.div>

          {/* Grafico de Fluxo */}
          <motion.div variants={itemVariants} className="h-56">
            <FluxoMensalChart months={4} />
          </motion.div>

          {/* Divisao por Categoria */}
          <motion.div variants={itemVariants}>
            <DivisaoCategoriaCard />
          </motion.div>
        </div>
      ) : (
        /* ============================================
           LAYOUT DESKTOP - 5 KPIs em linha no topo
           ============================================ */
        <div className="flex flex-col gap-4">
          {/* LINHA 1: 5 KPIs em linha */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-5 gap-3">
              <SaldoScore
                saldo={consolidatedData.saldoPrevisto || 0}
                isLoading={loading}
              />
              <SimpleMetricCard
                title="Saldo das Contas"
                value={consolidatedData.totalSaldo}
                icon={<DollarSign className={classes.iconSize} />}
                isLoading={loading}
                colorScheme="blue"
              />
              <SimpleMetricCard
                title="Receitas do Mes"
                value={consolidatedData.totalReceitas}
                icon={<TrendingUp className={classes.iconSize} />}
                isLoading={loading}
                colorScheme="green"
              />
              <SimpleMetricCard
                title="Despesas do Mes"
                value={consolidatedData.totalDespesas}
                icon={<TrendingDown className={classes.iconSize} />}
                isLoading={loading}
                colorScheme="coral"
              />
              <SimpleMetricCard
                title="Economia"
                value={consolidatedData.economiaMes}
                icon={<Activity className={classes.iconSize} />}
                isLoading={loading}
                colorScheme="neutral"
              />
            </div>
          </motion.div>

          {/* LINHA 2: FluxoMensal | Divisao por Categoria */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <div className="h-72">
              <FluxoMensalChart months={4} />
            </div>
            <div className="h-72">
              <DivisaoCategoriaCard />
            </div>
          </motion.div>

          {/* LINHA 3: ProximasTransacoes | AlertaInteligente */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <ProximasTransacoesCard limit={5} />
            <AlertaInteligenteCard />
          </motion.div>
        </div>
      )}

      {/* Botao FAB - Novo Lancamento */}
      <NewTransactionButton
        onSelect={handleNewTransaction}
        className={cn(
          "fixed z-50",
          size === 'mobile' ? "bottom-4 right-4" : "bottom-6 right-6"
        )}
      />

      {/* Modal de Novo Lancamento */}
      <TransactionModalComponent />
    </motion.div>
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
