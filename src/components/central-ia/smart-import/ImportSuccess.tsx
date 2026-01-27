/**
 * ImportSuccess - Tela de sucesso apos importacao
 */

import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ImportResult } from '../../../types/smart-import';

interface ImportSuccessProps {
  result: ImportResult;
  onClose: () => void;
}

export function ImportSuccess({ result, onClose }: ImportSuccessProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const hasErrors = result.failed > 0;
  const isPartialSuccess = result.imported > 0 && result.failed > 0;
  const isFullSuccess = result.imported > 0 && result.failed === 0;
  const isFullFailure = result.imported === 0 && result.failed > 0;

  return (
    <div className="p-6">
      {/* Icone e titulo */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-block mb-4"
        >
          {isFullSuccess && (
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          )}
          {isPartialSuccess && (
            <div className="p-4 bg-amber-100 rounded-full">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            </div>
          )}
          {isFullFailure && (
            <div className="p-4 bg-red-100 rounded-full">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-slate-800"
        >
          {isFullSuccess && 'Importacao Concluida!'}
          {isPartialSuccess && 'Importacao Parcial'}
          {isFullFailure && 'Erro na Importacao'}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500 mt-1"
        >
          {isFullSuccess && `${result.imported} itens importados com sucesso`}
          {isPartialSuccess && `${result.imported} importados, ${result.failed} com erro`}
          {isFullFailure && `Nenhum item foi importado`}
        </motion.p>
      </div>

      {/* Resumo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4 mb-6"
      >
        {/* Estatisticas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-green-600">{result.imported}</p>
            <p className="text-xs text-green-700">Importados</p>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-red-600">{result.failed}</p>
            <p className="text-xs text-red-700">Falhas</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-center">
            <p className="text-2xl font-bold text-slate-600">{result.skipped}</p>
            <p className="text-xs text-slate-700">Ignorados</p>
          </div>
        </div>

        {/* Valor total */}
        {result.summary.totalValue > 0 && (
          <div className="p-4 bg-gradient-to-r from-coral-50 to-blue-50 rounded-xl">
            <p className="text-sm text-slate-600 mb-1">Valor total importado</p>
            <p className="text-2xl font-bold text-slate-800">
              {formatCurrency(result.summary.totalValue)}
            </p>
          </div>
        )}

        {/* Por categoria */}
        {Object.keys(result.summary.byCategory).length > 0 && (
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-700 mb-2">Por categoria</p>
            <div className="space-y-2">
              {Object.entries(result.summary.byCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([category, value]) => (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{category}</span>
                    <span className="font-medium text-slate-800">{formatCurrency(value)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Erros */}
        {hasErrors && result.errors.length > 0 && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm font-medium text-red-700 mb-2">Erros encontrados</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {result.errors.slice(0, 5).map((error, i) => (
                <div key={i} className="text-xs text-red-600">
                  <span className="font-medium">{error.itemDescription}:</span> {error.error}
                </div>
              ))}
              {result.errors.length > 5 && (
                <p className="text-xs text-red-500 mt-1">
                  ... e mais {result.errors.length - 5} erros
                </p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Acoes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {isFullSuccess && (
          <>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors font-medium"
            >
              Ver Transacoes
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Fechar
            </button>
          </>
        )}

        {isPartialSuccess && (
          <>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors font-medium"
            >
              Ver Importados
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Fechar
            </button>
          </>
        )}

        {isFullFailure && (
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-medium"
          >
            Tentar Novamente
          </button>
        )}
      </motion.div>
    </div>
  );
}
