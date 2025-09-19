import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase/client';
import { 
  GlassFormContainer, 
  ModernInput, 
  ModernButton,
  cn 
} from '../../components/ui/modern';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

/**
 * Página de cadastro moderna com design glassmorphism
 * Integra o processo de onboarding completo
 */
export default function SignUpPage() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [onboardingStep, setOnboardingStep] = useState<'signup' | 'welcome' | 'complete'>('signup');
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      // Primeiro, vamos tentar um cadastro simples sem dados extras
      const { data, error } = await signUp(
        formData.email, 
        formData.password, 
        formData.nome
      );

      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ email: 'Este email já está cadastrado' });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      if (data?.user) {
        // Confirmar email automaticamente para desenvolvimento usando SQL
        try {
          await supabase.rpc('confirm_user_email', { user_id: data.user.id });
        } catch (emailError) {
          console.log('Aviso: Não foi possível confirmar email automaticamente:', emailError);
        }
        
        // Aguardar um pouco para o banco processar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fazer login automático após cadastro
        try {
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
          });
          
          if (!loginError) {
            // Login bem-sucedido, redirecionar para dashboard após mostrar o welcome
            setOnboardingStep('complete');
            setTimeout(() => navigate('/dashboard'), 3000);
            return; // Sair aqui para não mostrar o welcome normal
          } else {
            console.log('Login automático falhou:', loginError);
          }
        } catch (loginError) {
          console.log('Erro no login automático:', loginError);
        }
        
        // Se chegou aqui, o login automático falhou, mostrar onboarding normal
        setOnboardingStep('welcome');
      }
    } catch (error: any) {
      setErrors({ general: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };



  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#102542] via-[#1b3654] to-[#102542] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-coral-400/15 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl"
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
          className="absolute top-1/2 left-1/4 w-48 h-48 bg-coral-500/10 rounded-2xl blur-lg rotate-45"
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
        <AnimatePresence mode="wait">
          {onboardingStep === 'signup' && (
            <motion.div
              key="signup"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="relative z-10 w-full"
            >
              <GlassFormContainer>
                {/* Logo dentro do container */}
                <motion.div
                  className="text-center mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <img 
                    src="/logo.Vitto.png" 
                    alt="Vitto" 
                    className="h-10 w-auto mx-auto"
                  />
                </motion.div>

                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-800 mb-2">Crie sua conta</h1>
                  <p className="text-gray-600">Comece a controlar suas finanças hoje</p>
                </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <ModernInput
                    type="text"
                    placeholder="Nome completo"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    error={errors.nome}
                    icon={<User className="w-5 h-5" />}
                />

                <ModernInput
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    error={errors.email}
                    icon={<Mail className="w-5 h-5" />}
                />

                <div className="relative">
                  <ModernInput
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    error={errors.password}
                    icon={<Lock className="w-5 h-5" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <ModernInput
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmar senha"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    error={errors.confirmPassword}
                    icon={<Lock className="w-5 h-5" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>


                {errors.general && (
                  <p className="text-sm text-red-400">{errors.general}</p>
                )}

                <ModernButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                >
                  Criar conta
                </ModernButton>

                <div className="text-center pt-4">
                  <span className="text-white/80">Já tem uma conta? </span>
                  <Link to="/login" className="text-coral-400 hover:text-coral-300 font-medium transition-colors">
                    Fazer login
                  </Link>
                </div>
              </form>
            </GlassFormContainer>
          </motion.div>
        )}

        {onboardingStep === 'welcome' && (
          <motion.div
            key="welcome"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="relative z-10 w-full max-w-md"
          >
            <GlassFormContainer>
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-24 h-24 bg-gradient-to-br from-coral-400 to-coral-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Bem-vindo ao Barsi! 🎉
                </h2>
                
                <p className="text-white/85 mb-8">
                  Sua conta foi criada com sucesso. Configuramos tudo para você começar a organizar suas finanças agora mesmo!
                </p>

                <div className="space-y-3 text-left mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-coral-400 mt-0.5" />
                    <p className="text-white/90">Conta principal criada</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-coral-400 mt-0.5" />
                    <p className="text-white/90">Categorias padrão configuradas</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-coral-400 mt-0.5" />
                    <p className="text-white/90">Painel personalizado pronto</p>
                  </div>
                </div>

                <ModernButton
                  onClick={() => setOnboardingStep('complete')}
                  variant="primary"
                  fullWidth
                  icon={<ChevronRight className="w-5 h-5" />}
                >
                  Continuar
                </ModernButton>
              </div>
            </GlassFormContainer>
          </motion.div>
        )}

        {onboardingStep === 'complete' && (
          <motion.div
            key="complete"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            onAnimationComplete={() => {
              setTimeout(() => navigate('/dashboard'), 1500);
            }}
            className="relative z-10 w-full max-w-md"
          >
            <GlassFormContainer>
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                
                <h2 className="text-3xl font-bold text-white mb-4">
                  Tudo pronto! ✨
                </h2>
                
                <p className="text-white/85">
                  Redirecionando para seu painel...
                </p>
                
                <div className="mt-8">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className="h-full bg-gradient-to-r from-coral-400 to-coral-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5 }}
                    />
                  </div>
                </div>
              </div>
            </GlassFormContainer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <p className="text-sm text-white/70">
          © 2025 Vitto. Todos os direitos reservados.
        </p>
        <p className="text-xs text-white/60 mt-1">
          Seu assistente financeiro inteligente
        </p>
      </motion.div>
      </div>
    </div>
  );
}