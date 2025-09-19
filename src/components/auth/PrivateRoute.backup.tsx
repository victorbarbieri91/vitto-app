import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import ModernAppLayout from '../layout/ModernAppLayout';

type PrivateRouteProps = {
  redirectTo?: string;
};

export default function PrivateRoute({ redirectTo = '/login' }: PrivateRouteProps) {
  console.log('[PrivateRoute] Renderizando PrivateRoute');
  const { user, loading } = useAuth();
  
  console.log('[PrivateRoute] Estado de autenticação:', { user: !!user, loading });
  
  // Mostra um indicador de carregamento enquanto verifica a autenticação
  if (loading) {
    console.log('[PrivateRoute] Exibindo indicador de carregamento');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  // Redireciona para a página de login se não estiver autenticado
  if (!user) {
    console.log('[PrivateRoute] Usuário não autenticado, redirecionando para', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }
  
  console.log('[PrivateRoute] Usuário autenticado, renderizando conteúdo protegido');
  
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
