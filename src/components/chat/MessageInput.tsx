import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { useChat } from '../../store/chat/ChatContext';

type MessageInputProps = {
  onFocus?: () => void;
  customRef?: RefObject<HTMLTextAreaElement>;
};

const MessageInput = ({ onFocus, customRef }: MessageInputProps) => {
  const [text, setText] = useState('');
  const { sendMessage, state } = useChat();
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef = customRef || internalRef;

  const handleSend = () => {
    if (text.trim()) {
      sendMessage(text.trim());
      setText('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-ajuste da altura do textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'; // Reseta a altura
      const scrollHeight = textAreaRef.current.scrollHeight;
      textAreaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [text, textAreaRef]);

  return (
    <div className="flex-1 flex items-center">
      <textarea
        ref={textAreaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyPress={handleKeyPress}
        onFocus={onFocus}
        placeholder="Vô Barsi está ouvindo..."
        className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm text-gray-800 placeholder-gray-500 py-2.5 max-h-24 overflow-y-auto"
        rows={1}
        disabled={state.isLoading}
      />
      
      {/* Botão de microfone (placeholder) */}
      <button className="p-2 text-gray-500 hover:text-primary-dark transition-colors" disabled={state.isLoading}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
          <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.75 6.75 0 11-13.5 0v-1.5A.75.75 0 016 10.5z" />
        </svg>
      </button>
      
      {/* Botão de enviar */}
      <button 
        onClick={handleSend} 
        disabled={!text.trim() || state.isLoading}
        className="p-2 rounded-full bg-primary text-white hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  );
};

export default MessageInput;
