'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { SidebarSkeleton } from '@/components/skeletons/sidebar-skeleton';
import { useAuth } from '@/lib/auth/auth-context';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { status } = useAuth();
  const router = useRouter();

  const authReady = status === 'AUTHENTICATED';

  useEffect(() => {
    if (status === 'UNAUTHENTICATED') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      try {
        setSidebarCollapsed(JSON.parse(saved));
      } catch {
        setSidebarCollapsed(false);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {authReady ? (
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      ) : (
        <SidebarSkeleton collapsed={sidebarCollapsed} />
      )}

      {mobileMenuOpen && authReady && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-in fade-in md:hidden"
            onClick={toggleMobileMenu}
          />
          <div className="fixed left-0 top-0 z-40 md:hidden">
            <Sidebar
              collapsed={false}
              onToggle={toggleMobileMenu}
              onClose={toggleMobileMenu}
              overlay
            />
          </div>
        </>
      )}

      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out',
          !sidebarCollapsed ? 'md:ml-64' : 'md:ml-20'
        )}
      >
        <Header onMenuClick={toggleMobileMenu} />
        <main className="flex-1 overflow-y-auto animate-page-enter">{children}</main>
      </div>
    </div>
  );
}
