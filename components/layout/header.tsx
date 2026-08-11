'use client';

import { usePathname } from 'next/navigation';
import { UserMenu } from './user-menu';
import { NotificationsDropdown } from './notifications-dropdown';
import { RolePill } from './role-pill';
import { usePageTitleCollapsed } from './page-title-context';
import { sectionLabelFor } from '@/lib/ui/section-label';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname() ?? '';
  const sectionLabel = sectionLabelFor(pathname);
  // Móvil: la barra empieza desnuda y recoge el testigo del título grande al
  // desplazar. Escritorio: nada de esto aplica — rótulo y línea, siempre, como
  // antes de la fase 1.5. De ahí las contrapartes md: de ambas transiciones.
  const collapsed = usePageTitleCollapsed();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b bg-background/90 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] backdrop-blur-sm',
        // Scroll edge effect: sin línea arriba del todo, línea al desplazar.
        'transition-colors duration-200 ease-out-expo md:border-border',
        collapsed ? 'border-border' : 'border-transparent'
      )}
    >
      {/* Móvil: 56px de alto — aire para los controles de 44px (como las apps nativas). */}
      <div className="flex h-14 items-center justify-between gap-2 px-3 md:h-12 md:gap-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          {/* Móvil: sin hamburguesa — la navegación vive en la MobileTabBar inferior. */}
          <span
            aria-hidden={!collapsed}
            className={cn(
              'truncate text-eyebrow text-muted-foreground',
              'transition-all duration-200 ease-out-expo md:translate-y-0 md:opacity-100',
              collapsed ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
            )}
          >
            {sectionLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <RolePill />
          {/* El tema vive ahora en el menú de perfil, no en la primera vista. */}
          <NotificationsDropdown />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
