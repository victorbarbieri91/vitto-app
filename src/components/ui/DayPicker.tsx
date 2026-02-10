import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DayPickerProps {
  value?: number;
  onChange: (day: number | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  hint?: string;
}

/**
 *
 */
export default function DayPicker({
  value,
  onChange,
  placeholder = 'Selecione o dia',
  error,
  disabled = false,
  className,
  label,
  hint
}: DayPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDaySelect = (day: number) => {
    onChange(day);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  // Generate days array
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-slate-600">
            {label}
            {hint && (
              <span className="ml-1 text-coral-500 text-xs">{hint}</span>
            )}
          </label>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'relative w-full px-3 py-2.5 text-sm text-left border rounded-lg transition-all duration-200',
          'focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 focus:outline-none',
          'hover:border-slate-300 hover:shadow-sm',
          'flex items-center justify-between',
          error ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-white',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'border-coral-500 ring-2 ring-coral-500/20'
        )}
      >
        <div className="flex items-center">
          <Calendar className={cn(
            'w-4 h-4 mr-2 transition-colors',
            value ? 'text-coral-500' : 'text-slate-400'
          )} />
          <span className={cn(
            'transition-colors',
            value ? 'text-slate-900 font-medium' : 'text-slate-500'
          )}>
            {value ? `Dia ${value.toString().padStart(2, '0')}` : placeholder}
          </span>
        </div>

        <div className="flex items-center">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="w-4 h-4 mr-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              ×
            </button>
          )}
          <ChevronDown className={cn(
            'w-4 h-4 text-slate-400 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )} />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center">
          <span className="w-3 h-3 mr-1">⚠️</span>
          {error}
        </p>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200',
              'backdrop-blur-sm overflow-hidden'
            )}
          >
            <div className="p-2">
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => (
                  <motion.button
                    key={day}
                    type="button"
                    onClick={() => handleDaySelect(day)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'w-8 h-8 rounded-lg text-sm font-medium transition-all duration-150',
                      'hover:bg-coral-50 hover:text-coral-600',
                      'focus:outline-none focus:ring-2 focus:ring-coral-500/30',
                      value === day
                        ? 'bg-coral-500 text-white shadow-lg'
                        : 'text-slate-600 hover:shadow-sm'
                    )}
                  >
                    {day}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-2 pb-2 border-t border-slate-100">
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleDaySelect(1)}
                  className="text-xs text-slate-500 hover:text-coral-500 transition-colors"
                >
                  Início do mês
                </button>
                <button
                  type="button"
                  onClick={() => handleDaySelect(15)}
                  className="text-xs text-slate-500 hover:text-coral-500 transition-colors"
                >
                  Meio do mês
                </button>
                <button
                  type="button"
                  onClick={() => handleDaySelect(30)}
                  className="text-xs text-slate-500 hover:text-coral-500 transition-colors"
                >
                  Final do mês
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}