import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CalendarCheck,
  Wallet,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../store/AuthContext';
import { useState } from 'react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { to: '/admin/business-plan', icon: <FileText size={20} />, label: 'Business Plan' },
  { to: '/admin/agenda', icon: <CalendarCheck size={20} />, label: 'Agenda' },
  { to: '/admin/financeiro', icon: <Wallet size={20} />, label: 'Financeiro' },
  { to: '/admin/base-conhecimento', icon: <BookOpen size={20} />, label: 'Conhecimento' },
];

/**
 *
 */
export default function AdminSidebar() {
  const { signOut, userProfile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-slate-900 text-white
        flex flex-col transition-all duration-200 z-50
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <span className="font-semibold text-sm text-slate-200">Admin Panel</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-coral-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed && (
          <div className="mb-3 px-2">
            <p className="text-xs text-slate-500 truncate">Logado como</p>
            <p className="text-sm text-slate-300 truncate">{userProfile?.nome || 'Admin'}</p>
          </div>
        )}

        {/* Back to App */}
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mb-1"
          title={collapsed ? 'Voltar ao App' : undefined}
        >
          <ChevronLeft size={20} />
          {!collapsed && <span>Voltar ao App</span>}
        </NavLink>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
            text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
