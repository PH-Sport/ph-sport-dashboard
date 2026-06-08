'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AppSidebar, SidebarProvider, useSidebar } from './app-sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'UNAUTHENTICATED') router.push('/login');
  }, [status, router]);

  if (status !== 'AUTHENTICATED') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
          aria-label="Cargando"
        />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Saltar al contenido principal
      </a>
      <AppSidebar />
      <MainArea>{children}</MainArea>
    </SidebarProvider>
  );
}

function MainArea({ children }: { children: React.ReactNode }) {
  const { isMobile, layout, setMobileOpen } = useSidebar();
  return (
    <div
      style={{
        paddingLeft: isMobile ? 0 : `${layout.contentPadLeftRem}rem`,
      }}
      className={cn(
        'min-h-svh transition-[padding] duration-200 ease-out'
      )}
    >
      <Header onMenuClick={() => setMobileOpen(true)} />
      <main id="main-content" className="animate-page-enter">
        {children}
      </main>
    </div>
  );
}
