import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useJuntosService } from '../../hooks/useJuntosService';
import { ModernButton } from '../../components/ui/modern';
import type { ConviteInfo } from '../../types/juntos';

/**
 * Página para aceitar um convite de grupo via link
 * Rota: /juntos/convite/:token
 */
export const ConviteAceitarPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { buscarConvite, aceitarConvite } = useJuntosService();

  const [conviteInfo, setConviteInfo] = useState<ConviteInfo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aceitando, setAceitando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [grupoNome, setGrupoNome] = useState('');

  // Busca informações do convite quando a página carrega
  useEffect(() => {
    const carregarConvite = async () => {
      if (!token) {
        setErro('Link de convite inválido');
        setCarregando(false);
        return;
      }

      const info = await buscarConvite(token);

      if (info) {
        if (info.success) {
          setConviteInfo(info);
        } else {
          setErro(info.error || 'Convite não encontrado');
        }
      } else {
        setErro('Erro ao carregar convite');
      }

      setCarregando(false);
    };

    carregarConvite();
  }, [token, buscarConvite]);

  // Função para aceitar o convite
  const handleAceitar = async () => {
    if (!token || !user) return;

    setAceitando(true);
    setErro(null);

    const response = await aceitarConvite(token);

    if (response.success) {
      setSucesso(true);
      setGrupoNome(response.grupo_nome || conviteInfo?.grupo_nome || '');

      // Redireciona após 2 segundos
      setTimeout(() => {
        navigate('/juntos');
      }, 2000);
    } else {
      setErro(response.error || 'Erro ao aceitar convite');
    }

    setAceitando(false);
  };

  // Se está carregando auth ou convite
  if (authLoading || carregando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-deep-blue animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando convite...</p>
        </div>
      </div>
    );
  }

  // Se não está logado
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-deep-blue px-8 py-10 text-center">
              <div className="w-14 h-14 bg-white/10 rounded-xl mx-auto flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                Você recebeu um convite!
              </h1>
              {conviteInfo?.grupo_nome && (
                <p className="text-slate-300">
                  Para participar de "{conviteInfo.grupo_nome}"
                </p>
              )}
            </div>

            <div className="px-8 py-8 text-center">
              <p className="text-slate-600 mb-6">
                Faça login ou crie uma conta para aceitar o convite
              </p>

              <ModernButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate(`/login?redirect=/juntos/convite/${token}`)}
              >
                Fazer Login
              </ModernButton>

              <p className="text-sm text-slate-500 mt-4">
                Não tem conta?{' '}
                <button
                  onClick={() => navigate(`/cadastro?redirect=/juntos/convite/${token}`)}
                  className="text-coral-600 font-medium hover:underline"
                >
                  Criar conta
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Se houve erro
  if (erro && !conviteInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-coral-500 px-8 py-10 text-center">
              <div className="w-14 h-14 bg-white/10 rounded-xl mx-auto flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">
                Convite Inválido
              </h1>
            </div>

            <div className="px-8 py-8 text-center">
              <p className="text-slate-600 mb-6">
                {erro}
              </p>

              <ModernButton
                variant="outline"
                onClick={() => navigate('/juntos')}
              >
                Ir para Juntos
              </ModernButton>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Sucesso!
  if (sucesso) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-teal-600 px-8 py-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-14 h-14 bg-white/10 rounded-xl mx-auto flex items-center justify-center mb-4"
              >
                <Check className="w-7 h-7 text-white" />
              </motion.div>
              <h1 className="text-xl font-bold text-white mb-2">
                Convite Aceito!
              </h1>
              <p className="text-teal-100">
                Você agora faz parte de "{grupoNome}"
              </p>
            </div>

            <div className="px-8 py-8 text-center">
              <p className="text-slate-600 mb-2">
                Redirecionando para o módulo Juntos...
              </p>
              <Loader2 className="w-5 h-5 text-teal-600 animate-spin mx-auto" />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Tela de aceitar convite
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-deep-blue px-8 py-10 text-center">
            <div className="w-14 h-14 bg-white/10 rounded-xl mx-auto flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">
              Convite para Juntos
            </h1>
            <p className="text-slate-300">
              Você foi convidado para compartilhar finanças
            </p>
          </div>

          {/* Conteúdo */}
          <div className="px-8 py-8">
            {/* Info do grupo */}
            <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">Grupo</p>
              <p className="text-lg font-semibold text-slate-900">
                {conviteInfo?.grupo_nome}
              </p>

              {conviteInfo?.grupo_tipo && (
                <>
                  <p className="text-sm text-slate-500 mt-3 mb-1">Tipo</p>
                  <p className="text-slate-700 capitalize">
                    {conviteInfo.grupo_tipo}
                  </p>
                </>
              )}

              {conviteInfo?.mensagem && (
                <>
                  <p className="text-sm text-slate-500 mt-3 mb-1">Mensagem</p>
                  <p className="text-slate-700 italic">
                    "{conviteInfo.mensagem}"
                  </p>
                </>
              )}
            </div>

            {/* Erro */}
            {erro && (
              <div className="mb-4 p-3 bg-coral-50 border border-coral-200 rounded-xl text-coral-700 text-sm">
                {erro}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-3">
              <ModernButton
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Recusar
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={handleAceitar}
                isLoading={aceitando}
                className="flex-1"
              >
                Aceitar Convite
              </ModernButton>
            </div>

            {conviteInfo?.expira_em && (
              <p className="text-xs text-slate-400 text-center mt-4">
                Convite válido até{' '}
                {new Date(conviteInfo.expira_em).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ConviteAceitarPage;
