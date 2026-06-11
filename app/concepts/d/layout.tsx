'use client';

/**
 * Shell del CONCEPTO D — «Síntesis» (distribución A × materiales C).
 * Sidebar rail + topbar de estado (de A), iconos y superficies suaves (de C).
 * Nav principal SIN Miembros (vive dentro de Ajustes). Ancho aprovechado.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarRange, Palette, Settings, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConceptSwitcher } from '../_switcher';
import { WEEK_LABEL } from '../_data';

const NAV_ITEMS = [
  { href: '/concepts/d', label: 'Inicio', icon: Home, exact: true },
  { href: '/concepts/d/semana', label: 'Semana', icon: CalendarRange },
  { href: '/concepts/d/disenos', label: 'Diseños', icon: Palette },
];

const SECTION_LABELS: Record<string, string> = {
  '': 'Inicio',
  semana: 'Semana',
  disenos: 'Diseños',
  ajustes: 'Ajustes',
};

export default function ConceptDLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/')[3] ?? '';
  const sectionLabel = SECTION_LABELS[segment] ?? 'Inicio';
  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="dark min-h-dvh bg-[hsl(220,14%,6%)] text-foreground antialiased">
      <ConceptSwitcher />

      {/* Sidebar rail — estructura A, material C */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col items-center border-r border-border bg-[hsl(220,14%,5%)] py-4">
        <Link
          href="/concepts/d"
          className="flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-bold tracking-tight text-primary"
        >
          PH
        </Link>
        <nav className="mt-5 flex flex-1 flex-col gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                isActive(item)
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-panel-hover/60 hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {isActive(item) && (
                <span
                  className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
                  aria-hidden
                />
              )}
            </Link>
          ))}
        </nav>
        <Link
          href="/concepts/d/ajustes"
          title="Ajustes"
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
            segment === 'ajustes'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-panel-hover/60 hover:text-foreground'
          )}
        >
          <Settings className="h-5 w-5" />
        </Link>
      </aside>

      {/* Topbar de estado */}
      <header className="fixed left-16 right-0 top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-[hsl(220,14%,6%)]/95 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="font-mono text-eyebrow uppercase text-muted-foreground">
            {sectionLabel}
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="font-mono tabular text-xs text-muted-foreground">{WEEK_LABEL}</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 font-mono tabular text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> 2 críticos
          </span>
          <span className="flex items-center gap-1.5 font-mono tabular text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-status-warning" /> 5 sin asignar
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

      {/* Lienzo — ancho aprovechado, sin pasillo de aire */}
      <main className="pl-16 pt-12">
        <div className="mx-auto w-full max-w-[1600px] p-lg">{children}</div>
      </main>
    </div>
  );
}
