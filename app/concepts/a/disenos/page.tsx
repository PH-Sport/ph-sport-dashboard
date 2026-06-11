'use client';

/** CONCEPTO A — Diseños: base de datos densa con chips de filtro y tabla hairline. */

import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { DESIGNS_DB } from '../../_data';

const FILTERS = ['Todos', 'Pendientes', 'Entregados', 'Sin asignar'];

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptADisenos() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
    >
      {/* Toolbar */}
      <motion.div
        variants={rise}
        className="flex flex-col gap-3 border-b border-border px-6 py-3 lg:flex-row lg:items-center"
      >
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar…"
            className="h-8 w-full rounded-md border border-border bg-[hsl(220,14%,5%)] pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-1 items-center gap-1.5">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              className={cn(
                'h-7 rounded-md px-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors',
                i === 0
                  ? 'bg-panel-hover text-foreground'
                  : 'text-muted-foreground hover:bg-panel-hover/60 hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" />
          Crear
        </button>
      </motion.div>

      {/* Cabecera de tabla */}
      <motion.div
        variants={rise}
        className="grid grid-cols-[1fr,auto] items-center gap-4 border-b border-border bg-[hsl(220,14%,5%)] px-6 py-2 md:grid-cols-[2fr,1fr,1fr,auto]"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Diseño
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:block">
          Diseñador
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:block">
          Estado
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Entrega
        </span>
      </motion.div>

      {/* Filas */}
      <motion.ul variants={rise} className="divide-y divide-border/60">
        {DESIGNS_DB.map((d) => (
          <li
            key={d.title}
            className="grid cursor-pointer grid-cols-[1fr,auto] items-center gap-4 px-6 py-2.5 transition-colors hover:bg-panel-hover/30 md:grid-cols-[2fr,1fr,1fr,auto]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
              <p className="truncate text-xs text-muted-foreground">{d.player}</p>
            </div>
            <span className="hidden text-xs text-muted-foreground md:block">
              {d.designer ?? <span className="text-status-warning">Sin asignar</span>}
            </span>
            <span className="hidden items-center gap-1.5 md:flex">
              <span
                className={cn(
                  'h-2 w-2 rounded-[2px]',
                  d.delivered ? 'bg-status-success' : d.critical ? 'bg-destructive' : 'bg-muted-foreground/50'
                )}
              />
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {d.delivered ? 'Entregado' : 'Pendiente'}
              </span>
            </span>
            <span
              className={cn(
                'font-mono tabular text-xs',
                d.critical && !d.delivered ? 'font-semibold text-destructive' : 'text-muted-foreground'
              )}
            >
              {d.deadline}
            </span>
          </li>
        ))}
      </motion.ul>

      <motion.p
        variants={rise}
        className="px-6 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60"
      >
        9 diseños · semana actual
      </motion.p>
    </motion.div>
  );
}
