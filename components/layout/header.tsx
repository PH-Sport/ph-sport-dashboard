'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { UserMenu } from './user-menu';
import { NotificationsDropdown } from './notifications-dropdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RolePill } from './role-pill';

interface HeaderProps {
  onMenuClick: () => void;
}

/** Rótulo de sección derivado del primer segmento de la ruta. */
const SECTION_LABELS: Record<string, string> = {
  inicio: 'Inicio',
  equipo: 'Semana',
  'mi-semana': 'Semana',
  disenos: 'Diseños',
  ajustes: 'Ajustes',
};

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/')[1] ?? '';
  const sectionLabel = SECTION_LABELS[segment] ?? '';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile: abre el sidebar en Sheet. Desktop usa el toggle interno. */}
          <button
            onClick={onMenuClick}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-mono text-eyebrow uppercase text-muted-foreground">
            {sectionLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <RolePill />
          <ThemeToggle />
          <NotificationsDropdown />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
