import { supabase } from '../supabase/client';

export interface AgentConfig {
  id: string;
  tipo: string;
  nome: string;
  descricao: string;
  prompt_system: string;
  parametros: Record<string, any>;
  versao: number;
  ativo: boolean;
  criado_por: string;
  atualizado_por: string;
  criado_em: string;
  atualizado_em: string;
}

export interface UpdateAgentConfigRequest {
  prompt_system: string;
  parametros?: Record<string, any>;
  motivo_alteracao?: string;
}

export interface AgentMetrics {
  agente_tipo: string;
  data_metricas: string;
  total_execucoes: number;
  total_sucessos: number;
  total_falhas: number;
  tempo_medio_ms: number;
  feedback_medio: number;
  total_feedbacks: number;
  erros_comuns: string[];
}

/**
 * Service para gerenciar configurações dos agentes de IA
 */
export class AgentConfigService {
  /**
   * Buscar todas as configurações dos agentes
   */
  static async getAll(): Promise<AgentConfig[]> {
    const { data, error } = await supabase
      .from('app_agente_config')
      .select('*')
      .order('tipo');

    if (error) {
      console.error('Erro ao buscar configurações dos agentes:', error);
      throw new Error('Não foi possível carregar as configurações dos agentes');
    }

    return data || [];
  }

  /**
   * Buscar configurações ativas dos agentes
   */
  static async getActive(): Promise<AgentConfig[]> {
    const { data, error } = await supabase
      .from('app_agente_config')
      .select('*')
      .eq('ativo', true)
      .order('tipo');

    if (error) {
      console.error('Erro ao buscar configurações ativas:', error);
      throw new Error('Não foi possível carregar as configurações ativas');
    }

    return data || [];
  }

  /**
   * Buscar configuração específica por tipo
   */
  static async getByType(tipo: string): Promise<AgentConfig | null> {
    const { data, error } = await supabase
      .from('app_agente_config')
      .select('*')
      .eq('tipo', tipo)
      .eq('ativo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      console.error('Erro ao buscar configuração por tipo:', error);
      throw new Error('Não foi possível carregar a configuração do agente');
    }

    return data;
  }

  /**
   * Atualizar configuração de um agente
   */
  static async update(
    agentId: string,
    updates: UpdateAgentConfigRequest,
    userId: string
  ): Promise<AgentConfig> {
    // Primeiro, buscar a configuração atual para salvar no histórico
    const { data: currentConfig } = await supabase
      .from('app_agente_config')
      .select('prompt_system')
      .eq('id', agentId)
      .single();

    // Atualizar a configuração
    const { data, error } = await supabase
      .from('app_agente_config')
      .update({
        prompt_system: updates.prompt_system,
        parametros: updates.parametros,
        atualizado_por: userId,
        versao: supabase.rpc('increment_version', { config_id: agentId })
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw new Error('Não foi possível atualizar a configuração do agente');
    }

    // Salvar no histórico para auditoria
    if (currentConfig) {
      await supabase
        .from('app_prompt_historico')
        .insert({
          agente_config_id: agentId,
          prompt_anterior: currentConfig.prompt_system,
          prompt_novo: updates.prompt_system,
          alterado_por: userId,
          motivo_alteracao: updates.motivo_alteracao || 'Atualização via painel admin'
        });
    }

    return data;
  }

  /**
   * Buscar histórico de alterações de um agente
   */
  static async getHistory(agentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('app_prompt_historico')
      .select(`
        *,
        app_perfil!alterado_por(nome)
      `)
      .eq('agente_config_id', agentId)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      throw new Error('Não foi possível carregar o histórico de alterações');
    }

    return data || [];
  }

  /**
   * Buscar métricas dos agentes
   */
  static async getMetrics(days: number = 7): Promise<AgentMetrics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('app_agente_metricas')
      .select('*')
      .gte('data_metricas', startDate.toISOString().split('T')[0])
      .order('data_metricas', { ascending: false });

    if (error) {
      console.error('Erro ao buscar métricas:', error);
      throw new Error('Não foi possível carregar as métricas dos agentes');
    }

    return data || [];
  }

  /**
   * Registrar uso de um agente (para métricas)
   */
  static async logAgentUsage(
    agentType: string,
    success: boolean,
    responseTimeMs: number,
    feedback?: number
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Usar upsert para incrementar ou criar métricas do dia
      const { error } = await supabase.rpc('update_agent_metrics', {
        p_agente_tipo: agentType,
        p_data_metricas: today,
        p_sucesso: success,
        p_tempo_resposta_ms: responseTimeMs,
        p_feedback: feedback
      });

      if (error) {
        console.warn('Erro ao registrar métricas do agente:', error);
      }
    } catch (error) {
      console.warn('Exceção ao registrar métricas:', error);
    }
  }

  /**
   * Testar um prompt personalizado
   */
  static async testPrompt(
    agentType: string,
    customPrompt: string,
    testMessage: string
  ): Promise<string> {
    // Esta função seria usada para testar prompts antes de salvar
    // Por enquanto, retorna uma resposta mock
    return `Teste do prompt personalizado para ${agentType}:\n\nPrompt: ${customPrompt.substring(0, 100)}...\nMensagem de teste: ${testMessage}\n\nResposta simulada: Esta seria a resposta do agente com o novo prompt.`;
  }

  /**
   * Ativar/desativar um agente
   */
  static async toggleActive(agentId: string, ativo: boolean, userId: string): Promise<AgentConfig> {
    const { data, error } = await supabase
      .from('app_agente_config')
      .update({
        ativo,
        atualizado_por: userId
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alterar status do agente:', error);
      throw new Error('Não foi possível alterar o status do agente');
    }

    return data;
  }
}