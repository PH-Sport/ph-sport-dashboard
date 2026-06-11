'use client';

/** CONCEPTO B — Diseños: el archivo, con filtros como enlaces editoriales. */

import { motion } from 'framer-motion';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { PageMast } from '../_ui';
import { DESIGNS_DB } from '../../_data';

const FILTERS = ['Todos', 'Pendientes', 'Entregados', 'Sin asignar'];

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptBDisenos() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER * 2 } } }}
    >
      <motion.div variants={rise}>
        <PageMast kicker="9 piezas esta semana" title="El archivo." />
      </motion.div>

      {/* Filtros editoriales + búsqueda subrayada */}
      <motion.div
        variants={rise}
        className="flex flex-col gap-4 border-b border-border pb-lg md:flex-row md:items-baseline md:justify-between"
      >
        <div className="flex flex-wrap items-baseline gap-6">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              className={cn(
                'border-b-2 pb-1 font-mono text-eyebrow uppercase transition-colors',
                i === 0
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Buscar en el archivo…"
          className="w-full border-b border-border bg-transparent pb-1 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none md:max-w-[220px]"
        />
      </motion.div>

      {/* Índice */}
      <motion.ol variants={rise} className="divide-y divide-border/60">
        {DESIGNS_DB.map((d, i) => (
          <li
            key={d.title}
            className="group flex cursor-pointer items-baseline gap-6 py-5 transition-colors hover:bg-foreground/[0.02]"
          >
            <span className="w-7 shrink-0 font-mono tabular text-sm text-muted-foreground/60">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate font-heading text-xl font-semibold tracking-tight transition-colors',
                  d.delivered
                    ? 'text-muted-foreground/60 line-through'
                    : 'text-foreground group-hover:text-primary'
                )}
              >
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
                d.delivered
                  ? 'text-status-success'
                  : d.critical
                    ? 'font-semibold text-destructive'
                    : 'text-muted-foreground'
              )}
            >
              {d.delivered ? 'Entregado' : d.deadline}
            </span>
          </li>
        ))}
      </motion.ol>
    </motion.div>
  );
}
