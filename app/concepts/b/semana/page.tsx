'use client';

/** CONCEPTO B — Semana: cada diseñador como sección editorial numerada. */

import { motion } from 'framer-motion';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { SectionRule, PageMast } from '../_ui';
import { WEEK_LABEL, WEEK_GROUPS } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptBSemana() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER * 2 } } }}
    >
      <motion.div variants={rise}>
        <PageMast kicker={`Semana del ${WEEK_LABEL}`} title="La semana." />
      </motion.div>

      {WEEK_GROUPS.map((group, gi) => (
        <motion.section key={group.designer} variants={rise} className="pb-2xl">
          <SectionRule
            index={String(gi + 1).padStart(2, '0')}
            label={`${group.designer} · ${group.active} activas${group.overloaded ? ' · sobrecarga ▲' : ''}`}
          />
          <ol className="mt-md divide-y divide-border/60">
            {group.designs.map((d, i) => (
              <li
                key={d.title}
                className="group flex cursor-pointer items-baseline gap-6 py-4 transition-colors hover:bg-foreground/[0.02]"
              >
                <span className="w-7 shrink-0 font-mono tabular text-sm text-muted-foreground/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p
                  className={cn(
                    'min-w-0 flex-1 truncate font-heading text-lg font-semibold tracking-tight transition-colors',
                    d.delivered
                      ? 'text-muted-foreground/60 line-through'
                      : 'text-foreground group-hover:text-primary'
                  )}
                >
                  {d.title}
                </p>
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
          </ol>
        </motion.section>
      ))}
    </motion.div>
  );
}
