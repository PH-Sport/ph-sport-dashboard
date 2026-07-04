'use client';

/**
 * MobileTabBar — navegación inferior para móvil (<md), el patrón nativo de
 * teléfono para 3-4 secciones. Placa flotante esmerilada (glass-sidebar, el
 * mismo material que la sidebar y que los diseñadores PHSPORT usan en sus
 * plantillas), pill activa dorada que se desliza entre pestañas con muelle
 * sin rebote. En escritorio no existe: allí manda la sidebar.
 *
 * Nota PWA: hoy se muestra en cualquier viewport móvil (probable en Vercel
 * Preview). Si se prefiere solo en la app instalada, gatear con
 * `@media (display-mode: standalone)`.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { SPRINGS } from '@/components/ui/animations';
import { useAuth } from '@/lib/auth/auth-context';
import { buildNavItems, isItemActive } from './app-sidebar';
import { cn } from '@/lib/utils';

export function MobileTabBar() {
  const { profile } = useAuth();
  const pathname = usePathname() ?? '';
  const items = [
    ...buildNavItems(profile?.role),
    { href: '/ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="glass-sidebar fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 rounded-2xl shadow-overlay md:hidden"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isItemActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl outline-none transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-inset',
                  active ? 'text-primary' : 'text-sidebar-foreground/70'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-active-pill"
                    transition={SPRINGS.smooth}
                    className="absolute inset-x-1.5 inset-y-1.5 rounded-xl bg-primary/15"
                    aria-hidden
                  />
                )}
                <Icon className="relative z-10 h-5 w-5" aria-hidden />
                <span className="relative z-10 text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
