import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../services/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, ChevronRight, BarChart3, Wallet, Bot } from 'lucide-react';

type AuthMode = 'login' | 'signup';
type OnboardingStep = 'form' | 'welcome' | 'complete';

const CAROUSEL_SLIDES = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Controle total',
    highlight: 'das suas finanças',
    description: 'Dashboard completo com gráficos, saldos em tempo real e visão consolidada de todas as suas contas.',
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: 'Transações e orçamentos',
    highlight: 'na palma da mão',
    description: 'Categorize gastos, defina metas por categoria e acompanhe seus orçamentos mês a mês.',
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: 'Assistente IA',
    highlight: 'que entende você',
    description: 'Converse com a Central IA para análises, dicas personalizadas e insights inteligentes sobre seu dinheiro.',
  },
];

const SLIDE_DURATION = 5000;

export default function AuthPage() {
  const location = useLocation();
  const initialMode: AuthMode =
    location.pathname === '/signup' || location.pathname === '/cadastro'
      ? 'signup'
      : 'login';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [activeSlide, setActiveSlide] = useState(0);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const newMode: AuthMode =
      location.pathname === '/signup' || location.pathname === '/cadastro'
        ? 'signup'
        : 'login';
    setMode(newMode);
  }, [location.pathname]);

  const switchMode = useCallback((newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    navigate(newMode === 'login' ? '/login' : '/signup', { replace: true });
  }, [navigate]);

  const validateLogin = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
    if (!password) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors: { [key: string]: string } = {};
    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!email) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email inválido';
    if (!password) newErrors.password = 'Senha é obrigatória';
    else if (password.length < 6) newErrors.password = 'Mínimo 6 caracteres';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      newErrors.password = 'Use maiúscula, minúscula e número';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirme a senha';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrors({ general: 'Email ou senha incorretos.' });
        } else if (error.message.includes('Email not confirmed')) {
          setErrors({ general: 'Email não confirmado. Verifique sua caixa de entrada.' });
        } else {
          setErrors({ general: 'Erro ao fazer login. Tente novamente.' });
        }
      } else {
        navigate('/dashboard');
      }
    } catch {
      setErrors({ general: 'Erro inesperado. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const { data, error } = await signUp(email, password, nome);
      if (error) {
        if (error.message.includes('already registered')) {
          setErrors({ email: 'Este email já está cadastrado' });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }
      if (data?.user) {
        try {
          await supabase.rpc('confirm_user_email', { user_id: data.user.id });
        } catch {
          console.log('Aviso: Não foi possível confirmar email automaticamente');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
          if (!loginError) {
            setOnboardingStep('complete');
            setTimeout(() => navigate('/dashboard'), 3000);
            return;
          }
        } catch {
          console.log('Erro no login automático');
        }
        setOnboardingStep('welcome');
      }
    } catch {
      setErrors({ general: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const slide = CAROUSEL_SLIDES[activeSlide];

  // Onboarding screens (after successful signup)
  if (onboardingStep === 'welcome') {
    return (
      <div className="fixed inset-0 bg-[#102542] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-br from-[#F87060] to-[#e55a4a] rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-3">Bem-vindo ao Vitto!</h2>
          <p className="text-white/80 mb-8">
            Sua conta foi criada com sucesso. Tudo pronto para organizar suas finanças!
          </p>
          <div className="space-y-3 text-left mb-8">
            {['Conta principal criada', 'Categorias configuradas', 'Painel personalizado pronto'].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#F87060] flex-shrink-0" />
                <p className="text-white/90">{item}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setOnboardingStep('complete'); setTimeout(() => navigate('/dashboard'), 2000); }}
            className="w-full py-3 bg-gradient-to-r from-[#F87060] to-[#e55a4a] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#F87060]/25 transition-all flex items-center justify-center gap-2"
          >
            Continuar <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    );
  }

  if (onboardingStep === 'complete') {
    return (
      <div className="fixed inset-0 bg-[#102542] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onAnimationComplete={() => setTimeout(() => navigate('/dashboard'), 1500)}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-md w-full text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-3">Tudo pronto!</h2>
          <p className="text-white/80">Redirecionando para seu painel...</p>
          <div className="mt-6 w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="h-full bg-gradient-to-r from-[#F87060] to-[#e55a4a] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col lg:flex-row bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4 sm:px-12 lg:px-16 xl:px-24 bg-white relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F87060]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#102542]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 w-full max-w-md mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5"
          >
            <img src="/logo.Vitto.png" alt="Vitto" className="h-9 w-auto" />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Heading */}
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-[#102542] mb-1">
                  {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                </h1>
                <p className="text-gray-500">
                  {mode === 'login'
                    ? 'Entre para acessar seu painel financeiro.'
                    : 'Comece a controlar suas finanças hoje.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-3">
                {/* Name (signup only) */}
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Seu nome completo"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
                          errors.nome ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50/50'
                        } focus:border-[#F87060] focus:ring-2 focus:ring-[#F87060]/20 focus:bg-white outline-none transition-all text-[#102542] placeholder:text-gray-400`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome}</p>}
                  </motion.div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl border ${
                        errors.email ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50/50'
                      } focus:border-[#F87060] focus:ring-2 focus:ring-[#F87060]/20 focus:bg-white outline-none transition-all text-[#102542] placeholder:text-gray-400`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-11 pr-12 py-3 rounded-xl border ${
                        errors.password ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50/50'
                      } focus:border-[#F87060] focus:ring-2 focus:ring-[#F87060]/20 focus:bg-white outline-none transition-all text-[#102542] placeholder:text-gray-400`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password (signup only) */}
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-11 pr-12 py-3 rounded-xl border ${
                          errors.confirmPassword ? 'border-red-400 bg-red-50/50' : 'border-gray-200 bg-gray-50/50'
                        } focus:border-[#F87060] focus:ring-2 focus:ring-[#F87060]/20 focus:bg-white outline-none transition-all text-[#102542] placeholder:text-gray-400`}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </motion.div>
                )}

                {/* Forgot password + remember me (login only) */}
                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#F87060] focus:ring-[#F87060]/20" />
                      <span className="text-sm text-gray-600">Lembrar de mim</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-[#F87060] hover:text-[#e55a4a] transition-colors"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                )}

                {/* Error Message */}
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.01 } : undefined}
                  whileTap={!isLoading ? { scale: 0.99 } : undefined}
                  className="w-full py-3.5 bg-gradient-to-r from-[#F87060] to-[#e55a4a] text-white font-semibold rounded-xl shadow-lg shadow-[#F87060]/25 hover:shadow-xl hover:shadow-[#F87060]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      {mode === 'login' ? 'Entrar' : 'Criar conta'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-400">
                    {mode === 'login' ? 'Novo por aqui?' : 'Já tem conta?'}
                  </span>
                </div>
              </div>

              {/* Switch Mode Button */}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                disabled={isLoading}
                className="w-full py-3 bg-[#102542] text-white font-semibold rounded-xl border-2 border-[#102542] hover:bg-transparent hover:text-[#102542] active:bg-transparent active:text-[#102542] transition-all disabled:opacity-50"
              >
                {mode === 'login' ? 'Criar conta' : 'Fazer login'}
              </button>
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <p className="mt-4 text-center text-xs text-gray-400">
            &copy; 2025 Vitto. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Side - Branding Panel with Carousel */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-[#102542] via-[#163256] to-[#0d1e35] flex-col items-center justify-center overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Coral accent glow */}
          <div className="absolute top-1/4 -right-20 w-80 h-80 bg-[#F87060]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-20 w-60 h-60 bg-[#F87060]/10 rounded-full blur-3xl" />

          {/* Geometric shapes */}
          <motion.div
            className="absolute top-16 left-16 w-20 h-20 border-2 border-white/10 rounded-2xl"
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute bottom-24 right-20 w-14 h-14 border-2 border-[#F87060]/20 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/3 right-16 w-3 h-3 bg-[#F87060]/40 rounded-full"
            animate={{ y: [0, -20, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 left-24 w-2 h-2 bg-white/30 rounded-full"
            animate={{ y: [0, 15, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />

          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg w-full">
          {/* White Logo */}
          <motion.img
            src="/logo.vitto.branco.png"
            alt="Vitto"
            className="h-10 w-auto mb-8 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Character - proper aspect ratio */}
          <motion.div
            className="relative mb-8 w-full max-w-[320px]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Glow behind character */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#F87060]/20 to-transparent rounded-2xl blur-2xl scale-110" />

            {/* Character frame - landscape ratio matching the image (3:2) */}
            <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/30">
              <img
                src="/personagem.login.png"
                alt="Vitto - Seu assistente financeiro"
                className="w-full h-full object-contain"
              />
              {/* Subtle gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#102542]/40 to-transparent" />
            </div>

            {/* Coral accent badge */}
            <div className="absolute -bottom-3 -right-3 w-11 h-11 bg-gradient-to-br from-[#F87060] to-[#e55a4a] rounded-xl flex items-center justify-center shadow-lg shadow-[#F87060]/30">
              {slide.icon}
            </div>
          </motion.div>

          {/* Carousel Text */}
          <div className="h-[120px] flex flex-col items-center justify-start w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <h2 className="text-xl font-bold text-white mb-2">
                  {slide.title}{' '}
                  <span className="text-[#F87060]">{slide.highlight}</span>
                </h2>
                <p className="text-white/55 text-sm leading-relaxed max-w-xs mx-auto">
                  {slide.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Carousel Dots - clickable */}
          <div className="flex gap-2 mt-4">
            {CAROUSEL_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeSlide
                    ? 'w-8 bg-[#F87060]'
                    : 'w-2 bg-white/25 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
