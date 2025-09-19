import type { ReactNode } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatBar from '../chat/ChatBar';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Bot } from 'lucide-react';
import { AIChat } from '../chat/AIChat';
import { ModernButton } from '../ui/modern';

type AppLayoutProps = {
  children: ReactNode;
  requireAuth?: boolean;
};

export default function AppLayout({ children, requireAuth = true }: AppLayoutProps) {
  console.log('[AppLayout] Renderizando AppLayout', { requireAuth });
  
  const { user, loading } = useAuth();
  console.log('[AppLayout] Estado de autenticação:', { user: !!user, loading });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Show loading state
  if (loading) {
    console.log('[AppLayout] Exibindo indicador de carregamento');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (requireAuth && !user) {
    console.log('[AppLayout] Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  console.log('[AppLayout] Renderizando layout principal');
  
  // If we don't require auth or user is authenticated
  try {
    return (
      <div className="flex h-screen bg-background">
        {user && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {user && <Header onMenuClick={() => setSidebarOpen(true)} />}
          {/* Adiciona padding-bottom para não sobrepor o conteúdo com a barra de chat */}
          <main className="flex-1 p-4 md:p-6 pb-[90px]">
            {/* Log antes de renderizar children */}
            {(() => { console.log('[AppLayout] Renderizando children:', !!children); return null; })()}
            <Outlet />
          </main>
        </div>
        {user && <ChatBar />}

        {/* AI Chat Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <ModernButton
            onClick={() => setAiChatOpen(true)}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-[#F87060] to-[#102542] hover:scale-105"
            title="Abrir Assistente Vitto"
          >
            <Bot className="w-6 h-6 text-white" />
          </ModernButton>
        </div>

        {/* AI Chat Modal */}
        <AIChat 
          isOpen={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
        />
      </div>
    );
  } catch (error) {
    console.error('[AppLayout] Erro ao renderizar layout:', error);
    return (
      <div className="p-8 bg-red-50 text-red-800">
        <h2 className="text-xl font-bold mb-4">Erro ao renderizar layout</h2>
        <p>Ocorreu um erro ao carregar o layout da aplicação. Por favor, tente novamente.</p>
        <pre className="mt-4 p-4 bg-red-100 rounded overflow-auto">
          {error instanceof Error ? error.message : 'Erro desconhecido'}
        </pre>
      </div>
    );
  }
}
