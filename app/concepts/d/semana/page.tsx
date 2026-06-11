'use client';

/** CONCEPTO D — Semana: placas por diseñador en rejilla de 2 columnas (densidad A, material C). */

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { WEEK_LABEL, WEEK_GROUPS } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptDSemana() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
      className="space-y-4"
    >
      <motion.div variants={rise} className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Trabajo del equipo
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Quién lleva qué esta semana</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-raised">
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-panel-hover/60 hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-mono tabular text-xs">{WEEK_LABEL}</span>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-panel-hover/60 hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        {WEEK_GROUPS.map((group) => (
          <motion.section
            key={group.designer}
            variants={rise}
            className="rounded-2xl border border-border bg-card p-lg shadow-raised"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
                {group.designer.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold">{group.designer}</h2>
                <p className="font-mono tabular text-xs text-muted-foreground">
                  {group.active} activas
                </p>
              </div>
              {group.overloaded && (
                <span className="rounded-full bg-status-warning/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-status-warning">
                  Sobrecarga
                </span>
              )}
            </div>
            <ul className="-mx-2">
              {group.designs.map((d) => (
                <li
                  key={d.title}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-panel-hover/40"
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      d.delivered
                        ? 'bg-status-success'
                        : d.critical
                          ? 'bg-destructive'
                          : 'bg-muted-foreground/50'
                    )}
                  />
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm',
                      d.delivered
                        ? 'text-muted-foreground line-through'
                        : 'font-medium text-foreground'
                    )}
                  >
                    {d.title}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-mono tabular text-xs',
                      d.critical && !d.delivered
                        ? 'font-semibold text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {d.delivered ? 'Entregado' : d.deadline}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        ))}
      </div>
    </motion.div>
  );
}
