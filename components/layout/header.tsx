'use client';

import { usePathname } from 'next/navigation';
import { UserMenu } from './user-menu';
import { NotificationsDropdown } from './notifications-dropdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RolePill } from './role-pill';

/** Rótulo de sección derivado del primer segmento de la ruta. */
const SECTION_LABELS: Record<string, string> = {
  inicio: 'Inicio',
  equipo: 'Semana',
  'mi-semana': 'Semana',
  disenos: 'Diseños',
  ajustes: 'Ajustes',
};

export function Header() {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/')[1] ?? '';
  const sectionLabel = SECTION_LABELS[segment] ?? '';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <div className="flex h-12 items-center justify-between gap-2 px-3 md:gap-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          {/* Móvil: sin hamburguesa — la navegación vive en la MobileTabBar inferior. */}
          <span className="truncate font-mono text-eyebrow uppercase text-muted-foreground">
            {sectionLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <RolePill />
          <ThemeToggle />
          <NotificationsDropdown />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
