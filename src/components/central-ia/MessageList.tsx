import { useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import type { ChatMessage } from '../../types/central-ia';
import { cn } from '../../utils/cn';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novas mensagens chegam
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Pega a última mensagem do usuário para contextualizar o indicador de pensamento
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full overflow-y-auto scroll-smooth',
        // Scroll invisível
        'scrollbar-none',
        '[&::-webkit-scrollbar]:hidden',
        '[-ms-overflow-style:none]',
        '[scrollbar-width:none]'
      )}
    >
      <div className="max-w-3xl mx-auto py-6 px-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || `${message.role}-${index}`}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
        </AnimatePresence>

        {/* Indicador de loading com contexto da última mensagem */}
        {isLoading && <ThinkingIndicator userMessage={lastUserMessage?.content} />}

        {/* Elemento para scroll */}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
