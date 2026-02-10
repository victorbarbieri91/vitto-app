import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 *
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar />

      {/* Main content area - offset by sidebar width */}
      <main className="ml-56 min-h-screen transition-all duration-200">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
