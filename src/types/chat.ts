export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface Suggestion {
  id: string;
  text: string;
  action?: () => void;
}

export interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  suggestions: Suggestion[];
}

export type ChatAction =
  | { type: 'TOGGLE_CHAT' }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUGGESTIONS'; payload: Suggestion[] }
  | { type: 'CLEAR_CHAT' };
