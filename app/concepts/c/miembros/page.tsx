'use client';

/** CONCEPTO C — Miembros: tarjetas de plantilla + placa de invitación. */

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { MEMBERS, PENDING_INVITE } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRINGS.gentle },
};

export default function ConceptCMiembros() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER * 1.5 } } }}
    >
      <motion.div variants={rise} className="mb-lg">
        <p className="font-mono text-eyebrow uppercase text-muted-foreground">6 personas</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">Miembros</h1>
      </motion.div>

      <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-3">
        {MEMBERS.map((m) => (
          <motion.div
            key={m.email}
            variants={rise}
            className="rounded-2xl border border-border bg-card p-lg shadow-raised transition-colors hover:border-primary/30"
          >
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full font-mono text-base font-semibold',
                m.admin ? 'bg-primary/15 text-primary' : 'bg-panel-hover text-foreground'
              )}
            >
              {m.name.charAt(0)}
            </div>
            <p className="mt-3 truncate font-heading text-base font-semibold">{m.name}</p>
            <p className="truncate font-mono text-xs text-muted-foreground">{m.email}</p>
            <span
              className={cn(
                'mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                m.admin ? 'bg-primary/15 text-primary' : 'bg-panel-hover text-muted-foreground'
              )}
            >
              {m.role}
            </span>
          </motion.div>
        ))}

        {/* Placa de invitación */}
        <motion.button
          variants={rise}
          className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Invitar miembro</span>
        </motion.button>
      </div>

      <motion.section
        variants={rise}
        className="mt-lg rounded-2xl border border-border bg-card p-lg shadow-raised"
      >
        <p className="font-mono text-eyebrow uppercase text-muted-foreground">
          Invitación pendiente
        </p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <span className="truncate font-mono text-sm text-foreground">{PENDING_INVITE.email}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{PENDING_INVITE.note}</span>
        </div>
      </motion.section>
    </motion.div>
  );
}
