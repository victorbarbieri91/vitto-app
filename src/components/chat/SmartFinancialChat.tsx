import { useState, useRef, useEffect } from 'react';
import { Send, Loader, User, Bot } from 'lucide-react';
import { ModernCard } from '../ui/modern';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { useAuth } from '../../store/AuthContext';
import { cn } from '../../utils/cn';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const suggestionChips = [
  'Qual meu saldo atual?',
  'Listar últimas 5 transações',
  'Gastei 50 reais no supermercado',
  'Como estão meus gastos este mês?',
];

export default function SmartFinancialChat() {
  const { classes, size } = useResponsiveClasses();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! 👋 Sou o Vitto, seu assistente financeiro inteligente. Como posso ajudar você hoje?\n\nPosso consultar seus dados, criar transações, analisar padrões e muito mais!',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading || !user) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Call Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL não configurada');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          userId: user.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                accumulatedContent += content;

                // Update the assistant message with accumulated content
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent, isStreaming: true }
                    : msg
                ));
              }
            } catch (parseError) {
              console.warn('Error parsing streaming data:', parseError);
            }
          }
        }
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error('Chat error:', error);

      // Update assistant message with error
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
              ...msg,
              content: 'Desculpe, houve um erro ao processar sua mensagem. Por favor, tente novamente.',
              isStreaming: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipClick = (suggestion: string) => {
    if (!isLoading) {
      handleSendMessage(suggestion);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <ModernCard variant="glass" className={cn(
      size === 'mobile' ? 'p-3' : classes.padding,
      'flex flex-col h-full'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center border-b border-slate-200/50 pb-3',
        size === 'mobile' ? 'mb-2' : size === 'compact' ? 'mb-3' : 'mb-4'
      )}>
        <img
          src="/icone.vitto.png"
          alt="Vitto"
          className={size === 'mobile' ? 'w-4 h-4 mr-2' : classes.iconSize === 'w-4 h-4' ? 'w-5 h-5 mr-2' : 'w-6 h-6 mr-3'}
        />
        <div className="flex flex-col">
          <h3 className={cn(
            size === 'mobile' ? 'text-sm' : classes.textBase,
            'font-bold text-deep-blue'
          )}>Vitto - IA Financeira</h3>
          {isLoading && (
            <span className={cn(
              size === 'mobile' ? 'text-xs' : 'text-sm',
              'text-coral-500 font-medium'
            )}>
              Digitando...
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        className={cn(
          'flex-1 overflow-y-auto space-y-3',
          size === 'mobile' ? 'min-h-[280px] mb-2' : 'min-h-0',
          size !== 'mobile' && (size === 'compact' ? 'mb-3' : 'mb-4')
        )}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-2',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full bg-coral-500 flex items-center justify-center',
                size === 'mobile' ? 'w-5 h-5' : ''
              )}>
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}

            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2',
                size === 'mobile' ? 'text-xs' : classes.textSm,
                message.role === 'user'
                  ? 'bg-coral-500 text-white'
                  : 'bg-slate-100 text-slate-800',
              )}
            >
              {formatMessageContent(message.content)}
              {message.isStreaming && (
                <span className="inline-block w-2 h-4 bg-slate-400 ml-1 animate-pulse" />
              )}
            </div>

            {message.role === 'user' && (
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full bg-deep-blue flex items-center justify-center',
                size === 'mobile' ? 'w-5 h-5' : ''
              )}>
                <User className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips - Only show if no conversation started */}
      {messages.length === 1 && (
        <div className={cn(
          'flex flex-wrap',
          size === 'mobile' ? 'mb-2 gap-1' : size === 'compact' ? 'mb-3 gap-1' : 'mb-4 gap-2'
        )}>
          {suggestionChips.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(suggestion)}
              disabled={isLoading}
              className={cn(
                size === 'mobile' ? 'px-2 py-0.5 text-[10px]' : classes.textSm === 'text-xs' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5',
                'bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-600 font-medium transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                !size || size !== 'mobile' ? classes.textSm : ''
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua pergunta ou comando financeiro..."
          disabled={isLoading || !user}
          rows={1}
          className={cn(
            'w-full bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-coral-500 focus:outline-none transition-shadow resize-none',
            size === 'mobile' ? 'pl-3 pr-12 py-2 text-xs' : classes.textSm === 'text-xs' ? 'pl-3 pr-12 py-2.5' : 'pl-4 pr-14 py-3',
            size !== 'mobile' && classes.textSm,
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          style={{ minHeight: size === 'mobile' ? '32px' : '40px' }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !input.trim() || !user}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 bg-coral-500 hover:bg-coral-600 text-white rounded-lg transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            size === 'mobile' ? 'right-2 p-1.5' : classes.textSm === 'text-xs' ? 'right-2 p-2' : 'right-2.5 p-2.5'
          )}
        >
          {isLoading ? (
            <Loader className={cn(
              'animate-spin',
              size === 'mobile' ? 'w-3 h-3' : classes.iconSize
            )} />
          ) : (
            <Send className={size === 'mobile' ? 'w-3 h-3' : classes.iconSize} />
          )}
        </button>
      </div>

      {!user && (
        <div className="text-center mt-2">
          <span className={cn(
            size === 'mobile' ? 'text-xs' : 'text-sm',
            'text-slate-500'
          )}>
            Faça login para usar o assistente
          </span>
        </div>
      )}
    </ModernCard>
  );
}