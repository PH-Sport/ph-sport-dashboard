'use client';

/** CONCEPTO A — Miembros: gestión de integrantes en filas densas. */

import { motion } from 'framer-motion';
import { Plus, Copy, Trash2 } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { MEMBERS, PENDING_INVITE } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptAMiembros() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
    >
      <motion.div
        variants={rise}
        className="flex items-center justify-between border-b border-border px-6 py-3"
      >
        <div>
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">Miembros</p>
          <h1 className="text-sm font-semibold text-foreground">6 personas en PHSPORT</h1>
        </div>
        <button className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" />
          Invitar
        </button>
      </motion.div>

      {/* Filas de miembros */}
      <motion.ul variants={rise} className="divide-y divide-border/60">
        {MEMBERS.map((m) => (
          <li key={m.email} className="flex items-center gap-4 px-6 py-3">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-semibold',
                m.admin ? 'bg-primary/15 text-primary' : 'bg-panel-hover text-foreground'
              )}
            >
              {m.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{m.email}</p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
                m.admin
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground'
              )}
            >
              {m.role}
            </span>
          </li>
        ))}
      </motion.ul>

      {/* Invitación pendiente */}
      <motion.section variants={rise} className="border-t border-border px-6 py-4">
        <p className="font-mono text-eyebrow uppercase text-muted-foreground">
          Invitaciones pendientes
        </p>
        <div className="mt-3 flex items-center gap-4 rounded-md border border-dashed border-border px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-sm text-foreground">{PENDING_INVITE.email}</p>
            <p className="text-xs text-muted-foreground">{PENDING_INVITE.note}</p>
          </div>
          <button
            className="text-muted-foreground transition-colors hover:text-foreground"
            title="Copiar enlace"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            className="text-muted-foreground transition-colors hover:text-destructive"
            title="Eliminar invitación"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
