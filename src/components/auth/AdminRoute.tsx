import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useIsAdmin } from '../../hooks/useAdminPermissions';
import AdminLayout from '../admin/layout/AdminLayout';

/**
 *
 */
export default function AdminRoute() {
  const { user, loading, profileLoading, userProfile } = useAuth();
  const isAdmin = useIsAdmin();

  // Loading state - esperar auth E perfil carregarem
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Perfil ainda não carregou - aguardar
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  // Not admin - redirect to main dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render admin content
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
