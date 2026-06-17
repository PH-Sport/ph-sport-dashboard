'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Users } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/lib/auth/auth-context';
import { useViewAs } from '@/lib/auth/view-as-context';
import { ROLE_LABEL, ROLE_ACCENT } from '@/lib/utils/role';
import { ViewAsMenuSection } from './view-as-menu-section';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const router = useRouter();
  // status/logout/profile.role(efectivo) de useAuth; identidad REAL de useViewAs.
  const { status, logout, profile } = useAuth();
  const { isDev, realName, realEmail, realRole, realAvatarUrl } = useViewAs();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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

  const displayName = realName || realEmail.split('@')[0] || 'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menú de usuario — ${displayName}`}
          className="rounded-full outline-none ring-primary/40 transition-shadow hover:ring-2 focus-visible:ring-2"
        >
          <UserAvatar
            name={displayName}
            src={realAvatarUrl}
            className="h-8 w-8"
            fallbackClassName="bg-primary/15 text-xs font-semibold text-primary"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border border-border bg-popover text-popover-foreground shadow-xl">
        <DropdownMenuLabel className="text-foreground">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
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
      </DropdownMenuContent>

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
