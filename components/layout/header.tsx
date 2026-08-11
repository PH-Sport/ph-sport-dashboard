'use client';

import { usePathname } from 'next/navigation';
import { UserMenu } from './user-menu';
import { NotificationsDropdown } from './notifications-dropdown';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RolePill } from './role-pill';
import { sectionLabelFor } from '@/lib/ui/section-label';

export function Header() {
  const pathname = usePathname() ?? '';
  const sectionLabel = sectionLabelFor(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      {/* Móvil: 56px de alto — aire para los controles de 44px (como las apps nativas). */}
      <div className="flex h-14 items-center justify-between gap-2 px-3 md:h-12 md:gap-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2 md:gap-3">
          {/* Móvil: sin hamburguesa — la navegación vive en la MobileTabBar inferior. */}
          <span className="truncate text-eyebrow text-muted-foreground">
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
