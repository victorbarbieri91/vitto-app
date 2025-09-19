import { useEffect, useRef } from 'react';
import { useChat } from '../../store/chat/ChatContext';
import Message from './Message';

const MessageList = () => {
  const { state } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {state.messages.length === 0 && !state.isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
          <div className="mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-gray-300">
              <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm">
            Sou o Vô Barsi, seu assistente financeiro. <br /> Como posso ajudar?
          </p>
        </div>
      )}

      {state.messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}

      {state.isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 max-w-sm shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
