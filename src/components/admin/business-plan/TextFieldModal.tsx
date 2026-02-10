import { X, Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TextFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onSave?: (value: string) => Promise<void>;
  readOnly?: boolean;
}

/**
 *
 */
export default function TextFieldModal({
  isOpen,
  onClose,
  title,
  value,
  onSave,
  readOnly = false
}: TextFieldModalProps) {
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!onSave || readOnly) return;
    setSaving(true);
    try {
      await onSave(editValue);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = editValue !== value;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {readOnly ? (
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {value || <span className="text-slate-400 italic">Nenhum conteúdo</span>}
              </p>
            </div>
          ) : (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full h-64 px-4 py-3 text-sm text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent resize-none"
              placeholder="Digite o conteúdo..."
            />
          )}
        </div>

        {/* Footer */}
        {!readOnly && onSave && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-medium rounded-lg hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
