'use client';

/**
 * CONCEPTO D — Modal «Editar diseño».
 * Sustituye al diálogo de editar de la app real (que reutiliza el de crear).
 * Se abre EN LUGAR del detalle (intercambio secuencial, nunca apilado) y al
 * guardar/cancelar vuelve al detalle. Guardado optimista sobre la lista.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { SPRINGS, TWEENS } from '@/components/ui/animations';
import { cn } from '@/lib/utils';

export type EditValues = { title: string; player: string; deadline: string };

const inputCls =
  'mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring';
const labelCls = 'font-mono text-eyebrow uppercase text-muted-foreground';

function EditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: EditValues;
  onSave: (v: EditValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const valid = values.title.trim() !== '' && values.player.trim() !== '';
  const set = (field: keyof EditValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <>
      <div className="flex items-start justify-between gap-4 border-b border-border/60 p-lg">
        <div className="min-w-0">
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">Editar</p>
          <h2 className="mt-1 truncate font-heading text-xl font-semibold tracking-tight">
            {initial.title}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-lg">
        <div>
          <label className={labelCls}>Título</label>
          <input value={values.title} onChange={set('title')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Jugador</label>
          <input value={values.player} onChange={set('player')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Entrega</label>
          <input
            value={values.deadline}
            onChange={set('deadline')}
            className={cn(inputCls, 'font-mono')}
          />
        </div>
        <div>
          <label className={labelCls}>Carpeta Drive (opcional)</label>
          <input placeholder="https://drive.google.com/…" className={inputCls} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border/60 p-lg pt-md">
        <button
          onClick={onCancel}
          className="flex h-10 items-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          onClick={() => valid && onSave(values)}
          disabled={!valid}
          className="flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          Guardar cambios
        </button>
      </div>
    </>
  );
}

export function EditDesignModal({
  open,
  initial,
  onSave,
  onCancel,
}: {
  open: boolean;
  initial: EditValues | null;
  onSave: (v: EditValues) => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && initial && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TWEENS.base}
            onClick={onCancel}
            className="glass-scrim fixed inset-0 z-50"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={SPRINGS.smooth}
              className="pointer-events-auto flex max-h-[calc(100dvh-32px)] w-full max-w-md flex-col overflow-y-auto rounded-2xl border border-border bg-card shadow-overlay"
            >
              <EditForm key={initial.title} initial={initial} onSave={onSave} onCancel={onCancel} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
