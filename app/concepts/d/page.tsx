'use client';

/**
 * CONCEPTO D — Inicio: distribución de A (triage + KPIs + 2 columnas) en placas C.
 * Dos caras según rol: Mánager (triage del equipo) y Diseñador (su semana,
 * con hero de urgencia si vence algo en <24 h; compañeros en secundario).
 */

import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { WEEK_LABEL, ALERTS, KPIS, UPCOMING, TEAM, MY_WEEK, PERSONAS } from '../_data';
import { useRole } from './_role';
import { UrgencyDot } from './_ui';

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

function KpiPlate({ kpi }: { kpi: (typeof KPIS)[number] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-lg shadow-raised">
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
  );
}

/* ───────────────────────── Cara Mánager ───────────────────────── */

function ManagerInicio() {
  return (
    <>
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
          <button className="flex h-9 items-center gap-2 rounded-xl border border-border px-4 text-xs font-medium transition-colors hover:bg-muted/40">
            Ver semana
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.section>

      {/* KPIs — placas con la info-densidad de A */}
      <motion.section variants={rise} className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {KPIS.map((kpi) => (
          <KpiPlate key={kpi.label} kpi={kpi} />
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
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold',
                    d.designer
                      ? 'bg-muted text-foreground'
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
                <span className="flex shrink-0 items-center gap-2">
                  <UrgencyDot urgency={d.urgency} />
                  <span
                    className={cn(
                      'font-mono tabular text-xs',
                      d.urgency === 'h24' || d.urgency === 'overdue'
                        ? 'font-semibold text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {d.deadline}
                  </span>
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
                <div className="h-1 w-full rounded-full bg-muted">
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
    </>
  );
}

/* ───────────────────────── Cara Diseñador ───────────────────────── */

function DesignerInicio() {
  return (
    <>
      {/* Hero de urgencia — la entrega más próxima manda */}
      <motion.section
        variants={rise}
        className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-destructive/[0.06] p-lg shadow-raised md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-5">
          <span className="font-mono tabular text-5xl font-semibold leading-none text-destructive">
            {MY_WEEK.hero.hoursLeft}
          </span>
          <div>
            <p className="font-mono text-eyebrow uppercase text-destructive">
              Entrega más próxima
            </p>
            <p className="mt-0.5 text-sm font-medium">{MY_WEEK.hero.title}</p>
            <p className="text-xs text-muted-foreground">
              {MY_WEEK.hero.player} · {MY_WEEK.hero.deadline}
            </p>
          </div>
        </div>
        <button className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Abrir diseño
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </motion.section>

      {/* KPIs personales */}
      <motion.section variants={rise} className="grid grid-cols-3 gap-4">
        {MY_WEEK.kpis.map((kpi) => (
          <KpiPlate key={kpi.label} kpi={kpi} />
        ))}
      </motion.section>

      {/* Dos columnas: mi cola + compañeros (secundario a propósito) */}
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-lg shadow-raised"
        >
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">Tu cola</p>
              <h2 className="text-base font-semibold">Pendientes</h2>
            </div>
            <button className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary">
              Ver mi semana →
            </button>
          </div>
          <ul className="-mx-2">
            {MY_WEEK.pending.map((d) => (
              <li
                key={d.title}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
              >
                <UrgencyDot urgency={d.urgency} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.player}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 font-mono tabular text-xs',
                    d.urgency === 'overdue'
                      ? 'font-semibold text-destructive'
                      : d.urgency === 'h24'
                        ? 'font-semibold text-destructive'
                        : 'text-muted-foreground'
                  )}
                >
                  {d.urgency === 'overdue' ? `Atrasada · ${d.deadline}` : d.deadline}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-lg shadow-raised"
        >
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">Compañeros</p>
          <h2 className="text-base font-semibold">El resto del equipo</h2>
          <ul className="mt-4 space-y-3">
            {TEAM.filter((m) => m.name !== PERSONAS.designer.first).map((m) => (
              <li key={m.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold">
                    {m.name.charAt(0)}
                  </span>
                  {m.name}
                </span>
                <span className="font-mono tabular text-xs text-muted-foreground">
                  {m.active} activas
                </span>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </>
  );
}

export default function ConceptDInicio() {
  const { role } = useRole();
  const persona = PERSONAS[role];

  return (
    <motion.div
      key={role}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
      className="space-y-4"
    >
      {/* Saludo compacto, app-like */}
      <motion.div variants={rise} className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Buenos días, {persona.first}.
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Semana del {WEEK_LABEL}</p>
        </div>
      </motion.div>

      {role === 'manager' ? <ManagerInicio /> : <DesignerInicio />}
    </motion.div>
  );
}
