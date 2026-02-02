import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Image } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ImportQuestionCard } from './ImportQuestionCard';
import { ImportPreviewCard } from './ImportPreviewCard';
import { ConversationalImportAgent, createImportAgent } from '../../services/ai/ConversationalImportAgent';
import type { ChatMessage } from '../../types/central-ia';
import type { ImportResult, ImportTarget } from '../../types/smart-import';
import type { ImportFlowState, ImportChatMessage, ImportQuestion, ExtractedTransaction } from '../../types/import-flow';
import { useAuth } from '../../store/AuthContext';

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onAddMessage?: (message: ChatMessage) => Promise<void> | void;
  disabled?: boolean;
  isCentered?: boolean;
  onImportComplete?: (result: ImportResult) => void;
}

export function ChatContainer({
  messages,
  isLoading,
  onSendMessage,
  onAddMessage,
  disabled = false,
  isCentered = false,
  onImportComplete,
}: ChatContainerProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Estado do agente de importação
  const importAgentRef = useRef<ConversationalImportAgent | null>(null);
  const [importState, setImportState] = useState<ImportFlowState | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<ImportQuestion | null>(null);
  const [previewData, setPreviewData] = useState<{
    transacoes: ExtractedTransaction[];
    summary: { total: number; valor: string; destino: string };
  } | null>(null);

  // Tipos de arquivo suportados (incluindo imagens)
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ];

  const supportedExtensions = ['.pdf', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg', '.webp'];

  const isFileSupported = useCallback((file: File) => {
    const fileName = file.name.toLowerCase();
    return (
      supportedTypes.includes(file.type) ||
      supportedExtensions.some((ext) => fileName.endsWith(ext))
    );
  }, []);

  // Inicializar agente de importação quando usuário estiver logado
  useEffect(() => {
    if (user?.id && !importAgentRef.current) {
      createImportAgent(user.id).then(agent => {
        importAgentRef.current = agent;

        // Configurar callbacks
        agent.setCallbacks({
          onStateChange: (state) => {
            setImportState(state);

            // Atualizar estado da pergunta atual
            if (state.currentQuestion) {
              setCurrentQuestion(state.currentQuestion);
            }

            // Atualizar preview se estiver nesse step
            if (state.step === 'preview') {
              setPreviewData({
                transacoes: state.transacoes,
                summary: {
                  total: state.transacoes.length,
                  valor: `R$ ${state.valorTotal.toFixed(2).replace('.', ',')}`,
                  destino: state.cartaoNome || state.contaNome || 'Transações'
                }
              });
            } else {
              setPreviewData(null);
            }

            // Limpar pergunta quando não estiver em step de pergunta
            if (!['confirming_type', 'selecting_destination', 'collecting_data'].includes(state.step)) {
              setCurrentQuestion(null);
            }
          },
          onMessage: (message) => {
            // Converter mensagem do agente para ChatMessage
            const chatMessage: ChatMessage = {
              id: message.id,
              role: 'assistant',
              content: message.conteudo,
            };

            // Adicionar dados interativos se for pergunta
            if (message.tipo === 'pergunta' && message.dados?.question) {
              chatMessage.interactive = {
                type: 'import_question',
                elements: [{
                  type: 'custom',
                  id: message.dados.question.id,
                  data: message.dados.question
                }]
              };
            }

            // Adicionar dados interativos se for preview
            if (message.tipo === 'preview' && message.dados?.transacoes) {
              chatMessage.interactive = {
                type: 'import_preview',
                elements: [{
                  type: 'custom',
                  id: 'preview',
                  data: {
                    transacoes: message.dados.transacoes,
                    summary: message.dados.summary
                  }
                }]
              };
            }

            addMessage(chatMessage);
          }
        });
      });
    }
  }, [user?.id]);

  // Adiciona uma mensagem ao chat (usa callback se fornecido, senao simula)
  const addMessage = useCallback((message: ChatMessage) => {
    if (onAddMessage) {
      onAddMessage(message);
    }
  }, [onAddMessage]);

  // Handler para responder pergunta do agente de importação
  const handleAnswerQuestion = useCallback((questionId: string, answer: string | number) => {
    if (!importAgentRef.current) return;

    // Adicionar mensagem do usuário com a resposta
    const option = currentQuestion?.opcoes?.find(o => o.id === answer);
    addMessage({
      id: `user-answer-${Date.now()}`,
      role: 'user',
      content: option?.label || String(answer),
    });

    setCurrentQuestion(null);
    importAgentRef.current.answerQuestion(questionId, answer);
  }, [addMessage, currentQuestion]);

  // Handler para toggle de transação no preview
  const handleToggleTransaction = useCallback((transactionId: string) => {
    if (!importAgentRef.current) return;
    importAgentRef.current.toggleTransaction(transactionId);
  }, []);

  // Handler para confirmar importação
  const handleConfirmImport = useCallback(async () => {
    if (!importAgentRef.current) return;

    setIsProcessingFile(true);
    try {
      await importAgentRef.current.confirmImport();

      // Notificar callback de importação completa
      const state = importAgentRef.current.getState();
      if (state.step === 'completed' && onImportComplete) {
        onImportComplete({
          success: true,
          imported: state.importedCount || 0,
          failed: 0,
          skipped: 0,
          errors: [],
          summary: {
            totalValue: state.valorTotal,
            byCategory: {},
            byType: {},
          },
        });
      }
    } finally {
      setIsProcessingFile(false);
      setPreviewData(null);
    }
  }, [onImportComplete]);

  // Handler para cancelar importação
  const handleCancelImport = useCallback(() => {
    if (!importAgentRef.current) return;

    importAgentRef.current.reset();
    setImportState(null);
    setCurrentQuestion(null);
    setPreviewData(null);

    addMessage({
      id: `assistant-cancel-${Date.now()}`,
      role: 'assistant',
      content: '❌ Importação cancelada. Você pode enviar outro arquivo quando quiser.',
    });
  }, [addMessage]);

  // Handler para selecao de arquivo - inicia fluxo conversacional
  const handleFileSelect = useCallback(async (file: File) => {
    if (isProcessingFile || !importAgentRef.current) return;

    setIsProcessingFile(true);

    try {
      // Adiciona mensagem do usuário indicando envio do arquivo
      const isImage = file.type.startsWith('image/');
      const userMessage: ChatMessage = {
        id: `user-file-${Date.now()}`,
        role: 'user',
        content: isImage
          ? `📸 Enviei uma imagem: ${file.name}`
          : `📄 Enviei o arquivo: ${file.name}`,
      };
      addMessage(userMessage);

      // Processar arquivo com o agente de importação
      await importAgentRef.current.processFile(file);

    } catch (error) {
      addMessage({
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar o arquivo. Tente novamente.',
      });
    } finally {
      setIsProcessingFile(false);
    }
  }, [addMessage, isProcessingFile]);

  // Handler para acoes interativas (botoes, confirmacoes) - suporte a formato antigo
  const handleInteractiveAction = useCallback(async (action: string, value?: string) => {
    if (!user?.id) {
      addMessage({
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'Você precisa estar logado para realizar importações.',
      });
      return;
    }

    // Se tiver agente ativo, usar os handlers do novo sistema
    if (importAgentRef.current && importState) {
      if (action === 'cancel') {
        handleCancelImport();
        return;
      }

      // Responder pergunta se for seleção
      if (action === 'button' && value && currentQuestion) {
        handleAnswerQuestion(currentQuestion.id, value);
        return;
      }
    }

    // Fallback para sistema antigo (manter compatibilidade)
    setIsProcessingFile(true);
    try {
      // Ações antigas que ainda podem ser usadas
      if (action === 'cancel') {
        addMessage({
          id: `assistant-cancel-${Date.now()}`,
          role: 'assistant',
          content: '❌ Operação cancelada.',
        });
      }
    } finally {
      setIsProcessingFile(false);
    }
  }, [user?.id, addMessage, importState, currentQuestion, handleAnswerQuestion, handleCancelImport]);

  // Handlers de Drag & Drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const supportedFile = files.find(isFileSupported);

    if (supportedFile) {
      handleFileSelect(supportedFile);
    }
  }, [isFileSupported, handleFileSelect]);

  // Componente de overlay para drag & drop
  const DropOverlay = () => (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-coral-500/10 backdrop-blur-sm border-2 border-dashed border-coral-500 rounded-2xl m-4"
        >
          <div className="flex flex-col items-center text-center p-8 bg-white/90 rounded-2xl shadow-xl">
            <div className="p-4 bg-coral-100 rounded-full mb-4">
              <Upload className="w-10 h-10 text-coral-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Solte o arquivo aqui
            </h3>
            <p className="text-slate-500 mb-4">
              Vou analisar e te ajudar a importar
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4" />
                <span>PDF, Excel, CSV</span>
              </div>
              <div className="flex items-center gap-1">
                <Image className="w-4 h-4" />
                <span>PNG, JPG</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Componente de pergunta de importação
  const renderImportQuestion = () => {
    if (!currentQuestion) return null;

    return (
      <div className="px-4 pb-4">
        <div className="max-w-3xl mx-auto">
          <ImportQuestionCard
            question={currentQuestion}
            onAnswer={handleAnswerQuestion}
            disabled={isProcessingFile}
          />
        </div>
      </div>
    );
  };

  // Componente de preview de importação
  const renderImportPreview = () => {
    if (!previewData) return null;

    return (
      <div className="px-4 pb-4">
        <div className="max-w-3xl mx-auto">
          <ImportPreviewCard
            transacoes={previewData.transacoes}
            summary={previewData.summary}
            onToggleTransaction={handleToggleTransaction}
            onConfirmImport={handleConfirmImport}
            onCancel={handleCancelImport}
            isImporting={importState?.step === 'importing'}
          />
        </div>
      </div>
    );
  };

  // Layout centralizado para nova conversa
  if (isCentered) {
    return (
      <div
        className="flex flex-col h-full relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <DropOverlay />

        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center mb-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-2"
            >
              <img
                src="/personagem.vitto.png"
                alt="Vitto"
                className="w-auto h-40 sm:h-52 object-contain drop-shadow-lg"
              />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-2xl font-bold text-slate-800 mb-2"
            >
              Olá! Eu sou o Vitto
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-500 max-w-md mx-auto text-sm sm:text-base leading-relaxed"
            >
              Seu consultor financeiro inteligente. Pergunte qualquer coisa sobre suas finanças ou arraste um arquivo para importar!
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-2xl px-4"
          >
            <MessageInput
              onSend={onSendMessage}
              isLoading={isLoading || isProcessingFile}
              disabled={disabled}
              showSuggestions
              showFileUpload
              onFileSelect={handleFileSelect}
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // Layout padrão com mensagens
  return (
    <div
      className="flex flex-col h-full relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <DropOverlay />

      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading || isProcessingFile}
          onInteractiveAction={handleInteractiveAction}
        />
      </div>

      {/* Cards interativos de importação */}
      {renderImportQuestion()}
      {renderImportPreview()}

      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <MessageInput
            onSend={onSendMessage}
            isLoading={isLoading || isProcessingFile}
            disabled={disabled || !!currentQuestion || !!previewData}
            showSuggestions={!currentQuestion && !previewData}
            showFileUpload
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>
    </div>
  );
}
