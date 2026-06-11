'use client';

/** CONCEPTO B — Inicio: editorial Now/Next/Forever. */

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { SectionRule } from './_ui';
import { GREETING, WEEK_LABEL, ALERTS, KPIS, UPCOMING, TEAM } from '../_data';

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptBInicio() {
  return (
    <motion.div
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

      {/* AHORA */}
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

      {/* PRÓXIMO */}
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

      {/* BALANCE */}
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
    </motion.div>
  );
}
