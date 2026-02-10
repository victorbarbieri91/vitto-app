/**
 * ConfirmationCard - Card de confirmação no chat
 */

import { motion } from 'framer-motion';
import { AlertCircle, Check, X } from 'lucide-react';
import type { ConfirmationElement } from '../../../types/central-ia';

interface ConfirmationCardProps {
  element: ConfirmationElement;
  onConfirm?: () => void;
  onCancel?: () => void;
  disabled?: boolean;
}

/**
 *
 */
export function ConfirmationCard({
  element,
  onConfirm,
  onCancel,
  disabled = false,
}: ConfirmationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-amber-200/60">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">{element.title}</h4>
            <p className="text-sm text-slate-600 mt-0.5">{element.description}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      {element.details && element.details.length > 0 && (
        <div className="px-4 py-3 space-y-2">
          {element.details.map((detail, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{detail.label}</span>
              <span className="font-medium text-slate-800">{detail.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 p-4 border-t border-amber-200/60">
        <button
          onClick={onCancel}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          {element.cancelLabel || 'Cancelar'}
        </button>
        <button
          onClick={onConfirm}
          disabled={disabled}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-coral-500 text-white rounded-xl font-medium text-sm hover:bg-coral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          {element.confirmLabel || 'Confirmar'}
        </button>
      </div>
    </motion.div>
  );
}
