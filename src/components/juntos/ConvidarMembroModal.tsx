import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Copy, Check, Share2, Link2, Loader2 } from 'lucide-react';
import { useJuntos } from '../../contexts/JuntosContext';
import { juntosService } from '../../services/api/JuntosService';
import { ModernButton } from '../ui/modern';
import type { UsuarioBusca } from '../../types/juntos';

interface ConvidarMembroModalProps {
  isOpen: boolean;
  onClose: () => void;
  grupoId: number;
  grupoNome: string;
  onSuccess: () => void;
}

type ModalStep = 'search' | 'link' | 'success';

/**
 * Modal para convidar um membro para o grupo
 * Permite buscar usuários existentes ou gerar link para novos
 */
export const ConvidarMembroModal: React.FC<ConvidarMembroModalProps> = ({
  isOpen,
  onClose,
  grupoId,
  grupoNome,
  onSuccess,
}) => {
  const { enviarConvite } = useJuntos();

  // Estados
  const [step, setStep] = useState<ModalStep>('search');
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<UsuarioBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para link
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [linkConvite, setLinkConvite] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [gerandoLink, setGerandoLink] = useState(false);

  // Estado de sucesso
  const [usuarioConvidado, setUsuarioConvidado] = useState<string | null>(null);

  // Debounce da busca
  useEffect(() => {
    if (termo.length < 2) {
      setResultados([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setBuscando(true);
      try {
        const usuarios = await juntosService.buscarUsuariosParaConvite(termo, grupoId);
        setResultados(usuarios);
      } catch (err) {
        console.error('Erro na busca:', err);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [termo, grupoId]);

  // Enviar solicitação para usuário existente
  const handleEnviarSolicitacao = async (usuario: UsuarioBusca) => {
    setEnviando(true);
    setError(null);

    try {
      const response = await juntosService.enviarSolicitacao(grupoId, usuario.user_id);

      if (response.success) {
        setUsuarioConvidado(usuario.nome);
        setStep('success');
      } else {
        setError(response.error || 'Erro ao enviar solicitação');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação');
    } finally {
      setEnviando(false);
    }
  };

  // Gerar link para usuário novo
  const handleGerarLink = async () => {
    if (!email.trim()) {
      setError('Digite o email do convidado');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Digite um email válido');
      return;
    }

    setGerandoLink(true);
    setError(null);

    try {
      const response = await enviarConvite(grupoId, {
        email: email.trim(),
        mensagem: mensagem.trim() || undefined,
      });

      if (response.success && response.token) {
        const link = juntosService.gerarLinkConvite(response.token);
        setLinkConvite(link);
        setUsuarioConvidado(email);
        setStep('success');
      } else {
        setError(response.error || 'Erro ao gerar convite');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar convite');
    } finally {
      setGerandoLink(false);
    }
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(linkConvite);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleCompartilhar = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Convite para ${grupoNome}`,
          text: mensagem || `Você foi convidado para participar do grupo "${grupoNome}" no Vitto!`,
          url: linkConvite,
        });
      } catch {
        // Usuário cancelou
      }
    } else {
      handleCopiar();
    }
  };

  const handleClose = () => {
    // Reset states
    setStep('search');
    setTermo('');
    setResultados([]);
    setEmail('');
    setMensagem('');
    setLinkConvite('');
    setError(null);
    setUsuarioConvidado(null);
    onClose();
    if (step === 'success') {
      onSuccess();
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'search':
        return (
          <>
            {/* Campo de busca */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-deep-blue focus:ring-1 focus:ring-deep-blue/20 outline-none transition-all text-sm"
              />
              {buscando && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
              )}
            </div>

            {/* Resultados */}
            <div className="min-h-[200px] max-h-[280px] overflow-y-auto">
              {termo.length < 2 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Digite pelo menos 2 caracteres para buscar
                </div>
              ) : buscando ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Buscando...
                </div>
              ) : resultados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm mb-4">
                    Nenhum usuário encontrado
                  </p>
                  <p className="text-slate-400 text-xs">
                    Gere um link de convite para compartilhar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {resultados.map((usuario) => (
                    <div
                      key={usuario.user_id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {usuario.avatar_url ? (
                          <img
                            src={usuario.avatar_url}
                            alt={usuario.nome}
                            className="w-9 h-9 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-slate-600">
                              {usuario.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {usuario.nome}
                          </p>
                          <p className="text-xs text-slate-400">
                            {usuario.email}
                          </p>
                        </div>
                      </div>

                      {usuario.ja_membro ? (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          Já é membro
                        </span>
                      ) : usuario.solicitacao_pendente ? (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          Pendente
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEnviarSolicitacao(usuario)}
                          disabled={enviando}
                          className="flex items-center gap-1.5 text-xs font-medium text-white bg-deep-blue hover:bg-deep-blue/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {enviando ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserPlus className="w-3 h-3" />
                          )}
                          Convidar
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Erro */}
            {error && (
              <div className="mt-3 p-2.5 bg-coral-50 border border-coral-200 rounded-lg text-coral-700 text-xs">
                {error}
              </div>
            )}

            {/* Separador e link */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 text-center mb-3">
                Não encontrou? Gere um link para compartilhar
              </p>
              <ModernButton
                variant="outline"
                onClick={() => setStep('link')}
                fullWidth
              >
                <Link2 className="w-4 h-4 mr-2" />
                Gerar Link de Convite
              </ModernButton>
            </div>
          </>
        );

      case 'link':
        return (
          <>
            <button
              onClick={() => setStep('search')}
              className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
            >
              ← Voltar para busca
            </button>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email do convidado
              </label>
              <input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-deep-blue focus:ring-1 focus:ring-deep-blue/20 outline-none transition-all text-sm"
              />
            </div>

            {/* Mensagem */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mensagem (opcional)
              </label>
              <textarea
                placeholder="Mensagem personalizada..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-deep-blue focus:ring-1 focus:ring-deep-blue/20 outline-none transition-all resize-none text-sm"
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="mb-4 p-2.5 bg-coral-50 border border-coral-200 rounded-lg text-coral-700 text-xs">
                {error}
              </div>
            )}

            <ModernButton
              variant="primary"
              onClick={handleGerarLink}
              isLoading={gerandoLink}
              fullWidth
            >
              Gerar Convite
            </ModernButton>
          </>
        );

      case 'success':
        return (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-teal-600" />
            </div>

            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {linkConvite ? 'Convite criado!' : 'Solicitação enviada!'}
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              {linkConvite
                ? <>Compartilhe com <strong>{usuarioConvidado}</strong></>
                : <><strong>{usuarioConvidado}</strong> receberá uma notificação</>
              }
            </p>

            {linkConvite && (
              <>
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={linkConvite}
                      readOnly
                      className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 truncate"
                    />
                    <button
                      onClick={handleCopiar}
                      className={`p-1.5 rounded transition-colors ${
                        copiado
                          ? 'bg-teal-100 text-teal-600'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title={copiado ? 'Copiado!' : 'Copiar'}
                    >
                      {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mb-3">
                  <ModernButton
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Fechar
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    onClick={handleCompartilhar}
                    className="flex-1"
                  >
                    <Share2 className="w-4 h-4 mr-1.5" />
                    Compartilhar
                  </ModernButton>
                </div>

                <p className="text-xs text-slate-400">
                  Expira em 7 dias
                </p>
              </>
            )}

            {!linkConvite && (
              <ModernButton
                variant="primary"
                onClick={handleClose}
              >
                Concluir
              </ModernButton>
            )}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-deep-blue px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    {step === 'search' ? 'Adicionar Membro' : step === 'link' ? 'Gerar Link' : 'Convite'}
                  </h2>
                  <p className="text-slate-300 text-xs">
                    {grupoNome}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {renderContent()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConvidarMembroModal;
