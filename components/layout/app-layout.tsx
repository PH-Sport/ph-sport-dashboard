'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SPRINGS } from '@/components/ui/animations';
import { useAuth } from '@/lib/auth/auth-context';
import { useHydrated } from '@/lib/hooks/use-hydrated';
import { AppSidebar, SidebarProvider, useSidebar } from './app-sidebar';
import { Header } from './header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { status } = useAuth();
  const router = useRouter();
  const hydrated = useHydrated();

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
      {/* El shell se renderiza en SSR; el contenido de datos (SWR persistido,
          solo-cliente) se difiere a la hidratación para evitar mismatches. */}
      <MainArea>{hydrated ? children : null}</MainArea>
    </SidebarProvider>
  );
}

function MainArea({ children }: { children: React.ReactNode }) {
  const { contentPadLeft, setMobileOpen } = useSidebar();
  return (
    <motion.div
      initial={false}
      animate={{ paddingLeft: contentPadLeft }}
      transition={SPRINGS.smooth}
      className="min-h-svh"
    >
      <Header onMenuClick={() => setMobileOpen(true)} />
      <main id="main-content" className="animate-page-enter">
        {children}
      </main>
    </motion.div>
  );
}
