import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface SoundManagerContextType {
  isMuted: boolean;
  setMuted: (muted: boolean) => void;
  playSound: (soundType: SoundType) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

type SoundType = 'milestone_complete' | 'badge_unlock' | 'click' | 'notification' | 'success' | 'celebration';

const SoundManagerContext = createContext<SoundManagerContextType | undefined>(undefined);

// Frequências e duração para sons sintéticos
const soundConfigs = {
  milestone_complete: {
    frequencies: [523, 659, 784, 1047], // Do-Mi-Sol-Do
    duration: 600,
    type: 'success' as const
  },
  badge_unlock: {
    frequencies: [392, 523, 659, 784, 1047], // Sol-Do-Mi-Sol-Do
    duration: 800,
    type: 'celebration' as const
  },
  click: {
    frequencies: [800],
    duration: 100,
    type: 'interface' as const
  },
  notification: {
    frequencies: [659, 784],
    duration: 300,
    type: 'alert' as const
  },
  success: {
    frequencies: [523, 659, 784],
    duration: 400,
    type: 'positive' as const
  },
  celebration: {
    frequencies: [392, 523, 659, 784, 1047, 1319], // Escala ascendente
    duration: 1000,
    type: 'celebration' as const
  }
};

export function SoundManagerProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Inicializar AudioContext
  useEffect(() => {
    // Criar AudioContext apenas quando necessário
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    // Inicializar no primeiro clique do usuário
    const handleUserGesture = () => {
      initAudioContext();
      document.removeEventListener('click', handleUserGesture);
    };

    document.addEventListener('click', handleUserGesture);
    return () => document.removeEventListener('click', handleUserGesture);
  }, []);

  const playSound = useCallback((soundType: SoundType) => {
    if (isMuted || !audioContextRef.current) return;

    const config = soundConfigs[soundType];
    const ctx = audioContextRef.current;

    try {
      const now = ctx.currentTime;
      const noteDuration = config.duration / config.frequencies.length / 1000;

      config.frequencies.forEach((frequency, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        const startTime = now + (index * noteDuration);
        const endTime = startTime + noteDuration;

        // Envelope para suavizar o som
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(volume * 0.7, endTime - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, endTime);

        oscillator.start(startTime);
        oscillator.stop(endTime);
      });
    } catch (error) {
      console.warn('Erro ao reproduzir som:', error);
    }
  }, [isMuted, volume]);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    // Salvar preferência no localStorage
    localStorage.setItem('vitto_sound_muted', muted.toString());
  }, []);

  const setVolumeValue = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    // Salvar preferência no localStorage
    localStorage.setItem('vitto_sound_volume', clampedVolume.toString());
  }, []);

  // Carregar preferências do localStorage
  useEffect(() => {
    const savedMuted = localStorage.getItem('vitto_sound_muted');
    const savedVolume = localStorage.getItem('vitto_sound_volume');

    if (savedMuted !== null) {
      setIsMuted(savedMuted === 'true');
    }
    if (savedVolume !== null) {
      setVolume(parseFloat(savedVolume));
    }
  }, []);

  return (
    <SoundManagerContext.Provider
      value={{
        isMuted,
        setMuted,
        playSound,
        volume,
        setVolume: setVolumeValue
      }}
    >
      {children}
    </SoundManagerContext.Provider>
  );
}

export function useSoundManager() {
  const context = useContext(SoundManagerContext);
  if (!context) {
    throw new Error('useSoundManager must be used within a SoundManagerProvider');
  }
  return context;
}

// Hook específico para sons de gamificação
export function useGameSounds() {
  const { playSound } = useSoundManager();

  const playMilestoneComplete = useCallback(() => {
    playSound('milestone_complete');
  }, [playSound]);

  const playBadgeUnlock = useCallback(() => {
    playSound('badge_unlock');
  }, [playSound]);

  const playCelebration = useCallback(() => {
    playSound('celebration');
  }, [playSound]);

  const playSuccess = useCallback(() => {
    playSound('success');
  }, [playSound]);

  const playNotification = useCallback(() => {
    playSound('notification');
  }, [playSound]);

  const playClick = useCallback(() => {
    playSound('click');
  }, [playSound]);

  return {
    playMilestoneComplete,
    playBadgeUnlock,
    playCelebration,
    playSuccess,
    playNotification,
    playClick
  };
}

// Componente de controle de volume
export function VolumeControl({ className = '' }: { className?: string }) {
  const { isMuted, setMuted, volume, setVolume } = useSoundManager();

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={() => setMuted(!isMuted)}
        className={`p-2 rounded-xl transition-colors ${
          isMuted 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
        title={isMuted ? 'Ativar som' : 'Desativar som'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
      
      {!isMuted && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-slate-500 w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}