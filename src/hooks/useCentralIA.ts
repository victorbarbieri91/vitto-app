import { useState, useCallback, useRef, useEffect } from 'react';
import { centralIAService } from '../services/central-ia';
import { chatSessionService } from '../services/central-ia';
import type {
  ChatMessage,
  ChatSession,
  PendingAction,
  DataRequest,
  ChatState,
} from '../types/central-ia';

interface UseCentralIAReturn {
  // Estado
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  currentSession: ChatSession | null;
  pendingAction: PendingAction | null;
  dataRequest: DataRequest | null;

  // Ações
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => Promise<void>;
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
    isStreaming: false,
    streamingContent: '',
    error: null,
    currentSession: null,
    pendingAction: null,
    dataRequest: null,
  });

  // Ref para sessão atual (para evitar problemas de closure)
  const currentSessionRef = useRef<ChatSession | null>(null);
  currentSessionRef.current = state.currentSession;

  // Ref para streaming content (para acesso em callbacks)
  const streamingRef = useRef('');

  // Flag para evitar carregamento duplo
  const hasLoadedLastSession = useRef(false);

  // Carregar última sessão automaticamente ao iniciar
  useEffect(() => {
    if (hasLoadedLastSession.current) return;
    hasLoadedLastSession.current = true;

    const loadLastSession = async () => {
      try {
        const sessions = await chatSessionService.listSessions({ limit: 1 });
        if (sessions.length > 0) {
          const lastSession = sessions[0];
          const messages = await chatSessionService.getSessionMessages(lastSession.id);

          if (messages.length > 0) {
            setState({
              messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                tool_calls: m.tool_calls,
              })),
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              error: null,
              currentSession: lastSession,
              pendingAction: null,
              dataRequest: null,
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar última sessão:', error);
      }
    };

    loadLastSession();
  }, []);

  // Envia mensagem para o agente com streaming
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      isStreaming: false,
      streamingContent: '',
      error: null,
    }));

    streamingRef.current = '';

    try {
      // Garantir que existe uma sessão
      let sessionId = currentSessionRef.current?.id;

      if (!sessionId) {
        const titulo = chatSessionService.generateAutoTitle(content);
        const newSession = await chatSessionService.createSession(titulo);
        sessionId = newSession.id;
        setState(prev => ({ ...prev, currentSession: newSession }));
        currentSessionRef.current = newSession;
      }

      // Usar streaming SSE
      await centralIAService.sendMessageStream(
        [userMessage],
        sessionId,
        {
          onToken: (token) => {
            streamingRef.current += token;
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: true,
              streamingContent: streamingRef.current,
            }));
          },
          onToolStart: (toolName) => {
            console.log(`Tool executando: ${toolName}`);
          },
          onNeedsConfirmation: ({ message, pendingAction }) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              messages: [
                ...prev.messages,
                { role: 'assistant', content: message },
              ],
              pendingAction,
            }));
          },
          onNeedsData: ({ message, dataRequest }) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              messages: [
                ...prev.messages,
                { role: 'assistant', content: message },
              ],
              dataRequest,
            }));
          },
          onDone: (returnedSessionId) => {
            const finalContent = streamingRef.current;
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              messages: finalContent
                ? [...prev.messages, { role: 'assistant', content: finalContent }]
                : prev.messages,
            }));

            // Atualizar sessão se retornada
            if (returnedSessionId && !currentSessionRef.current) {
              chatSessionService.getSession(returnedSessionId).then(session => {
                if (session) {
                  setState(prev => ({ ...prev, currentSession: session }));
                  currentSessionRef.current = session;
                }
              });
            }
          },
          onError: (errorMsg) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              error: errorMsg,
            }));
          },
        },
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
        streamingContent: '',
        error: error instanceof Error ? error.message : 'Erro ao enviar mensagem',
      }));
    }
  }, []);

  // Confirma ação pendente (JSON, sem streaming)
  const confirmAction = useCallback(async () => {
    if (!state.pendingAction) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await centralIAService.processConfirmation(
        state.pendingAction.id,
        true
      );

      if (response.message) {
        setState(prev => ({
          ...prev,
          messages: [
            ...prev.messages,
            { role: 'assistant', content: response.message! },
          ],
          isLoading: false,
          pendingAction: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          pendingAction: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao confirmar ação',
      }));
    }
  }, [state.pendingAction]);

  // Rejeita ação pendente
  const rejectAction = useCallback(async () => {
    if (!state.pendingAction) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await centralIAService.processConfirmation(
        state.pendingAction.id,
        false
      );

      if (response.message) {
        setState(prev => ({
          ...prev,
          messages: [
            ...prev.messages,
            { role: 'assistant', content: response.message! },
          ],
          isLoading: false,
          pendingAction: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          pendingAction: null,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        pendingAction: null,
        error: error instanceof Error ? error.message : 'Erro ao cancelar ação',
      }));
    }
  }, [state.pendingAction]);

  // Envia dados coletados via modal (streaming)
  const submitUserData = useCallback(async (data: Record<string, unknown>) => {
    setState(prev => ({ ...prev, isLoading: true, dataRequest: null, streamingContent: '' }));
    streamingRef.current = '';

    try {
      const sessionId = currentSessionRef.current?.id;
      const userDataMessage: ChatMessage = {
        role: 'user',
        content: `Dados fornecidos: ${JSON.stringify(data)}`,
      };

      await centralIAService.sendMessageStream(
        [userDataMessage],
        sessionId,
        {
          onToken: (token) => {
            streamingRef.current += token;
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: true,
              streamingContent: streamingRef.current,
            }));
          },
          onNeedsConfirmation: ({ message, pendingAction }) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              messages: [...prev.messages, { role: 'assistant', content: message }],
              pendingAction,
            }));
          },
          onNeedsData: ({ message, dataRequest: newRequest }) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              messages: [...prev.messages, { role: 'assistant', content: message }],
              dataRequest: newRequest,
            }));
          },
          onDone: () => {
            const finalContent = streamingRef.current;
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              messages: finalContent
                ? [...prev.messages, { role: 'assistant', content: finalContent }]
                : prev.messages,
            }));
          },
          onError: (errorMsg) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              error: errorMsg,
            }));
          },
        },
        data,
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isStreaming: false,
        streamingContent: '',
        error: error instanceof Error ? error.message : 'Erro ao enviar dados',
      }));
    }
  }, []);

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
      isStreaming: false,
      streamingContent: '',
      error: null,
      currentSession: null,
      pendingAction: null,
      dataRequest: null,
    });
    currentSessionRef.current = null;
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
        isStreaming: false,
        streamingContent: '',
        error: null,
        currentSession: session,
        pendingAction: null,
        dataRequest: null,
      });
      currentSessionRef.current = session;
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
    setState(prev => ({
      ...prev,
      messages: [],
      currentSession: null,
      streamingContent: '',
      isStreaming: false,
    }));
    currentSessionRef.current = null;
  }, []);

  // Adiciona uma mensagem diretamente (para uso em fluxos externos como importação)
  const addMessage = useCallback(async (message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));

    // Salvar no banco de dados se tiver sessão
    try {
      let sessionId = currentSessionRef.current?.id;

      // Se não tiver sessão, criar uma
      if (!sessionId) {
        const titulo = message.role === 'user'
          ? chatSessionService.generateAutoTitle(message.content)
          : 'Importação de arquivo';
        const newSession = await chatSessionService.createSession(titulo);
        sessionId = newSession.id;
        setState(prev => ({ ...prev, currentSession: newSession }));
        currentSessionRef.current = newSession;
      }

      // Só salva se for um role válido (ignora 'tool')
      if (message.role === 'user' || message.role === 'assistant' || message.role === 'system') {
        await chatSessionService.addMessage(sessionId, {
          role: message.role,
          content: message.content,
        });
      }
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    streamingContent: state.streamingContent,
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
