import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useCentralIA } from '../../hooks/useCentralIA';
import { useChatSession } from '../../hooks/useChatSession';
import {
  ChatContainer,
  ActionConfirmModal,
  DataCollectionModal,
  HistoryDropdown,
} from '../../components/central-ia';

export function CentralIAPage() {
  // Hooks principais
  const {
    messages,
    isLoading,
    error,
    currentSession,
    pendingAction,
    dataRequest,
    sendMessage,
    addMessage,
    confirmAction,
    rejectAction,
    submitUserData,
    cancelDataRequest,
    startNewSession,
    loadSession,
    clearError,
  } = useCentralIA();

  const {
    sessions,
    isLoading: sessionsLoading,
    deleteSession,
  } = useChatSession();

  // Handlers
  const handleSelectSession = useCallback(
    (sessionId: string) => {
      loadSession(sessionId);
    },
    [loadSession]
  );

  const handleNewSession = useCallback(() => {
    startNewSession();
  }, [startNewSession]);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await deleteSession(sessionId);
        if (currentSession?.id === sessionId) {
          startNewSession();
        }
      } catch {
        // Erro tratado no hook
      }
    },
    [deleteSession, currentSession?.id, startNewSession]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="h-full flex flex-col overflow-hidden -m-4 sm:-m-6">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Botão Nova Conversa */}
        <button
          onClick={handleNewSession}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-deep-blue text-white hover:bg-deep-blue/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Nova conversa</span>
        </button>

        {/* Info da conversa atual (quando há mensagens) */}
        {hasMessages && currentSession?.titulo && (
          <div className="hidden sm:flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
            <img
              src="/personagem.vitto.png"
              alt="Vitto"
              className="w-7 h-7 rounded-full"
              style={{ imageRendering: 'auto' }}
            />
            <span className="text-sm font-medium text-slate-600 max-w-[200px] truncate">
              {currentSession.titulo}
            </span>
          </div>
        )}

        {/* Histórico Dropdown */}
        <HistoryDropdown
          sessions={sessions}
          currentSessionId={currentSession?.id}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          isLoading={sessionsLoading}
        />
      </header>

      {/* Área principal do chat */}
      <main className="flex-1 overflow-hidden relative">
        <ChatContainer
          messages={messages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onAddMessage={addMessage}
          disabled={!!pendingAction || !!dataRequest}
          isCentered={!hasMessages}
        />

        {/* Mensagem de erro */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-24 left-4 right-4 mx-auto max-w-md z-50"
            >
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Erro</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal de confirmação de ação */}
      <ActionConfirmModal
        isOpen={!!pendingAction}
        pendingAction={pendingAction}
        onConfirm={confirmAction}
        onReject={rejectAction}
        isLoading={isLoading}
      />

      {/* Modal de coleta de dados */}
      <DataCollectionModal
        isOpen={!!dataRequest}
        dataRequest={dataRequest}
        onSubmit={submitUserData}
        onCancel={cancelDataRequest}
        isLoading={isLoading}
      />
    </div>
  );
}

export default CentralIAPage;
