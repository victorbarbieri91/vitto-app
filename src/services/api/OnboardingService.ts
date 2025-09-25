import { BaseApi } from './BaseApi';

export type OnboardingStep = {
  step: number;
  completed: boolean;
  data?: any;
};

export type OnboardingData = {
  personalInfo: {
    nome: string;
    receita_mensal: number;
  };
  accountInfo: {
    nome: string;
    tipo: string;
    saldo_inicial: number;
  };
  goalInfo: {
    meta_percentual: number;
    receita_mensal: number;
  };
};

export type OnboardingStatus = {
  completed: boolean;
  currentStep: number;
  receita_mensal_estimada: number;
  meta_despesa_percentual: number;
};

/**
 * Service to handle onboarding-related API calls
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
        .select('onboarding_completed, onboarding_step, receita_mensal_estimada, meta_despesa_percentual')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return {
        completed: data.onboarding_completed || false,
        currentStep: data.onboarding_step || 0,
        receita_mensal_estimada: data.receita_mensal_estimada || 0,
        meta_despesa_percentual: data.meta_despesa_percentual || 80
      };
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar status do onboarding');
    }
  }

  /**
   * Start onboarding process
   */
  async startOnboarding(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase.rpc('iniciar_onboarding', {
        user_id_param: user.id
      });

      if (error) throw error;
      return data?.success || false;
    } catch (error) {
      throw this.handleError(error, 'Falha ao iniciar onboarding');
    }
  }

  /**
   * Update onboarding step
   */
  async updateStep(step: number, stepData?: any): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase.rpc('atualizar_etapa_onboarding', {
        user_id_param: user.id,
        step_param: step,
        step_data: stepData || {}
      });

      if (error) throw error;
      return data?.success || false;
    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar etapa do onboarding');
    }
  }

  /**
   * Complete onboarding process
   */
  async completeOnboarding(onboardingData: OnboardingData): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Create the first account
      const { data: conta, error: accountError } = await this.supabase
        .from('app_conta')
        .insert({
          user_id: user.id,
          nome: onboardingData.accountInfo.nome,
          tipo: onboardingData.accountInfo.tipo,
          saldo_inicial: onboardingData.accountInfo.saldo_inicial,
          saldo_atual: onboardingData.accountInfo.saldo_inicial,
          status: 'ativo',
          cor: '#4F46E5',
          moeda: 'BRL'
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Criar lançamento VIRTUAL de saldo inicial se houver saldo
      // Este lançamento aparece no módulo mas não duplica o valor no cálculo
      if (onboardingData.accountInfo.saldo_inicial && onboardingData.accountInfo.saldo_inicial !== 0) {
        const isReceita = onboardingData.accountInfo.saldo_inicial >= 0;
        const valorAbsoluto = Math.abs(onboardingData.accountInfo.saldo_inicial);

        // Buscar categoria apropriada
        const { data: categoria } = await this.supabase
          .from('app_categoria')
          .select('id')
          .eq('nome', 'Saldo Inicial')
          .eq('is_default', true)
          .single();

        const categoriaId = categoria?.id || 1; // Fallback para categoria 1 se não encontrar

        // Criar lançamento virtual
        await this.supabase
          .from('app_transacoes')
          .insert({
            descricao: `Saldo inicial - ${onboardingData.accountInfo.nome}`,
            valor: valorAbsoluto,
            data: new Date().toISOString().split('T')[0],
            tipo: isReceita ? 'receita' : 'despesa',
            categoria_id: categoriaId,
            conta_id: conta.id,
            user_id: user.id,
            status: 'confirmado',
            tipo_especial: 'saldo_inicial' // IMPORTANTE: marca como saldo inicial para não duplicar
          });
      }

      // Finalize onboarding with goal setup
      const { data, error } = await this.supabase.rpc('finalizar_onboarding', {
        user_id_param: user.id,
        receita_mensal: onboardingData.goalInfo.receita_mensal,
        meta_percentual: onboardingData.goalInfo.meta_percentual
      });

      if (error) throw error;
      return data?.success || false;
    } catch (error) {
      throw this.handleError(error, 'Falha ao finalizar onboarding');
    }
  }

  /**
   * Get expense goal indicator for current month
   */
  async getExpenseGoalIndicator(): Promise<any> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase.rpc('obter_indicador_meta_mes', {
        user_id_param: user.id
      });

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar indicador de meta');
    }
  }
}

const onboardingService = new OnboardingService();
export default onboardingService;