import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { User, Wrench } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { ChatMessage } from '../../types/central-ia';

interface MessageBubbleProps {
  message: ChatMessage;
  isLast?: boolean;
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  function MessageBubble({ message, isLast }, ref) {
    const isUser = message.role === 'user';
    const isTool = message.role === 'tool';

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
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-coral-500 text-white flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        ) : (
          <img
            src="/personagem.vitto.icone.red.png"
            alt="Vitto"
            className="flex-shrink-0 w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200/60"
          />
        )}

        {/* Conteúdo */}
        <div
          className={cn(
            'max-w-[85%] rounded-2xl px-4 py-3',
            isUser
              ? 'bg-coral-500 text-white rounded-tr-sm'
              : 'bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-tl-sm shadow-sm'
          )}
        >
          {/* Renderização de Markdown */}
          <div className="text-sm leading-relaxed">
            <MarkdownRenderer
              content={message.content}
              isUser={isUser}
            />
          </div>

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
        </div>
      </motion.div>
    );
  }
);
