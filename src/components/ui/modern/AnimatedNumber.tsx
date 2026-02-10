import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '../../../utils/cn';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

/**
 * Componente para animar números grandes inspirado no design da Crextio
 * 
 * Features:
 * - Animação suave de contadores
 * - Formatação customizável
 * - Suporte a prefixos e sufixos
 * - Performance otimizada
 * - Controle de precisão decimal
 */
export default function AnimatedNumber({
  value,
  duration = 4000,
  format,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef<number | undefined>(undefined); // Iniciar como undefined

  // Spring physics para animação suave
  const spring = useSpring(displayValue, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  // Transformar o valor spring para número
  const animatedValue = useTransform(spring, (v) => v);

  useEffect(() => {
    // Primeira inicialização ou mudança de valor
    if (prevValue.current === undefined || prevValue.current !== value) {
      console.log('🎯 [AnimatedNumber] Animando para:', value, 'de:', prevValue.current);
      setIsAnimating(true);
      
      // Animar para o novo valor
      spring.set(value);
      
      // Controlar duração da animação
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, duration);

      prevValue.current = value;

      return () => clearTimeout(timer);
    }
  }, [value, duration, spring]);

  // Atualizar o valor exibido
  useEffect(() => {
    const unsubscribe = animatedValue.onChange((v) => {
      setDisplayValue(v);
    });

    return unsubscribe;
  }, [animatedValue]);

  // Formatação do número
  const formatNumber = (num: number): string => {
    if (format) {
      return format(num);
    }

    // Formatação padrão com decimais
    return num.toFixed(decimals);
  };

  return (
    <motion.span
      className={cn(
        'font-bold tabular-nums',
        className
      )}
      initial={false}
      animate={{
        scale: isAnimating ? [1, 1.05, 1] : 1,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
    >
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </motion.span>
  );
}

/**
 * Hook para animar números com controle manual
 */
export function useAnimatedNumber(
  targetValue: number,
  options: {
    duration?: number;
    decimals?: number;
    autoStart?: boolean;
  } = {}
) {
  const { duration = 4000, decimals = 0, autoStart = true } = options;
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = (toValue: number) => {
    setIsAnimating(true);
    
    const startValue = currentValue;
    const difference = toValue - startValue;
    const startTime = Date.now();

    const updateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      const newValue = startValue + (difference * easedProgress);
      setCurrentValue(Number(newValue.toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(updateValue);
  };

  useEffect(() => {
    if (autoStart) {
      animate(targetValue);
    }
  }, [targetValue, autoStart]);

  return {
    value: currentValue,
    isAnimating,
    animate,
  };
} 