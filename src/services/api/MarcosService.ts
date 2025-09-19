import { BaseApi } from './BaseApi';
import type { 
  Marco, 
  Badge, 
  EventoTimeline, 
  NovoMarco, 
  NovaBadge,
  ResumoHistoria,
  ProgressoMarco,
  EstatisticasJornada
} from '../../types/historia';

/**
 * Serviço para gerenciar marcos, badges e jornada do usuário
 * Sistema de gamificação "Sua História"
 */
export class MarcosService extends BaseApi {
  
  // ===== MARCOS =====
  
  /**
   * Buscar todos os marcos do usuário
   */
  async fetchMarcos(): Promise<Marco[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_marco')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar marcos');
    }
  }

  /**
   * Buscar marcos por categoria
   */
  async fetchMarcosByCategoria(categoria: 'sistema' | 'objetivo'): Promise<Marco[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_marco')
        .select('*')
        .eq('user_id', user.id)
        .eq('categoria', categoria)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, `Falha ao buscar marcos da categoria ${categoria}`);
    }
  }

  /**
   * Buscar marcos pendentes
   */
  async fetchMarcosPendentes(): Promise<Marco[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_marco')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar marcos pendentes');
    }
  }

  /**
   * Criar novo marco (objetivo do usuário)
   */
  async createMarco(novoMarco: NovoMarco): Promise<Marco> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase
        .from('app_marco')
        .insert({
          ...novoMarco,
          user_id: user.id,
          valor_atual: novoMarco.valor_atual || 0,
          cor: novoMarco.cor || '#F87060'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar marco');
    }
  }

  /**
   * Atualizar progresso de um marco
   */
  async updateProgressoMarco(id: string, valor_atual: number): Promise<ProgressoMarco> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar marco para calcular progresso
      const { data: marco, error: fetchError } = await this.supabase
        .from('app_marco')
        .select('valor_alvo, valor_atual')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const valor_alvo = marco.valor_alvo || 0;
      const percentual = valor_alvo > 0 ? (valor_atual / valor_alvo) * 100 : 0;
      const atingido = percentual >= 100;

      // Atualizar o marco
      const updateData: any = { valor_atual };
      if (atingido) {
        updateData.status = 'concluido';
        updateData.achieved_at = new Date().toISOString();
      }

      const { error: updateError } = await this.supabase
        .from('app_marco')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return {
        valor_atual,
        percentual: Math.round(percentual),
        atingido
      };
    } catch (error) {
      throw this.handleError(error, 'Falha ao atualizar progresso do marco');
    }
  }

  /**
   * Completar marco (marcar como concluído)
   */
  async completeMarco(id: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_marco')
        .update({
          status: 'concluido',
          achieved_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('status', 'pendente'); // Só atualiza se estiver pendente

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao completar marco');
    }
  }

  /**
   * Deletar marco (apenas objetivos do usuário)
   */
  async deleteMarco(id: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await this.supabase
        .from('app_marco')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('categoria', 'objetivo'); // Só permite deletar objetivos do usuário

      if (error) throw error;
      return true;
    } catch (error) {
      throw this.handleError(error, 'Falha ao deletar marco');
    }
  }

  // ===== BADGES =====

  /**
   * Buscar todas as badges do usuário
   */
  async fetchBadges(): Promise<Badge[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_badge')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar badges');
    }
  }

  /**
   * Criar nova badge (chamada pelo sistema)
   */
  async createBadge(novaBadge: NovaBadge): Promise<Badge> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await this.supabase
        .from('app_badge')
        .insert({
          ...novaBadge,
          user_id: user.id,
          cor: novaBadge.cor || '#10b981'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error, 'Falha ao criar badge');
    }
  }

  // ===== TIMELINE =====

  /**
   * Buscar timeline unificada (marcos + badges)
   */
  async fetchTimeline(limite?: number): Promise<EventoTimeline[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      let query = this.supabase
        .from('app_evento_timeline')
        .select('*')
        .eq('user_id', user.id)
        .order('data_evento', { ascending: false });

      if (limite) {
        query = query.limit(limite);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar timeline');
    }
  }

  /**
   * Buscar timeline apenas de itens concluídos
   */
  async fetchTimelineConcluidos(): Promise<EventoTimeline[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await this.supabase
        .from('app_evento_timeline')
        .select('*')
        .eq('user_id', user.id)
        .eq('concluido', true)
        .order('data_evento', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar timeline concluídos');
    }
  }

  // ===== RESUMOS E ESTATÍSTICAS =====

  /**
   * Buscar resumo da jornada do usuário
   */
  async fetchResumoHistoria(): Promise<ResumoHistoria> {
    try {
      const [marcos, badges] = await Promise.all([
        this.fetchMarcos(),
        this.fetchBadges()
      ]);

      const marcos_concluidos = marcos.filter(m => m.status === 'concluido').length;
      const marcos_pendentes = marcos.filter(m => m.status === 'pendente').length;
      const total_marcos = marcos.length;

      const percentual_conclusao = total_marcos > 0 
        ? Math.round((marcos_concluidos / total_marcos) * 100)
        : 0;

      // Próximos marcos (primeiros 3 pendentes)
      const proximos_marcos = marcos
        .filter(m => m.status === 'pendente')
        .slice(0, 3);

      // Badges recentes (últimas 3)
      const badges_recentes = badges.slice(0, 3);

      return {
        total_marcos,
        marcos_concluidos,
        marcos_pendentes,
        total_badges: badges.length,
        percentual_conclusao,
        proximos_marcos,
        badges_recentes
      };
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar resumo da história');
    }
  }

  /**
   * Buscar estatísticas detalhadas da jornada
   */
  async fetchEstatisticas(): Promise<EstatisticasJornada> {
    try {
      const [marcos, badges] = await Promise.all([
        this.fetchMarcos(),
        this.fetchBadges()
      ]);

      // Cálculo básico de estatísticas
      const marcos_concluidos = marcos.filter(m => m.status === 'concluido');
      const primeiro_marco = marcos[0];
      const ultimo_marco = marcos_concluidos[marcos_concluidos.length - 1];

      const dias_ativos = primeiro_marco && ultimo_marco
        ? Math.ceil((new Date(ultimo_marco.achieved_at || ultimo_marco.created_at).getTime() - 
                    new Date(primeiro_marco.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const marcos_por_mes = dias_ativos > 0 
        ? Math.round((marcos_concluidos.length / dias_ativos) * 30)
        : 0;

      // Badges por categoria (placeholder - poderia ser implementado)
      const badges_por_categoria = badges.reduce((acc: Record<string, number>, badge) => {
        const categoria = badge.icon_slug || 'geral';
        acc[categoria] = (acc[categoria] || 0) + 1;
        return acc;
      }, {});

      return {
        dias_ativos,
        marcos_por_mes,
        badges_por_categoria,
        tempo_medio_conclusao: 0, // Placeholder
        streak_atual: 0, // Placeholder
        maior_streak: 0 // Placeholder
      };
    } catch (error) {
      throw this.handleError(error, 'Falha ao buscar estatísticas');
    }
  }

  // ===== FUNÇÕES AUXILIARES =====

  /**
   * Verificar se um marco específico existe
   */
  async marcoExists(titulo: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const { data, error } = await this.supabase
        .from('app_marco')
        .select('id')
        .eq('user_id', user.id)
        .eq('titulo', titulo)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verificar se uma badge específica existe
   */
  async badgeExists(nome: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      const { data, error } = await this.supabase
        .from('app_badge')
        .select('id')
        .eq('user_id', user.id)
        .eq('nome', nome)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }
}

const marcosService = new MarcosService();
export default marcosService;