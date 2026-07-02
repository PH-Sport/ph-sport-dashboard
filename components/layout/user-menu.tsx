'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Users } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SPRINGS } from '@/components/ui/animations';
import { useAuth } from '@/lib/auth/auth-context';
import { useViewAs } from '@/lib/auth/view-as-context';
import { ROLE_LABEL, ROLE_ACCENT } from '@/lib/utils/role';
import { ViewAsMenuSection } from './view-as-menu-section';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const router = useRouter();
  // status/logout/profile.role(efectivo) de useAuth; identidad REAL de useViewAs.
  const { status, logout, profile } = useAuth();
  const { isDev, realName, realDisplayName, realEmail, realRole, realAvatarUrl } = useViewAs();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Altura medida en píxeles (subpíxel exacto) para el despliegue del menú.
  // Animar height a un número — en vez de 'auto' — evita el swap final de framer
  // (el "microcorte"). El ResizeObserver la mantiene al día, así el "Ver como"
  // interno también empuja la altura sin recortarse.
  const roRef = useRef<ResizeObserver | null>(null);
  const [menuHeight, setMenuHeight] = useState(0);

  // Callback ref: mide la altura real en píxeles (subpíxel exacto) en cuanto el
  // contenido monta en el portal, y la mantiene al día con ResizeObserver.
  // Animar height a ese número — en vez de 'auto' — evita el swap final de framer
  // (el "microcorte"); el RO deja crecer el "Ver como" interno sin recortarse.
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!node) return;
    const measure = () => setMenuHeight(node.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    roRef.current = ro;
  }, []);

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/login');
    router.refresh();
  };

  const authLoading = status === 'INITIALIZING';

  if (authLoading) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />;
  }

  if (!realEmail) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm">
        ?
      </div>
    );
  }

  // Etiqueta corta (display_name) en el día a día; el avatar usa el nombre completo para las iniciales.
  const label = realDisplayName || realEmail.split('@')[0] || 'User';
  const avatarName = realName || label;

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menú de usuario — ${label}`}
          className="rounded-full outline-none ring-primary/40 transition-shadow hover:ring-2 focus-visible:ring-2 data-[state=open]:ring-2 data-[state=open]:ring-primary/60"
        >
          <UserAvatar
            name={avatarName}
            src={realAvatarUrl}
            className="h-8 w-8"
            fallbackClassName="bg-primary/15 text-xs font-semibold text-primary"
          />
        </button>
      </DropdownMenuTrigger>
      <AnimatePresence>
        {menuOpen && (
          <DropdownMenuPrimitive.Portal forceMount>
            <DropdownMenuPrimitive.Content asChild align="end" sideOffset={8} forceMount>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: menuHeight }}
                exit={{ opacity: 0, height: 0 }}
                transition={SPRINGS.smooth}
                className="z-50 w-56 overflow-hidden rounded-md shadow-xl"
              >
                <div
                  ref={measureRef}
                  className="rounded-md border border-border bg-popover p-1 text-popover-foreground"
                >
                <DropdownMenuLabel className="text-foreground">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">{realEmail}</p>
                    {realRole && (
                      <span
                        className={cn(
                          'mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                          ROLE_ACCENT[realRole]
                        )}
                      >
                        {ROLE_LABEL[realRole]}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />

                <DropdownMenuItem
                  onClick={() => router.push('/ajustes')}
                  className="text-foreground hover:bg-accent cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ajustes</span>
                </DropdownMenuItem>
                {profile?.role === 'ADMIN' && (
                  <DropdownMenuItem
                    onClick={() => router.push('/ajustes?tab=miembros')}
                    className="text-foreground hover:bg-accent cursor-pointer"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Miembros</span>
                  </DropdownMenuItem>
                )}

                {isDev && <ViewAsMenuSection />}

                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => setLogoutDialogOpen(true)}
                  className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
                </div>
              </motion.div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="¿Cerrar sesión?"
        description="Tendrás que volver a iniciar sesión para acceder a la aplicación."
        confirmLabel="Cerrar Sesión"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={handleLogout}
        customIcon="/images/logo-ph-sport.svg"
      />
    </DropdownMenu>
  );
}
