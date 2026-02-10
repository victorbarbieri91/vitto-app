import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  CreditCard,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  invoiceImportService,
  ExtractedTransaction,
  DocumentProcessingResult,
  ImportResult
} from '../../services/ai/InvoiceImportService';
import { CreditCard as CreditCardType } from '../../services/api/CreditCardService';

interface InvoiceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onImportComplete?: (result: ImportResult) => void;
}

type ModalStep = 'processing' | 'review' | 'importing' | 'complete' | 'error';

/**
 *
 */
export function InvoiceImportModal({
  isOpen,
  onClose,
  file,
  onImportComplete
}: InvoiceImportModalProps) {
  const [step, setStep] = useState<ModalStep>('processing');
  const [processingResult, setProcessingResult] = useState<DocumentProcessingResult | null>(null);
  const [transactions, setTransactions] = useState<ExtractedTransaction[]>([]);
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);

  // Processar arquivo apenas UMA VEZ quando o modal abrir
  useEffect(() => {
    if (isOpen && file && !hasProcessed) {
      setHasProcessed(true);
      processFile(file);
    }
  }, [isOpen, file, hasProcessed]);

  // Carregar cartoes disponiveis
  useEffect(() => {
    if (isOpen) {
      loadCards();
    }
  }, [isOpen]);

  // Reset quando fechar
  useEffect(() => {
    if (!isOpen) {
      setStep('processing');
      setProcessingResult(null);
      setTransactions([]);
      setSelectedCardId(null);
      setImportResult(null);
      setError(null);
      setHasProcessed(false); // Reset para permitir novo processamento
    }
  }, [isOpen]);

  const processFile = async (file: File) => {
    setStep('processing');
    setError(null);

    try {
      const result = await invoiceImportService.processDocument(file);

      if (!result.success) {
        setError(result.error || 'Erro ao processar documento');
        setStep('error');
        return;
      }

      setProcessingResult(result);
      setTransactions(result.transactions);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStep('error');
    }
  };

  const loadCards = async () => {
    try {
      const availableCards = await invoiceImportService.getAvailableCards();
      setCards(availableCards);
      if (availableCards.length > 0 && !selectedCardId) {
        setSelectedCardId(availableCards[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar cartoes:', err);
    }
  };

  const toggleTransaction = (id: string) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === id ? { ...t, selected: !t.selected } : t
      )
    );
  };

  const toggleAllTransactions = () => {
    const allSelected = transactions.every(t => t.selected);
    setTransactions(prev =>
      prev.map(t => ({ ...t, selected: !allSelected }))
    );
  };

  const handleImport = async () => {
    if (!selectedCardId) {
      setError('Selecione um cartao');
      return;
    }

    const selectedCount = transactions.filter(t => t.selected).length;
    if (selectedCount === 0) {
      setError('Selecione pelo menos uma transacao');
      return;
    }

    setStep('importing');
    setError(null);

    try {
      const result = await invoiceImportService.importTransactions(
        transactions,
        selectedCardId
      );

      setImportResult(result);
      setStep('complete');
      onImportComplete?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
      setStep('error');
    }
  };

  // Calcular totais
  const totals = useMemo(() => {
    const selected = transactions.filter(t => t.selected);
    const total = selected.reduce((acc, t) => acc + t.valor, 0);
    return {
      count: selected.length,
      total
    };
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn(
            'relative bg-white rounded-2xl shadow-2xl w-full max-w-lg',
            'max-h-[90vh] flex flex-col overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-coral-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Importar Fatura</h2>
                {file && (
                  <p className="text-sm text-slate-500 truncate max-w-[200px]">
                    {file.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Processing State */}
            {step === 'processing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-coral-500 animate-spin" />
                <div className="text-center">
                  <p className="text-slate-700 font-medium">Processando documento...</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Extraindo transacoes com IA
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {step === 'error' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-slate-700 font-medium">Erro ao processar</p>
                  <p className="text-sm text-red-500 mt-1">{error}</p>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Review State */}
            {step === 'review' && (
              <div className="space-y-6">
                {/* Card Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cartao de Credito
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCardId || ''}
                      onChange={(e) => setSelectedCardId(Number(e.target.value))}
                      className={cn(
                        'w-full px-4 py-3 pr-10 rounded-xl border border-slate-200',
                        'bg-white text-slate-700 appearance-none cursor-pointer',
                        'focus:outline-none focus:ring-2 focus:ring-coral-100 focus:border-coral-300'
                      )}
                    >
                      {cards.length === 0 ? (
                        <option value="">Nenhum cartao cadastrado</option>
                      ) : (
                        cards.map(card => (
                          <option key={card.id} value={card.id}>
                            {card.nome}
                            {card.ultimos_quatro_digitos && ` •••• ${card.ultimos_quatro_digitos}`}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Stats */}
                {processingResult && (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-slate-600">
                        {transactions.length} transacoes
                      </span>
                    </div>
                    <div className="w-px h-4 bg-slate-200" />
                    <div className="text-sm text-slate-600">
                      Confianca: {Math.round(processingResult.confianca * 100)}%
                    </div>
                  </div>
                )}

                {/* Transactions List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">
                      Transacoes ({totals.count} selecionadas)
                    </span>
                    <button
                      onClick={toggleAllTransactions}
                      className="text-sm text-coral-500 hover:text-coral-600"
                    >
                      {transactions.every(t => t.selected) ? 'Desmarcar todas' : 'Selecionar todas'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {transactions.map(transaction => (
                      <div
                        key={transaction.id}
                        onClick={() => toggleTransaction(transaction.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
                          transaction.selected
                            ? 'bg-coral-50 border border-coral-200'
                            : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                        )}
                      >
                        {/* Checkbox */}
                        <div
                          className={cn(
                            'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
                            transaction.selected
                              ? 'bg-coral-500 text-white'
                              : 'border-2 border-slate-300'
                          )}
                        >
                          {transaction.selected && <Check className="w-3 h-3" />}
                        </div>

                        {/* Data */}
                        <span className="text-sm text-slate-500 w-12 flex-shrink-0">
                          {formatDate(transaction.data)}
                        </span>

                        {/* Descricao */}
                        <span className="flex-1 text-sm text-slate-700 truncate">
                          {transaction.descricao}
                        </span>

                        {/* Valor */}
                        <span className="text-sm font-medium text-slate-800">
                          {formatCurrency(transaction.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl text-white">
                  <span className="font-medium">Total a importar</span>
                  <span className="text-xl font-bold">{formatCurrency(totals.total)}</span>
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
              </div>
            )}

            {/* Importing State */}
            {step === 'importing' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 text-coral-500 animate-spin" />
                <div className="text-center">
                  <p className="text-slate-700 font-medium">Importando transacoes...</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {totals.count} transacoes sendo criadas
                  </p>
                </div>
              </div>
            )}

            {/* Complete State */}
            {step === 'complete' && importResult && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="text-center">
                  <p className="text-slate-700 font-medium">Importacao concluida!</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {importResult.imported} transacoes importadas com sucesso
                  </p>
                  {importResult.failed > 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      {importResult.failed} transacoes com erro
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {(step === 'review' || step === 'complete') && (
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              {step === 'review' && (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={totals.count === 0 || !selectedCardId || cards.length === 0}
                    className={cn(
                      'px-6 py-2.5 rounded-xl font-medium transition-all',
                      'flex items-center gap-2',
                      totals.count > 0 && selectedCardId && cards.length > 0
                        ? 'bg-coral-500 text-white hover:bg-coral-600 shadow-md'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    )}
                  >
                    <CreditCard className="w-4 h-4" />
                    Importar {totals.count > 0 ? `(${totals.count})` : ''}
                  </button>
                </>
              )}
              {step === 'complete' && (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-coral-500 text-white rounded-xl font-medium hover:bg-coral-600 transition-colors"
                >
                  Concluir
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
