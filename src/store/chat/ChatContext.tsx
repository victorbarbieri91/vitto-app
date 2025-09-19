import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

// Função simples para gerar IDs únicos (substitui uuid)
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
import type { ChatState, ChatAction, Suggestion, ChatMessage } from '../../types/chat';

// Estado inicial do chat
const initialState: ChatState = {
  messages: [],
  isOpen: false,
  isLoading: false,
  suggestions: [],
};

// Reducer para gerenciar as ações do chat
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'TOGGLE_CHAT':
      return {
        ...state,
        isOpen: !state.isOpen,
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload,
      };
    case 'CLEAR_CHAT':
      return {
        ...state,
        messages: [],
      };
    default:
      return state;
  }
};

// Criação do contexto
type ChatContextType = {
  state: ChatState;
  toggleChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider do contexto
export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const location = useLocation();

  // Função para alternar a visibilidade do chat
  const toggleChat = () => {
    dispatch({ type: 'TOGGLE_CHAT' });
  };

  // Função para enviar uma mensagem
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Adiciona a mensagem do usuário
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Simula uma resposta da IA (será substituída pela integração MCP no futuro)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Gera uma resposta simulada baseada no conteúdo da mensagem
      let responseContent = '';
      
      if (content.toLowerCase().includes('olá') || content.toLowerCase().includes('oi')) {
        responseContent = 'Olá, netinho! Como posso ajudar você hoje com suas finanças?';
      } else if (content.toLowerCase().includes('saldo') || content.toLowerCase().includes('disponível')) {
        responseContent = 'Você tem R$ 1.250,00 disponíveis em suas contas. Quer ver o detalhamento?';
      } else if (content.toLowerCase().includes('gasto') || content.toLowerCase().includes('gastei')) {
        responseContent = 'Anotei seu gasto! Quer que eu categorize para você?';
      } else if (content.toLowerCase().includes('investir') || content.toLowerCase().includes('investimento')) {
        responseContent = 'Sobre investimentos, sempre digo: compre empresas boas a preços justos e seja paciente!';
      } else {
        responseContent = 'Entendi! Estou aqui para ajudar com suas finanças. Quer uma dica do dia?';
      }

      // Adiciona a resposta da IA
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Mensagem de erro
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Ops! Tive um problema para processar sua mensagem. Pode tentar novamente?',
        timestamp: new Date(),
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Função para limpar o histórico de chat
  const clearChat = () => {
    dispatch({ type: 'CLEAR_CHAT' });
  };

  // Atualiza as sugestões com base na rota atual
  useEffect(() => {
    const path = location.pathname;
    let newSuggestions: Suggestion[] = [];

    // Sugestões específicas para cada página
    if (path.includes('/dashboard')) {
      newSuggestions = [
        { id: generateId(), text: 'Como estão minhas finanças?' },
        { id: generateId(), text: 'Resumo do mês' },
        { id: generateId(), text: 'Dicas de economia' },
      ];
    } else if (path.includes('/transactions')) {
      newSuggestions = [
        { id: generateId(), text: 'Gastei R$50 no mercado' },
        { id: generateId(), text: 'Quanto gastei em alimentação?' },
        { id: generateId(), text: 'Excluir último lançamento' },
      ];
    } else if (path.includes('/accounts')) {
      newSuggestions = [
        { id: generateId(), text: 'Adicionar nova conta' },
        { id: generateId(), text: 'Saldo disponível' },
        { id: generateId(), text: 'Transferir entre contas' },
      ];
    } else if (path.includes('/categories')) {
      newSuggestions = [
        { id: generateId(), text: 'Criar categoria' },
        { id: generateId(), text: 'Categorias mais usadas' },
        { id: generateId(), text: 'Analisar gastos por categoria' },
      ];
    } else {
      // Sugestões padrão
      newSuggestions = [
        { id: generateId(), text: 'Como posso te ajudar?' },
        { id: generateId(), text: 'Dica financeira do dia' },
        { id: generateId(), text: 'Quanto tenho disponível?' },
      ];
    }

    dispatch({ type: 'SET_SUGGESTIONS', payload: newSuggestions });
  }, [location.pathname]);

  return (
    <ChatContext.Provider value={{ state, toggleChat, sendMessage, clearChat }}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat deve ser usado dentro de um ChatProvider');
  }
  return context;
};
