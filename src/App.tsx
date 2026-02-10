import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { TransactionProvider } from './store/TransactionContext';
import { ChatProvider } from './store/chat/ChatContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { useAuth } from './store/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';

// ============================================
// EAGER IMPORTS - Páginas carregadas imediatamente
// (páginas mais acessadas / primeiro acesso)
// ============================================
import AuthPage from './pages/auth/AuthPage';
import DashboardPageModern from './pages/dashboard/DashboardPageModern';
import AccountsPage from './pages/accounts/AccountsPage';
import TransactionsPageModern from './pages/transactions/TransactionsPageModern';

// ============================================
// LAZY IMPORTS - Páginas carregadas sob demanda
// (carregam apenas quando o usuário navega até elas)
// ============================================

// Auth secundárias
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Onboarding (visitado uma vez)
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));

// Páginas secundárias do app
const AccountDetailPage = lazy(() => import('./pages/accounts/AccountDetailPage'));
const CategoriesPage = lazy(() => import('./pages/categories/CategoriesPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const CardsPage = lazy(() => import('./pages/cards/CardsPage'));
const BudgetsPage = lazy(() => import('./pages/budgets/BudgetsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

// Módulos pesados
const CentralIAPage = lazy(() => import('./pages/central-ia/CentralIAPage'));
const PatrimonioPage = lazy(() => import('./pages/patrimonio/PatrimonioPage'));
const JuntosPage = lazy(() => import('./pages/juntos/JuntosPage'));
const ConviteAceitarPage = lazy(() => import('./pages/juntos/ConviteAceitarPage'));

// Admin Panel (todo o painel admin carrega sob demanda)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const BusinessPlanPage = lazy(() => import('./pages/admin/BusinessPlanPage'));
const BusinessPlanSubmodulePage = lazy(() => import('./pages/admin/BusinessPlanSubmodulePage'));
const BusinessPlanPrintPage = lazy(() => import('./pages/admin/BusinessPlanPrintPage'));
const AgendaPage = lazy(() => import('./pages/admin/AgendaPage'));
const AdminFinancePage = lazy(() => import('./pages/admin/AdminFinancePage'));
const BaseConhecimentoPage = lazy(() => import('./pages/admin/BaseConhecimentoPage'));

// Página de erro
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage'));

// ============================================
// LOADING SPINNER - Exibido durante lazy loading
// ============================================
const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-600">Carregando...</p>
    </div>
  </div>
);

// Componente para redirecionar com base na autenticação e onboarding
const RedirectBasedOnAuth = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, let PrivateRoute handle onboarding checks
  return <Navigate to="/dashboard" replace />;
};

/**
 *
 */
function App() {
  return (
    <AuthProvider>
      <TransactionProvider>
        <OnboardingProvider>
          <Router>
            <ChatProvider>
            <ErrorBoundary componentName="AppRoutes" fullPage>
            <Suspense fallback={<PageLoadingSpinner />}>
            <Routes>
            {/* Rota raiz - Redireciona com base na autenticação */}
            <Route path="/" element={<RedirectBasedOnAuth />} />

            {/* Rotas públicas - Autenticação */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/entrar" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="/cadastro" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

            {/* Rota de onboarding - Protegida mas sem layout */}
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/configuracao-inicial" element={<OnboardingPage />} />

            {/* Rotas protegidas - Requerem autenticação */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<DashboardPageModern />} />
              <Route path="/painel" element={<DashboardPageModern />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/contas" element={<AccountsPage />} />
              <Route path="/contas/:id" element={<AccountDetailPage />} />
              <Route path="/transactions" element={<TransactionsPageModern />} />
              <Route path="/lancamentos" element={<TransactionsPageModern />} />

              {/* Rotas de transação removidas - Agora usando modal mobile */}

              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categorias" element={<CategoriesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/perfil" element={<ProfilePage />} />

              {/* Rotas para páginas em desenvolvimento */}
              <Route path="/cartoes" element={<CardsPage />} />
              <Route path="/cards" element={<CardsPage />} />
              {/* Rotas de faturas removidas - agora usamos InvoiceDrawer */}
              <Route path="/faturas" element={<Navigate to="/cartoes" replace />} />
              <Route path="/invoices" element={<Navigate to="/cards" replace />} />
              <Route path="/orcamentos" element={<BudgetsPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Rotas de patrimônio */}
              <Route path="/patrimonio" element={<PatrimonioPage />} />
              <Route path="/assets" element={<PatrimonioPage />} />

              {/* Rotas do módulo Juntos (Finanças Compartilhadas) */}
              <Route path="/juntos" element={<JuntosPage />} />
              <Route path="/juntos/convite/:token" element={<ConviteAceitarPage />} />
              <Route path="/together" element={<JuntosPage />} />

              {/* Central IA - Assistente Inteligente */}
              <Route path="/central-ia" element={<CentralIAPage />} />
              <Route path="/assistente" element={<CentralIAPage />} />
              <Route path="/ai-assistant" element={<CentralIAPage />} />

              {/* TEMPORARIAMENTE OCULTO - MÓDULO HISTÓRIA */}
              {/* <Route path="/sua-historia" element={<SuaHistoriaPage />} /> */}
              {/* <Route path="/historia" element={<SuaHistoriaPage />} /> */}
              {/* <Route path="/jornada" element={<SuaHistoriaPage />} /> */}
              {/* <Route path="/game-test" element={<JourneyGamePage />} /> */}
            </Route>

            {/* Pagina de impressao do Business Plan - Sem layout admin */}
            <Route path="/admin/business-plan/print" element={<BusinessPlanPrintPage />} />

            {/* Rotas do Painel Admin - Requerem permissão de admin */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/business-plan" element={<BusinessPlanPage />} />
              <Route path="/admin/business-plan/:submodule" element={<BusinessPlanSubmodulePage />} />
              <Route path="/admin/agenda" element={<AgendaPage />} />
              <Route path="/admin/financeiro" element={<AdminFinancePage />} />
              <Route path="/admin/base-conhecimento" element={<BaseConhecimentoPage />} />
            </Route>

            {/* Página 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
            </Suspense>
            </ErrorBoundary>
            </ChatProvider>
          </Router>
        </OnboardingProvider>
      </TransactionProvider>
    </AuthProvider>
  );
}

export default App;
