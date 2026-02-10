import { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '../../utils/cn';
import type { ReactNode, LucideIcon } from 'react';

export interface SwipeAction {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

/**
 *
 */
export default function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 70,
  disabled = false,
  className,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const rightActionsWidth = rightActions.length * 64;
  const leftActionsWidth = leftActions.length * 64;

  // Opacity for action buttons based on swipe distance
  const rightOpacity = useTransform(x, [-rightActionsWidth, -threshold / 2, 0], [1, 0.5, 0]);
  const leftOpacity = useTransform(x, [0, threshold / 2, leftActionsWidth], [0, 0.5, 1]);

  if (disabled || (leftActions.length === 0 && rightActions.length === 0)) {
    return <div className={className}>{children}</div>;
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    setSwiping(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // If swiped far enough or fast enough to the left, snap to reveal right actions
    if (offset < -threshold || velocity < -500) {
      // Already handled by drag constraints + spring
    }
    // If swiped far enough to the right, snap to reveal left actions
    if (offset > threshold || velocity > 500) {
      // Already handled by drag constraints + spring
    }
  };

  return (
    <div ref={constraintsRef} className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Right actions (revealed on swipe left) */}
      {rightActions.length > 0 && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 flex items-stretch"
          style={{ opacity: rightOpacity }}
        >
          {rightActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={action.onClick}
                className={cn(
                  "flex flex-col items-center justify-center w-16 gap-1 transition-colors",
                  action.bgColor
                )}
              >
                <Icon className={cn("w-5 h-5", action.color)} />
                <span className={cn("text-[10px] font-medium", action.color)}>{action.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Left actions (revealed on swipe right) */}
      {leftActions.length > 0 && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 flex items-stretch"
          style={{ opacity: leftOpacity }}
        >
          {leftActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={action.onClick}
                className={cn(
                  "flex flex-col items-center justify-center w-16 gap-1 transition-colors",
                  action.bgColor
                )}
              >
                <Icon className={cn("w-5 h-5", action.color)} />
                <span className={cn("text-[10px] font-medium", action.color)}>{action.label}</span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* Swipeable card content */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: rightActions.length > 0 ? -rightActionsWidth : 0,
          right: leftActions.length > 0 ? leftActionsWidth : 0,
        }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={() => setSwiping(true)}
        onDragEnd={handleDragEnd}
        style={{ x, touchAction: 'pan-y' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn("relative z-10", swiping && "cursor-grabbing")}
      >
        {children}
      </motion.div>
    </div>
  );
}
