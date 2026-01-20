import { supabase } from '../supabase/client';
import type {
  ChatMessage,
  AgentResponse,
  CentralIARequest,
  PendingAction,
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
   * Envia uma mensagem para o agente e processa a resposta
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
