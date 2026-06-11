'use client';

/**
 * CONCEPTO B — «Editorial» (programa de partido)
 * Shell: barra superior tipo masthead — SIN sidebar.
 * Geometría: columna editorial asimétrica con reglas hairline; cero cards.
 * Densidad: baja, mucho aire. La tipografía ES la interfaz.
 * Estructura de marca: AHORA / PRÓXIMO / BALANCE (Now. Next. Forever.).
 */

import { motion } from 'framer-motion';
import { Plus, ArrowUpRight } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { ConceptSwitcher } from '../_switcher';
import { GREETING, WEEK_LABEL, ALERTS, KPIS, UPCOMING, TEAM, NAV } from '../_data';

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

function SectionRule({ label, index }: { label: string; index: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-mono text-eyebrow uppercase text-primary">{index}</span>
      <span className="font-mono text-eyebrow uppercase text-muted-foreground">{label}</span>
      <span className="h-px flex-1 self-center bg-border" />
    </div>
  );
}

export default function ConceptB() {
  return (
    <div className="dark min-h-dvh bg-[hsl(220,14%,7%)] text-foreground antialiased">
      <ConceptSwitcher />

      {/* Masthead */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 pb-2 pt-6">
        <span className="font-heading text-sm font-semibold tracking-[0.3em] text-foreground">
          PHSPORT
        </span>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item, i) => (
            <button
              key={item}
              className={cn(
                'border-b-2 pb-1 font-mono text-eyebrow uppercase transition-colors',
                i === 0
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {item}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button className="flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            Crear
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border font-mono text-[11px] font-semibold text-muted-foreground">
            M
          </div>
        </div>
      </header>

      {/* Doble regla editorial */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="border-b border-border" />
        <div className="mt-[3px] border-b border-border/50" />
      </div>

      <motion.main
        className="mx-auto max-w-5xl px-6 pb-2xl"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: STAGGER * 2 } } }}
      >
        {/* Cabecera editorial */}
        <motion.section variants={rise} className="pb-xl pt-2xl">
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">
            Semana del {WEEK_LABEL}
          </p>
          <h1 className="mt-3 font-heading text-[clamp(2.5rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-tight">
            {GREETING.split(', ')[0]},{' '}
            <span className="text-primary">{GREETING.split(', ')[1]}</span>.
          </h1>
        </motion.section>

        {/* AHORA — lo que arde */}
        <motion.section variants={rise} className="pb-2xl">
          <SectionRule index="01" label="Ahora" />
          <div className="mt-lg grid gap-xl md:grid-cols-[auto,1fr] md:items-start">
            <div className="flex items-end gap-4 md:block">
              <span className="font-mono tabular text-[7rem] font-semibold leading-[0.85] text-foreground">
                {String(ALERTS.total).padStart(2, '0')}
              </span>
              <span className="pb-2 font-mono text-eyebrow uppercase text-primary md:pb-0 md:pl-1">
                avisos
              </span>
            </div>
            <div className="space-y-lg md:pt-2">
              <ul className="space-y-3 text-lg leading-snug text-muted-foreground">
                {ALERTS.bullets.map((b, i) => (
                  <li key={i}>
                    <span className="font-semibold text-foreground">{b.strong}</span> {b.rest}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <button className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  Repartir sin asignar
                </button>
                <button className="flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground/30">
                  Ver semana
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* PRÓXIMO — índice de vencimientos */}
        <motion.section variants={rise} className="pb-2xl">
          <SectionRule index="02" label="Próximo" />
          <ol className="mt-md divide-y divide-border/60">
            {UPCOMING.map((d, i) => (
              <li
                key={d.title}
                className="group flex cursor-pointer items-baseline gap-6 py-5 transition-colors hover:bg-foreground/[0.02]"
              >
                <span className="w-7 shrink-0 font-mono tabular text-sm text-muted-foreground/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {d.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {d.player} ·{' '}
                    {d.designer ? d.designer : <span className="text-status-warning">sin asignar</span>}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 font-mono tabular text-sm',
                    d.critical ? 'font-semibold text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {d.deadline}
                </span>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* BALANCE — los números de la semana */}
        <motion.section variants={rise} className="pb-2xl">
          <SectionRule index="03" label="Balance" />
          <div className="mt-lg flex flex-wrap gap-x-2xl gap-y-lg">
            {KPIS.map((kpi) => (
              <div key={kpi.label}>
                <span
                  className={cn(
                    'font-mono tabular text-5xl font-semibold leading-none',
                    kpi.tone === 'success' && 'text-status-success',
                    kpi.tone === 'warning' && 'text-status-warning',
                    kpi.tone === 'primary' && 'text-primary',
                    kpi.tone === 'default' && 'text-foreground'
                  )}
                >
                  {kpi.value}
                </span>
                <p className="mt-2 font-mono text-eyebrow uppercase text-muted-foreground">
                  {kpi.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-xl border-t border-border/60 pt-lg">
            <p className="font-mono text-eyebrow uppercase text-muted-foreground">El equipo</p>
            <div className="mt-3 flex flex-wrap gap-x-xl gap-y-2">
              {TEAM.map((m) => (
                <span key={m.name} className="text-sm">
                  <span className="font-medium text-foreground">{m.name}</span>{' '}
                  <span className="font-mono tabular text-muted-foreground">
                    {m.active}
                    {m.overloaded && <span className="text-status-warning"> ▲</span>}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Cierre de marca */}
        <motion.footer variants={rise} className="border-t border-border pt-lg text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground/50">
            Now · Next · Forever
          </span>
        </motion.footer>
      </motion.main>
    </div>
  );
}
