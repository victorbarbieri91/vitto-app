/**
 * ColumnMappingCard - Mapeamento de colunas interativo no chat
 */

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Columns,
} from 'lucide-react';
import { useState } from 'react';
import type { ColumnMappingElement } from '../../../types/central-ia';
import { cn } from '../../../utils/cn';

interface ColumnMappingCardProps {
  element: ColumnMappingElement;
  onMappingChange?: (columnIndex: number, newField: string) => void;
}

export function ColumnMappingCard({
  element,
  onMappingChange,
}: ColumnMappingCardProps) {
  const [expandedColumn, setExpandedColumn] = useState<number | null>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.5) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.5) return 'Média';
    return 'Baixa';
  };

  const getImportTypeLabel = () => {
    switch (element.importType) {
      case 'transacoes':
        return 'Transações';
      case 'transacoes_fixas':
        return 'Transações Fixas';
      case 'patrimonio':
        return 'Patrimônio';
      default:
        return element.importType;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-3 bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Columns className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Mapeamento de Colunas</h4>
            <p className="text-xs text-slate-500">
              Tipo: {getImportTypeLabel()}
            </p>
          </div>
        </div>
      </div>

      {/* Missing Required Fields Warning */}
      {element.missingRequired.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Campos obrigatórios não mapeados:
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {element.missingRequired.map((field) => {
                  const fieldInfo = element.availableFields.find(f => f.field === field);
                  return (
                    <span
                      key={field}
                      className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded"
                    >
                      {fieldInfo?.label || field}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mappings */}
      <div className="divide-y divide-slate-100">
        {element.mappings.map((mapping, i) => (
          <div key={i} className="p-3">
            <div className="flex items-center justify-between gap-2">
              {/* Column Name */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">
                  {mapping.columnName}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  Ex: {mapping.samples.slice(0, 2).join(', ')}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />

              {/* Mapped Field */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setExpandedColumn(
                      expandedColumn === mapping.columnIndex ? null : mapping.columnIndex
                    )
                  }
                  className="flex items-center gap-1 px-3 py-1.5 bg-coral-50 text-coral-700 rounded-lg text-sm font-medium hover:bg-coral-100 transition-colors"
                >
                  {element.availableFields.find(f => f.field === mapping.suggestedField)?.label ||
                    mapping.suggestedField}
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform',
                      expandedColumn === mapping.columnIndex && 'rotate-180'
                    )}
                  />
                </button>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    getConfidenceColor(mapping.confidence)
                  )}
                >
                  {getConfidenceLabel(mapping.confidence)}
                </span>
              </div>
            </div>

            {/* Field Selection Dropdown */}
            {expandedColumn === mapping.columnIndex && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-2 p-2 bg-slate-50 rounded-lg"
              >
                <p className="text-xs text-slate-500 mb-2">
                  Selecione o campo correto:
                </p>
                <div className="flex flex-wrap gap-1">
                  {element.availableFields.map((field) => (
                    <button
                      key={field.field}
                      onClick={() => {
                        onMappingChange?.(mapping.columnIndex, field.field);
                        setExpandedColumn(null);
                      }}
                      className={cn(
                        'text-xs px-2 py-1 rounded transition-colors',
                        mapping.suggestedField === field.field
                          ? 'bg-coral-500 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-coral-300'
                      )}
                    >
                      {field.label}
                      {field.required && <span className="text-red-400 ml-0.5">*</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Success indicator */}
      {element.missingRequired.length === 0 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              Todos os campos obrigatórios mapeados
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
