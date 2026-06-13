'use client';

/**
 * Shell del CONCEPTO D — «Síntesis» (distribución A × materiales C).
 * Sidebar FLOTANTE estilo macOS 26 (placa de cristal plegable) + topbar viva:
 * conmutador dev de rol, tema claro/oscuro, campana con dropdown y menú de
 * usuario con logout. Nav principal SIN Miembros (vive dentro de Ajustes).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  CalendarRange,
  Palette,
  Settings,
  Bell,
  BellRing,
  CalendarPlus,
  CheckCircle2,
  Info,
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from 'lucide-react';
import { SPRINGS, TWEENS } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { ConceptSwitcher } from '../_switcher';
import { WEEK_LABEL, PERSONAS, NOTIFICATIONS } from '../_data';
import { RoleProvider, useRole, type ConceptRole } from './_role';
import { ConfirmDialog } from './_ui';

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

const NOTIF_ICONS = {
  deadline: BellRing,
  assignment: CalendarPlus,
  delivered: CheckCircle2,
  system: Info,
} as const;

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
        active
          ? 'text-primary'
          : 'text-panel-foreground/60 hover:bg-panel-hover/60 hover:text-panel-foreground'
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

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/')[3] ?? '';
  const sectionLabel = SECTION_LABELS[segment] ?? 'Inicio';
  const { role, setRole } = useRole();
  const persona = PERSONAS[role];

  const [collapsed, setCollapsed] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme === 'dark';
  const [panel, setPanel] = useState<'bell' | 'user' | null>(null);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const unread = notifs.filter((n) => n.unread).length;
  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
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

        <div className="flex flex-col gap-1.5 border-t border-panel-border/70 pt-3">
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
            className="flex h-10 items-center overflow-hidden rounded-xl px-[10px] text-panel-foreground/60 transition-colors hover:bg-panel-hover/60 hover:text-panel-foreground"
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
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <span className="font-mono text-eyebrow uppercase text-muted-foreground">
              {sectionLabel}
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono tabular text-xs text-muted-foreground">{WEEK_LABEL}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Conmutador de rol — vista de desarrollador */}
            <div
              title="Vista de desarrollador: ver la app con cada rol"
              className="flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5"
            >
              <span className="pl-2 pr-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
                dev
              </span>
              {(
                [
                  { id: 'manager', label: 'Mánager' },
                  { id: 'designer', label: 'Diseñador' },
                ] as { id: ConceptRole; label: string }[]
              ).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={cn(
                    'h-6 rounded-full px-2.5 text-[11px] font-medium transition-colors',
                    role === r.id
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {role === 'manager' && (
              <div className="hidden items-center gap-5 lg:flex">
                <span className="flex items-center gap-1.5 font-mono tabular text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> 2 críticos
                </span>
                <span className="flex items-center gap-1.5 font-mono tabular text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-warning" /> 5 sin asignar
                </span>
              </div>
            )}

            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? 'Tema claro' : 'Tema oscuro'}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Campana */}
            <div className="relative">
              <button
                onClick={() => setPanel((p) => (p === 'bell' ? null : 'bell'))}
                title="Notificaciones"
                className={cn(
                  'relative transition-colors hover:text-foreground',
                  panel === 'bell' ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary font-mono text-[8px] font-bold text-primary-foreground">
                    {unread}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {panel === 'bell' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={SPRINGS.snappy}
                    className="glass-panel absolute right-0 top-9 z-50 w-80 rounded-2xl p-2 shadow-overlay"
                  >
                    <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                      <span className="font-mono text-eyebrow uppercase text-panel-foreground/60">
                        Notificaciones
                      </span>
                      {unread > 0 && (
                        <button
                          onClick={() =>
                            setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })))
                          }
                          className="text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                        >
                          Marcar todas
                        </button>
                      )}
                    </div>
                    <ul className="space-y-0.5">
                      {notifs.length === 0 && (
                        <li className="px-2 py-6 text-center text-sm text-panel-foreground/50">
                          No tienes notificaciones
                        </li>
                      )}
                      {notifs.map((n) => {
                        const Icon = NOTIF_ICONS[n.kind];
                        return (
                          <li key={n.id}>
                            <div
                              onClick={() =>
                                setNotifs((ns) =>
                                  ns.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
                                )
                              }
                              className="group flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-panel-hover"
                            >
                              <span
                                className={cn(
                                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                                  n.unread
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-panel-hover text-panel-foreground/50'
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    'block truncate text-sm',
                                    n.unread
                                      ? 'font-medium text-panel-foreground'
                                      : 'text-panel-foreground/70'
                                  )}
                                >
                                  {n.title}
                                </span>
                                <span className="block truncate text-xs text-panel-foreground/50">
                                  {n.body}
                                </span>
                              </span>
                              <span className="flex shrink-0 flex-col items-end gap-1">
                                <span className="font-mono text-[10px] text-panel-foreground/40 group-hover:hidden">
                                  {n.time}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setNotifs((ns) => ns.filter((x) => x.id !== n.id));
                                  }}
                                  title="Borrar notificación"
                                  className="hidden h-5 w-5 items-center justify-center rounded text-panel-foreground/50 transition-colors hover:text-destructive group-hover:flex"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar → menú de usuario */}
            <div className="relative">
              <button
                onClick={() => setPanel((p) => (p === 'user' ? null : 'user'))}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] font-semibold text-primary ring-primary/40 transition-shadow',
                  panel === 'user' && 'ring-2'
                )}
              >
                {persona.initial}
              </button>
              <AnimatePresence>
                {panel === 'user' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={SPRINGS.snappy}
                    className="glass-panel absolute right-0 top-9 z-50 w-60 rounded-2xl p-2 shadow-overlay"
                  >
                    <div className="px-2 pb-2 pt-1">
                      <p className="truncate text-sm font-semibold text-panel-foreground">
                        {persona.name}
                      </p>
                      <p className="truncate font-mono text-xs text-panel-foreground/50">
                        {persona.email}
                      </p>
                      <span className="mt-1.5 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {persona.role}
                      </span>
                    </div>
                    <div className="border-t border-border/60 pt-1.5">
                      <Link
                        href="/concepts/d/ajustes"
                        onClick={() => setPanel(null)}
                        className="flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-panel-foreground/80 transition-colors hover:bg-panel-hover"
                      >
                        <Settings className="h-4 w-4" />
                        Ajustes
                      </Link>
                      <button
                        onClick={() => {
                          setPanel(null);
                          setConfirmLogout(true);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Cierra dropdowns al clicar fuera */}
        {panel && <div onClick={() => setPanel(null)} className="fixed inset-0 z-20" />}

        {/* Lienzo — ancho aprovechado, sin pasillo de aire */}
        <main>
          <div className="mx-auto w-full max-w-[1600px] p-lg">{children}</div>
        </main>
      </motion.div>

      <ConfirmDialog
        open={confirmLogout}
        title="¿Cerrar sesión?"
        description="Tendrás que volver a iniciar sesión para entrar al panel."
        confirmLabel="Cerrar sesión"
        destructive
        onConfirm={() => setConfirmLogout(false)}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}

export default function ConceptDLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <Shell>{children}</Shell>
    </RoleProvider>
  );
}
