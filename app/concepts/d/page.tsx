'use client';

/** CONCEPTO D — Inicio: distribución de A (triage + KPIs + 2 columnas) en placas C. */

import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { GREETING, WEEK_LABEL, ALERTS, KPIS, UPCOMING, TEAM } from '../_data';

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

const TONE_TEXT: Record<string, string> = {
  default: 'text-foreground',
  success: 'text-status-success',
  warning: 'text-status-warning',
  primary: 'text-primary',
};

export default function ConceptDInicio() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
      className="space-y-4"
    >
      {/* Saludo compacto, app-like */}
      <motion.div variants={rise} className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{GREETING}.</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Semana del {WEEK_LABEL}</p>
        </div>
      </motion.div>

      {/* Placa de triage — acción donde está el problema */}
      <motion.section
        variants={rise}
        className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-card p-lg shadow-raised md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-5">
          <span className="font-mono tabular text-5xl font-semibold leading-none text-primary">
            {String(ALERTS.total).padStart(2, '0')}
          </span>
          <div>
            <p className="font-mono text-eyebrow uppercase text-primary">Avisos</p>
            <ul className="mt-0.5 text-sm text-muted-foreground">
              {ALERTS.bullets.map((b, i) => (
                <li key={i}>
                  <span className="font-medium text-foreground">{b.strong}</span> {b.rest}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Users className="h-3.5 w-3.5" />
            Repartir sin asignar
          </button>
          <button className="flex h-9 items-center gap-2 rounded-xl border border-border px-4 text-xs font-medium transition-colors hover:bg-panel-hover/40">
            Ver semana
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.section>

      {/* KPIs — placas con la info-densidad de A */}
      <motion.section variants={rise} className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-border bg-card p-lg shadow-raised"
          >
            <p className="font-mono text-eyebrow uppercase text-muted-foreground">{kpi.label}</p>
            <p
              className={cn(
                'mt-2 font-mono tabular text-4xl font-semibold leading-none',
                TONE_TEXT[kpi.tone]
              )}
            >
              {kpi.value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{kpi.note}</p>
          </div>
        ))}
      </motion.section>

      {/* Dos columnas: vencimientos + carga */}
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-lg shadow-raised"
        >
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">
                Próximas 48 horas
              </p>
              <h2 className="text-base font-semibold">Vencimientos</h2>
            </div>
            <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
              Ver todos →
            </button>
          </div>
          <ul className="-mx-2">
            {UPCOMING.map((d) => (
              <li
                key={d.title}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-panel-hover/40"
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold',
                    d.designer
                      ? 'bg-panel-hover text-foreground'
                      : 'bg-status-warning/15 text-status-warning'
                  )}
                >
                  {d.designer ? d.designer.charAt(0) : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
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

        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-lg shadow-raised"
        >
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">Carga del equipo</p>
          <h2 className="text-base font-semibold">Trabajo activo</h2>
          <ul className="mt-4 space-y-4">
            {TEAM.map((m) => (
              <li key={m.name}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-semibold text-primary">
                      {m.name.charAt(0)}
                    </span>
                    {m.name}
                  </span>
                  <span className="font-mono tabular text-xs text-muted-foreground">
                    {m.active}
                    {m.overloaded && <span className="ml-1.5 text-status-warning">▲</span>}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-panel-hover">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (m.active / 8) * 100)}%` }}
                    transition={SPRINGS.smooth}
                    className={cn(
                      'h-1 rounded-full',
                      m.overloaded ? 'bg-status-warning' : 'bg-primary/50'
                    )}
                  />
                </div>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </motion.div>
  );
}
