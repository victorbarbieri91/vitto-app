import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Settings, RefreshCw, Bell } from 'lucide-react';
import { JuntosProvider, useJuntos } from '../../contexts/JuntosContext';
import { JuntosDashboard } from '../../components/juntos/JuntosDashboard';
import { SemGrupoCard } from '../../components/juntos/SemGrupoCard';
import { CriarGrupoModal } from '../../components/juntos/CriarGrupoModal';
import { ConvidarMembroModal } from '../../components/juntos/ConvidarMembroModal';
import { GrupoConfigModal } from '../../components/juntos/GrupoConfigModal';
import { SolicitacoesPendentesModal } from '../../components/juntos/SolicitacoesPendentesModal';
import { ModernButton } from '../../components/ui/modern';
import { useScreenDetection } from '../../hooks/useScreenDetection';

/**
 * Conteúdo da página Juntos (usa o contexto)
 */
const JuntosContent: React.FC = () => {
  const { grupos, grupoAtivo, setGrupoAtivo, loading, error, refresh, solicitacoesPendentes, fetchSolicitacoesPendentes } = useJuntos();
  const { size } = useScreenDetection();
  const isMobile = size === 'mobile';

  const [showCriarGrupoModal, setShowCriarGrupoModal] = useState(false);
  const [showConvidarModal, setShowConvidarModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSolicitacoesModal, setShowSolicitacoesModal] = useState(false);

  const handleGrupoCriado = () => {
    setShowCriarGrupoModal(false);
    refresh();
  };

  const handleConviteEnviado = () => {
    setShowConvidarModal(false);
  };

  const handleSolicitacaoAceita = () => {
    // Atualiza a lista de grupos e solicitações
    refresh();
    fetchSolicitacoesPendentes();
  };

  // Se não tem grupos, mostra estado vazio
  if (!loading && grupos.length === 0) {
    return (
      <>
        <SemGrupoCard onCriarGrupo={() => setShowCriarGrupoModal(true)} />

        <CriarGrupoModal
          isOpen={showCriarGrupoModal}
          onClose={() => setShowCriarGrupoModal(false)}
          onSuccess={handleGrupoCriado}
        />
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Header simples */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">
            {grupoAtivo?.nome || 'Juntos'}
          </h1>
          {grupoAtivo && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
              {grupoAtivo.total_membros} {grupoAtivo.total_membros === 1 ? 'membro' : 'membros'}
            </span>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          {/* Botão de solicitações pendentes */}
          <button
            onClick={() => setShowSolicitacoesModal(true)}
            title="Solicitações pendentes"
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {solicitacoesPendentes > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[9px] font-bold text-white bg-coral-600 rounded-full">
                {solicitacoesPendentes > 9 ? '9+' : solicitacoesPendentes}
              </span>
            )}
          </button>

          <ModernButton
            variant="ghost"
            size="icon"
            onClick={refresh}
            disabled={loading}
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </ModernButton>

          {grupoAtivo?.papel === 'admin' && (
            <>
              <button
                onClick={() => setShowConvidarModal(true)}
                title="Convidar"
                className="flex items-center gap-2 bg-deep-blue text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-deep-blue/90 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {!isMobile && <span>Convidar</span>}
              </button>

              <ModernButton
                variant="ghost"
                size="icon"
                onClick={() => setShowConfigModal(true)}
                title="Configurações"
              >
                <Settings className="w-4 h-4" />
              </ModernButton>
            </>
          )}
        </div>
      </div>

      {/* Seletor de grupos (se tiver mais de um) */}
      {grupos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {grupos.map((grupo) => (
            <button
              key={grupo.id}
              onClick={() => setGrupoAtivo(grupo)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${grupoAtivo?.id === grupo.id
                  ? 'bg-deep-blue text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {grupo.nome}
            </button>
          ))}
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Dashboard */}
      {loading && !grupoAtivo ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500" />
        </div>
      ) : grupoAtivo ? (
        <JuntosDashboard />
      ) : (
        <div className="text-center py-20 text-slate-500">
          Selecione um grupo para visualizar
        </div>
      )}

      {/* Modais */}
      <CriarGrupoModal
        isOpen={showCriarGrupoModal}
        onClose={() => setShowCriarGrupoModal(false)}
        onSuccess={handleGrupoCriado}
      />

      {grupoAtivo && (
        <>
          <ConvidarMembroModal
            isOpen={showConvidarModal}
            onClose={() => setShowConvidarModal(false)}
            grupoId={grupoAtivo.id}
            grupoNome={grupoAtivo.nome}
            onSuccess={handleConviteEnviado}
          />

          <GrupoConfigModal
            isOpen={showConfigModal}
            onClose={() => setShowConfigModal(false)}
            grupo={grupoAtivo}
          />
        </>
      )}

      {/* Modal de solicitações pendentes */}
      <SolicitacoesPendentesModal
        isOpen={showSolicitacoesModal}
        onClose={() => setShowSolicitacoesModal(false)}
        onAceitar={handleSolicitacaoAceita}
      />
    </motion.div>
  );
};

/**
 * Página principal do módulo Juntos
 * Wrapped com JuntosProvider
 */
export const JuntosPage: React.FC = () => {
  return (
    <JuntosProvider>
      <JuntosContent />
    </JuntosProvider>
  );
};

export default JuntosPage;
