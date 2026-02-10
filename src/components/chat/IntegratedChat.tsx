import { useState } from 'react';
import { Send } from 'lucide-react';
import { ModernCard } from '../ui/modern';
import { useResponsiveClasses } from '../../hooks/useScreenDetection';
import { cn } from '../../utils/cn';

const suggestionChips = [
  'Qual meu saldo total?',
  'Listar últimas 5 despesas',
  'Metas para este ano',
  'Como economizar mais?',
];

/**
 *
 */
export default function IntegratedChat() {
  const { classes, size } = useResponsiveClasses();
  const [message, setMessage] = useState('');
  const [_chatHistory, _setChatHistory] = useState([]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    console.log('Mensagem enviada:', message);
    setMessage('');
  };

  const handleChipClick = (suggestion) => {
    setMessage(suggestion);
  };

  return (
    <ModernCard variant="glass" className={cn(
      size === 'mobile' ? 'p-3' : classes.padding,
      'flex flex-col h-full'
    )}>
      <div className={cn(
        'flex items-center',
        size === 'mobile' ? 'mb-2' : size === 'compact' ? 'mb-3' : 'mb-4'
      )}>
        <img
          src="/icone.vitto.png"
          alt="Vitto"
          className={size === 'mobile' ? 'w-4 h-4 mr-2' : classes.iconSize === 'w-4 h-4' ? 'w-5 h-5 mr-2' : 'w-6 h-6 mr-3'}
        />
        <h3 className={cn(
          size === 'mobile' ? 'text-sm' : classes.textBase,
          'font-bold text-deep-blue'
        )}>Meu Assistente Inteligente</h3>
      </div>
      
      <div
        className={cn(
          'bg-slate-100/50 rounded-2xl overflow-y-auto',
          size === 'mobile' ? 'p-2 mb-2 h-[300px]' : 'flex-1 p-4 min-h-0',
          size !== 'mobile' && (size === 'compact' ? 'mb-3' : 'mb-4')
        )}
      >
        <p className={cn(
          size === 'mobile' ? 'text-xs' : classes.textSm,
          'text-slate-500'
        )}>
          Olá! Como posso te ajudar hoje? Use uma das sugestões abaixo ou digite sua pergunta.
        </p>
      </div>

      <div className={cn(
        'flex flex-wrap',
        size === 'mobile' ? 'mt-auto mb-2 gap-1' : size === 'compact' ? 'mb-3 gap-1' : 'mb-4 gap-2'
      )}>
        {suggestionChips.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => handleChipClick(suggestion)}
            className={cn(
              size === 'mobile' ? 'px-2 py-0.5 text-[10px]' : classes.textSm === 'text-xs' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5',
              'bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-600 font-medium transition-all',
              !size || size !== 'mobile' ? classes.textSm : ''
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
      
      <form onSubmit={handleSendMessage} className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua pergunta..."
          className={cn(
            'w-full bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-coral-500 focus:outline-none transition-shadow',
            size === 'mobile' ? 'pl-3 pr-9 py-1.5 text-xs' : classes.textSm === 'text-xs' ? 'pl-3 pr-10 py-2' : 'pl-4 pr-12 py-3',
            size !== 'mobile' && classes.textSm
          )}
        />
        <button
          type="submit"
          className={cn(
            'absolute top-1/2 -translate-y-1/2 bg-coral-500 hover:bg-coral-600 text-white rounded-lg transition-all',
            size === 'mobile' ? 'right-1 p-1' : classes.textSm === 'text-xs' ? 'right-1.5 p-1.5' : 'right-2 p-2'
          )}
        >
          <Send className={size === 'mobile' ? 'w-3 h-3' : classes.iconSize} />
        </button>
      </form>
    </ModernCard>
  );
}
