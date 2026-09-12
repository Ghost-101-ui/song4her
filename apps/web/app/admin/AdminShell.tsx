'use client';
// Song4Her 🦋 — Admin Shell (sidebar + nav)
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Plus, Settings, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/Button';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/new', label: 'Quick Send', icon: Plus },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await auth.logout();
      router.replace('/admin/login');
    } catch {
      setLoggingOut(false);
    }
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-6 mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-flutter">🦋</span>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">Song4Her</h1>
            <p className="text-white/30 text-xs">Admin</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'sidebar-link',
              isActive(item.href, item.exact) && 'active'
            )}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="sidebar-link w-full text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut size={18} />
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-surface">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-surface-border bg-surface-1">
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col',
          'bg-surface-1 border-r border-surface-border',
          'transform transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-white/40 hover:text-white"
        >
          <X size={20} />
        </button>
        <NavContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-surface-border bg-surface-1 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-surface-2 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-2xl">🦋</span>
          <span className="font-bold text-white">Song4Her</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
