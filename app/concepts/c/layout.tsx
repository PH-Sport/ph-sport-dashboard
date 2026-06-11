'use client';

/**
 * Shell del CONCEPTO C — «Club»: dock flotante de cristal, halo Champions,
 * monograma de marca de agua. Sin chrome lateral.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, CalendarRange, Palette, Users, Settings, Plus } from 'lucide-react';
import { SPRINGS } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { ConceptSwitcher } from '../_switcher';

const DOCK_ITEMS = [
  { href: '/concepts/c', label: 'Inicio', icon: Home, exact: true },
  { href: '/concepts/c/semana', label: 'Semana', icon: CalendarRange },
  { href: '/concepts/c/disenos', label: 'Diseños', icon: Palette },
  { href: '/concepts/c/miembros', label: 'Miembros', icon: Users },
  { href: '/concepts/c/ajustes', label: 'Ajustes', icon: Settings },
];

export default function ConceptCLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="dark relative min-h-dvh overflow-hidden bg-[hsl(220,14%,7%)] text-foreground antialiased">
      <ConceptSwitcher />

      {/* Momento Champions Pulse — halo dorado, único brillo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,hsl(41,70%,56%,0.08),transparent_62%)]"
      />
      {/* Monograma marca de agua */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-16 select-none font-heading text-[22rem] font-bold leading-none tracking-tighter text-primary/[0.04]"
      >
        PH
      </div>

      {/* Chip de usuario flotante */}
      <div className="absolute right-6 top-6 z-40 flex items-center gap-2">
        <button className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-overlay transition-colors hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" />
          Crear
        </button>
        <div className="glass-panel flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-semibold text-primary">
          M
        </div>
      </div>

      <main className="relative mx-auto max-w-4xl px-6 pb-32 pt-2xl">{children}</main>

      {/* Dock flotante de cristal */}
      <motion.nav
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRINGS.smooth}
        className="glass-panel fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl px-2 py-1.5 shadow-overlay"
      >
        {DOCK_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              'relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition-colors',
              isActive(item)
                ? 'bg-primary/15 text-primary'
                : 'text-panel-foreground/60 hover:bg-panel-hover hover:text-panel-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {isActive(item) && (
              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" aria-hidden />
            )}
          </Link>
        ))}
      </motion.nav>
    </div>
  );
}
