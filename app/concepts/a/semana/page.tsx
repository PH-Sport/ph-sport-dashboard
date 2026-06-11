'use client';

/** CONCEPTO A — Semana: trabajo por diseñador en secciones hairline densas. */

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { WEEK_LABEL, WEEK_GROUPS } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptASemana() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
    >
      {/* Navegación de semana */}
      <motion.div
        variants={rise}
        className="flex items-center justify-between border-b border-border px-6 py-3"
      >
        <div>
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">La semana</p>
          <h1 className="text-sm font-semibold text-foreground">Trabajo del equipo</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-panel-hover/60 hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-mono tabular text-xs text-foreground">{WEEK_LABEL}</span>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-panel-hover/60 hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Secciones por diseñador */}
      {WEEK_GROUPS.map((group) => (
        <motion.section key={group.designer} variants={rise} className="border-b border-border">
          <div className="flex items-center justify-between bg-[hsl(220,14%,5%)] px-6 py-2.5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{group.designer}</span>
              {group.overloaded && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-status-warning">
                  ▲ sobrecarga
                </span>
              )}
            </div>
            <span className="font-mono tabular text-xs text-muted-foreground">
              {group.active} activas
            </span>
          </div>
          <ul className="divide-y divide-border/60">
            {group.designs.map((d) => (
              <li
                key={d.title}
                className="flex cursor-pointer items-center gap-4 px-6 py-2.5 transition-colors hover:bg-panel-hover/30"
              >
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-[2px]',
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
                    d.delivered ? 'text-muted-foreground line-through' : 'font-medium text-foreground'
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
                  {d.deadline}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>
      ))}
    </motion.div>
  );
}
