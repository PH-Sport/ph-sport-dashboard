'use client';

/**
 * Shell del CONCEPTO A — «Cabina»: rail de iconos 56px + barra superior de estado.
 * Navegación real entre las 5 páginas del concepto.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarRange, Palette, Users, Settings, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConceptSwitcher } from '../_switcher';
import { WEEK_LABEL } from '../_data';

const NAV_ITEMS = [
  { href: '/concepts/a', label: 'Inicio', icon: Home, exact: true },
  { href: '/concepts/a/semana', label: 'Semana', icon: CalendarRange },
  { href: '/concepts/a/disenos', label: 'Diseños', icon: Palette },
  { href: '/concepts/a/miembros', label: 'Miembros', icon: Users },
];

const SECTION_LABELS: Record<string, string> = {
  '': 'Inicio',
  semana: 'Semana',
  disenos: 'Diseños',
  miembros: 'Miembros',
  ajustes: 'Ajustes',
};

export default function ConceptALayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/')[3] ?? '';
  const sectionLabel = SECTION_LABELS[segment] ?? 'Inicio';
  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="dark min-h-dvh bg-[hsl(220,14%,6%)] text-foreground antialiased">
      <ConceptSwitcher />

      {/* Rail de iconos */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-14 flex-col items-center border-r border-border bg-[hsl(220,14%,5%)] py-3">
        <Link
          href="/concepts/a"
          className="flex h-9 w-9 items-center justify-center rounded-md font-mono text-xs font-bold tracking-tight text-primary"
        >
          PH
        </Link>
        <nav className="mt-4 flex flex-1 flex-col gap-1.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
                isActive(item)
                  ? 'bg-panel-hover text-primary'
                  : 'text-muted-foreground hover:bg-panel-hover/60 hover:text-foreground'
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
            </Link>
          ))}
        </nav>
        <Link
          href="/concepts/a/ajustes"
          title="Ajustes"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-md transition-colors',
            segment === 'ajustes'
              ? 'bg-panel-hover text-primary'
              : 'text-muted-foreground hover:bg-panel-hover/60 hover:text-foreground'
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
        </Link>
      </aside>

      {/* Barra superior de estado */}
      <header className="fixed left-14 right-0 top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-[hsl(220,14%,6%)]/95 px-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="font-mono text-eyebrow uppercase text-muted-foreground">
            {sectionLabel}
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="font-mono tabular text-xs text-muted-foreground">{WEEK_LABEL}</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 font-mono tabular text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px] bg-destructive" /> 2 críticos
          </span>
          <span className="flex items-center gap-1.5 font-mono tabular text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-[2px] bg-status-warning" /> 5 sin asignar
          </span>
          <button
            className="text-muted-foreground transition-colors hover:text-foreground"
            title="Notificaciones"
          >
            <Bell className="h-4 w-4" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] font-semibold text-primary">
            M
          </div>
        </div>
      </header>

      <main className="pl-14 pt-12">{children}</main>
    </div>
  );
}
