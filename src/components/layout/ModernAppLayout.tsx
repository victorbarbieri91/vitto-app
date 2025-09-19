import type { ReactNode } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Navigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Tags,
  PiggyBank,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Wallet,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { useScreenDetection } from '../../hooks/useScreenDetection';
import { cn } from '../../utils/cn';
import ChatBar from '../chat/ChatBar';

type ModernAppLayoutProps = {
  children: ReactNode;
  requireAuth?: boolean;
};

const navigation = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Contas', path: '/contas', icon: Wallet },
  { name: 'Cartões', path: '/cartoes', icon: CreditCard },
  { name: 'Lançamentos', path: '/lancamentos', icon: Receipt },
  // { name: 'Categorias', path: '/categorias', icon: Tags }, // MOVIDO PARA MENU DO USUÁRIO
  { name: 'Orçamentos', path: '/orcamentos', icon: PiggyBank },
  // { name: 'Sua História', path: '/sua-historia', icon: BookOpen }, // TEMPORARIAMENTE OCULTO
  // { name: 'Configurações', path: '/configuracoes', icon: Settings }, // MOVIDO PARA MENU DO USUÁRIO
];

export default function ModernAppLayout({ children, requireAuth = true }: ModernAppLayoutProps) {
  const { user, userProfile, signOut, loading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { size } = useScreenDetection();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Modern Header with Horizontal Navigation */}
      {user && (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
          <div className={cn(
            'mx-auto px-4 sm:px-6 lg:px-8',
            size === 'compact' ? 'max-w-7xl' : 'max-w-screen-2xl'
          )}>
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <img 
                  src="/logo.Vitto.png" 
                  alt="Vitto" 
                  className="h-8 w-auto"
                />
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-coral-500 text-white shadow-lg shadow-coral-500/25'
                          : 'text-slate-600 hover:text-coral-600 hover:bg-white/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User Menu */}
              <div className="flex items-center space-x-4">
                {/* Profile */}
                <div className="relative group">
                  <button className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/60 transition-all duration-200">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-coral-500 to-coral-600 text-white flex items-center justify-center text-sm font-medium">
                      {(userProfile?.nome || user?.email)?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:block">
                      {userProfile?.nome || user?.email?.split('@')[0]}
                    </span>
                  </button>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b border-slate-200/60 mb-1">
                        <p className="text-xs text-slate-500">Logado como</p>
                        <p className="text-sm font-medium text-slate-700 truncate">{user?.email}</p>
                      </div>
                      
                      <Link
                        to="/perfil"
                        className="flex items-center px-3 py-2 text-sm text-slate-600 hover:text-coral-600 hover:bg-coral-50 rounded-xl transition-all duration-200"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Perfil
                      </Link>
                      
                      <Link
                        to="/categorias"
                        className="flex items-center px-3 py-2 text-sm text-slate-600 hover:text-coral-600 hover:bg-coral-50 rounded-xl transition-all duration-200"
                      >
                        <Tags className="w-4 h-4 mr-3" />
                        Categorias
                      </Link>
                      
                      <Link
                        to="/configuracoes"
                        className="flex items-center px-3 py-2 text-sm text-slate-600 hover:text-coral-600 hover:bg-coral-50 rounded-xl transition-all duration-200"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Configurações
                      </Link>
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sair
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl hover:bg-white/60 transition-colors"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5 text-slate-600" />
                  ) : (
                    <Menu className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden border-t border-slate-200/60">
                <nav className="py-4 space-y-1">
                  {navigation.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-coral-500 text-white shadow-lg shadow-coral-500/25'
                            : 'text-slate-600 hover:text-coral-600 hover:bg-white/60'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className={cn(
          'h-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
          size === 'compact' ? 'max-w-7xl' : 'max-w-screen-2xl'
        )}>
            {children}
        </div>
      </main>
    </div>
  );
} 