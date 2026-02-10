import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, FileSpreadsheet, FileText, Image } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_FILE_TYPES = [
  // Documentos
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  // Imagens (processadas via GPT Vision)
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
].join(',');

const ACCEPTED_EXTENSIONS = '.pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp';

/**
 *
 */
export function FileUploadButton({
  onFileSelect,
  disabled = false,
  className
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          'text-slate-400 hover:text-coral-500 hover:bg-coral-50',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        title="Importar fatura (PDF, planilha ou imagem)"
      >
        <Paperclip className="w-5 h-5" />
      </motion.button>

      {/* Tooltip simples */}
      <AnimatePresence>
        {showTooltip && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={cn(
              'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
              'bg-slate-800 text-white rounded-lg shadow-lg p-3',
              'text-xs whitespace-nowrap'
            )}
          >
            <div className="space-y-2">
              <p className="font-medium text-sm">Importar fatura</p>
              <div className="text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-blue-400" />
                  <span>Print/Foto (PNG, JPG)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PDF com texto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Planilha (XLSX, CSV)</span>
                </div>
              </div>
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept={`${ACCEPTED_FILE_TYPES},${ACCEPTED_EXTENSIONS}`}
        onChange={handleChange}
        className="hidden"
        aria-label="Upload de arquivo de fatura"
      />
    </div>
  );
}
