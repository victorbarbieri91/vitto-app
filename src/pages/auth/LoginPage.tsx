import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import {
  GlassFormContainer,
  ModernInput,
  ModernButton
} from '../../components/ui/modern';
import { motion } from 'framer-motion';

/**
 * Página de login moderna inspirada no design da Crextio
 * 
 * Features:
 * - Design glassmorphism
 * - Componentes modernos
 * - Animações suaves
 * - Responsivo
 * - Validação visual
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({}); // Limpa erros anteriores
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // Trata diferentes tipos de erro
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ 
            general: 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.' 
          });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ 
            general: 'Email não confirmado. Verifique sua caixa de entrada.' 
          });
        } else {
          setErrors({ 
            general: 'Erro ao fazer login. Tente novamente mais tarde.' 
          });
        }
      } else {
        // Login bem-sucedido
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Erro durante login:', error);
      setErrors({ 
        general: 'Erro inesperado. Tente novamente.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-100 to-secondary-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-20 left-20 w-32 h-32 bg-primary-500/10 rounded-full blur-xl"
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -20, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-48 h-48 bg-secondary-500/10 rounded-full blur-xl"
          animate={{ 
            x: [0, -20, 0], 
            y: [0, 15, 0],
            scale: [1, 0.9, 1] 
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2 
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-accent-500/10 rounded-2xl blur-lg rotate-45"
          animate={{ 
            rotate: [45, 135, 45],
            scale: [1, 1.2, 1] 
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 4 
          }}
        />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <img 
            src="/logo.Vitto.png" 
            alt="Vitto" 
            className="h-12 w-auto mx-auto"
          />
        </motion.div>

        <GlassFormContainer
          title="Bem-vindo de volta"
          subtitle="Entre na sua conta do Vitto"
          className="backdrop-blur-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <ModernInput
              id="email"
              type="email"
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
              disabled={isLoading}
            />

            {/* Password Field */}
            <ModernInput
              id="password"
              type="password"
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              disabled={isLoading}
            />

            {/* Error Message */}
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-danger-50 border border-danger-200 rounded-xl"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-danger-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-danger-700">{errors.general}</p>
                </div>
              </motion.div>
            )}

            {/* Login Button */}
            <ModernButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-8"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </ModernButton>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-neutral-500 font-medium">
                  Novo por aqui?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <ModernButton
              type="button"
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => navigate('/signup')}
              disabled={isLoading}
            >
              Criar conta
            </ModernButton>
          </form>
        </GlassFormContainer>

        {/* Footer */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-sm text-neutral-600">
            © 2025 Vitto. Todos os direitos reservados.
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Seu assistente financeiro inteligente
          </p>
        </motion.div>
      </div>
    </div>
  );
}
