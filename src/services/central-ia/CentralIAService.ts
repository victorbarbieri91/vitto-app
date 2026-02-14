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

  /**
   *
   */
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
    mode?: 'chat' | 'interview',
  ): Promise<void> {
    const token = await this.getAuthToken();

    const body: CentralIARequest = { messages, sessionId };
    if (userData) body.userData = userData;
    if (mode) body.mode = mode;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorMsg = `Erro ${response.status}`;
      try {
        const text = await response.text();
        const parsed = JSON.parse(text);
        if (parsed.error) errorMsg = parsed.error;
      } catch {
        // Body não é JSON (pode ser SSE ou HTML) - usa mensagem padrão
      }
      throw new Error(errorMsg);
    }

    // Verificar se resposta é SSE ou JSON (fallback)
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('text/event-stream')) {
      // Fallback: resposta veio como texto/JSON em vez de stream
      const text = await response.text();
      this.parseSSEText(text, callbacks);
      return;
    }

    // Processar SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      // Fallback: body não disponível, ler como texto
      const text = await response.text();
      this.parseSSEText(text, callbacks);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (done) break;

      buffer += decoder.decode(result.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        this.handleSSELine(line, callbacks);
      }
    }

    // Processar dados restantes no buffer
    if (buffer.trim()) {
      this.handleSSELine(buffer, callbacks);
    }
  }

  /**
   * Processa uma linha SSE individual
   */
  private handleSSELine(line: string, callbacks: StreamCallbacks): void {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data: ')) return;

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
        case 'interview_complete':
          callbacks.onInterviewComplete?.();
          break;
        case 'interactive_buttons':
          callbacks.onInteractiveButtons?.({ buttons: event.buttons });
          break;
        case 'done':
          callbacks.onDone(event.sessionId);
          break;
        case 'error':
          callbacks.onError(event.error);
          break;
      }
    } catch {
      // Skip malformed SSE events
    }
  }

  /**
   * Fallback: parsear texto SSE quando streaming não está disponível
   */
  private parseSSEText(text: string, callbacks: StreamCallbacks): void {
    const lines = text.split('\n');
    for (const line of lines) {
      this.handleSSELine(line, callbacks);
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

    const { data: inserted, error } = await supabase.from('app_memoria_ia').insert({
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
    }).select('id').single();

    if (error) throw error;

    // Gerar embedding para que o feedback apareca em buscas RAG
    if (inserted?.id) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (supabaseUrl && token) {
        fetch(`${supabaseUrl}/functions/v1/embed-and-save`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: `[${tipo}] ${conteudo}`,
            table: 'app_memoria_ia',
            id: inserted.id,
            column: 'embedding',
          }),
        }).catch(() => { /* fire-and-forget */ });
      }
    }
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
