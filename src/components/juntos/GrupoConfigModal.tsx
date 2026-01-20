import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, LogOut, Trash2, AlertTriangle, ChevronRight } from 'lucide-react';
import { useJuntos } from '../../contexts/JuntosContext';
import { ModernButton } from '../ui/modern';
import type { GrupoResumo } from '../../types/juntos';

interface GrupoConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  grupo: GrupoResumo;
}

/**
 * Modal de configurações do grupo
 */
export const GrupoConfigModal: React.FC<GrupoConfigModalProps> = ({
  isOpen,
  onClose,
  grupo,
}) => {
  const { sairGrupo, refresh } = useJuntos();

  const [showConfirmSair, setShowConfirmSair] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSairGrupo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await sairGrupo(grupo.id);

      if (response.success) {
        await refresh();
        onClose();
      } else {
        setError(response.error || 'Erro ao sair do grupo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sair do grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowConfirmSair(false);
    setError(null);
    onClose();
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
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Configurações
                    </h2>
                    <p className="text-slate-300 text-sm">
                      {grupo.nome}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {!showConfirmSair ? (
                // Opções do grupo
                <div className="space-y-3">
                  {/* Info do grupo */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tipo</span>
                      <span className="font-medium text-slate-900 capitalize">
                        {grupo.tipo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-500">Membros</span>
                      <span className="font-medium text-slate-900">
                        {grupo.total_membros}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-slate-500">Seu papel</span>
                      <span className={`font-medium capitalize ${
                        grupo.papel === 'admin' ? 'text-rose-600' : 'text-slate-900'
                      }`}>
                        {grupo.papel === 'admin' ? 'Administrador' : 'Membro'}
                      </span>
                    </div>
                  </div>

                  {/* Minhas permissões (futuro) */}
                  <button
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    onClick={() => {/* TODO: Abrir modal de permissões */}}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-slate-900">Minhas permissões</p>
                        <p className="text-sm text-slate-500">O que você compartilha</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>

                  {/* Sair do grupo */}
                  <button
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
                    onClick={() => setShowConfirmSair(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <LogOut className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-red-600">Sair do grupo</p>
                        <p className="text-sm text-slate-500">Deixar de participar</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              ) : (
                // Confirmação para sair
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Sair do grupo?
                  </h3>
                  <p className="text-slate-600 text-sm mb-6">
                    Você deixará de ter acesso às finanças compartilhadas de{' '}
                    <strong>{grupo.nome}</strong>.
                    {grupo.papel === 'admin' && (
                      <span className="block text-red-600 mt-2">
                        Como administrador, transfira a administração antes de sair
                        se houver outros membros.
                      </span>
                    )}
                  </p>

                  {/* Erro */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-3">
                    <ModernButton
                      variant="outline"
                      onClick={() => setShowConfirmSair(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </ModernButton>
                    <ModernButton
                      variant="danger"
                      onClick={handleSairGrupo}
                      isLoading={loading}
                      className="flex-1"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair do grupo
                    </ModernButton>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GrupoConfigModal;
