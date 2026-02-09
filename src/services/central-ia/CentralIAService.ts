import { supabase } from '../supabase/client';
import type {
  ChatMessage,
  AgentResponse,
  CentralIARequest,
  PendingAction,
  StreamCallbacks,
} from '../../types/central-ia';

/**
 * Serviço principal para comunicação com a Edge Function central-ia
 */
export class CentralIAService {
  private static instance: CentralIAService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/central-ia`;
  }

  static getInstance(): CentralIAService {
    if (!CentralIAService.instance) {
      CentralIAService.instance = new CentralIAService();
    }
    return CentralIAService.instance;
  }

  /**
   * Obtém o token de autenticação atual
   */
  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado');
    }
    return session.access_token;
  }

  /**
   * Envia mensagem com streaming SSE (novo fluxo principal)
   */
  async sendMessageStream(
    messages: ChatMessage[],
    sessionId: string | undefined,
    callbacks: StreamCallbacks,
    userData?: Record<string, unknown>,
  ): Promise<void> {
    const token = await this.getAuthToken();

    const body: CentralIARequest = { messages, sessionId };
    if (userData) body.userData = userData;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    // Processar SSE stream
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Stream não disponível');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const event = JSON.parse(trimmed.slice(6));

          switch (event.type) {
            case 'token':
              callbacks.onToken(event.content);
              break;
            case 'tool_start':
              callbacks.onToolStart?.(event.tool);
              break;
            case 'needs_confirmation':
              callbacks.onNeedsConfirmation({
                message: event.message,
                pendingAction: event.pendingAction,
              });
              break;
            case 'needs_data':
              callbacks.onNeedsData({
                message: event.message,
                dataRequest: event.dataRequest,
              });
              break;
            case 'done':
              callbacks.onDone(event.sessionId);
              break;
            case 'error':
              callbacks.onError(event.error);
              break;
          }
        } catch { /* skip malformed events */ }
      }
    }
  }

  /**
   * Envia uma mensagem para o agente (fallback sem streaming)
   */
  async sendMessage(
    messages: ChatMessage[],
    sessionId?: string
  ): Promise<AgentResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        sessionId,
      } as CentralIARequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    return response.json();
  }

  /**
   * Confirma ou rejeita uma ação pendente
   */
  async processConfirmation(
    actionId: string,
    confirmed: boolean
  ): Promise<AgentResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirmationToken: actionId,
        confirmed,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    return response.json();
  }

  /**
   * Envia dados coletados via modal e continua o fluxo
   */
  async sendUserData(
    messages: ChatMessage[],
    userData: Record<string, unknown>,
    sessionId?: string
  ): Promise<AgentResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        sessionId,
        userData,
      } as CentralIARequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    return response.json();
  }

  /**
   * Busca ações pendentes do usuário
   */
  async getPendingActions(): Promise<PendingAction[]> {
    const { data, error } = await supabase
      .from('app_pending_actions')
      .select('*')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Envia feedback do usuário (thumbs up/down) para app_memoria_ia
   */
  async submitFeedback(params: {
    userMessage: string;
    assistantMessage: string;
    isPositive: boolean;
    comment?: string;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const tipo = params.isPositive ? 'feedback_positivo' : 'feedback_negativo';
    const conteudo = params.comment
      ? `[Feedback] ${params.comment}\n\n[Pergunta] ${params.userMessage}\n\n[Resposta] ${params.assistantMessage}`
      : `[Pergunta] ${params.userMessage}\n\n[Resposta] ${params.assistantMessage}`;
    const resumo = params.isPositive
      ? 'Usuário aprovou esta resposta'
      : `Usuário reprovou: ${params.comment || 'sem comentário'}`;

    const { error } = await supabase.from('app_memoria_ia').insert({
      usuario_id: user.id,
      tipo_conteudo: tipo,
      conteudo,
      resumo,
      metadata: {
        user_message: params.userMessage,
        assistant_message: params.assistantMessage.substring(0, 500),
        comment: params.comment || null,
      },
      relevancia_score: params.isPositive ? 0.7 : 0.9,
    });

    if (error) throw error;
  }

  /**
   * Cancela uma ação pendente expirada
   */
  async cancelExpiredActions(): Promise<void> {
    await supabase
      .from('app_pending_actions')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());
  }
}

// Exportar instância singleton
export const centralIAService = CentralIAService.getInstance();
