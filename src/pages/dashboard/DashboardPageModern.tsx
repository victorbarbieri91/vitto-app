import { motion } from 'framer-motion';
import { useAuth } from '../../store/AuthContext';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
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
import { useKPIDetailModal } from '../../hooks/useKPIDetailModal';
import { MonthlyDashboardProvider, useMonthlyDashboard } from '../../contexts/MonthlyDashboardContext';
import KPIDetailModal from '../../components/modals/KPIDetailModal';
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
    kpiDetailData,
    loading,
    error,
    currentMonth,
    currentYear,
    fetchMonthData
  } = useMonthlyDashboard();

  // Hook para modal de detalhes dos KPIs
  const { isOpen: isKPIModalOpen, kpiType, openModal: openKPIModal, closeModal: closeKPIModal } = useKPIDetailModal();

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

  // Helper para subtitles dos KPIs (mostra valor efetivado quando há previstos)
  const fmtShort = (v: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(v);

  const receitasConfirmadas = kpiDetailData.receitasConfirmadas;
  const despesasConfirmadas = kpiDetailData.despesasConfirmadas;
  const receitasPrevistas = consolidatedData.totalReceitas - receitasConfirmadas;
  const despesasPrevistas = consolidatedData.totalDespesas - despesasConfirmadas;

  const receitasSubtitle = receitasPrevistas > 0
    ? `${fmtShort(receitasConfirmadas)} efetivado`
    : undefined;
  const despesasSubtitle = despesasPrevistas > 0
    ? `${fmtShort(despesasConfirmadas)} efetivado`
    : undefined;
  const economiaConfirmada = receitasConfirmadas - despesasConfirmadas;
  const economiaSubtitle = (receitasPrevistas > 0 || despesasPrevistas > 0)
    ? `${fmtShort(economiaConfirmada)} efetivado`
    : undefined;

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
          {/* KPIs - Receitas+Despesas, Saldo+Economia, Saldo Previsto */}
          <motion.div variants={itemVariants} className="space-y-2">
            {/* Linha 1: Receitas + Despesas */}
            <div className="grid grid-cols-2 gap-2">
              <SimpleMetricCard
                title="Receitas"
                value={consolidatedData.totalReceitas}
                subtitle={receitasSubtitle}
                icon={<TrendingUp className="w-3 h-3" />}
                isLoading={loading}
                colorScheme="green"
                onClick={() => openKPIModal('receitas')}
              />
              <SimpleMetricCard
                title="Despesas"
                value={consolidatedData.totalDespesas}
                subtitle={despesasSubtitle}
                icon={<TrendingDown className="w-3 h-3" />}
                isLoading={loading}
                colorScheme="coral"
                onClick={() => openKPIModal('despesas')}
              />
            </div>
            {/* Linha 2: Saldo em Conta + Economia */}
            <div className="grid grid-cols-2 gap-2">
              <SimpleMetricCard
                title="Saldo em Conta"
                value={consolidatedData.totalSaldo}
                icon={<DollarSign className="w-3 h-3" />}
                isLoading={loading}
                colorScheme="blue"
                onClick={() => openKPIModal('saldo_conta')}
              />
              <SimpleMetricCard
                title="Economia do Mês"
                value={consolidatedData.economiaMes}
                subtitle={economiaSubtitle}
                icon={<Activity className="w-3 h-3" />}
                isLoading={loading}
                colorScheme="neutral"
                onClick={() => openKPIModal('economia')}
              />
            </div>
            {/* Linha 3: Saldo Previsto sozinho */}
            <div>
              <SaldoScore
                saldo={consolidatedData.saldoPrevisto || 0}
                isLoading={loading}
                onClick={() => openKPIModal('saldo_previsto')}
              />
            </div>
          </motion.div>

          {/* Fluxo Mensal */}
          <motion.div variants={itemVariants} className="h-56">
            <FluxoMensalChart months={4} />
          </motion.div>

          {/* Proximos Lancamentos */}
          <motion.div variants={itemVariants}>
            <ProximasTransacoesCard limit={5} />
          </motion.div>

          {/* Divisao por Categoria */}
          <motion.div variants={itemVariants}>
            <DivisaoCategoriaCard />
          </motion.div>

          {/* Conselhos Inteligentes */}
          <motion.div variants={itemVariants}>
            <AlertaInteligenteCard />
          </motion.div>
        </div>
      ) : (
        /* ============================================
           LAYOUT DESKTOP - 5 KPIs em linha no topo
           ============================================ */
        <div className="flex flex-col gap-4">
          {/* LINHA 1: 5 KPIs em linha */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <SaldoScore
                saldo={consolidatedData.saldoPrevisto || 0}
                isLoading={loading}
                onClick={() => openKPIModal('saldo_previsto')}
              />
              <SimpleMetricCard
                title="Saldo em Conta Corrente"
                value={consolidatedData.totalSaldo}
                icon={<DollarSign className={classes.iconSize} />}
                isLoading={loading}
                colorScheme="blue"
                onClick={() => openKPIModal('saldo_conta')}
              />
              <SimpleMetricCard
                title="Receitas do Mes"
                value={consolidatedData.totalReceitas}
                subtitle={receitasSubtitle}
                icon={<TrendingUp className={classes.iconSize} />}
                isLoading={loading}
                colorScheme="green"
                onClick={() => openKPIModal('receitas')}
              />
              <SimpleMetricCard
                title="Despesas do Mes"
                value={consolidatedData.totalDespesas}
                subtitle={despesasSubtitle}
                icon={<TrendingDown className={classes.iconSize} />}
                isLoading={loading}
                colorScheme="coral"
                onClick={() => openKPIModal('despesas')}
              />
              <SimpleMetricCard
                title="Economia do Mês"
                value={consolidatedData.economiaMes}
                subtitle={economiaSubtitle}
                icon={<Activity className={classes.iconSize} />}
                isLoading={loading}
                colorScheme="neutral"
                onClick={() => openKPIModal('economia')}
              />
            </div>
          </motion.div>

          {/* LINHA 2: FluxoMensal | Divisao por Categoria */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-72">
              <FluxoMensalChart months={4} />
            </div>
            <div className="h-72">
              <DivisaoCategoriaCard />
            </div>
          </motion.div>

          {/* LINHA 3: ProximasTransacoes | AlertaInteligente */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProximasTransacoesCard limit={5} />
            <AlertaInteligenteCard />
          </motion.div>
        </div>
      )}

      {/* Modal de Detalhes dos KPIs */}
      <KPIDetailModal
        isOpen={isKPIModalOpen}
        onClose={closeKPIModal}
        kpiType={kpiType}
        data={kpiDetailData}
        consolidatedData={consolidatedData}
      />
    </motion.div>
  );
}

// Componente principal que envolve com o Provider
/**
 *
 */
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
