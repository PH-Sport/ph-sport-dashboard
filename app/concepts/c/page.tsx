'use client';

/**
 * CONCEPTO C — «Club» (túnel VIP / hospitality)
 * Shell: dock flotante de cristal esmerilado abajo — el lienzo respira sin chrome lateral.
 * Geometría: placas redondeadas elevadas, con capas y profundidad.
 * Densidad: media-baja, cálida, premium.
 * Resaltado: el ÚNICO momento Champions Pulse — halo dorado sutil tras el héroe.
 */

import { motion } from 'framer-motion';
import {
  Home,
  CalendarRange,
  Palette,
  Users,
  Settings,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { ConceptSwitcher } from '../_switcher';
import { GREETING, WEEK_LABEL, ALERTS, KPIS, UPCOMING, TEAM } from '../_data';

const DOCK = [
  { icon: Home, label: 'Inicio', active: true },
  { icon: CalendarRange, label: 'Semana', active: false },
  { icon: Palette, label: 'Diseños', active: false },
  { icon: Users, label: 'Miembros', active: false },
  { icon: Settings, label: 'Ajustes', active: false },
];

const rise = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRINGS.gentle },
};

export default function ConceptC() {
  return (
    <div className="dark relative min-h-dvh overflow-hidden bg-[hsl(220,14%,7%)] text-foreground antialiased">
      <ConceptSwitcher />

      {/* Momento Champions Pulse — halo dorado, único brillo de la pantalla */}
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

      <motion.main
        className="relative mx-auto max-w-4xl px-6 pb-32 pt-2xl"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: STAGGER * 1.5 } } }}
      >
        {/* Héroe: saludo + triage en una placa con anillo dorado sutil */}
        <motion.section
          variants={rise}
          className="rounded-2xl border border-primary/20 bg-card p-xl shadow-overlay"
        >
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">
            Semana del {WEEK_LABEL}
          </p>
          <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight">{GREETING}.</h1>

          <div className="mt-lg flex flex-col gap-lg border-t border-border/60 pt-lg md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <span className="font-mono tabular text-6xl font-semibold leading-none text-primary">
                {String(ALERTS.total).padStart(2, '0')}
              </span>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {ALERTS.bullets.map((b, i) => (
                  <li key={i}>
                    <span className="font-medium text-foreground">{b.strong}</span> {b.rest}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                <Users className="h-4 w-4" />
                Repartir
              </button>
              <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-panel-hover/40">
                Ver semana
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Placa de KPIs */}
        <motion.section
          variants={rise}
          className="mt-lg grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border/60 shadow-raised md:grid-cols-4"
        >
          {KPIS.map((kpi) => (
            <div key={kpi.label} className="bg-card px-6 py-5">
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">{kpi.label}</p>
              <p
                className={cn(
                  'mt-2 font-mono tabular text-3xl font-semibold leading-none',
                  kpi.tone === 'success' && 'text-status-success',
                  kpi.tone === 'warning' && 'text-status-warning',
                  kpi.tone === 'primary' && 'text-primary',
                  kpi.tone === 'default' && 'text-foreground'
                )}
              >
                {kpi.value}
              </p>
            </div>
          ))}
        </motion.section>

        {/* Dos placas: vencimientos + equipo */}
        <div className="mt-lg grid gap-lg lg:grid-cols-[3fr,2fr]">
          <motion.section variants={rise} className="rounded-2xl border border-border bg-card p-xl shadow-raised">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="font-mono text-eyebrow uppercase text-muted-foreground">
                  Próximas 48 horas
                </p>
                <h2 className="font-heading text-lg font-semibold">Vencimientos</h2>
              </div>
              <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
                Ver todos →
              </button>
            </div>
            <ul className="space-y-2">
              {UPCOMING.map((d) => (
                <li
                  key={d.title}
                  className="flex cursor-pointer items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-panel-hover/40"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold',
                      d.designer
                        ? 'bg-panel-hover text-foreground'
                        : 'bg-status-warning/15 text-status-warning'
                    )}
                  >
                    {d.designer ? d.designer.charAt(0) : '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.player}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 font-mono tabular text-xs',
                      d.critical ? 'font-semibold text-destructive' : 'text-muted-foreground'
                    )}
                  >
                    {d.deadline}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section variants={rise} className="rounded-2xl border border-border bg-card p-xl shadow-raised">
            <p className="font-mono text-eyebrow uppercase text-muted-foreground">El equipo</p>
            <h2 className="font-heading text-lg font-semibold">Carga activa</h2>
            <ul className="mt-4 space-y-3">
              {TEAM.map((m) => (
                <li key={m.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-semibold text-primary">
                    {m.name.charAt(0)}
                  </div>
                  <span className="flex-1 truncate text-sm font-medium">{m.name}</span>
                  {m.overloaded && (
                    <span className="rounded-full bg-status-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-status-warning">
                      Sobrecarga
                    </span>
                  )}
                  <span className="font-mono tabular text-sm text-muted-foreground">{m.active}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>
      </motion.main>

      {/* Dock flotante de cristal */}
      <motion.nav
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRINGS.smooth}
        className="glass-panel fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl px-2 py-1.5 shadow-overlay"
      >
        {DOCK.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            title={label}
            className={cn(
              'relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition-colors',
              active
                ? 'bg-primary/15 text-primary'
                : 'text-panel-foreground/60 hover:bg-panel-hover hover:text-panel-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {active && (
              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" aria-hidden />
            )}
          </button>
        ))}
      </motion.nav>
    </div>
  );
}
