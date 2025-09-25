import { useState, useEffect } from 'react';

/**
 * Hook customizado para detectar se a viewport está em modo mobile
 * @param breakpoint - Breakpoint em pixels para considerar mobile (padrão: 768px)
 * @returns boolean indicando se está em modo mobile
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Função para verificar o tamanho da tela
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Verificar tamanho inicial
    handleResize();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', handleResize);

    // Cleanup do listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
};

/**
 * Hook para detectar diferentes breakpoints de responsividade
 * @returns objeto com flags para diferentes tamanhos de tela
 */
export const useResponsiveBreakpoints = () => {
  const [breakpoints, setBreakpoints] = useState({
    isMobile: false,    // < 768px
    isTablet: false,    // 768px - 1024px
    isDesktop: false,   // > 1024px
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setBreakpoints({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    // Verificar tamanho inicial
    handleResize();

    // Adicionar listener
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpoints;
};