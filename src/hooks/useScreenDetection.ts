import { useState, useEffect } from 'react';

export type ScreenSize = 'mobile' | 'compact' | 'medium' | 'large' | 'xlarge';

export interface ScreenInfo {
  size: ScreenSize;
  width: number;
  height: number;
  pixelRatio: number;
  effectiveWidth: number;
  effectiveHeight: number;
  availableSpace: number;
  isTouch: boolean;
}

/**
 * Hook para detecção inteligente de tela que considera:
 * - Largura da viewport
 * - Densidade de pixels (devicePixelRatio)
 * - Espaço disponível total
 * - Capacidades touch
 * 
 * Isso resolve o problema de notebooks com telas pequenas mas alta resolução
 */
export function useScreenDetection(): ScreenInfo {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        size: 'large',
        width: 1920,
        height: 1080,
        pixelRatio: 1,
        effectiveWidth: 1920,
        effectiveHeight: 1080,
        availableSpace: 2073600,
        isTouch: false,
      };
    }
    
    return calculateScreenInfo();
  });

  function calculateScreenInfo(): ScreenInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Calcular dimensões "efetivas" considerando densidade de pixels
    const effectiveWidth = width / Math.max(pixelRatio * 0.8, 1);
    const effectiveHeight = height / Math.max(pixelRatio * 0.8, 1);
    const availableSpace = effectiveWidth * effectiveHeight;
    
    // Detectar se é dispositivo touch
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Lógica de classificação melhorada
    let size: ScreenSize;

    if (width <= 480) {  // Mobile phones (mudado de 640 para 480)
      size = 'mobile';
    } else if (width <= 768 || (isTouch && width <= 834)) {  // Tablets
      size = 'compact';
    } else if (width <= 1024 || availableSpace < 600000) {
      // Notebooks típicos: mesmo com resolução alta, espaço efetivo é limitado
      size = 'compact';
    } else if (width <= 1440 || availableSpace < 1000000) {
      size = 'medium';
    } else if (width <= 1920) {
      size = 'large';
    } else {
      size = 'xlarge';
    }

    // Ajuste especial para notebooks com alta densidade ou telas pequenas
    if (pixelRatio >= 1.25 && !isTouch) {
      // Notebooks com densidade alta (incluindo 1.3x) devem ser tratados como compact
      if (width <= 1680) { // Inclui telas até ~16" 4K
        size = 'compact';
      } else if (width <= 1920 && size === 'large') {
        size = 'medium';
      }
    }

    // Força compact para telas que provavelmente são notebooks físicos pequenos
    // EXCETO dispositivos genuinamente mobile (width <= 480)
    if (height < 800 && width < 1800 && width > 480 && !isTouch) {
      size = 'compact';
    }
    
    return {
      size,
      width,
      height,
      pixelRatio,
      effectiveWidth,
      effectiveHeight,
      availableSpace,
      isTouch,
    };
  }

  useEffect(() => {
    const handleResize = () => {
      setScreenInfo(calculateScreenInfo());
    };

    // Debounce para performance
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return screenInfo;
}

/**
 * Hook para obter classes CSS responsivas baseadas no tamanho de tela
 */
export function useResponsiveClasses() {
  const { size } = useScreenDetection();
  
  const getClasses = () => {
    const base = {
      container: 'space-y-4',
      grid: 'grid grid-cols-1 gap-4',
      metricGrid: 'grid grid-cols-2 gap-3',
      iconSize: 'w-4 h-4',
      padding: 'p-4',
      textSm: 'text-sm',
      textBase: 'text-base',
      textLg: 'text-lg',
    };

    switch (size) {
      case 'mobile':
        return {
          ...base,
          container: 'space-y-2 px-2',
          grid: 'flex flex-col space-y-2',
          metricGrid: 'grid grid-cols-2 gap-2',
          iconSize: 'w-3 h-3',
          padding: 'p-2',
          textSm: 'text-xs',
          textBase: 'text-sm',
          textLg: 'text-base',
        };
      
      case 'compact': // Notebooks e tablets
        return {
          ...base,
          container: 'space-y-3',
          grid: 'grid grid-cols-1 lg:grid-cols-5 gap-3',
          metricGrid: 'grid grid-cols-2 gap-2',
          iconSize: 'w-4 h-4',
          padding: 'p-3',
          textSm: 'text-xs',
          textBase: 'text-sm',
          textLg: 'text-base',
        };
        
      case 'medium':
        return {
          ...base,
          container: 'space-y-5',
          grid: 'grid grid-cols-1 xl:grid-cols-5 gap-5',
          metricGrid: 'grid grid-cols-2 gap-4',
          iconSize: 'w-5 h-5',
          padding: 'p-5',
          textSm: 'text-sm',
          textBase: 'text-base',
          textLg: 'text-lg',
        };
        
      case 'large':
        return {
          ...base,
          container: 'space-y-6',
          grid: 'grid grid-cols-1 xl:grid-cols-5 gap-6',
          metricGrid: 'grid grid-cols-2 gap-5',
          iconSize: 'w-5 h-5',
          padding: 'p-6',
          textSm: 'text-sm',
          textBase: 'text-lg',
          textLg: 'text-xl',
        };
        
      case 'xlarge':
      default:
        return {
          ...base,
          container: 'space-y-8',
          grid: 'grid grid-cols-1 xl:grid-cols-5 gap-8',
          metricGrid: 'grid grid-cols-2 gap-6',
          iconSize: 'w-6 h-6',
          padding: 'p-8',
          textSm: 'text-base',
          textBase: 'text-xl',
          textLg: 'text-2xl',
        };
    }
  };

  return { size, classes: getClasses() };
}
