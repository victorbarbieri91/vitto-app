import { BaseApi } from './BaseApi';

export type OnboardingStatus = {
  completed: boolean;
  receita_mensal_estimada: number;
  meta_despesa_percentual: number;
};

/**
 * Service simplificado - apenas verifica status do onboarding.
 * A entrevista IA (Edge Function central-ia mode=interview) substitui o fluxo antigo.
 */
export class OnboardingService extends BaseApi {
  /**
   * Get user onboarding status
   */
  async getOnboardingStatus(): Promise<OnboardingStatus | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('app_perfil')
        .select('onboarding_completed, receita_mensal_estimada, meta_despesa_percentual')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return {
        completed: data.onboarding_completed || false,
        receita_mensal_estimada: data.receita_mensal_estimada || 0,
        meta_despesa_percentual: data.meta_despesa_percentual || 80
      };
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar status do onboarding');
    }
  }
}

const onboardingService = new OnboardingService();
export default onboardingService;
