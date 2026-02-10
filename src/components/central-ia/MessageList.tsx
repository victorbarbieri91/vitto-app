import { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useScreenDetection } from '../../hooks/useScreenDetection';
import type { ChatMessage } from '../../types/central-ia';
import { cn } from '../../utils/cn';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
  onInteractiveAction?: (action: string, value?: string) => void;
  onFeedback?: (params: {
    userMessage: string;
    assistantMessage: string;
    isPositive: boolean;
    comment?: string;
  }) => void;
}

/**
 *
 */
export function MessageList({
  messages,
  isLoading,
  isStreaming = false,
  streamingContent = '',
  onInteractiveAction,
  onFeedback,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novas mensagens chegam ou streaming atualiza
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isStreaming, streamingContent]);

  // Pega a última mensagem do usuário para contextualizar o indicador de pensamento
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

  const { size } = useScreenDetection();
  const isMobile = size === 'mobile';

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
      <div className="max-w-3xl mx-auto py-3 px-3 md:py-6 md:px-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => {
            // Encontra a mensagem do usuário anterior para contextualizar feedback
            const prevUserMsg = message.role === 'assistant'
              ? messages.slice(0, index).reverse().find(m => m.role === 'user')?.content
              : undefined;
            return (
              <MessageBubble
                key={message.id || `${message.role}-${index}`}
                message={message}
                isLast={index === messages.length - 1 && !isStreaming}
                previousUserMessage={prevUserMsg}
                onInteractiveAction={onInteractiveAction}
                onFeedback={onFeedback}
              />
            );
          })}
        </AnimatePresence>

        {/* Streaming bubble - mostra conteúdo parcial enquanto tokens chegam */}
        {isStreaming && streamingContent && (
          <StreamingBubble content={streamingContent} isMobile={isMobile} />
        )}

        {/* Indicador de loading com contexto da última mensagem */}
        {isLoading && !isStreaming && (
          <ThinkingIndicator userMessage={lastUserMessage?.content} />
        )}

        {/* Elemento para scroll */}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}

/** Bolha de streaming com cursor piscante */
function StreamingBubble({ content, isMobile }: { content: string; isMobile: boolean }) {
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="py-2"
      >
        <div className="text-[13px] leading-relaxed text-slate-700">
          <MarkdownRenderer content={content} isUser={false} />
          <span className="inline-block w-1.5 h-4 bg-coral-500 rounded-sm ml-0.5 animate-pulse" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="flex gap-3 py-3 flex-row"
    >
      {/* Avatar */}
      <img
        src="/personagem.vitto.icone.red.png"
        alt="Vitto"
        className="flex-shrink-0 w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200/60"
      />

      {/* Conteúdo */}
      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-tl-sm shadow-sm">
        <div className="text-sm leading-relaxed">
          <MarkdownRenderer content={content} isUser={false} />
          <span className="inline-block w-1.5 h-4 bg-coral-500 rounded-sm ml-0.5 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}
