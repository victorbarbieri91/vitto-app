import React from 'react';
import { useChat } from '../../store/chat/ChatContext';

interface ChatButtonProps {
  unreadCount?: number;
}

const ChatButton: React.FC<ChatButtonProps> = ({ unreadCount = 0 }) => {
  const { toggleChat, state } = useChat();

  return (
    <button
      onClick={toggleChat}
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center justify-center
        w-14 h-14 rounded-full
        bg-primary text-white
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-in-out
        ${state.isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
      `}
      aria-label={state.isOpen ? "Fechar chat" : "Abrir chat"}
    >
      {/* Ícone do Vô Barsi (placeholder - substituir por SVG ou imagem) */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="w-7 h-7"
      >
        <path 
          fillRule="evenodd" 
          d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" 
          clipRule="evenodd" 
        />
      </svg>

      {/* Badge para notificações não lidas */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default ChatButton;
