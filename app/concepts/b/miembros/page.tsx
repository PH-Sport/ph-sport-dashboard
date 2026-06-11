'use client';

/** CONCEPTO B — Miembros: la plantilla, nombres grandes como créditos editoriales. */

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { PageMast, SectionRule } from '../_ui';
import { MEMBERS, PENDING_INVITE } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptBMiembros() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER * 2 } } }}
    >
      <motion.div variants={rise} className="flex items-end justify-between gap-6">
        <PageMast kicker="6 personas" title="La plantilla." />
        <button className="mb-xl flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Invitar
        </button>
      </motion.div>

      <motion.ol variants={rise} className="divide-y divide-border/60 border-t border-border">
        {MEMBERS.map((m, i) => (
          <li key={m.email} className="flex items-baseline gap-6 py-6">
            <span className="w-7 shrink-0 font-mono tabular text-sm text-muted-foreground/60">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-2xl font-semibold tracking-tight text-foreground">
                {m.name}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{m.email}</p>
            </div>
            <span
              className={cn(
                'shrink-0 font-mono text-eyebrow uppercase',
                m.admin ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {m.role}
            </span>
          </li>
        ))}
      </motion.ol>

      <motion.section variants={rise} className="pt-2xl">
        <SectionRule index="—" label="Invitación pendiente" />
        <div className="mt-md flex items-baseline gap-6 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
            {PENDING_INVITE.email}
          </span>
          <span className="shrink-0 text-sm text-muted-foreground">{PENDING_INVITE.note}</span>
          <button className="shrink-0 border-b border-transparent font-mono text-eyebrow uppercase text-muted-foreground transition-colors hover:border-destructive hover:text-destructive">
            Revocar
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
