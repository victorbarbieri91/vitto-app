import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase/client';
import { resetService, DataSummary } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ModernButton from '../../components/ui/modern/ModernButton';
import { RotateCcw, Loader2, X, AlertCircle } from 'lucide-react';

type Profile = {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

const CONFIRMATION_TEXT = 'quero excluir meus dados';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Estados do modal de reset
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
      }));
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('app_usuario')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData(prev => ({
        ...prev,
        nome: data.nome || '',
      }));
    } catch (error: any) {
      console.error('Erro ao buscar perfil:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('app_usuario')
        .update({ nome: formData.nome })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      fetchProfile();
    } catch (error: any) {
      setMessage({ text: error.message || 'Erro ao atualizar perfil', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: 'As senhas nao coincidem', type: 'error' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ text: 'A nova senha deve ter pelo menos 6 caracteres', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error('Senha atual incorreta');
      }

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      setMessage({ text: 'Senha atualizada com sucesso!', type: 'success' });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      setMessage({ text: error.message || 'Erro ao atualizar senha', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Funcoes do Reset
  const openResetModal = async () => {
    setShowResetModal(true);
    setResetConfirmText('');
    setLoadingSummary(true);

    try {
      const summary = await resetService.getDataSummary();
      setDataSummary(summary);
    } catch (error) {
      console.error('Erro ao buscar resumo dos dados:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetConfirmText('');
    setDataSummary(null);
  };

  const canReset = resetConfirmText.toLowerCase() === CONFIRMATION_TEXT;

  const handleReset = async () => {
    if (!canReset) return;

    setIsResetting(true);

    try {
      const result = await resetService.resetAllData();

      if (result.success) {
        closeResetModal();
        navigate('/onboarding');
      }
    } catch (error: any) {
      console.error('Erro ao resetar dados:', error);
      setMessage({ text: error.message || 'Erro ao resetar dados', type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Perfil</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Informacoes Pessoais</h2>

        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <Input
              id="nome"
              name="nome"
              type="text"
              value={formData.nome}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              O e-mail nao pode ser alterado.
            </p>
          </div>

          <div>
            <Button
              type="submit"
              isLoading={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Salvar Alteracoes
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Alterar Senha</h2>

        <form onSubmit={updatePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Senha Atual
            </label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              Nova Senha
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmar Nova Senha
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <Button
              type="submit"
              isLoading={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Atualizar Senha
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Conta</h2>

        <Button
          onClick={handleSignOut}
          isLoading={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sair da Conta
        </Button>
      </div>

      {/* Resetar sua conta */}
      <div className="bg-white rounded-3xl shadow-soft p-6 border border-neutral-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-xl">
            <RotateCcw className="w-5 h-5 text-neutral-500" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-800">Resetar sua conta</h2>
        </div>

        <p className="text-neutral-500 text-sm mb-4 leading-relaxed">
          Comece do zero removendo todas as suas transacoes, contas, cartoes e configuracoes.
          Voce voltara ao estado inicial como se estivesse criando uma nova conta.
        </p>

        <ModernButton
          variant="outline"
          size="sm"
          onClick={openResetModal}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Resetar conta
        </ModernButton>
      </div>

      {/* Modal de Confirmacao */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeResetModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-coral-100 to-coral-50 rounded-2xl">
                      <AlertCircle className="w-6 h-6 text-coral-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-800">Resetar conta</h3>
                      <p className="text-sm text-neutral-500">Esta acao e irreversivel</p>
                    </div>
                  </div>
                  <button
                    onClick={closeResetModal}
                    className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>
              </div>

              {/* Conteudo */}
              <div className="p-6">
                {loadingSummary ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-300" />
                  </div>
                ) : dataSummary && dataSummary.total > 0 ? (
                  <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-2xl p-4 mb-5">
                    <p className="text-sm text-neutral-600 mb-3">
                      Os seguintes dados serao removidos permanentemente:
                    </p>
                    <div className="space-y-2 text-sm">
                      {dataSummary.transacoes > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Transacoes</span>
                          <span className="font-medium text-neutral-700">{dataSummary.transacoes}</span>
                        </div>
                      )}
                      {dataSummary.contas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Contas</span>
                          <span className="font-medium text-neutral-700">{dataSummary.contas}</span>
                        </div>
                      )}
                      {dataSummary.cartoes > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Cartoes</span>
                          <span className="font-medium text-neutral-700">{dataSummary.cartoes}</span>
                        </div>
                      )}
                      {dataSummary.faturas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Faturas</span>
                          <span className="font-medium text-neutral-700">{dataSummary.faturas}</span>
                        </div>
                      )}
                      {dataSummary.metas > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Metas</span>
                          <span className="font-medium text-neutral-700">{dataSummary.metas}</span>
                        </div>
                      )}
                      {dataSummary.patrimonio > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Ativos</span>
                          <span className="font-medium text-neutral-700">{dataSummary.patrimonio}</span>
                        </div>
                      )}
                      {dataSummary.chat_sessoes > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Conversas IA</span>
                          <span className="font-medium text-neutral-700">{dataSummary.chat_sessoes}</span>
                        </div>
                      )}
                      <div className="border-t border-neutral-200 pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                          <span className="text-neutral-700">Total</span>
                          <span className="text-coral-500">{dataSummary.total} registros</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-2xl p-4 mb-5 text-center">
                    <p className="text-sm text-neutral-500">Sua conta nao possui dados para remover.</p>
                  </div>
                )}

                {/* Campo de confirmacao */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Para confirmar, digite: <span className="text-coral-500 font-semibold">quero excluir meus dados</span>
                  </label>
                  <input
                    type="text"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="Digite a frase de confirmacao"
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-all placeholder:text-neutral-400"
                    disabled={isResetting}
                  />
                </div>

                {/* Botoes */}
                <div className="flex gap-3">
                  <ModernButton
                    variant="outline"
                    size="md"
                    onClick={closeResetModal}
                    disabled={isResetting}
                    fullWidth
                  >
                    Cancelar
                  </ModernButton>
                  <ModernButton
                    variant={canReset ? 'danger' : 'outline'}
                    size="md"
                    onClick={handleReset}
                    disabled={!canReset || isResetting}
                    isLoading={isResetting}
                    fullWidth
                  >
                    {isResetting ? 'Resetando...' : 'Confirmar reset'}
                  </ModernButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
