import { useState, useRef, useEffect } from 'react';
import { Send, Loader, User, Bot, HelpCircle, ChevronDown } from 'lucide-react';
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

const frequentQuestions = {
  consultas: [
    'Qual meu saldo atual?',
    'Listar últimas 5 transações',
    'Mostrar minhas contas',
    'Qual o saldo de cada conta?',
    'Receitas do mês atual',
    'Despesas do mês atual',
    'Listar transações por categoria'
  ],
  ações: [
    'Gastei 50 reais no supermercado',
    'Recebi 100 reais de freelance',
    'Paguei 80 reais de luz',
    'Comprei café da manhã por 15 reais',
    'Recebi pagamento de cliente',
    'Paguei conta do cartão',
    'Transferi dinheiro para poupança'
  ],
  análises: [
    'Como estão meus gastos este mês?',
    'Estou gastando mais que o normal?',
    'Qual categoria gasto mais?',
    'Meu histórico de economia',
    'Relatório financeiro mensal',
    'Comparar gastos com mês passado',
    'Projeção de gastos futuros'
  ]
};

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
  const [showFAQ, setShowFAQ] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'consultas' | 'ações' | 'análises'>('consultas');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = false) => {
    if (scrollContainerRef.current) {
      if (smooth) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    // Only scroll for non-streaming messages or initial streaming message
    const hasStreamingMessage = messages.some(msg => msg.isStreaming);
    const shouldScroll = !hasStreamingMessage ||
      (hasStreamingMessage && messages[messages.length - 1]?.content === 'Pensando...');

    if (shouldScroll) {
      const timer = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length, messages.some(msg => msg.isStreaming && msg.content === 'Pensando...')]);

  // Close FAQ when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (faqRef.current && !faqRef.current.contains(event.target as Node)) {
        setShowFAQ(false);
      }
    };

    if (showFAQ) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFAQ]);

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

    // Create assistant message placeholder with initial content
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: 'Pensando...',
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
                    ? { ...msg, content: accumulatedContent || 'Pensando...', isStreaming: true }
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
      size === 'mobile' ? 'p-2' : 'p-3',
      'flex flex-col',
      // Mobile mantém comportamento original (altura definida pelo pai)
      size === 'mobile' && 'h-full',
      // Desktop: alturas fixas específicas por tamanho de tela
      size === 'compact' && 'h-[400px]',
      size === 'medium' && 'h-[500px]',
      size === 'large' && 'h-[600px]',
      size === 'xlarge' && 'h-[700px]'
    )}>
      {/* Header - Compact */}
      <div className="flex items-center justify-between border-b border-slate-200/50 pb-2 mb-2">
        <div className="flex items-center">
          <img
            src="/icone.vitto.png"
            alt="Vitto"
            className={size === 'mobile' ? 'w-4 h-4 mr-2' : 'w-4 h-4 mr-2'}
          />
          <div className="flex flex-col">
            <h3 className={cn(
              size === 'mobile' ? 'text-xs' : 'text-sm',
              'font-bold text-deep-blue'
            )}>Vitto - IA Financeira</h3>
            {isLoading && (
              <span className="text-xs text-coral-500 font-medium">
                Digitando...
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Messages Area - Flexible height with scroll */}
      <div className={cn(
        'flex-1 min-h-0 overflow-hidden rounded-2xl bg-slate-100/30',
        size === 'mobile' ? 'mb-1' : 'mb-2'
      )}>
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto p-2 space-y-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 transparent',
            willChange: 'contents'
          }}
        >
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2 w-full',
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
                  'max-w-[85%] rounded-2xl px-3 py-2 break-words',
                  size === 'mobile' ? 'text-xs' : classes.textSm,
                  message.role === 'user'
                    ? 'bg-coral-500 text-white'
                    : 'bg-white/80 text-slate-800 shadow-sm',
                )}
              >
                {message.isStreaming && message.content === 'Pensando...' ? (
                  <div className="flex items-center gap-1">
                    <span>Pensando</span>
                    <div className="flex gap-0.5">
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '0ms'}}></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '150ms'}}></div>
                      <div className="w-1 h-1 bg-slate-400 rounded-full animate-pulse" style={{animationDelay: '300ms'}}></div>
                    </div>
                  </div>
                ) : (
                  <>
                    {formatMessageContent(message.content)}
                    <span className={cn(
                      'inline-block w-2 h-4 ml-1',
                      message.isStreaming ? 'bg-slate-400 animate-pulse' : 'bg-transparent'
                    )} />
                  </>
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
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* FAQ Button - Compact and discrete */}
      <div className="relative flex justify-center mb-2" ref={faqRef}>
          <button
            onClick={() => setShowFAQ(!showFAQ)}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 text-deep-blue hover:text-deep-blue/80 hover:bg-slate-100/50 rounded-lg transition-all',
              'focus:outline-none focus:ring-2 focus:ring-deep-blue/20 border border-slate-200/50 bg-white/50',
              'text-xs'
            )}
            title="Dúvidas Financeiras"
          >
            <HelpCircle className="w-3 h-3" />
            Dúvidas Financeiras
            <ChevronDown className={cn(
              'w-3 h-3 transition-transform',
              showFAQ && 'rotate-180'
            )} />
          </button>

          {/* FAQ Dropdown - positioned above */}
          {showFAQ && (
            <div
              className={cn(
                'absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl border border-slate-200 shadow-lg z-50',
                size === 'mobile' ? 'w-80 max-h-96' : 'w-96 max-h-[480px]'
              )}
            >
              {/* Category Tabs */}
              <div className="flex border-b border-slate-200">
                {Object.keys(frequentQuestions).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category as any)}
                    className={cn(
                      'flex-1 px-4 py-3 text-sm font-medium transition-all',
                      selectedCategory === category
                        ? 'text-deep-blue border-b-2 border-deep-blue bg-slate-50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                    )}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {/* Questions List */}
              <div className="max-h-80 overflow-y-auto p-2">
                {frequentQuestions[selectedCategory].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(question);
                      setShowFAQ(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-all',
                      'hover:bg-slate-100 hover:text-deep-blue'
                    )}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Input Area - Compact and centered */}
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
            size === 'mobile' ? 'pl-3 pr-12 text-xs' : 'pl-4 pr-14 text-sm',
            'disabled:opacity-50 disabled:cursor-not-allowed py-2'
          )}
          style={{ minHeight: size === 'mobile' ? '32px' : '40px' }}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !input.trim() || !user}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'bg-coral-500 hover:bg-coral-600 text-white rounded-lg transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-coral-500/50',
            'w-8 h-8 flex items-center justify-center'
          )}
          style={{ transform: 'translateY(calc(-50% - 3.2px))' }}
        >
          {isLoading ? (
            <Loader className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
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