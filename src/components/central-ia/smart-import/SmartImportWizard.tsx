/**
 * SmartImportWizard - Wizard de Importacao Inteligente
 *
 * Modal com 4 passos para importacao de dados:
 * 1. Selecao do tipo de importacao
 * 2. Mapeamento de colunas
 * 3. Configuracao de destino
 * 4. Preview e confirmacao
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { smartImportService } from '../../../services/ai/SmartImportService';
import { Step1ImportType } from './Step1ImportType';
import { Step2ColumnMapping } from './Step2ColumnMapping';
import { Step3Destination } from './Step3Destination';
import { Step4Preview } from './Step4Preview';
import { ImportSuccess } from './ImportSuccess';
import type {
  FileAnalysis,
  ImportWizardConfig,
  PreparedImportData,
  ImportResult,
  ImportTarget,
  ColumnMapping,
  TransactionType,
} from '../../../types/smart-import';

interface SmartImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onImportComplete?: (result: ImportResult) => void;
}

/**
 *
 */
export function SmartImportWizard({
  isOpen,
  onClose,
  file,
  onImportComplete,
}: SmartImportWizardProps) {
  // Estado do wizard
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [preparedData, setPreparedData] = useState<PreparedImportData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Configuracao do wizard
  const [config, setConfig] = useState<Partial<ImportWizardConfig>>({});

  // Analisar arquivo quando modal abre
  useEffect(() => {
    if (isOpen && file && !analysis) {
      analyzeFile();
    }
  }, [isOpen, file]);

  // Reset ao fechar
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setAnalysis(null);
      setPreparedData(null);
      setImportResult(null);
      setError(null);
      setConfig({});
    }
  }, [isOpen]);

  const analyzeFile = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await smartImportService.analyzeFile(file);

      if (!result.success) {
        setError(result.error || 'Erro ao analisar arquivo');
        return;
      }

      setAnalysis(result);

      // Pre-configurar com sugestoes
      setConfig({
        step1: { importType: result.suggestedImportType },
        step2: { mappings: result.suggestedMappings },
        step3: {
          transactionType: 'despesa',
          destinationType: 'conta',
        },
        step4: { selectedIds: new Set() },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStep1Change = (importType: ImportTarget) => {
    setConfig((prev) => ({
      ...prev,
      step1: { importType },
    }));
  };

  const handleStep2Change = (mappings: ColumnMapping[]) => {
    setConfig((prev) => ({
      ...prev,
      step2: { mappings },
    }));
  };

  const handleStep3Change = (step3Config: {
    transactionType: TransactionType | 'auto';
    destinationType: 'conta' | 'cartao' | 'auto';
    contaId?: number;
    cartaoId?: number;
    categoriaDefault?: number;
  }) => {
    setConfig((prev) => ({
      ...prev,
      step3: step3Config,
    }));
  };

  const handleStep4Change = (selectedIds: Set<number>) => {
    setConfig((prev) => ({
      ...prev,
      step4: { selectedIds },
    }));
  };

  const prepareData = async () => {
    if (!file || !config.step1 || !config.step2 || !config.step3) return;

    try {
      const fullConfig: ImportWizardConfig = {
        step1: config.step1,
        step2: config.step2,
        step3: config.step3,
        step4: config.step4 || { selectedIds: new Set() },
      };

      const data = await smartImportService.prepareImportData(file, fullConfig);
      setPreparedData(data);

      // Selecionar todos os itens validos por padrao
      const validIds = new Set(data.items.filter((i) => i.valid).map((i) => i.id));
      setConfig((prev) => ({
        ...prev,
        step4: { selectedIds: validIds },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao preparar dados');
    }
  };

  const handleNext = async () => {
    if (currentStep === 3) {
      // Preparar dados antes de ir para o step 4
      await prepareData();
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleImport = async () => {
    if (!preparedData || !config.step4) return;

    setIsImporting(true);
    setError(null);

    try {
      const fullConfig: ImportWizardConfig = {
        step1: config.step1!,
        step2: config.step2!,
        step3: config.step3!,
        step4: config.step4,
      };

      const result = await smartImportService.executeImport(
        preparedData,
        fullConfig,
        config.step4.selectedIds
      );

      setImportResult(result);
      onImportComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setIsImporting(false);
    }
  };

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return !!config.step1?.importType;
      case 2: {
        // Verificar se campos obrigatorios estao mapeados
        const mappings = config.step2?.mappings || [];
        const mappedFields = mappings.map((m) => m.targetField);
        if (config.step1?.importType === 'transacoes') {
          return (
            mappedFields.includes('data') &&
            mappedFields.includes('descricao') &&
            mappedFields.includes('valor')
          );
        }
        if (config.step1?.importType === 'transacoes_fixas') {
          return (
            mappedFields.includes('descricao') &&
            mappedFields.includes('valor')
          );
        }
        if (config.step1?.importType === 'patrimonio') {
          return (
            mappedFields.includes('nome') &&
            mappedFields.includes('valor_atual')
          );
        }
        return true;
      }
      case 3:
        return !!(
          config.step3?.transactionType &&
          config.step3?.destinationType &&
          (config.step3.destinationType === 'auto' ||
            config.step3.contaId ||
            config.step3.cartaoId)
        );
      case 4:
        return (config.step4?.selectedIds?.size || 0) > 0;
      default:
        return false;
    }
  }, [currentStep, config]);

  if (!isOpen) return null;

  // Tela de sucesso
  if (importResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        >
          <ImportSuccess result={importResult} onClose={onClose} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-coral-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-coral-100 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-coral-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Importacao Inteligente
              </h2>
              <p className="text-sm text-slate-500">
                Passo {currentStep} de 4
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step < currentStep
                      ? 'bg-green-500 text-white'
                      : step === currentStep
                      ? 'bg-coral-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step < currentStep ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`w-12 sm:w-20 h-1 mx-1 rounded ${
                      step < currentStep ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Tipo</span>
            <span>Colunas</span>
            <span>Destino</span>
            <span>Confirmar</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading state */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-coral-500 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Analisando arquivo...</p>
              <p className="text-slate-400 text-sm mt-1">{file?.name}</p>
            </div>
          )}

          {/* Error state */}
          {error && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 font-medium mb-2">Erro na analise</p>
              <p className="text-slate-500 text-sm text-center max-w-md">{error}</p>
              <button
                onClick={analyzeFile}
                className="mt-4 px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Steps */}
          {!isAnalyzing && !error && analysis && (
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Step1ImportType
                    analysis={analysis}
                    selectedType={config.step1?.importType}
                    onChange={handleStep1Change}
                  />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Step2ColumnMapping
                    analysis={analysis}
                    importType={config.step1?.importType || 'transacoes'}
                    mappings={config.step2?.mappings || []}
                    onChange={handleStep2Change}
                  />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Step3Destination
                    importType={config.step1?.importType || 'transacoes'}
                    config={config.step3}
                    onChange={handleStep3Change}
                  />
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Step4Preview
                    preparedData={preparedData}
                    selectedIds={config.step4?.selectedIds || new Set()}
                    onChange={handleStep4Change}
                    isLoading={!preparedData}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {!isAnalyzing && !error && analysis && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proximo
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={!canProceed() || isImporting}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Importar {config.step4?.selectedIds?.size || 0} itens
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
