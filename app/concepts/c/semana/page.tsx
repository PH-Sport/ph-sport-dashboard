'use client';

/** CONCEPTO C — Semana: una placa por diseñador con filas suaves. */

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { WEEK_LABEL, WEEK_GROUPS } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRINGS.gentle },
};

export default function ConceptCSemana() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER * 1.5 } } }}
    >
      <motion.div variants={rise} className="mb-lg flex items-end justify-between">
        <div>
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">La semana</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            Trabajo del equipo
          </h1>
        </div>
        <div className="glass-panel flex items-center gap-1 rounded-full px-1.5 py-1">
          <button className="flex h-7 w-7 items-center justify-center rounded-full text-panel-foreground/60 transition-colors hover:bg-panel-hover hover:text-panel-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-mono tabular text-xs text-panel-foreground">{WEEK_LABEL}</span>
          <button className="flex h-7 w-7 items-center justify-center rounded-full text-panel-foreground/60 transition-colors hover:bg-panel-hover hover:text-panel-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      <div className="space-y-lg">
        {WEEK_GROUPS.map((group) => (
          <motion.section
            key={group.designer}
            variants={rise}
            className="rounded-2xl border border-border bg-card p-xl shadow-raised"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm font-semibold text-primary">
                {group.designer.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-lg font-semibold">{group.designer}</h2>
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
            <ul className="space-y-1">
              {group.designs.map((d) => (
                <li
                  key={d.title}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-panel-hover/40"
                >
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
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
