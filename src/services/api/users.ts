import { supabase } from '../supabase/client';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  avatar_url: string | null;
  tipo_usuario?: string;
  created_at: string;
}

/**
 * Busca o perfil do usuário na tabela app_perfil
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('app_perfil')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Perfil não encontrado
        console.log('[UserService] Perfil não encontrado para usuário:', userId);
        return null;
      }
      console.error('[UserService] Erro ao buscar perfil do usuário:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[UserService] Exceção ao buscar perfil do usuário:', error);
    throw error;
  }
};

/**
 * Atualiza o perfil do usuário
 */
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<Omit<UserProfile, 'id' | 'created_at'>>
): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('app_perfil')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[UserService] Erro ao atualizar perfil do usuário:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[UserService] Exceção ao atualizar perfil do usuário:', error);
    throw error;
  }
};