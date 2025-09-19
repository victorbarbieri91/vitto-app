import React from 'react';
import { useChat } from '../../store/chat/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SuggestionChips from './SuggestionChips';

const ChatInterface: React.FC = () => {
  const { toggleChat, state, clearChat } = useChat();

  return (
    <div 
      className={`
        fixed bottom-0 right-0 z-40
        w-full sm:w-96 h-[550px] max-h-[80vh]
        bg-white rounded-t-xl sm:rounded-xl shadow-xl
        flex flex-col
        transition-all duration-300 ease-in-out
        ${state.isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-[120%] opacity-0 pointer-events-none'}
        sm:bottom-6 sm:right-6
      `}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-6 h-6"
            >
              <path 
                fillRule="evenodd" 
                d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Vô Barsi</h3>
            <p className="text-xs text-gray-500">Seu assistente financeiro</p>
          </div>
        </div>
        
        <div className="flex items-center">
          {/* Botão para limpar o chat */}
          {state.messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpar conversa"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          )}
          
          {/* Botão para fechar o chat */}
          <button
            onClick={toggleChat}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar chat"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5"
            >
              <path 
                fillRule="evenodd" 
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Lista de mensagens */}
      <MessageList />
      
      {/* Sugestões */}
      <SuggestionChips />
      
      {/* Input de mensagem */}
      <MessageInput />
    </div>
  );
};

export default ChatInterface;
