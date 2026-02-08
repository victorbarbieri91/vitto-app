import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Sparkles,
  CreditCard,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const tabs = [
  { name: 'Inicio', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Lanc.', path: '/lancamentos', icon: Receipt },
  { name: 'IA', path: '/central-ia', icon: Sparkles },
  { name: 'Cartoes', path: '/cartoes', icon: CreditCard },
];

interface MobileBottomNavProps {
  onMorePress: () => void;
  moreOpen: boolean;
}

export default function MobileBottomNav({ onMorePress, moreOpen }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav className="flex-shrink-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-colors duration-150',
                isActive
                  ? 'text-coral-600'
                  : 'text-slate-400 active:text-slate-600'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
              <span className={cn(
                'text-[10px] mt-0.5 leading-none',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {tab.name}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-coral-500 rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Botao Mais */}
        <button
          onClick={onMorePress}
          className={cn(
            'flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-colors duration-150',
            moreOpen
              ? 'text-coral-600'
              : 'text-slate-400 active:text-slate-600'
          )}
        >
          <MoreHorizontal className={cn('w-5 h-5', moreOpen && 'stroke-[2.5]')} />
          <span className={cn(
            'text-[10px] mt-0.5 leading-none',
            moreOpen ? 'font-semibold' : 'font-medium'
          )}>
            Mais
          </span>
        </button>
      </div>
    </nav>
  );
}
