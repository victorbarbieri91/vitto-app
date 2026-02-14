import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { centralIAService } from '../services/central-ia';
import { chatSessionService } from '../services/central-ia';
import { supabase } from '../services/supabase/client';
import type { ChatMessage, ChatSession } from '../types/central-ia';

interface InteractiveButton {
  label: string;
  value: string;
}

interface InterviewState {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  currentSession: ChatSession | null;
  isComplete: boolean;
  interactiveButtons: InteractiveButton[] | null;
  isResumingSession: boolean;
  hasStarted: boolean;
  userName: string | null;
}

interface UseInterviewReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  isComplete: boolean;
  interactiveButtons: InteractiveButton[] | null;
  isResumingSession: boolean;
  hasStarted: boolean;
  userName: string | null;
  sendMessage: (content: string) => Promise<void>;
  handleInteractiveAction: (value: string, label?: string) => void;
  skipToDashboard: () => Promise<void>;
  continueLater: () => void;
  startInterview: () => void;
  restartInterview: () => Promise<void>;
  retryLastMessage: () => void;
  clearError: () => void;
}

/**
 * Hook para a entrevista inicial com IA.
 * Suporta: auto-start, session resume, interactive buttons, retry, continue later.
 */
export function useInterview(): UseInterviewReturn {
  const navigate = useNavigate();

  const [state, setState] = useState<InterviewState>({
    messages: [],
    isLoading: false,
    isStreaming: false,
    streamingContent: '',
    error: null,
    currentSession: null,
    isComplete: false,
    interactiveButtons: null,
    isResumingSession: false,
    hasStarted: false,
    userName: null,
  });

  const currentSessionRef = useRef<ChatSession | null>(null);
  currentSessionRef.current = state.currentSession;

  const streamingRef = useRef('');
  const hasAutoStarted = useRef(false);
  const lastUserMessageRef = useRef<string | null>(null);
  const pendingButtonsRef = useRef<InteractiveButton[] | null>(null);

  // Função interna para enviar mensagem com mode='interview'
  const sendMessageInternal = useCallback(async (content: string, isAutoStart = false) => {
    const userMessage: ChatMessage = { role: 'user', content };
    lastUserMessageRef.current = content;

    setState(prev => ({
      ...prev,
      messages: isAutoStart ? prev.messages : [...prev.messages, userMessage],
      isLoading: true,
      isStreaming: false,
      streamingContent: '',
      error: null,
      interactiveButtons: null,
    }));

    streamingRef.current = '';
    pendingButtonsRef.current = null;

    try {
      // Wait for auth to be ready
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        setState(prev => ({ ...prev, isLoading: false, error: 'Sessao expirada. Recarregue a pagina.' }));
        return;
      }

      let sessionId = currentSessionRef.current?.id;

      if (!sessionId) {
        const newSession = await chatSessionService.createSession('Entrevista Inicial');
        sessionId = newSession.id;
        setState(prev => ({ ...prev, currentSession: newSession }));
        currentSessionRef.current = newSession;
      }

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
            console.log(`[Interview] Tool executando: ${toolName}`);
          },
          onNeedsConfirmation: ({ message }) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              messages: [...prev.messages, { role: 'assistant', content: message }],
            }));
          },
          onNeedsData: ({ message }) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isStreaming: false,
              streamingContent: '',
              messages: [...prev.messages, { role: 'assistant', content: message }],
            }));
          },
          onInterviewComplete: async () => {
            setState(prev => ({ ...prev, isComplete: true }));
            // Marcar onboarding como completo no banco
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase
                  .from('app_perfil')
                  .update({ onboarding_completed: true })
                  .eq('id', user.id);
              }
            } catch (err) {
              console.error('[Interview] Erro ao marcar onboarding completo:', err);
            }
          },
          onInteractiveButtons: ({ buttons }) => {
            // Store buttons - they'll be attached when onDone fires
            pendingButtonsRef.current = buttons;
          },
          onDone: (returnedSessionId) => {
            let finalContent = streamingRef.current;
            const buttons = pendingButtonsRef.current;

            // Limpar texto de tool calls que pode ter vazado no streaming
            if (finalContent) {
              finalContent = finalContent
                .replace(/functions\.\w+[^\n]*/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            }

            setState(prev => {
              const newMessages = finalContent
                ? [...prev.messages, { role: 'assistant' as const, content: finalContent }]
                : prev.messages;

              return {
                ...prev,
                isLoading: false,
                isStreaming: false,
                streamingContent: '',
                messages: newMessages,
                interactiveButtons: buttons,
              };
            });

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
        undefined,
        'interview',
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

  // Funcao de inicializacao extraida para poder ser chamada pelo restartInterview
  const initInterviewRef = useRef<(() => Promise<void>) | null>(null);

  // Fase 1 (mount): Checa sessao existente e busca nome do usuario.
  // Se TEM sessao com mensagens -> resume automaticamente (hasStarted=true).
  // Se NAO tem sessao -> para no estado inicial (card de conversa aparece).
  useEffect(() => {
    if (hasAutoStarted.current) return;
    hasAutoStarted.current = true;

    const initInterview = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        if (!authSession) {
          setTimeout(initInterview, 1000);
          return;
        }

        // Buscar nome do usuario do perfil
        const { data: perfil } = await supabase
          .from('app_perfil')
          .select('nome')
          .eq('id', authSession.user.id)
          .single();

        const firstName = perfil?.nome?.split(' ')[0] || authSession.user.user_metadata?.nome?.split(' ')[0] || null;
        if (firstName) {
          setState(prev => ({ ...prev, userName: firstName }));
        }

        // Checar sessao existente
        setState(prev => ({ ...prev, isResumingSession: true }));
        const existingSession = await chatSessionService.findInterviewSession();

        if (existingSession) {
          const messages = await chatSessionService.getSessionMessages(existingSession.id);
          const chatMessages: ChatMessage[] = messages
            .filter((m: ChatMessage) => m.role === 'user' || m.role === 'assistant')
            .filter((m: ChatMessage) => m.content && m.content !== '[INICIAR_ENTREVISTA]')
            .map((m: ChatMessage) => ({
              role: m.role,
              content: m.content,
            }));

          currentSessionRef.current = existingSession;

          if (chatMessages.length > 0) {
            // Resume: pula estado inicial, vai direto pro chat
            setState(prev => ({
              ...prev,
              currentSession: existingSession,
              messages: chatMessages,
              isResumingSession: true,
              hasStarted: true,
            }));
            await sendMessageInternal('[CONTINUAR_ENTREVISTA]', true);
            setState(prev => ({ ...prev, isResumingSession: false }));
          } else {
            // Sessao existe mas sem mensagens - mostra estado inicial
            setState(prev => ({
              ...prev,
              currentSession: existingSession,
              isResumingSession: false,
            }));
          }
        } else {
          // Nenhuma sessao existente - mostra estado inicial (card de conversa)
          setState(prev => ({ ...prev, isResumingSession: false }));
        }
      } catch (error) {
        console.error('Error initializing interview:', error);
        setState(prev => ({ ...prev, isResumingSession: false }));
      }
    };

    initInterviewRef.current = initInterview;
    const timer = setTimeout(initInterview, 500);
    return () => clearTimeout(timer);
  }, [sendMessageInternal]);

  // Fase 2 (watch hasStarted): Quando usuario clica "Vamos comecar!",
  // dispara [INICIAR_ENTREVISTA] se nao tem mensagens carregadas.
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (!state.hasStarted || hasStartedRef.current) return;
    // So dispara se nao veio do resume (resume ja enviou [CONTINUAR_ENTREVISTA])
    if (state.messages.length > 0) return;
    hasStartedRef.current = true;
    sendMessageInternal('[INICIAR_ENTREVISTA]', true);
  }, [state.hasStarted, state.messages.length, sendMessageInternal]);

  // Redirecionar para dashboard quando entrevista completar
  useEffect(() => {
    if (state.isComplete && !state.isStreaming && !state.isLoading) {
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.isComplete, state.isStreaming, state.isLoading, navigate]);

  // Enviar mensagem do usuário
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    await sendMessageInternal(content);
  }, [sendMessageInternal]);

  // Handle interactive button click - show label in UI, send value to AI
  const handleInteractiveAction = useCallback((value: string, label?: string) => {
    const displayText = label || value;
    setState(prev => ({
      ...prev,
      interactiveButtons: null,
      messages: [...prev.messages, { role: 'user' as const, content: displayText }],
    }));
    // Send value to AI with isAutoStart=true so it doesn't duplicate the user message
    sendMessageInternal(value, true);
  }, [sendMessageInternal]);

  // Retry after error - re-send last user message
  const retryLastMessage = useCallback(() => {
    const lastMsg = lastUserMessageRef.current;
    if (lastMsg) {
      setState(prev => ({ ...prev, error: null }));
      sendMessageInternal(lastMsg, lastMsg === '[INICIAR_ENTREVISTA]' || lastMsg === '[CONTINUAR_ENTREVISTA]');
    }
  }, [sendMessageInternal]);

  // Iniciar entrevista (chamado pelo botao "Vamos comecar!")
  const startInterview = useCallback(() => {
    setState(prev => ({ ...prev, hasStarted: true }));
  }, []);

  // Continuar depois - navega para dashboard SEM marcar onboarding completo
  const continueLater = useCallback(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  // Reiniciar entrevista - limpa todos os dados e volta ao card inicial
  const restartInterview = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Chamar RPC que limpa todos os dados do usuario
      await supabase.rpc('reset_user_data', { target_user_id: user.id });

      // 2. Guardar o nome antes de resetar
      const savedName = state.userName;

      // 3. Resetar state local completo
      setState({
        messages: [],
        isLoading: false,
        isStreaming: false,
        streamingContent: '',
        error: null,
        currentSession: null,
        isComplete: false,
        interactiveButtons: null,
        isResumingSession: false,
        hasStarted: false,
        userName: savedName,
      });

      // 4. Resetar todas as refs
      currentSessionRef.current = null;
      streamingRef.current = '';
      hasAutoStarted.current = true; // manter true para nao re-triggerar useEffect
      hasStartedRef.current = false;
      lastUserMessageRef.current = null;
      pendingButtonsRef.current = null;

      // Estado limpo - mostra card de boas-vindas novamente
    } catch (error) {
      console.error('Erro ao reiniciar entrevista:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao reiniciar. Tente novamente.',
      }));
    }
  }, [state.userName]);

  // Pular entrevista e ir direto para o dashboard
  const skipToDashboard = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('app_perfil')
        .update({
          onboarding_completed: true,
        })
        .eq('id', user.id);

      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Erro ao pular entrevista:', error);
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    streamingContent: state.streamingContent,
    error: state.error,
    isComplete: state.isComplete,
    interactiveButtons: state.interactiveButtons,
    isResumingSession: state.isResumingSession,
    hasStarted: state.hasStarted,
    userName: state.userName,
    sendMessage,
    handleInteractiveAction,
    skipToDashboard,
    continueLater,
    startInterview,
    restartInterview,
    retryLastMessage,
    clearError,
  };
}
