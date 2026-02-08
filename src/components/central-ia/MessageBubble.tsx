import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { User, Wrench } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MarkdownRenderer } from './MarkdownRenderer';
import { InteractiveMessage } from './interactive';
import type { ChatMessage } from '../../types/central-ia';

interface MessageBubbleProps {
  message: ChatMessage;
  isLast?: boolean;
  onInteractiveAction?: (action: string, value?: string) => void;
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  function MessageBubble({ message, isLast, onInteractiveAction }, ref) {
    const isUser = message.role === 'user';
    const isTool = message.role === 'tool';
    const hasInteractive = message.interactive && message.interactive.elements.length > 0;

    // Não renderiza mensagens de sistema ou tool (mas pode mostrar indicador de tool)
    if (message.role === 'system') return null;

    // Renderiza indicador de tool execution
    if (isTool) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500"
        >
          <Wrench className="w-4 h-4 text-coral-500" />
          <span>Executando operação...</span>
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex gap-3 py-3',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {/* Avatar */}
        {isUser ? (
          <div className="flex-shrink-0 w-7 h-7 md:w-10 md:h-10 rounded-full bg-coral-500 text-white flex items-center justify-center">
            <User className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        ) : (
          <img
            src="/personagem.vitto.icone.red.png"
            alt="Vitto"
            className="flex-shrink-0 w-7 h-7 md:w-10 md:h-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200/60"
          />
        )}

        {/* Conteúdo */}
        <div
          className={cn(
            'max-w-[92%] md:max-w-[85%] rounded-2xl px-3 py-2.5 md:px-4 md:py-3',
            isUser
              ? 'bg-coral-500 text-white rounded-tr-sm'
              : 'bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-tl-sm shadow-sm'
          )}
        >
          {/* Renderização de Markdown */}
          {message.content && (
            <div className="text-[13px] leading-normal md:text-sm md:leading-relaxed">
              <MarkdownRenderer
                content={message.content}
                isUser={isUser}
              />
            </div>
          )}

          {/* Indicador de tool calls */}
          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200/50">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Wrench className="w-3 h-3" />
                <span>
                  {message.tool_calls.length} ferramenta(s) executada(s)
                </span>
              </div>
            </div>
          )}

          {/* Conteúdo interativo (botões, cards, etc.) */}
          {hasInteractive && !isUser && (
            <InteractiveMessage
              interactive={message.interactive!}
              onButtonClick={(value) => onInteractiveAction?.('button', value)}
              onConfirm={() => onInteractiveAction?.('confirm')}
              onCancel={() => onInteractiveAction?.('cancel')}
              disabled={!isLast}
            />
          )}
        </div>
      </motion.div>
    );
  }
);
