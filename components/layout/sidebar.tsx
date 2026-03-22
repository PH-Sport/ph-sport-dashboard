'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, Calendar, Activity, Home, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarLogo } from './sidebar-logo';
import { useAuth } from '@/lib/auth/auth-context';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
  /** Drawer móvil: fuerza visibilidad (el sidebar desktop va con `hidden md:flex`). */
  overlay?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function getNavGroups(role: 'ADMIN' | 'DESIGNER' | undefined): NavGroup[] {
  return [
    {
      label: 'Navegación',
      items: [
        { href: '/dashboard', label: 'Inicio', icon: Home },
        role === 'ADMIN'
          ? { href: '/team', label: 'Equipo', icon: Users }
          : { href: '/my-week', label: 'Mi Semana', icon: Calendar },
        { href: '/designs', label: 'Diseños', icon: Palette },
        { href: '/communications', label: 'Actividad', icon: Activity },
      ],
    },
  ];
}

export function Sidebar({ collapsed, onToggle, onClose, overlay }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const navGroups = getNavGroups(profile?.role);

  const handleLinkClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out',
        'bg-sidebar text-sidebar-foreground',
        'flex flex-col',
        collapsed ? 'w-20' : 'w-64',
        overlay ? 'w-[min(100%,16rem)]' : 'hidden md:flex'
      )}
    >
      <SidebarLogo collapsed={collapsed} onToggle={onToggle} />

      <div className="mx-4 border-b border-border" />

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <div
              className={cn(
                'overflow-hidden transition-all duration-300 ease-in-out',
                collapsed ? 'max-h-0 opacity-0' : 'max-h-8 opacity-100'
              )}
            >
              <h3 className="mb-1 whitespace-nowrap px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center rounded-lg px-3 py-2.5 transition-all duration-300 ease-in-out',
                    isActive
                      ? 'border-l-[3px] border-primary bg-card font-medium text-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-all duration-300',
                      collapsed && 'translate-x-[0.0625rem]',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'overflow-hidden whitespace-nowrap text-sm transition-all duration-300 ease-in-out',
                      collapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-3 max-w-[150px] opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
