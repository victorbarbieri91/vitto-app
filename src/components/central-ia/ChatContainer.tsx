import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { InvoiceImportModal } from './InvoiceImportModal';
import type { ChatMessage } from '../../types/central-ia';
import type { ImportResult } from '../../services/ai/InvoiceImportService';

interface ChatContainerProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isCentered?: boolean;
  onImportComplete?: (result: ImportResult) => void;
}

export function ChatContainer({
  messages,
  isLoading,
  onSendMessage,
  disabled = false,
  isCentered = false,
  onImportComplete,
}: ChatContainerProps) {
  // Estado para upload de arquivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Handler para selecao de arquivo
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsImportModalOpen(true);
  };

  // Handler para fechamento do modal
  const handleCloseModal = () => {
    setIsImportModalOpen(false);
    setSelectedFile(null);
  };

  // Handler para importacao completa
  const handleImportComplete = (result: ImportResult) => {
    onImportComplete?.(result);
    // Enviar mensagem de confirmacao no chat
    if (result.imported > 0) {
      onSendMessage(`Importei ${result.imported} transacoes da fatura com sucesso!`);
    }
  };

  // Layout centralizado para nova conversa
  if (isCentered) {
    return (
      <div className="flex flex-col h-full">
        {/* Área central com welcome message */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center mb-6"
          >
            {/* Avatar do Vitto - imagem livre sem distorção */}
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

            {/* Título */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-2xl font-bold text-slate-800 mb-2"
            >
              Olá! Eu sou o Vitto
            </motion.h2>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-500 max-w-md mx-auto text-sm sm:text-base leading-relaxed"
            >
              Seu consultor financeiro inteligente. Pergunte qualquer coisa sobre suas finanças!
            </motion.p>
          </motion.div>

          {/* Input centralizado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-2xl px-4"
          >
            <MessageInput
              onSend={onSendMessage}
              isLoading={isLoading}
              disabled={disabled}
              showSuggestions
              showFileUpload
              onFileSelect={handleFileSelect}
            />
          </motion.div>
        </div>

        {/* Modal de importacao de fatura */}
        <InvoiceImportModal
          isOpen={isImportModalOpen}
          onClose={handleCloseModal}
          file={selectedFile}
          onImportComplete={handleImportComplete}
        />
      </div>
    );
  }

  // Layout padrão com mensagens
  return (
    <div className="flex flex-col h-full">
      {/* Lista de mensagens */}
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input de mensagem */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <MessageInput
            onSend={onSendMessage}
            isLoading={isLoading}
            disabled={disabled}
            showSuggestions
            showFileUpload
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>

      {/* Modal de importacao de fatura */}
      <InvoiceImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseModal}
        file={selectedFile}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
