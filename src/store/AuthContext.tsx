import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase/client';
import { useUserProfile } from '../hooks/useUserProfile';
import type { UserProfile } from '../services/api/users';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nome: string, userData?: any) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Hook para gerenciar perfil do usuário
  const { userProfile, loading: profileLoading, refreshProfile } = useUserProfile(user?.id || null);

  // Ref para controlar se já tentou verificar/criar perfil
  const profileChecked = useRef<Set<string>>(new Set());

  useEffect(() => {
    const getInitialSession = async () => {
      console.log('[AuthContext] Iniciando getInitialSession');
      try {
        console.log('[AuthContext] Buscando sessão atual');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[AuthContext] Sessão recuperada:', session ? 'Com sessão' : 'Sem sessão');
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Só tenta verificar perfil se usuário existe e ainda não foi verificado
        if (session?.user && !profileChecked.current.has(session.user.id)) {
          console.log('[AuthContext] Verificando perfil do usuário em getInitialSession');
          await checkAndCreateUserProfile(session.user);
        }
      } catch (error) {
        console.error('Erro ao recuperar sessão:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Configura o listener para mudanças de autenticação
    console.log('[AuthContext] Configurando listener de autenticação');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Evento de autenticação detectado: ${event}`, session ? 'Com sessão' : 'Sem sessão');
      
      // Atualizamos o estado imediatamente
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Se é um novo login e ainda não verificamos o perfil
      if (session?.user && !profileChecked.current.has(session.user.id)) {
        console.log(`[AuthContext] Usuário autenticado: ${session.user.id}`);
        // Agenda verificação assíncrona que não bloqueia navegação
        setTimeout(() => {
          checkAndCreateUserProfile(session.user);
        }, 100);
      } else if (!session?.user) {
        console.log('[AuthContext] Nenhum usuário na sessão');
        // Limpa perfis verificados ao fazer logout
        profileChecked.current.clear();
      }
    });

    // Refresh proativo: verifica a cada 10 min se o token está perto de expirar.
    // Supabase autoRefreshToken faz isso, mas browsers suspendem timers em abas de fundo.
    const refreshInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = currentSession.expires_at - now;
        if (timeUntilExpiry < 300) {
          console.log('[AuthContext] Token expiring soon, proactively refreshing');
          const { error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('[AuthContext] Failed to refresh session:', error.message);
          }
        }
      }
    }, 10 * 60 * 1000);

    // Ao voltar para aba suspensa, verifica se token precisa de refresh
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          if (currentSession?.expires_at) {
            const now = Math.floor(Date.now() / 1000);
            if (currentSession.expires_at - now < 300) {
              console.log('[AuthContext] Tab regained focus with expiring token, refreshing');
              supabase.auth.refreshSession();
            }
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Função auxiliar para verificar/criar perfil (evita duplicação)
  const checkAndCreateUserProfile = async (user: User) => {
    // Marca como verificado antes de começar para evitar múltiplas tentativas
    profileChecked.current.add(user.id);
    
    try {
      console.log('[AuthContext] Verificando perfil do usuário na tabela app_perfil');
      const { data: userData, error: profileError } = await supabase
        .from('app_perfil')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('[AuthContext] Erro ao buscar perfil:', profileError);
        return;
      }
      
      if (!userData) {
        console.log('[AuthContext] Perfil não encontrado, criando novo perfil');
        const { error: insertError } = await supabase.from('app_perfil').insert({
          id: user.id,
          email: user.email,
          nome: user.email?.split('@')[0] || 'Usuário',
        });
        
        if (insertError) {
          console.error('[AuthContext] Erro ao criar perfil:', insertError);
          // Remove da lista se falhou, para tentar novamente depois
          profileChecked.current.delete(user.id);
        } else {
          console.log('[AuthContext] Perfil criado com sucesso');
        }
      } else {
        console.log('[AuthContext] Perfil encontrado:', userData.id);
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao verificar usuário:', error);
      // Remove da lista se falhou, para tentar novamente depois
      profileChecked.current.delete(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] Iniciando signIn com email:', email);
    try {
      console.time('auth-signin');
      console.log('[AuthContext] Chamando supabase.auth.signInWithPassword');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.timeEnd('auth-signin');
      
      if (error) {
        console.error('[AuthContext] Erro no signInWithPassword:', error);
      } else {
        console.log('[AuthContext] Login bem-sucedido, user:', data?.user?.id);
      }
      
      return { error };
    } catch (error: any) {
      console.error('[AuthContext] Exceção no signIn:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, nome: string, userData?: any) => {
    try {
      // Passa os dados do usuário nos metadados para que o trigger do DB possa usá-los
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: nome,
            avatar_url: null,
            // Incluir dados adicionais se fornecidos
            ...(userData || {})
          }
        }
      });

      // O trigger no banco de dados cuidará da criação do perfil.
      // O código de inserção manual foi removido daqui.

      return { error, data };
    } catch (error: any) {
      return { error, data: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const value = {
    session,
    user,
    userProfile,
    loading,
    profileLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
