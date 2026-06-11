'use client';

/** CONCEPTO C — Ajustes: placas por sección, inputs redondeados, toggles pill. */

import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { NOTIF_PREFS } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 16, scale: 0.99 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRINGS.gentle },
};

function Pill({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors',
        on ? 'bg-primary' : 'bg-panel-hover'
      )}
    >
      <span
        className={cn(
          'h-4 w-4 rounded-full bg-background transition-transform',
          on && 'translate-x-4'
        )}
      />
    </span>
  );
}

export default function ConceptCAjustes() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER * 1.5 } } }}
      className="mx-auto max-w-2xl"
    >
      <motion.div variants={rise} className="mb-lg">
        <p className="font-mono text-eyebrow uppercase text-muted-foreground">Tu cuenta</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">Ajustes</h1>
      </motion.div>

      <div className="space-y-lg">
        {/* Cuenta */}
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-xl shadow-raised"
        >
          <h2 className="font-heading text-lg font-semibold">Cuenta</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-lg font-semibold text-primary">
              M
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input
                defaultValue="Mario Rodríguez"
                className="h-10 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="font-mono text-xs text-muted-foreground">
                mario@phsport.es · <span className="uppercase tracking-wider text-primary">Mánager</span>
              </p>
            </div>
          </div>
        </motion.section>

        {/* Apariencia */}
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-xl shadow-raised"
        >
          <h2 className="font-heading text-lg font-semibold">Apariencia</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm text-muted-foreground transition-colors hover:bg-panel-hover/40">
              <Sun className="h-4 w-4" />
              Claro
            </button>
            <button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 text-sm font-medium text-foreground">
              <Moon className="h-4 w-4" />
              Oscuro
            </button>
          </div>
        </motion.section>

        {/* Notificaciones */}
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-xl shadow-raised"
        >
          <h2 className="font-heading text-lg font-semibold">Notificaciones</h2>
          <ul className="mt-4 space-y-4">
            {NOTIF_PREFS.map((p) => (
              <li key={p.label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-foreground">{p.label}</span>
                <span className="flex shrink-0 items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      App
                    </span>
                    <Pill on={p.app} />
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Email
                    </span>
                    <Pill on={p.email} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <button className="mt-6 flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Guardar cambios
          </button>
        </motion.section>
      </div>
    </motion.div>
  );
}
