/**
 * Step2ColumnMapping - Passo 2: Mapeamento de colunas
 */

import { AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import type {
  FileAnalysis,
  ImportTarget,
  ColumnMapping,
  MappableField,
} from '../../../types/smart-import';
import { FIELD_LABELS, REQUIRED_FIELDS } from '../../../types/smart-import';

interface Step2ColumnMappingProps {
  analysis: FileAnalysis;
  importType: ImportTarget;
  mappings: ColumnMapping[];
  onChange: (mappings: ColumnMapping[]) => void;
}

/**
 *
 */
export function Step2ColumnMapping({
  analysis,
  importType,
  mappings,
  onChange,
}: Step2ColumnMappingProps) {
  const fieldLabels = FIELD_LABELS[importType];
  const requiredFields = REQUIRED_FIELDS[importType];

  // Campos disponiveis para este tipo de importacao
  const availableFields = Object.keys(fieldLabels) as MappableField[];

  // Verificar quais campos obrigatorios estao mapeados
  const mappedFields = new Set(mappings.filter((m) => m.targetField !== 'ignorar').map((m) => m.targetField));
  const missingRequired = requiredFields.filter((f) => !mappedFields.has(f as any));

  const handleFieldChange = (columnIndex: number, newField: MappableField) => {
    const newMappings = mappings.map((m) => {
      if (m.columnIndex === columnIndex) {
        return { ...m, targetField: newField };
      }
      return m;
    });
    onChange(newMappings);
  };

  // Se mappings esta vazio, inicializar com dados da analise
  if (mappings.length === 0 && analysis.suggestedMappings.length > 0) {
    onChange(analysis.suggestedMappings);
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Titulo */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Mapeamento de Colunas
        </h3>
        <p className="text-sm text-slate-500">
          Associe cada coluna do seu arquivo ao campo correspondente do sistema
        </p>
      </div>

      {/* Alerta de campos obrigatorios */}
      {missingRequired.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Campos obrigatorios faltando
            </p>
            <p className="text-sm text-amber-600 mt-1">
              Mapeie: {missingRequired.map((f) => fieldLabels[f]?.label).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Tabela de mapeamento */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                Sua Coluna
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                Campo do Sistema
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                Exemplo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mappings.map((mapping) => {
              const column = analysis.columns.find((c) => c.index === mapping.columnIndex);
              const isRequired = requiredFields.includes(mapping.targetField as any);
              const isIgnored = mapping.targetField === 'ignorar';

              return (
                <tr
                  key={mapping.columnIndex}
                  className={`${isIgnored ? 'bg-slate-50 opacity-60' : ''}`}
                >
                  {/* Coluna original */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {mapping.columnName}
                      </span>
                      {column?.confidence && column.confidence > 0.7 && (
                        <span className="w-2 h-2 bg-green-400 rounded-full" title="Alta confianca" />
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      Tipo detectado: {column?.detectedType || 'desconhecido'}
                    </span>
                  </td>

                  {/* Select do campo */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={mapping.targetField}
                        onChange={(e) =>
                          handleFieldChange(mapping.columnIndex, e.target.value as MappableField)
                        }
                        className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm appearance-none cursor-pointer transition-colors ${
                          isIgnored
                            ? 'border-slate-200 bg-slate-100 text-slate-500'
                            : isRequired
                            ? 'border-coral-300 bg-coral-50 text-coral-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {availableFields.map((field) => {
                          const info = fieldLabels[field];
                          return (
                            <option key={field} value={field}>
                              {info?.icon} {info?.label}
                              {info?.required ? ' *' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        {mapping.targetField !== 'ignorar' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Exemplo */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {mapping.sampleValues.slice(0, 2).map((val, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded truncate max-w-[120px]"
                          title={val}
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-coral-400 rounded-full" />
          Campo obrigatorio
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full" />
          Alta confianca
        </div>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3 h-3" />
          Dica: "Ignorar" para colunas nao necessarias
        </div>
      </div>

      {/* Preview dos dados */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">
          Preview dos dados (primeiras 3 linhas)
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                {mappings
                  .filter((m) => m.targetField !== 'ignorar')
                  .map((m) => (
                    <th
                      key={m.columnIndex}
                      className="px-3 py-2 text-left text-xs font-medium text-slate-600"
                    >
                      {fieldLabels[m.targetField]?.icon} {fieldLabels[m.targetField]?.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.sampleRows.slice(0, 3).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {mappings
                    .filter((m) => m.targetField !== 'ignorar')
                    .map((m) => (
                      <td
                        key={m.columnIndex}
                        className="px-3 py-2 text-slate-700 truncate max-w-[150px]"
                        title={String(row[m.columnName] || '')}
                      >
                        {String(row[m.columnName] || '-')}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
