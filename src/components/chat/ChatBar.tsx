import { useState, useEffect, useRef } from 'react';

import { useChat } from '../../store/chat/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SuggestionChips from './SuggestionChips';

const ChatBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { state } = useChat();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toggleExpansion = () => {
    setIsExpanded(prev => !prev);
  };

  // Foca no input ao expandir
  useEffect(() => {
    if (isExpanded) {
      // Leve timeout para permitir a transição da UI
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  return (
    <div 
      className={`
        fixed bottom-0 left-0 right-0 z-50
        flex justify-center
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'bg-black bg-opacity-25' : ''}
      `}
      onClick={() => { if(isExpanded) toggleExpansion() }}
    >
      <div 
        className={`
          flex flex-col
          bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.08)]
          transition-all duration-300 ease-in-out
          w-full max-w-5xl
          ${isExpanded ? 'h-[550px] max-h-[80vh] rounded-t-2xl' : 'h-[75px]'}
        `}
        onClick={(e) => e.stopPropagation()} // Impede que o clique dentro do chat feche a janela
      >
        {/* Cabeçalho (visível apenas quando expandido) */}
        {isExpanded && (
          <header className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-800">Vô Barsi</h3>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            <button onClick={toggleExpansion} className="p-2 text-gray-400 hover:text-gray-600" aria-label="Recolher chat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" /></svg>
            </button>
          </header>
        )}

        {/* Corpo do Chat (visível apenas quando expandido) */}
        {isExpanded && (
          <div className="flex-1 overflow-y-hidden flex flex-col">
            <MessageList />
            {state.suggestions.length > 0 && <SuggestionChips />}
          </div>
        )}

        {/* Barra de Input (sempre visível, mas com layout ajustado) */}
        <div className={`flex items-center p-2.5 flex-shrink-0 ${isExpanded ? 'border-t border-gray-200' : ''}`}>
          <div className="flex items-center w-full bg-gray-100 rounded-full px-2">
            {!isExpanded && (
              <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 items-center justify-center text-white mr-2 hidden sm:flex">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>
              </div>
            )}
            <MessageInput onFocus={!isExpanded ? toggleExpansion : undefined} customRef={inputRef} />
            {!isExpanded && (
              <button onClick={toggleExpansion} className="p-2 text-gray-500 hover:text-primary" aria-label="Expandir chat">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBar;
