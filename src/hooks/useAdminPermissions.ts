import { useAuth } from '../store/AuthContext';

export interface AdminPermissions {
  isAdmin: boolean;
  isSpecialist: boolean;
  canManageAI: boolean;
  canTrainAI: boolean;
  canViewMetrics: boolean;
}

/**
 * Hook para verificar permissões administrativas do usuário
 */
export function useAdminPermissions(): AdminPermissions {
  const { userProfile } = useAuth();

  const userType = userProfile?.tipo_usuario || 'usuario';

  // Debug
  console.log('[useAdminPermissions] userProfile:', userProfile);
  console.log('[useAdminPermissions] userType:', userType);

  const isAdmin = userType === 'admin';
  const isSpecialist = userType === 'especialista';
  const hasElevatedPermissions = isAdmin || isSpecialist;

  return {
    isAdmin,
    isSpecialist,
    canManageAI: isAdmin, // Apenas admins podem gerenciar configurações da IA
    canTrainAI: hasElevatedPermissions, // Admins e especialistas podem treinar
    canViewMetrics: hasElevatedPermissions, // Admins e especialistas podem ver métricas
  };
}

/**
 * Hook simples para verificar se o usuário é admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAdminPermissions();
  return isAdmin;
}

/**
 * Hook para verificar se o usuário pode acessar o centro de IA
 */
export function useCanAccessAICenter(): boolean {
  const { canManageAI, canTrainAI, canViewMetrics } = useAdminPermissions();
  return canManageAI || canTrainAI || canViewMetrics;
}