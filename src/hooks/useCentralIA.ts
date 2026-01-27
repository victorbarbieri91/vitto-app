import { useState, useCallback, useRef } from 'react';
import { centralIAService } from '../services/central-ia';
import { chatSessionService } from '../services/central-ia';
import type {
  ChatMessage,
  ChatSession,
  AgentResponse,
  PendingAction,
  DataRequest,
  ChatState,
} from '../types/central-ia';

interface UseCentralIAReturn {
  // Estado
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentSession: ChatSession | null;
  pendingAction: PendingAction | null;
  dataRequest: DataRequest | null;

  // Ações
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  confirmAction: () => Promise<void>;
  rejectAction: () => Promise<void>;
  submitUserData: (data: Record<string, unknown>) => Promise<void>;
  cancelDataRequest: () => void;
  startNewSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  clearError: () => void;
  clearMessages: () => void;
}

export function useCentralIA(): UseCentralIAReturn {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    currentSession: null,
    pendingAction: null,
    dataRequest: null,
  });

  // Ref para manter mensagens atualizadas em callbacks
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = state.messages;

  // Processa a resposta do agente
  const processResponse = useCallback((response: AgentResponse) => {
    // Atualiza sessionId se retornado
    if (response.sessionId && !state.currentSession) {
      chatSessionService.getSession(response.sessionId).then(session => {
        if (session) {
          setState(prev => ({ ...prev, currentSession: session }));
        }
      });
    }

    switch (response.type) {
      case 'complete':
        if (response.message) {
          setState(prev => ({
            ...prev,
            messages: [
              ...prev.messages,
              { role: 'assistant', content: response.message! },
            ],
            isLoading: false,
            pendingAction: null,
            dataRequest: null,
          }));
        }
        break;

      case 'needs_confirmation':
        setState(prev => ({
          ...prev,
          pendingAction: response.pendingAction || null,
          isLoading: false,
        }));
        // Adiciona mensagem de preview
        if (response.message) {
          setState(prev => ({
            ...prev,
            messages: [
              ...prev.messages,
              { role: 'assistant', content: response.message! },
            ],
          }));
        }
        break;

      case 'needs_data':
        setState(prev => ({
          ...prev,
          dataRequest: response.dataRequest || null,
          isLoading: false,
        }));
        if (response.message) {
          setState(prev => ({
            ...prev,
            messages: [
              ...prev.messages,
              { role: 'assistant', content: response.message! },
            ],
          }));
        }
        break;

      case 'error':
        setState(prev => ({
          ...prev,
          error: response.error || 'Erro desconhecido',
          isLoading: false,
        }));
        break;
    }
  }, [state.currentSession]);

  // Envia mensagem para o agente
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await centralIAService.sendMessage(
        [...messagesRef.current, userMessage],
        state.currentSession?.id
      );
      processResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      }));
    }
  }, [state.currentSession?.id, processResponse]);

  // Confirma ação pendente
  const confirmAction = useCallback(async () => {
    if (!state.pendingAction) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await centralIAService.processConfirmation(
        state.pendingAction.id,
        true
      );
      processResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao confirmar ação',
      }));
    }
  }, [state.pendingAction, processResponse]);

  // Rejeita ação pendente
  const rejectAction = useCallback(async () => {
    if (!state.pendingAction) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await centralIAService.processConfirmation(
        state.pendingAction.id,
        false
      );
      processResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        pendingAction: null,
        error: error instanceof Error ? error.message : 'Erro ao cancelar ação',
      }));
    }
  }, [state.pendingAction, processResponse]);

  // Envia dados coletados via modal
  const submitUserData = useCallback(async (data: Record<string, unknown>) => {
    setState(prev => ({ ...prev, isLoading: true, dataRequest: null }));

    try {
      const response = await centralIAService.sendUserData(
        messagesRef.current,
        data,
        state.currentSession?.id
      );
      processResponse(response);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar dados',
      }));
    }
  }, [state.currentSession?.id, processResponse]);

  // Cancela solicitação de dados
  const cancelDataRequest = useCallback(() => {
    setState(prev => ({
      ...prev,
      dataRequest: null,
      messages: [
        ...prev.messages,
        { role: 'assistant', content: 'Operação cancelada. Como posso ajudar?' },
      ],
    }));
  }, []);

  // Inicia nova sessão
  const startNewSession = useCallback(async () => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
      currentSession: null,
      pendingAction: null,
      dataRequest: null,
    });
  }, []);

  // Carrega uma sessão existente
  const loadSession = useCallback(async (sessionId: string) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const [session, messages] = await Promise.all([
        chatSessionService.getSession(sessionId),
        chatSessionService.getSessionMessages(sessionId),
      ]);

      setState({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
          tool_calls: m.tool_calls,
        })),
        isLoading: false,
        error: null,
        currentSession: session,
        pendingAction: null,
        dataRequest: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar sessão',
      }));
    }
  }, []);

  // Limpa erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Limpa mensagens
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [], currentSession: null }));
  }, []);

  // Adiciona uma mensagem diretamente (para uso em fluxos externos como importação)
  const addMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    currentSession: state.currentSession,
    pendingAction: state.pendingAction,
    dataRequest: state.dataRequest,
    sendMessage,
    addMessage,
    confirmAction,
    rejectAction,
    submitUserData,
    cancelDataRequest,
    startNewSession,
    loadSession,
    clearError,
    clearMessages,
  };
}
