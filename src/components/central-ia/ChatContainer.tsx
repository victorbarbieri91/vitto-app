import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { conversationalImportService } from '../../services/ai/ConversationalImportService';
import type { ChatMessage } from '../../types/central-ia';
import type { ImportResult, ImportTarget } from '../../types/smart-import';
import { useAuth } from '../../store/AuthContext';

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onAddMessage?: (message: ChatMessage) => void;
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

  // Tipos de arquivo suportados
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ];

  const supportedExtensions = ['.pdf', '.xlsx', '.xls', '.csv'];

  const isFileSupported = useCallback((file: File) => {
    const fileName = file.name.toLowerCase();
    return (
      supportedTypes.includes(file.type) ||
      supportedExtensions.some((ext) => fileName.endsWith(ext))
    );
  }, []);

  // Adiciona uma mensagem ao chat (usa callback se fornecido, senao simula)
  const addMessage = useCallback((message: ChatMessage) => {
    if (onAddMessage) {
      onAddMessage(message);
    }
  }, [onAddMessage]);

  // Handler para selecao de arquivo - inicia fluxo conversacional
  const handleFileSelect = useCallback(async (file: File) => {
    if (isProcessingFile) return;

    setIsProcessingFile(true);

    try {
      // Adiciona mensagem do usuário indicando envio do arquivo
      const userMessage: ChatMessage = {
        id: `user-file-${Date.now()}`,
        role: 'user',
        content: `Enviei o arquivo: ${file.name}`,
      };
      addMessage(userMessage);

      // Inicia importação e adiciona mensagem de "analisando"
      const startMessage = await conversationalImportService.startImport(file);
      addMessage({ ...startMessage, id: `assistant-start-${Date.now()}` });

      // Analisa o arquivo e adiciona mensagem com resultado
      const analysisMessage = await conversationalImportService.analyzeFile();
      addMessage({ ...analysisMessage, id: `assistant-analysis-${Date.now()}` });
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

  // Handler para acoes interativas (botoes, confirmacoes)
  const handleInteractiveAction = useCallback(async (action: string, value?: string) => {
    if (!user?.id) {
      addMessage({
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'Você precisa estar logado para realizar importações.',
      });
      return;
    }

    setIsProcessingFile(true);

    try {
      let responseMessage: ChatMessage | null = null;

      switch (action) {
        case 'button':
          // Processa cliques em botões
          if (value === 'cancel') {
            responseMessage = conversationalImportService.cancelImport();
          } else if (value === 'confirm_columns') {
            // Confirmou mapeamento de colunas - avança para preview
            addMessage({
              id: `user-confirm-cols-${Date.now()}`,
              role: 'user',
              content: 'Sim, o mapeamento está correto!',
            });
            responseMessage = await conversationalImportService.handleColumnConfirmation(true);
          } else if (value === 'adjust_columns') {
            // Quer ajustar o mapeamento
            addMessage({
              id: `user-adjust-${Date.now()}`,
              role: 'user',
              content: 'Preciso ajustar algumas colunas.',
            });
            responseMessage = await conversationalImportService.handleColumnConfirmation(false);
          } else if (value === 'transacoes' || value === 'transacoes_fixas' || value === 'patrimonio') {
            // Seleção de tipo (caso antigo - mantido para compatibilidade)
            const typeLabel = value === 'transacoes' ? 'transações' :
                             value === 'transacoes_fixas' ? 'transações fixas' : 'patrimônio';
            addMessage({
              id: `user-type-${Date.now()}`,
              role: 'user',
              content: `Sim, pode importar como ${typeLabel}!`,
            });
            responseMessage = await conversationalImportService.handleTypeSelection(value as ImportTarget);
          } else if (value === 'confirm_mapping') {
            // Confirmou mapeamento
            addMessage({
              id: `user-mapping-${Date.now()}`,
              role: 'user',
              content: 'O mapeamento está correto, pode continuar.',
            });
            responseMessage = await conversationalImportService.confirmMapping();
          } else if (value === 'execute_import') {
            // Confirmou importação
            addMessage({
              id: `user-import-${Date.now()}`,
              role: 'user',
              content: 'Pode importar!',
            });
            responseMessage = await conversationalImportService.executeImport(user.id);

            // Notifica callback de importação completa
            const importState = conversationalImportService.getCurrentImport();
            if (importState?.result && onImportComplete) {
              onImportComplete({
                success: importState.result.imported > 0,
                imported: importState.result.imported,
                failed: importState.result.failed,
                skipped: importState.result.skipped,
                errors: importState.result.errors?.map((e, i) => ({
                  itemIndex: i,
                  itemDescription: e.description,
                  error: e.error,
                })) || [],
                summary: {
                  totalValue: importState.result.totalValue,
                  byCategory: {},
                  byType: {},
                },
              });
            }
          }
          break;

        case 'confirm':
          // Confirmação genérica
          addMessage({
            id: `user-confirm-${Date.now()}`,
            role: 'user',
            content: 'Sim, confirmo.',
          });
          responseMessage = await conversationalImportService.confirmMapping();
          break;

        case 'cancel':
          responseMessage = conversationalImportService.cancelImport();
          break;
      }

      if (responseMessage) {
        addMessage({ ...responseMessage, id: `assistant-response-${Date.now()}` });
      }
    } catch (error) {
      addMessage({
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
      });
    } finally {
      setIsProcessingFile(false);
    }
  }, [user?.id, addMessage, onImportComplete]);

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
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <FileSpreadsheet className="w-4 h-4" />
              <span>PDF, Excel, CSV</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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

      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <MessageInput
            onSend={onSendMessage}
            isLoading={isLoading || isProcessingFile}
            disabled={disabled}
            showSuggestions
            showFileUpload
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>
    </div>
  );
}
