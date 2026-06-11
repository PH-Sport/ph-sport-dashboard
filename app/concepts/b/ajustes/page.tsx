'use client';

/** CONCEPTO B — Ajustes: secciones editoriales con inputs subrayados. */

import { motion } from 'framer-motion';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { PageMast, SectionRule } from '../_ui';
import { NOTIF_PREFS } from '../../_data';

const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptBAjustes() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER * 2 } } }}
      className="max-w-2xl"
    >
      <motion.div variants={rise}>
        <PageMast kicker="Tu cuenta" title="Ajustes." />
      </motion.div>

      <motion.section variants={rise} className="pb-2xl">
        <SectionRule index="01" label="Cuenta" />
        <div className="mt-lg space-y-lg">
          <div>
            <label className="font-mono text-eyebrow uppercase text-muted-foreground">Nombre</label>
            <input
              defaultValue="Mario Rodríguez"
              className="mt-1 w-full border-b border-border bg-transparent pb-1.5 font-heading text-xl font-semibold tracking-tight text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-x-2xl gap-y-4">
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">Email</p>
              <p className="mt-1 font-mono text-sm text-foreground">mario@phsport.es</p>
            </div>
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">Rol</p>
              <p className="mt-1 font-mono text-sm uppercase tracking-wider text-primary">Mánager</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={rise} className="pb-2xl">
        <SectionRule index="02" label="Apariencia" />
        <div className="mt-lg flex items-baseline gap-8">
          {[
            { label: 'Claro', active: false },
            { label: 'Oscuro', active: true },
          ].map((t) => (
            <button
              key={t.label}
              className={cn(
                'border-b-2 pb-1 font-heading text-xl font-semibold tracking-tight transition-colors',
                t.active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section variants={rise} className="pb-2xl">
        <SectionRule index="03" label="Notificaciones" />
        <ul className="mt-md divide-y divide-border/60">
          {NOTIF_PREFS.map((p) => (
            <li key={p.label} className="flex items-baseline justify-between gap-6 py-4">
              <span className="text-base text-foreground">{p.label}</span>
              <span className="shrink-0 font-mono text-eyebrow uppercase">
                <span className={p.app ? 'text-foreground' : 'text-muted-foreground/40'}>App</span>
                <span className="px-2 text-muted-foreground/40">·</span>
                <span className={p.email ? 'text-foreground' : 'text-muted-foreground/40'}>
                  Email
                </span>
              </span>
            </li>
          ))}
        </ul>
        <button className="mt-lg flex h-10 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Guardar cambios
        </button>
      </motion.section>
    </motion.div>
  );
}
