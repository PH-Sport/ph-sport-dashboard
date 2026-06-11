'use client';

/** CONCEPTO A — Inicio: banda de triage + rejilla hairline densa. */

import { motion } from 'framer-motion';
import { Users, Plus, ArrowRight } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { GREETING, ALERTS, KPIS, UPCOMING, TEAM } from '../_data';

const TONE_TEXT: Record<string, string> = {
  default: 'text-foreground',
  success: 'text-status-success',
  warning: 'text-status-warning',
  primary: 'text-primary',
};

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptAInicio() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
    >
      {/* Banda de triage */}
      <motion.section
        variants={rise}
        className="flex flex-col gap-4 border-b border-primary/25 bg-primary/[0.03] px-6 py-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-5">
          <span className="font-mono tabular text-4xl font-semibold leading-none text-primary">
            {String(ALERTS.total).padStart(2, '0')}
          </span>
          <div>
            <p className="font-mono text-eyebrow uppercase text-primary">Avisos</p>
            <p className="text-sm text-muted-foreground">
              {ALERTS.bullets.map((b, i) => (
                <span key={i}>
                  <span className="font-medium text-foreground">{b.strong}</span> {b.rest}{' '}
                </span>
              ))}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Users className="h-3.5 w-3.5" />
            Repartir sin asignar
          </button>
          <button className="flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-panel-hover/60">
            Ver semana
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.section>

      {/* KPIs como celdas de rejilla hairline */}
      <motion.section
        variants={rise}
        className="grid grid-cols-2 gap-px border-b border-border bg-border xl:grid-cols-4"
      >
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="bg-[hsl(220,14%,6%)] px-6 py-5">
            <p className="font-mono text-eyebrow uppercase text-muted-foreground">{kpi.label}</p>
            <p
              className={cn(
                'mt-2 font-mono tabular text-[2.5rem] font-semibold leading-none',
                TONE_TEXT[kpi.tone]
              )}
            >
              {kpi.value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{kpi.note}</p>
          </div>
        ))}
      </motion.section>

      {/* Vencimientos + Carga */}
      <div className="grid gap-px bg-border lg:grid-cols-[2fr,1fr]">
        <motion.section variants={rise} className="bg-[hsl(220,14%,6%)] px-6 py-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">
                Próximas 48 horas
              </p>
              <h2 className="text-sm font-semibold text-foreground">Vencimientos</h2>
            </div>
            <button className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary">
              Ver todos →
            </button>
          </div>
          <ul className="divide-y divide-border/60">
            {UPCOMING.map((d) => (
              <li key={d.title} className="flex items-center gap-4 py-2.5">
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-[2px]',
                    d.critical
                      ? 'bg-destructive'
                      : d.designer
                        ? 'bg-status-success'
                        : 'bg-status-warning'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.player} ·{' '}
                    {d.designer ? d.designer : <span className="text-status-warning">Sin asignar</span>}
                  </p>
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

        <motion.section variants={rise} className="bg-[hsl(220,14%,6%)] px-6 py-5">
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">Carga del equipo</p>
          <h2 className="text-sm font-semibold text-foreground">Trabajo activo</h2>
          <ul className="mt-4 space-y-4">
            {TEAM.map((m) => (
              <li key={m.name}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{m.name}</span>
                  <span className="font-mono tabular text-muted-foreground">
                    {m.active} act · {m.delivered} ent
                    {m.overloaded && <span className="ml-2 text-status-warning">▲</span>}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-panel-hover">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (m.active / 8) * 100)}%` }}
                    transition={SPRINGS.smooth}
                    className={cn(
                      'h-1 rounded-full',
                      m.overloaded ? 'bg-status-warning' : 'bg-foreground/40'
                    )}
                  />
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      {/* Pie de estado */}
      <motion.footer variants={rise} className="flex items-center justify-between px-6 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
          {GREETING} — sin ruido, con intención
        </span>
        <button className="flex h-8 items-center gap-1.5 rounded-md border border-border px-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
          <Plus className="h-3.5 w-3.5" />
          Crear
        </button>
      </motion.footer>
    </motion.div>
  );
}
