import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check, XIcon, Loader2, Bell } from 'lucide-react';
import { juntosService } from '../../services/api/JuntosService';
import type { SolicitacaoVinculo } from '../../types/juntos';

interface SolicitacoesPendentesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAceitar?: (grupoId: number) => void;
}

/**
 * Modal para visualizar e responder solicitações de vínculo pendentes
 */
export const SolicitacoesPendentesModal: React.FC<SolicitacoesPendentesModalProps> = ({
  isOpen,
  onClose,
  onAceitar,
}) => {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoVinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondendo, setRespondendo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carrega solicitações ao abrir
  useEffect(() => {
    if (isOpen) {
      carregarSolicitacoes();
    }
  }, [isOpen]);

  const carregarSolicitacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await juntosService.obterSolicitacoesPendentes();
      setSolicitacoes(data);
    } catch (err) {
      setError('Erro ao carregar solicitações');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponder = async (solicitacaoId: number, aceitar: boolean) => {
    setRespondendo(solicitacaoId);
    setError(null);

    try {
      const response = await juntosService.responderSolicitacao(solicitacaoId, aceitar);

      if (response.success) {
        // Remove da lista
        setSolicitacoes((prev) => prev.filter((s) => s.id !== solicitacaoId));

        // Se aceitou, notifica o parent
        if (aceitar && response.grupo_id && onAceitar) {
          onAceitar(response.grupo_id);
        }

        // Se não há mais solicitações, fecha o modal
        if (solicitacoes.length === 1) {
          setTimeout(() => onClose(), 500);
        }
      } else {
        setError(response.error || 'Erro ao responder');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao responder');
    } finally {
      setRespondendo(null);
    }
  };

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias === 0) return 'Hoje';
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
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
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      Convites Recebidos
                    </h2>
                    <p className="text-slate-300 text-xs">
                      {solicitacoes.length} {solicitacoes.length === 1 ? 'pendente' : 'pendentes'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              )}

              {/* Erro */}
              {error && !loading && (
                <div className="p-3 bg-coral-50 border border-coral-200 rounded-lg text-coral-700 text-sm mb-4">
                  {error}
                </div>
              )}

              {/* Lista vazia */}
              {!loading && solicitacoes.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm">
                    Nenhum convite pendente
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Você será notificado quando receber um convite
                  </p>
                </div>
              )}

              {/* Lista de solicitações */}
              {!loading && solicitacoes.length > 0 && (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {solicitacoes.map((solicitacao) => (
                    <motion.div
                      key={solicitacao.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50"
                    >
                      {/* Info do grupo */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {solicitacao.grupo_nome}
                          </h3>
                          <p className="text-xs text-slate-500 capitalize">
                            {solicitacao.grupo_tipo}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatarData(solicitacao.created_at)}
                        </span>
                      </div>

                      {/* Quem convidou */}
                      <div className="flex items-center gap-2 mb-3">
                        {solicitacao.solicitante_avatar ? (
                          <img
                            src={solicitacao.solicitante_avatar}
                            alt={solicitacao.solicitante_nome}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-slate-600">
                              {solicitacao.solicitante_nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">{solicitacao.solicitante_nome}</span> convidou você
                        </p>
                      </div>

                      {/* Mensagem */}
                      {solicitacao.mensagem && (
                        <p className="text-sm text-slate-600 italic mb-3 p-2 bg-white rounded-lg border border-slate-100">
                          "{solicitacao.mensagem}"
                        </p>
                      )}

                      {/* Botões */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResponder(solicitacao.id, false)}
                          disabled={respondendo === solicitacao.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors disabled:opacity-50"
                        >
                          {respondendo === solicitacao.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XIcon className="w-4 h-4" />
                          )}
                          Recusar
                        </button>
                        <button
                          onClick={() => handleResponder(solicitacao.id, true)}
                          disabled={respondendo === solicitacao.id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                        >
                          {respondendo === solicitacao.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Aceitar
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SolicitacoesPendentesModal;
