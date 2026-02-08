import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  PiggyBank,
  Landmark,
  Users,
  User,
  Tags,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const moreNavItems = [
  { name: 'Contas', path: '/contas', icon: Wallet },
  { name: 'Orcamentos', path: '/orcamentos', icon: PiggyBank },
  { name: 'Patrimonio', path: '/patrimonio', icon: Landmark },
  { name: 'Juntos', path: '/juntos', icon: Users },
];

const userItems = [
  { name: 'Perfil', path: '/perfil', icon: User },
  { name: 'Categorias', path: '/categorias', icon: Tags },
  { name: 'Configuracoes', path: '/configuracoes', icon: Settings },
];

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  badgeCount?: number;
}

export default function MobileMoreSheet({ isOpen, onClose, onSignOut, badgeCount = 0 }: MobileMoreSheetProps) {
  const location = useLocation();

  const handleLinkClick = () => {
    onClose();
  };

  const handleSignOut = () => {
    onClose();
    onSignOut();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-14 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-xl safe-area-bottom"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            <div className="px-4 pb-4 space-y-1">
              {/* Navegacao principal */}
              {moreNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                const showBadge = item.name === 'Juntos' && badgeCount > 0;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={cn(
                      'relative flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 w-full',
                      isActive
                        ? 'bg-coral-50 text-coral-600'
                        : 'text-slate-600 active:bg-slate-50'
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{item.name}</span>
                    {showBadge && (
                      <span className="ml-auto flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-[11px] font-bold text-white bg-coral-600 rounded-full">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Separador */}
              <div className="border-t border-slate-200/60 !my-2" />

              {/* Itens do usuario */}
              {userItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 w-full',
                      isActive
                        ? 'bg-coral-50 text-coral-600'
                        : 'text-slate-600 active:bg-slate-50'
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Sair */}
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-slate-600 active:bg-red-50 active:text-red-600 transition-colors duration-150 w-full"
              >
                <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>Sair</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
