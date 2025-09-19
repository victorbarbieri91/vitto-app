import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

type ProgressSize = 'sm' | 'md' | 'lg' | 'xl';
type ProgressColor = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'coral';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: ProgressSize;
  color?: ProgressColor;
  strokeWidth?: number;
  centerContent?: ReactNode;
  showValue?: boolean;
  className?: string;
  animate?: boolean;
}

/**
 * Componente de progresso circular inspirado no "Time tracker" da Crextio
 * 
 * Features:
 * - Progresso circular animado
 * - Múltiplos tamanhos (sm, md, lg, xl)
 * - Cores temáticas
 * - Conteúdo central customizável
 * - Animações suaves
 * - Display opcional de porcentagem
 */
export default function ProgressRing({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  strokeWidth,
  centerContent,
  showValue = false,
  className,
  animate = true,
}: ProgressRingProps) {
  // Configurações de tamanho
  const sizeConfig: Record<ProgressSize, { 
    size: number; 
    strokeWidth: number; 
    fontSize: string; 
  }> = {
    sm: { size: 60, strokeWidth: 4, fontSize: 'text-xs' },
    md: { size: 80, strokeWidth: 6, fontSize: 'text-sm' },
    lg: { size: 120, strokeWidth: 8, fontSize: 'text-lg' },
    xl: { size: 160, strokeWidth: 10, fontSize: 'text-2xl' },
  };

  // Configurações de cor
  const colorConfig: Record<ProgressColor, {
    stroke: string;
    background: string;
    text: string;
  }> = {
    primary: {
      stroke: '#F87060',
      background: '#FEE4E2',
      text: 'text-primary-600',
    },
    coral: {
      stroke: '#F87060',
      background: '#FEE4E2',
      text: 'text-coral-600',
    },
    success: {
      stroke: '#22C55E',
      background: '#DCFCE7',
      text: 'text-success-600',
    },
    warning: {
      stroke: '#F59E0B',
      background: '#FEF3C7',
      text: 'text-warning-600',
    },
    danger: {
      stroke: '#EF4444',
      background: '#FEE2E2',
      text: 'text-danger-600',
    },
    neutral: {
      stroke: '#737373',
      background: '#F5F5F5',
      text: 'text-neutral-600',
    },
  };

  const config = sizeConfig[size];
  const colors = colorConfig[color];
  const finalStrokeWidth = strokeWidth || config.strokeWidth;
  
  // Cálculos do círculo
  const radius = (config.size - finalStrokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* SVG Ring */}
      <svg
        width={config.size}
        height={config.size}
        className="transform -rotate-90"
      >
        {/* Background Circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke={colors.background}
          strokeWidth={finalStrokeWidth}
          fill="transparent"
          className="opacity-30"
        />
        
        {/* Progress Circle */}
        <motion.circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={finalStrokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ 
            strokeDashoffset: animate ? strokeDashoffset : circumference - (percentage / 100) * circumference 
          }}
          transition={{ 
            duration: animate ? 1.5 : 0, 
            ease: "easeInOut",
            delay: animate ? 0.2 : 0,
          }}
          className="drop-shadow-sm"
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {centerContent ? (
          centerContent
        ) : showValue ? (
          <div className="text-center">
            <motion.div
              className={cn(
                'font-bold leading-none',
                config.fontSize,
                colors.text
              )}
              initial={animate ? { scale: 0, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: animate ? 0.8 : 0,
                ease: "easeOut" 
              }}
            >
              {Math.round(percentage)}%
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Versão compacta para uso em cards menores
 */
export function ProgressRingCompact({ 
  value, 
  max = 100, 
  color = 'primary',
  size = 40,
  strokeWidth = 4,
}: {
  value: number;
  max?: number;
  color?: ProgressColor;
  size?: number;
  strokeWidth?: number;
}) {
  const colorConfig: Record<ProgressColor, string> = {
    primary: '#F87060',
    coral: '#F87060',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    neutral: '#737373',
  };

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F5F5F5"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorConfig[color]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-neutral-700">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
} 