'use client';

/** CONCEPTO A — Ajustes: secciones de formulario divididas por hairlines. */

import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { NOTIF_PREFS } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

function Tick({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-4 w-4 items-center justify-center rounded-[3px] border',
        on ? 'border-primary bg-primary/20 text-primary' : 'border-border text-transparent'
      )}
    >
      <span className="text-[10px] leading-none">✓</span>
    </span>
  );
}

export default function ConceptAAjustes() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
      className="mx-auto max-w-2xl"
    >
      {/* Cuenta */}
      <motion.section variants={rise} className="border-b border-border px-6 py-5">
        <p className="font-mono text-eyebrow uppercase text-muted-foreground">Cuenta</p>
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-[100px,1fr] items-center gap-4">
            <label className="font-mono text-xs text-muted-foreground">Nombre</label>
            <input
              defaultValue="Mario Rodríguez"
              className="h-8 rounded-md border border-border bg-[hsl(220,14%,5%)] px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-[100px,1fr] items-center gap-4">
            <label className="font-mono text-xs text-muted-foreground">Email</label>
            <span className="font-mono text-sm text-muted-foreground">mario@phsport.es</span>
          </div>
          <div className="grid grid-cols-[100px,1fr] items-center gap-4">
            <label className="font-mono text-xs text-muted-foreground">Rol</label>
            <span className="font-mono text-xs uppercase tracking-wider text-primary">Mánager</span>
          </div>
        </div>
      </motion.section>

      {/* Apariencia */}
      <motion.section variants={rise} className="border-b border-border px-6 py-5">
        <p className="font-mono text-eyebrow uppercase text-muted-foreground">Apariencia</p>
        <div className="mt-4 flex gap-2">
          <button className="flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs text-muted-foreground transition-colors hover:bg-panel-hover/60">
            <Sun className="h-3.5 w-3.5" />
            Claro
          </button>
          <button className="flex h-8 items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 text-xs font-medium text-foreground">
            <Moon className="h-3.5 w-3.5" />
            Oscuro
          </button>
        </div>
      </motion.section>

      {/* Notificaciones */}
      <motion.section variants={rise} className="px-6 py-5">
        <p className="font-mono text-eyebrow uppercase text-muted-foreground">Notificaciones</p>
        <div className="mt-4">
          <div className="grid grid-cols-[1fr,60px,60px] gap-2 border-b border-border/60 pb-2">
            <span />
            <span className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              App
            </span>
            <span className="text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Email
            </span>
          </div>
          {NOTIF_PREFS.map((p) => (
            <div
              key={p.label}
              className="grid grid-cols-[1fr,60px,60px] items-center gap-2 border-b border-border/40 py-2.5"
            >
              <span className="text-sm text-foreground">{p.label}</span>
              <span className="flex justify-center">
                <Tick on={p.app} />
              </span>
              <span className="flex justify-center">
                <Tick on={p.email} />
              </span>
            </div>
          ))}
        </div>
        <button className="mt-5 flex h-8 items-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Guardar cambios
        </button>
      </motion.section>
    </motion.div>
  );
}
