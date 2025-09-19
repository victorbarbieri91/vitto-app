// Componentes base modernos inspirados no design da Crextio
export { default as ModernButton } from './ModernButton';
export { default as ModernCard } from './ModernCard';
export { default as ModernInput } from './ModernInput';
export { default as ModernBadge } from './ModernBadge';
export { default as ModernSelect } from './ModernSelect';
export { default as ModernSwitch } from './ModernSwitch';

// Componentes especializados
export { default as MetricCard } from './MetricCard';
export { default as ProgressRing, ProgressRingCompact } from './ProgressRing';
export { 
  default as GlassmorphCard, 
  GlassOverlay, 
  GlassFormContainer 
} from './GlassmorphCard';

// Componentes de layout
export { 
  default as WelcomeHeader, 
  DateTimeDisplay, 
  PeriodDisplay 
} from './WelcomeHeader';
export { default as ModernAppLayout } from '../../layout/ModernAppLayout';

// Componentes utilitários
export { default as AnimatedNumber, useAnimatedNumber } from './AnimatedNumber';
export { default as MonthNavigator } from './MonthNavigator';

// Re-exportar utilitários
export { cn } from '../../../utils/cn';
export { 
  buttonVariants, 
  cardVariants, 
  inputVariants,
  type ButtonVariants,
  type CardVariants,
  type InputVariants 
} from '../../../utils/variants'; 