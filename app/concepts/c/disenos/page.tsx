'use client';

/** CONCEPTO C — Diseños: una gran placa con búsqueda redondeada y pills. */

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { DESIGNS_DB } from '../../_data';

const FILTERS = ['Todos', 'Pendientes', 'Entregados', 'Sin asignar'];

const rise = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRINGS.gentle },
};

export default function ConceptCDisenos() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER * 1.5 } } }}
    >
      <motion.div variants={rise} className="mb-lg">
        <p className="font-mono text-eyebrow uppercase text-muted-foreground">9 piezas</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">Diseños</h1>
      </motion.div>

      {/* Búsqueda + filtros pill */}
      <motion.div variants={rise} className="mb-lg flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por título, jugador…"
            className="h-11 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm text-foreground shadow-raised placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              className={cn(
                'h-9 rounded-full px-4 text-xs font-medium transition-colors',
                i === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Placa con filas */}
      <motion.section
        variants={rise}
        className="rounded-2xl border border-border bg-card p-md shadow-raised"
      >
        <ul className="space-y-1">
          {DESIGNS_DB.map((d) => (
            <li
              key={d.title}
              className="flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-panel-hover/40"
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
                <p
                  className={cn(
                    'truncate text-sm font-medium',
                    d.delivered && 'text-muted-foreground line-through'
                  )}
                >
                  {d.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{d.player}</p>
              </div>
              <span
                className={cn(
                  'hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline',
                  d.delivered
                    ? 'bg-status-success/15 text-status-success'
                    : 'bg-panel-hover text-muted-foreground'
                )}
              >
                {d.delivered ? 'Entregado' : 'Pendiente'}
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
    </motion.div>
  );
}
