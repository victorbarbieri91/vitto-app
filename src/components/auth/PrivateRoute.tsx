import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import ModernAppLayout from '../layout/ModernAppLayout';

type PrivateRouteProps = {
  redirectTo?: string;
};

/**
 *
 */
export default function PrivateRoute({ redirectTo = '/login' }: PrivateRouteProps) {
  console.log('[PrivateRoute] Renderizando PrivateRoute');
  const { user, loading } = useAuth();
  const { isOnboardingRequired, loading: onboardingLoading } = useOnboarding();

  console.log('[PrivateRoute] Estado de autenticação:', { user: !!user, loading, isOnboardingRequired, onboardingLoading });
  
  // Se ainda está carregando, mostra um loading
  if (loading || onboardingLoading) {
    console.log('[PrivateRoute] Carregando estado de autenticação...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // Se não tem usuário, redireciona para login
  if (!user) {
    console.log('[PrivateRoute] Usuário não autenticado, redirecionando para login');
    return <Navigate to={redirectTo} replace />;
  }

  // Se onboarding é necessário, redireciona para onboarding
  if (isOnboardingRequired) {
    console.log('[PrivateRoute] Onboarding necessário, redirecionando para /onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  console.log('[PrivateRoute] Usuário autenticado e onboarding completo, renderizando conteúdo protegido');
  
  // Renderiza o conteúdo protegido dentro do layout da aplicação
  try {
    return (
      <ModernAppLayout>
        <Outlet />
      </ModernAppLayout>
    );
  } catch (error) {
    console.error('[PrivateRoute] Erro ao renderizar layout:', error);
    return (
      <div className="p-8 bg-red-50 text-red-800">
        <h2 className="text-xl font-bold mb-4">Erro ao renderizar página</h2>
        <p>Ocorreu um erro ao carregar esta página. Por favor, tente novamente.</p>
        <pre className="mt-4 p-4 bg-red-100 rounded overflow-auto">
          {error instanceof Error ? error.message : 'Erro desconhecido'}
        </pre>
      </div>
    );
  }
}
