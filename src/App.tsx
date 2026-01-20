import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ChatProvider } from './store/chat/ChatContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { useAuth } from './store/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import OnboardingPage from './pages/onboarding/OnboardingPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.tsx';

// App Pages
import DashboardPageModern from './pages/dashboard/DashboardPageModern';
import AccountsPage from './pages/accounts/AccountsPage';
import AccountDetailPage from './pages/accounts/AccountDetailPage';
import TransactionsPageModern from './pages/transactions/TransactionsPageModern';
import CategoriesPage from './pages/categories/CategoriesPage';
import ProfilePage from './pages/profile/ProfilePage';
import CardsPage from './pages/cards/CardsPage';
import BudgetsPage from './pages/budgets/BudgetsPage';
import SettingsPage from './pages/settings/SettingsPage';
// import SuaHistoriaPage from './pages/historia/SuaHistoriaPage'; // TEMPORARIAMENTE OCULTO
import NotFoundPage from './pages/errors/NotFoundPage';
// import JourneyGamePage from './pages/historia/JourneyGamePage'; // TEMPORARIAMENTE OCULTO

// Admin Pages
import AICenterPage from './pages/admin/AICenterPage';
import TrainingCenterPage from './pages/admin/TrainingCenterPage';

// Central IA
import CentralIAPage from './pages/central-ia/CentralIAPage';

// Patrimonio Page
import PatrimonioPage from './pages/patrimonio/PatrimonioPage';

// Juntos (Finanças Compartilhadas)
import JuntosPage from './pages/juntos/JuntosPage';
import ConviteAceitarPage from './pages/juntos/ConviteAceitarPage';

// Componente para redirecionar com base na autenticação e onboarding
const RedirectBasedOnAuth = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, let PrivateRoute handle onboarding checks
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <Router>
          <ChatProvider>
            <Routes>
            {/* Rota raiz - Redireciona com base na autenticação */}
            <Route path="/" element={<RedirectBasedOnAuth />} />
            
            {/* Rotas públicas - Autenticação */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/entrar" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/cadastro" element={<SignUpPage />} />
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

              {/* Rotas administrativas - Protegidas por permissão */}
              <Route path="/admin/ai-center" element={<AICenterPage />} />
              <Route path="/admin/centro-ia" element={<AICenterPage />} />
              <Route path="/admin/ai-center/training" element={<TrainingCenterPage />} />
              <Route path="/admin/centro-ia/treinamento" element={<TrainingCenterPage />} />

              {/* TEMPORARIAMENTE OCULTO - MÓDULO HISTÓRIA */}
              {/* <Route path="/sua-historia" element={<SuaHistoriaPage />} /> */}
              {/* <Route path="/historia" element={<SuaHistoriaPage />} /> */}
              {/* <Route path="/jornada" element={<SuaHistoriaPage />} /> */}
              {/* <Route path="/game-test" element={<JourneyGamePage />} /> */}
            </Route>
            
            {/* Página 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </ChatProvider>
        </Router>
      </OnboardingProvider>
    </AuthProvider>
  );
}

export default App;
