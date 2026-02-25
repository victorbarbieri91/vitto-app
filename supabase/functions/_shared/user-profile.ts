// =====================================================
// USER PROFILE
// =====================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { UserProfile } from './types.ts';

export async function loadUserProfile(supabase: SupabaseClient, userId: string): Promise<UserProfile> {
  try {
    const { data, error } = await supabase
      .from('app_perfil')
      .select('nome, receita_mensal_estimada, meta_despesa_percentual, ai_context, perfil_financeiro')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn('loadUserProfile: perfil nao encontrado');
      return { nome: 'Usuario', receita_mensal: null, meta_despesa: null, ai_context: {}, perfil_financeiro: {} };
    }

    return {
      nome: data.nome || 'Usuario',
      receita_mensal: data.receita_mensal_estimada,
      meta_despesa: data.meta_despesa_percentual,
      ai_context: data.ai_context || {},
      perfil_financeiro: data.perfil_financeiro || {},
    };
  } catch (e) {
    console.error('loadUserProfile error:', e);
    return { nome: 'Usuario', receita_mensal: null, meta_despesa: null, ai_context: {}, perfil_financeiro: {} };
  }
}
