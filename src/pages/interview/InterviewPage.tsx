import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useInterview } from '../../hooks/useInterview';
import { MessageList } from '../../components/central-ia/MessageList';
import { MessageInput } from '../../components/central-ia/MessageInput';
import { InvoiceImportModal } from '../../components/central-ia/InvoiceImportModal';
import { cn } from '../../utils/cn';

/**
 * Pagina de entrevista inicial com IA (substitui o onboarding estatico).
 * Full-screen, sem sidebar, sem navigation - foco total na conversa.
 *
 * 3 estados visuais na mesma tela:
 * 1. Estado inicial: Vitto + card de conversa + "Vamos comecar!"
 * 2. Loading moderno: Vitto pulsando + pontos animados
 * 3. Chat: MessageList + MessageInput + interactive buttons
 */
export function InterviewPage() {
  const { user, loading: authLoading } = useAuth();

  // Auth guard - proteger rota
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#102542] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#F87060] rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    isComplete,
    isResumingSession,
    hasStarted,
    userName,
    sendMessage,
    handleInteractiveAction,
    skipToDashboard,
    continueLater,
    startInterview,
    restartInterview,
    retryLastMessage,
    clearError,
  } = useInterview();

  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const hasMessages = messages.length > 0;
  const showInitialCard = !hasStarted && !isResumingSession;
  const showChat = (hasStarted || isResumingSession) && (hasMessages || isStreaming);
  const showModernLoading = (hasStarted || isResumingSession) && !hasMessages && !isStreaming && (isLoading || !hasMessages);

  const handleFileSelect = (file: File) => {
    setImportFile(file);
    setShowImportModal(true);
  };

  const handleImportComplete = (result: { totalImported: number }) => {
    setShowImportModal(false);
    setImportFile(null);
    if (result.totalImported > 0) {
      sendMessage(`Importei uma fatura com ${result.totalImported} transacoes!`);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-slate-50 via-white to-coral-50/30">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-100/60 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img
            src="/personagem.vitto.icone.red.png"
            alt="Vitto"
            className="w-9 h-9 rounded-full object-cover shadow-sm ring-1 ring-slate-200/60"
          />
          <div>
            <h1 className="text-sm font-semibold text-slate-800">Vitto</h1>
            <p className="text-xs text-slate-500">
              {isResumingSession
                ? 'Retomando conversa...'
                : showInitialCard
                  ? 'Seu assistente financeiro'
                  : 'Configurando suas finanças'}
            </p>
          </div>
        </div>

        {!isComplete && (
          <div className="flex items-center gap-1">
            {hasStarted && hasMessages && (
              <button
                onClick={continueLater}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Continuar depois - sua conversa fica salva"
              >
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Continuar depois</span>
              </button>
            )}
            {hasStarted && (
              <button
                onClick={() => {
                  if (confirm('Tem certeza? Todos os dados cadastrados serão apagados e a entrevista começa do zero.')) {
                    restartInterview();
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Reiniciar entrevista do zero"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
            )}
            <button
              onClick={skipToDashboard}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Pular entrevista completamente"
            >
              <SkipForward className="w-3 h-3" />
              <span className="hidden sm:inline">Pular</span>
            </button>
          </div>
        )}
      </header>

      {/* Area principal */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {/* === Estado 1: Card de conversa inicial === */}
          {showInitialCard && (
            <motion.div
              key="initial-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="h-full flex flex-col items-center justify-center px-4 overflow-y-auto py-8"
            >
              {/* Personagem Vitto */}
              <motion.img
                src="/personagem.vitto.webp"
                alt="Vitto"
                className="w-auto h-40 sm:h-52 object-contain drop-shadow-xl mb-6"
                style={{ imageRendering: 'auto' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              />

              {/* Card de conversa */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="relative bg-white rounded-2xl shadow-lg border border-slate-100 p-6 max-w-md w-full"
              >
                {/* Seta apontando para cima */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-slate-100 rotate-45" />

                <h2 className="text-lg font-semibold text-slate-800 mb-3">
                  {userName ? `Olá, ${userName}!` : 'Olá!'} Eu sou o <span className="text-coral-500">Vitto</span>
                </h2>

                <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                  Seu assistente financeiro pessoal. Em <strong>15 a 20 perguntas</strong>, vou
                  configurar seu sistema completo com insights personalizados sobre suas finanças.
                </p>

                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                  Reserve cerca de <strong>20 minutos</strong> para responder com calma.
                  Quanto mais preciso, melhor será sua experiência.
                </p>

                <p className="text-sm font-medium text-slate-700 mb-2">Vamos configurar:</p>
                <ul className="text-sm text-slate-600 space-y-1 mb-6 ml-1">
                  <li className="flex items-start gap-2">
                    <span className="text-coral-400 mt-0.5">&#8226;</span>
                    Contas bancárias e saldos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-coral-400 mt-0.5">&#8226;</span>
                    Cartões de crédito e faturas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-coral-400 mt-0.5">&#8226;</span>
                    Receitas e despesas fixas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-coral-400 mt-0.5">&#8226;</span>
                    Seu perfil financeiro
                  </li>
                </ul>

                <motion.button
                  onClick={startInterview}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-6 bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white font-semibold rounded-xl shadow-md shadow-coral-200/50 transition-all text-sm"
                >
                  Vamos começar!
                </motion.button>

                <button
                  onClick={skipToDashboard}
                  className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
                >
                  Pular entrevista
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* === Estado 2: Loading moderno === */}
          {showModernLoading && !showInitialCard && (
            <motion.div
              key="modern-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="h-full flex flex-col items-center justify-center px-4 relative overflow-hidden"
            >
              {/* Circulos decorativos flutuando */}
              {[
                { size: 'w-20 h-20', x: '-left-6', y: 'top-1/4', delay: 0 },
                { size: 'w-14 h-14', x: '-right-4', y: 'top-1/3', delay: 0.5 },
                { size: 'w-10 h-10', x: 'left-1/4', y: 'top-[15%]', delay: 1 },
                { size: 'w-16 h-16', x: 'right-1/4', y: 'bottom-1/4', delay: 1.5 },
                { size: 'w-12 h-12', x: 'left-[10%]', y: 'bottom-1/3', delay: 0.8 },
              ].map((circle, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    'absolute rounded-full bg-coral-200/30',
                    circle.size, circle.x, circle.y,
                  )}
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    delay: circle.delay,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}

              {/* Glow coral atras do personagem */}
              <div className="absolute w-40 h-40 bg-coral-300/20 blur-3xl rounded-full" />

              {/* Personagem Vitto pulsando */}
              <motion.img
                src="/personagem.vitto.webp"
                alt="Vitto"
                className="w-auto h-44 object-contain drop-shadow-xl relative z-10 mb-6"
                style={{ imageRendering: 'auto' }}
                animate={{
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Texto */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-base font-medium text-slate-700 mb-1 relative z-10"
              >
                {isResumingSession ? 'Retomando sua conversa...' : 'Preparando sua entrevista...'}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-slate-400 mb-6 relative z-10"
              >
                Seu assistente está se preparando
              </motion.p>

              {/* 3 pontos animados */}
              <div className="flex gap-2 relative z-10">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-coral-400"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 1, 0.4],
                    }}
                    transition={{
                      duration: 1.2,
                      delay: i * 0.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* === Estado 3: Chat === */}
          {showChat && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <MessageList
                messages={messages}
                isLoading={isLoading}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                onInteractiveAction={(action, value) => {
                  if (action === 'button' && value) {
                    // Encontrar label do botão na última mensagem
                    const lastMsg = messages[messages.length - 1];
                    const buttonsEl = lastMsg?.interactive?.elements?.find(e => e.type === 'buttons');
                    const label = buttonsEl && 'buttons' in buttonsEl
                      ? buttonsEl.buttons.find(b => b.value === value)?.label
                      : undefined;
                    handleInteractiveAction(value, label);
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Banner de conclusao */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-20 left-4 right-4 mx-auto max-w-md z-50"
            >
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center shadow-lg">
                <p className="text-sm font-medium text-emerald-800">
                  Entrevista concluída! Redirecionando para o dashboard...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensagem de erro com retry */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 right-4 mx-auto max-w-md z-50"
            >
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg">
                <div className="flex items-start gap-3">
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
                <button
                  onClick={retryLastMessage}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tentar novamente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input de mensagem - visivel apenas no chat */}
      {(hasStarted || isResumingSession) && (
        <div className={cn(
          'px-4 sm:px-6 py-3',
          'border-t border-slate-100/60',
          'bg-white/60 backdrop-blur-sm',
        )}>
          <div className="max-w-3xl mx-auto">
            <MessageInput
              onSend={sendMessage}
              isLoading={isLoading || isStreaming}
              placeholder="Digite sua resposta..."
              disabled={isComplete}
              showFileUpload={true}
              onFileSelect={handleFileSelect}
            />
          </div>
        </div>
      )}

      {/* Invoice Import Modal */}
      <InvoiceImportModal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportFile(null); }}
        file={importFile}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

export default InterviewPage;
