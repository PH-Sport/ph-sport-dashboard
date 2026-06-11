'use client';

/**
 * Shell del CONCEPTO D — «Síntesis» (distribución A × materiales C).
 * Sidebar FLOTANTE estilo macOS 26: placa de cristal despegada de los bordes,
 * plegable a solo-iconos. Nav principal SIN Miembros (vive dentro de Ajustes).
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  CalendarRange,
  Palette,
  Settings,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { SPRINGS, TWEENS } from '@/components/ui/animations';
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

/** Anchos de la placa flotante (px): inset 12 + placa + hueco 12 → padding del lienzo. */
const EXPANDED = 208;
const COLLAPSED = 64;

function NavRow({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        'relative flex h-10 items-center overflow-hidden rounded-xl px-[10px] transition-colors',
        active ? 'text-primary' : 'text-muted-foreground hover:bg-panel-hover/60 hover:text-foreground'
      )}
    >
      {active && (
        <motion.span
          layoutId="d-nav-pill"
          transition={SPRINGS.smooth}
          className="absolute inset-0 rounded-xl bg-primary/15"
          aria-hidden
        />
      )}
      <Icon className="relative h-5 w-5 shrink-0" />
      <motion.span
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1 }}
        transition={TWEENS.fast}
        className="relative ml-3 whitespace-nowrap text-sm font-medium"
      >
        {label}
      </motion.span>
    </Link>
  );
}

export default function ConceptDLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/')[3] ?? '';
  const sectionLabel = SECTION_LABELS[segment] ?? 'Inicio';
  const [collapsed, setCollapsed] = useState(false);
  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="dark min-h-dvh bg-[hsl(220,14%,6%)] text-foreground antialiased">
      <ConceptSwitcher />

      {/* Sidebar flotante — placa de cristal despegada de los bordes, plegable */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? COLLAPSED : EXPANDED }}
        transition={SPRINGS.smooth}
        className="glass-panel fixed bottom-3 left-3 top-3 z-40 flex flex-col overflow-hidden rounded-2xl p-3 shadow-overlay"
      >
        <Link href="/concepts/d" className="flex h-10 items-center overflow-hidden">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center font-mono text-sm font-bold tracking-tight text-primary">
            PH
          </span>
          <motion.span
            initial={false}
            animate={{ opacity: collapsed ? 0 : 1 }}
            transition={TWEENS.fast}
            className="whitespace-nowrap font-heading text-sm font-semibold tracking-tight"
          >
            PHSPORT
          </motion.span>
        </Link>

        <nav className="mt-5 flex flex-1 flex-col gap-1.5">
          {NAV_ITEMS.map((item) => (
            <NavRow
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
          <NavRow
            href="/concepts/d/ajustes"
            label="Ajustes"
            icon={Settings}
            active={segment === 'ajustes'}
            collapsed={collapsed}
          />
          <button
            onClick={() => setCollapsed((v) => !v)}
            title={collapsed ? 'Expandir' : 'Contraer'}
            className="flex h-10 items-center overflow-hidden rounded-xl px-[10px] text-muted-foreground transition-colors hover:bg-panel-hover/60 hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0" />
            ) : (
              <PanelLeftClose className="h-5 w-5 shrink-0" />
            )}
            <motion.span
              initial={false}
              animate={{ opacity: collapsed ? 0 : 1 }}
              transition={TWEENS.fast}
              className="ml-3 whitespace-nowrap text-sm font-medium"
            >
              Contraer
            </motion.span>
          </button>
        </div>
      </motion.aside>

      {/* Columna de contenido — se desplaza con el mismo muelle que la placa */}
      <motion.div
        initial={false}
        animate={{ paddingLeft: (collapsed ? COLLAPSED : EXPANDED) + 24 }}
        transition={SPRINGS.smooth}
        className="min-h-dvh"
      >
        {/* Topbar de estado */}
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-[hsl(220,14%,6%)]/90 px-6 backdrop-blur-sm">
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
        <main>
          <div className="mx-auto w-full max-w-[1600px] p-lg">{children}</div>
        </main>
      </motion.div>
    </div>
  );
}
