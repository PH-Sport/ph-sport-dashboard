'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, Moon, Sun, ChevronDown, Users } from 'lucide-react';
import { SettingsDialog } from '@/components/features/account/settings-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu() {
  const router = useRouter();
  const { user, profile, status, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    setLogoutDialogOpen(false);
    await logout();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push('/login');
    router.refresh();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const authLoading = status === 'INITIALIZING';

  if (authLoading) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm">
        ?
      </div>
    );
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
  const displayRole = profile?.role === 'ADMIN' ? 'Manager' : 'Diseñador';
  const roleColor = profile?.role === 'ADMIN' ? 'text-primary' : 'text-blue-400';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
        >
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/10 font-medium text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <p className={cn('text-xs', roleColor)}>{displayRole}</p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border border-border bg-popover text-popover-foreground shadow-xl">
        <DropdownMenuLabel className="text-foreground">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={() => setSettingsOpen(true)}
          className="text-foreground hover:bg-accent cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>
        {profile?.role === 'ADMIN' && (
          <DropdownMenuItem
            onClick={() => router.push('/settings/users')}
            className="text-foreground hover:bg-accent cursor-pointer"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Usuarios</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            toggleTheme();
          }}
          className="text-foreground hover:bg-accent cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>Modo Oscuro</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={() => setLogoutDialogOpen(true)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer focus:text-red-300 focus:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="¿Cerrar sesión?"
        description="Tendrás que volver a iniciar sesión para acceder a la aplicación."
        confirmLabel="Cerrar Sesión"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={handleLogout}
        customIcon="/images/logo-ph-sport-gold.svg"
      />
    </DropdownMenu>
  );
}
