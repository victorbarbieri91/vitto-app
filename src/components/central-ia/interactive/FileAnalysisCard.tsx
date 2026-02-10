/**
 * FileAnalysisCard - Card de análise de arquivo no chat
 */

import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  Columns,
  Rows3,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import type { FileAnalysisElement } from '../../../types/central-ia';
import { cn } from '../../../utils/cn';

interface FileAnalysisCardProps {
  element: FileAnalysisElement;
}

/**
 *
 */
export function FileAnalysisCard({ element }: FileAnalysisCardProps) {
  const [showColumns, setShowColumns] = useState(false);

  const getFileIcon = () => {
    return <FileSpreadsheet className="w-5 h-5 text-coral-500" />;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      date: 'Data',
      number: 'Número',
      text: 'Texto',
      category: 'Categoria',
      unknown: 'Desconhecido',
    };
    return labels[type] || type;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-slate-100 text-slate-600';
    if (confidence >= 0.8) return 'bg-green-100 text-green-700';
    if (confidence >= 0.5) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3 bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 truncate">
              {element.fileName}
            </h4>
            <p className="text-xs text-slate-500">
              {element.fileType.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-200/60">
        <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
          <Rows3 className="w-4 h-4 text-blue-500" />
          <div>
            <p className="text-xs text-slate-500">Linhas</p>
            <p className="font-semibold text-slate-800">{element.rowCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
          <Columns className="w-4 h-4 text-purple-500" />
          <div>
            <p className="text-xs text-slate-500">Colunas</p>
            <p className="font-semibold text-slate-800">{element.columns.length}</p>
          </div>
        </div>
      </div>

      {/* Suggested Import Type */}
      {element.suggestedImportType && (
        <div className="px-4 py-3 border-b border-slate-200/60 bg-coral-50/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-coral-500" />
            <span className="text-sm text-slate-700">
              Tipo sugerido:{' '}
              <strong className="text-coral-600">
                {element.suggestedImportType === 'transacoes'
                  ? 'Transações'
                  : element.suggestedImportType === 'transacoes_fixas'
                  ? 'Transações Fixas'
                  : 'Patrimônio'}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Observations */}
      {element.observations && element.observations.length > 0 && (
        <div className="px-4 py-3 border-b border-slate-200/60">
          <div className="space-y-1">
            {element.observations.map((obs, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Columns Toggle */}
      <button
        onClick={() => setShowColumns(!showColumns)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/40 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">
          Ver colunas detectadas
        </span>
        {showColumns ? (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        )}
      </button>

      {/* Columns List */}
      {showColumns && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-slate-200/60"
        >
          <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
            {element.columns.map((col, i) => (
              <div
                key={i}
                className="p-2 bg-white rounded-lg border border-slate-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-800 text-sm">
                    {col.name}
                  </span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      getConfidenceColor(col.confidence)
                    )}
                  >
                    {getTypeLabel(col.type)}
                  </span>
                </div>
                {col.suggestedField && (
                  <p className="text-xs text-coral-600">
                    → Mapeado para: <strong>{col.suggestedField}</strong>
                  </p>
                )}
                {col.samples.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    Ex: {col.samples.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
