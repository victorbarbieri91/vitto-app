import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Star, Target, TrendingUp, Trophy, Gift, MessageCircle } from 'lucide-react';
import type { FraseVitto, CueVitto } from '../../types/historia';

interface VittoCueProps {
  trigger?: string;
  contexto?: 'boas-vindas' | 'parabens' | 'motivacao' | 'dica' | 'comemoração';
  mensagem?: string;
  duracao?: number;
  onClose?: () => void;
  className?: string;
}

// Banco de frases do Vitto por contexto
const frasesVitto: Record<string, FraseVitto[]> = {
  'boas-vindas': [
    {
      id: 'welcome-1',
      contexto: 'boas-vindas',
      texto: 'Olá! Sou o Vitto, seu mentor financeiro. Vamos juntos conquistar seus objetivos!',
      emoji: '👋'
    },
    {
      id: 'welcome-2',
      contexto: 'boas-vindas',
      texto: 'Bem-vindo à sua jornada financeira! Estou aqui para te ajudar a vencer cada desafio.',
      emoji: '🎯'
    },
    {
      id: 'welcome-3',
      contexto: 'boas-vindas',
      texto: 'Que bom te ver por aqui! Vamos transformar sua vida financeira passo a passo.',
      emoji: '✨'
    }
  ],
  'parabens': [
    {
      id: 'congrats-1',
      contexto: 'parabens',
      texto: 'Parabéns! Você subiu mais um degrau rumo à liberdade financeira! 🚀',
      emoji: '🎉'
    },
    {
      id: 'congrats-2',
      contexto: 'parabens',
      texto: 'Fantástico! Mais uma conquista para sua coleção. Continue assim!',
      emoji: '🏆'
    },
    {
      id: 'congrats-3',
      contexto: 'parabens',
      texto: 'Você está mandando muito bem! Cada marco é uma vitória importante.',
      emoji: '⭐'
    },
    {
      id: 'congrats-4',
      contexto: 'parabens',
      texto: 'Isso aí! Você está provando que disciplina financeira dá resultado.',
      emoji: '💪'
    }
  ],
  'motivacao': [
    {
      id: 'motivation-1',
      contexto: 'motivacao',
      texto: 'Você está no caminho certo! Pequenos passos levam a grandes conquistas.',
      emoji: '🌟'
    },
    {
      id: 'motivation-2',
      contexto: 'motivacao',
      texto: 'Não desista! Cada objetivo cumprido te aproxima da sua independência financeira.',
      emoji: '💫'
    },
    {
      id: 'motivation-3',
      contexto: 'motivacao',
      texto: 'Lembre-se: consistência é a chave do sucesso financeiro. Você consegue!',
      emoji: '🔑'
    }
  ],
  'dica': [
    {
      id: 'tip-1',
      contexto: 'dica',
      texto: 'Dica: Que tal automatizar uma transferência mensal para sua reserva?',
      emoji: '💡'
    },
    {
      id: 'tip-2',
      contexto: 'dica',
      texto: 'Vejo que você está indo bem! Já pensou em criar uma nova meta financeira?',
      emoji: '🎯'
    },
    {
      id: 'tip-3',
      contexto: 'dica',
      texto: 'Sua reserva está crescendo! Considere diversificar seus investimentos.',
      emoji: '📈'
    }
  ],
  'comemoração': [
    {
      id: 'celebration-1',
      contexto: 'comemoração',
      texto: 'UHUUUU! 🎊 Você atingiu um marco importante! Que orgulho!',
      emoji: '🎊'
    },
    {
      id: 'celebration-2',
      contexto: 'comemoração',
      texto: 'É ISSO AÍ! 🎉 Mais uma conquista na sua jornada de sucesso!',
      emoji: '🎉'
    },
    {
      id: 'celebration-3',
      contexto: 'comemoração',
      texto: 'BRAVO! 👏 Você está construindo um futuro financeiro sólido!',
      emoji: '👏'
    }
  ]
};

// Ícones por contexto
const iconesContexto = {
  'boas-vindas': MessageCircle,
  'parabens': Trophy,
  'motivacao': Heart,
  'dica': Target,
  'comemoração': Star
};

export default function VittoCue({ 
  trigger, 
  contexto = 'boas-vindas', 
  mensagem, 
  duracao = 5000,
  onClose,
  className = ''
}: VittoCueProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [fraseAtual, setFraseAtual] = useState<FraseVitto | null>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Selecionar frase aleatória do contexto
  const selecionarFrase = (ctx: string): FraseVitto => {
    const frasesDoContexto = frasesVitto[ctx] || frasesVitto['boas-vindas'];
    const indice = Math.floor(Math.random() * frasesDoContexto.length);
    return frasesDoContexto[indice];
  };

  // Mostrar Vitto com animação
  const mostrarVitto = () => {
    const frase = mensagem ? {
      id: 'custom',
      contexto: contexto,
      texto: mensagem,
      emoji: frasesVitto[contexto]?.[0]?.emoji || '😊'
    } : selecionarFrase(contexto);

    setFraseAtual(frase);
    setIsVisible(true);
    setShouldAnimate(true);

    // Auto-hide após duração
    const timer = setTimeout(() => {
      setIsVisible(false);
      setShouldAnimate(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    }, duracao);

    return () => clearTimeout(timer);
  };

  // Trigger effect
  useEffect(() => {
    if (trigger) {
      mostrarVitto();
    }
  }, [trigger]);

  // Fechar manualmente
  const handleClose = () => {
    setIsVisible(false);
    setShouldAnimate(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const IconeContexto = iconesContexto[contexto];

  return (
    <AnimatePresence>
      {isVisible && fraseAtual && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3
          }}
          className={`fixed bottom-6 right-6 z-50 ${className}`}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/60 p-6 max-w-sm">
            {/* Header com avatar do Vitto */}
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar do Vitto */}
              <div className="flex-shrink-0">
                <motion.div
                  animate={shouldAnimate ? {
                    rotate: [0, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ 
                    duration: 0.8,
                    repeat: contexto === 'comemoração' ? 2 : 0
                  }}
                  className="w-12 h-12 bg-gradient-to-br from-coral-500 to-coral-600 rounded-full flex items-center justify-center text-white shadow-lg"
                >
                  <div className="text-lg font-bold">V</div>
                </motion.div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <IconeContexto className="h-4 w-4 text-coral-500" />
                  <span className="text-sm font-medium text-deep-blue">Vitto</span>
                  <button
                    onClick={handleClose}
                    className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="text-sm text-slate-700 leading-relaxed">
                  {fraseAtual.texto}
                </div>
              </div>
            </div>

            {/* Emoji de reação */}
            {fraseAtual.emoji && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-right"
              >
                <span className="text-2xl">{fraseAtual.emoji}</span>
              </motion.div>
            )}

            {/* Barra de progresso */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duracao / 1000, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-coral-500 to-coral-600 rounded-b-3xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook para usar o VittoCue facilmente
export function useVittoCue() {
  const [cue, setCue] = useState<CueVitto | null>(null);

  const mostrarVitto = (
    contexto: 'boas-vindas' | 'parabens' | 'motivacao' | 'dica' | 'comemoração',
    mensagem?: string,
    duracao?: number
  ) => {
    setCue({
      trigger: Date.now().toString(),
      frase: {
        id: 'custom',
        contexto,
        texto: mensagem || '',
        emoji: frasesVitto[contexto]?.[0]?.emoji || '😊'
      },
      duracao,
      animacao: 'bounce'
    });
  };

  const esconderVitto = () => {
    setCue(null);
  };

  return {
    cue,
    mostrarVitto,
    esconderVitto,
    // Funções de conveniência
    parabenizar: (mensagem?: string) => mostrarVitto('parabens', mensagem),
    motivar: (mensagem?: string) => mostrarVitto('motivacao', mensagem),
    darDica: (mensagem?: string) => mostrarVitto('dica', mensagem),
    comemorar: (mensagem?: string) => mostrarVitto('comemoração', mensagem),
    saudar: (mensagem?: string) => mostrarVitto('boas-vindas', mensagem)
  };
}