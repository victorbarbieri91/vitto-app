/**
 * Step1ImportType - Passo 1: Selecao do tipo de importacao
 */

import { FileText, RefreshCw, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { FileAnalysis, ImportTarget } from '../../../types/smart-import';

interface Step1ImportTypeProps {
  analysis: FileAnalysis;
  selectedType?: ImportTarget;
  onChange: (type: ImportTarget) => void;
}

const importTypes: Array<{
  value: ImportTarget;
  label: string;
  description: string;
  icon: typeof FileText;
  examples: string[];
}> = [
  {
    value: 'transacoes',
    label: 'Transacoes',
    description: 'Gastos, receitas, compras do dia a dia',
    icon: FileText,
    examples: ['Fatura do cartao', 'Extrato bancario', 'Controle de gastos'],
  },
  {
    value: 'transacoes_fixas',
    label: 'Despesas/Receitas Fixas',
    description: 'Pagamentos recorrentes todo mes',
    icon: RefreshCw,
    examples: ['Salario', 'Aluguel', 'Netflix, Spotify'],
  },
  {
    value: 'patrimonio',
    label: 'Patrimonio/Investimentos',
    description: 'Ativos, investimentos, bens',
    icon: TrendingUp,
    examples: ['Acoes', 'Fundos', 'Imoveis', 'Veiculos'],
  },
];

/**
 *
 */
export function Step1ImportType({
  analysis,
  selectedType,
  onChange,
}: Step1ImportTypeProps) {
  return (
    <div className="space-y-6">
      {/* Info do arquivo */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 truncate">{analysis.fileName}</p>
            <p className="text-sm text-slate-500">
              {analysis.rowCount} linhas encontradas
              {analysis.columns.length > 0 && ` • ${analysis.columns.length} colunas`}
            </p>
            {analysis.confidence > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${analysis.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {Math.round(analysis.confidence * 100)}% confianca
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Observacoes */}
        {analysis.observations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <ul className="text-sm text-slate-600 space-y-1">
              {analysis.observations.slice(0, 3).map((obs, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  {obs}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Titulo */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Que tipo de dados voce esta importando?
        </h3>
        <p className="text-sm text-slate-500">
          Selecione o tipo para configurarmos o mapeamento correto
        </p>
      </div>

      {/* Opcoes */}
      <div className="space-y-3">
        {importTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.value;
          const isSuggested = analysis.suggestedImportType === type.value;

          return (
            <button
              key={type.value}
              onClick={() => onChange(type.value)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-coral-500 bg-coral-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    isSelected ? 'bg-coral-100' : 'bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isSelected ? 'text-coral-600' : 'text-slate-500'
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isSelected ? 'text-coral-700' : 'text-slate-800'
                      }`}
                    >
                      {type.label}
                    </span>
                    {isSuggested && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Sugerido
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-coral-500 ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{type.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {type.examples.map((ex, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
