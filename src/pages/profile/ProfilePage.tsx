import { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase/client';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

type Profile = {
  id: string;
  nome: string | null;
  avatar_url: string | null;
  updated_at: string | null;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  // O profile é usado para armazenar dados do usuário e é atualizado pelo fetchProfile
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
      // Atualizar perfil no banco de dados
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
      setMessage({ text: 'As senhas não coincidem', type: 'error' });
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setMessage({ text: 'A nova senha deve ter pelo menos 6 caracteres', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      // Verificar senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: formData.currentPassword,
      });
      
      if (signInError) {
        throw new Error('Senha atual incorreta');
      }
      
      // Atualizar senha
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
      // O redirecionamento será tratado pelo AuthContext
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error.message);
    } finally {
      setLoading(false);
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
        <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>
        
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
              O e-mail não pode ser alterado.
            </p>
          </div>
          
          <div>
            <Button
              type="submit"
              isLoading={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Salvar Alterações
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
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Conta</h2>
        
        <Button
          onClick={handleSignOut}
          isLoading={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Sair da Conta
        </Button>
      </div>
    </div>
  );
}
