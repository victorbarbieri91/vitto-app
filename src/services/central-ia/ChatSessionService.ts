import { supabase } from '../supabase/client';
import type {
  ChatSession,
  ChatMessage,
  SessionFilters,
} from '../../types/central-ia';

/**
 * Serviço para gerenciamento de sessões de chat
 */
export class ChatSessionService {
  private static instance: ChatSessionService;

  private constructor() {}

  static getInstance(): ChatSessionService {
    if (!ChatSessionService.instance) {
      ChatSessionService.instance = new ChatSessionService();
    }
    return ChatSessionService.instance;
  }

  /**
   * Cria uma nova sessão de chat
   */
  async createSession(titulo?: string): Promise<ChatSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('app_chat_sessoes')
      .insert({
        user_id: user.id,
        titulo: titulo || 'Nova conversa',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Lista sessões do usuário
   */
  async listSessions(filters?: SessionFilters): Promise<ChatSession[]> {
    let query = supabase
      .from('app_chat_sessoes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filters?.search) {
      query = query.or(`titulo.ilike.%${filters.search}%,ultima_mensagem.ilike.%${filters.search}%`);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Busca uma sessão específica
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await supabase
      .from('app_chat_sessoes')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  /**
   * Busca mensagens de uma sessão
   */
  async getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('app_chat_mensagens')
      .select('*')
      .eq('sessao_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Atualiza o título de uma sessão
   */
  async updateSessionTitle(sessionId: string, titulo: string): Promise<void> {
    const { error } = await supabase
      .from('app_chat_sessoes')
      .update({ titulo })
      .eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Deleta uma sessão e suas mensagens
   */
  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('app_chat_sessoes')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Gera um título automático baseado no conteúdo
   */
  generateAutoTitle(firstMessage: string): string {
    // Remove quebras de linha e espaços extras
    const cleaned = firstMessage.replace(/\s+/g, ' ').trim();

    // Limita a 50 caracteres
    if (cleaned.length <= 50) {
      return cleaned;
    }

    // Corta na última palavra completa
    const truncated = cleaned.substring(0, 47);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > 20) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Busca sessões recentes (últimas 24h)
   */
  async getRecentSessions(limit: number = 5): Promise<ChatSession[]> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data, error } = await supabase
      .from('app_chat_sessoes')
      .select('*')
      .gte('updated_at', yesterday.toISOString())
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Conta total de sessões do usuário
   */
  async countSessions(): Promise<number> {
    const { count, error } = await supabase
      .from('app_chat_sessoes')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }
}

// Exportar instância singleton
export const chatSessionService = ChatSessionService.getInstance();
