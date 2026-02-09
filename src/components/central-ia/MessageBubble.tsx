import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Wrench, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MarkdownRenderer } from './MarkdownRenderer';
import { InteractiveMessage } from './interactive';
import { useScreenDetection } from '../../hooks/useScreenDetection';
import type { ChatMessage } from '../../types/central-ia';

interface MessageBubbleProps {
  message: ChatMessage;
  isLast?: boolean;
  previousUserMessage?: string;
  onInteractiveAction?: (action: string, value?: string) => void;
  onFeedback?: (params: {
    userMessage: string;
    assistantMessage: string;
    isPositive: boolean;
    comment?: string;
  }) => void;
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  function MessageBubble({ message, isLast, previousUserMessage, onInteractiveAction, onFeedback }, ref) {
    const isUser = message.role === 'user';
    const isTool = message.role === 'tool';
    const isAssistant = message.role === 'assistant';
    const hasInteractive = message.interactive && message.interactive.elements.length > 0;
    const { size } = useScreenDetection();
    const isMobile = size === 'mobile';

    // Estado de feedback
    const [feedbackState, setFeedbackState] = useState<'none' | 'positive' | 'negative' | 'commenting'>('none');
    const [feedbackComment, setFeedbackComment] = useState('');

    const handleFeedback = (isPositive: boolean) => {
      if (isPositive) {
        setFeedbackState('positive');
        onFeedback?.({
          userMessage: previousUserMessage || '',
          assistantMessage: message.content,
          isPositive: true,
        });
      } else {
        setFeedbackState('commenting');
      }
    };

    const submitNegativeFeedback = () => {
      setFeedbackState('negative');
      onFeedback?.({
        userMessage: previousUserMessage || '',
        assistantMessage: message.content,
        isPositive: false,
        comment: feedbackComment || undefined,
      });
      setFeedbackComment('');
    };

    const cancelComment = () => {
      setFeedbackState('none');
      setFeedbackComment('');
    };

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

    // ========== MOBILE: layout estilo ChatGPT ==========
    if (isMobile) {
      if (isUser) {
        // Usuário: bolha coral compacta à direita, sem avatar
        return (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-end py-1.5"
          >
            <div className="max-w-[80%] bg-coral-500 text-white rounded-2xl rounded-tr-sm px-3.5 py-2">
              {message.content && (
                <div className="text-[13px] leading-normal">
                  <MarkdownRenderer content={message.content} isUser={true} />
                </div>
              )}
            </div>
          </motion.div>
        );
      }

      // Assistente: full-width, sem bolha, sem avatar, texto direto
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="py-2 group"
        >
          {message.content && (
            <div className="text-[13px] leading-relaxed text-slate-700">
              <MarkdownRenderer content={message.content} isUser={false} />
            </div>
          )}

          {/* Indicador de tool calls */}
          {message.tool_calls && message.tool_calls.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Wrench className="w-3 h-3" />
                <span>{message.tool_calls.length} ferramenta(s) executada(s)</span>
              </div>
            </div>
          )}

          {/* Conteúdo interativo */}
          {hasInteractive && (
            <InteractiveMessage
              interactive={message.interactive!}
              onButtonClick={(value) => onInteractiveAction?.('button', value)}
              onConfirm={() => onInteractiveAction?.('confirm')}
              onCancel={() => onInteractiveAction?.('cancel')}
              disabled={!isLast}
            />
          )}

          {/* Feedback - mobile */}
          {isAssistant && message.content && onFeedback && (
            <FeedbackButtons
              feedbackState={feedbackState}
              feedbackComment={feedbackComment}
              onFeedbackComment={setFeedbackComment}
              onFeedback={handleFeedback}
              onSubmitNegative={submitNegativeFeedback}
              onCancelComment={cancelComment}
            />
          )}
        </motion.div>
      );
    }

    // ========== DESKTOP: layout original com avatars e bubbles ==========
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex gap-3 py-3',
          isUser ? 'flex-row-reverse' : 'flex-row group'
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
          {message.content && (
            <div className="text-sm leading-relaxed">
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

          {/* Feedback - desktop */}
          {isAssistant && message.content && onFeedback && (
            <FeedbackButtons
              feedbackState={feedbackState}
              feedbackComment={feedbackComment}
              onFeedbackComment={setFeedbackComment}
              onFeedback={handleFeedback}
              onSubmitNegative={submitNegativeFeedback}
              onCancelComment={cancelComment}
            />
          )}
        </div>
      </motion.div>
    );
  }
);

/** Botões de feedback (thumbs up/down) */
function FeedbackButtons({
  feedbackState,
  feedbackComment,
  onFeedbackComment,
  onFeedback,
  onSubmitNegative,
  onCancelComment,
}: {
  feedbackState: 'none' | 'positive' | 'negative' | 'commenting';
  feedbackComment: string;
  onFeedbackComment: (v: string) => void;
  onFeedback: (isPositive: boolean) => void;
  onSubmitNegative: () => void;
  onCancelComment: () => void;
}) {
  // Já deu feedback
  if (feedbackState === 'positive' || feedbackState === 'negative') {
    return (
      <div className="mt-2 pt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
        {feedbackState === 'positive' ? (
          <ThumbsUp className="w-3 h-3 text-green-500" />
        ) : (
          <ThumbsDown className="w-3 h-3 text-red-400" />
        )}
        <span>Obrigado pelo feedback!</span>
      </div>
    );
  }

  // Escrevendo comentário
  if (feedbackState === 'commenting') {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-2 pt-2 border-t border-slate-100"
      >
        <p className="text-xs text-slate-500 mb-1.5">O que poderia melhorar?</p>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={feedbackComment}
            onChange={(e) => onFeedbackComment(e.target.value)}
            placeholder="Opcional..."
            className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-coral-300 focus:ring-1 focus:ring-coral-200"
            onKeyDown={(e) => e.key === 'Enter' && onSubmitNegative()}
            autoFocus
          />
          <button
            onClick={onSubmitNegative}
            className="p-1.5 rounded-lg bg-coral-500 text-white hover:bg-coral-600 transition-colors"
            title="Enviar feedback"
          >
            <Send className="w-3 h-3" />
          </button>
          <button
            onClick={onCancelComment}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
            title="Cancelar"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Estado inicial - botões de feedback
  return (
    <div className="mt-1.5 pt-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity [div:hover>&]:opacity-100">
      <button
        onClick={() => onFeedback(true)}
        className="p-1 rounded text-slate-300 hover:text-green-500 hover:bg-green-50 transition-colors"
        title="Boa resposta"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onFeedback(false)}
        className="p-1 rounded text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
        title="Resposta pode melhorar"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
