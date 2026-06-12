'use client';

/**
 * Piezas compartidas del CONCEPTO D:
 * - UrgencyDot: punto de color con pulso sutil según tiempo restante
 *   (sustituye a iconos de fuego/peligro — más contenido, más premium).
 * - PlayerStatusTag: estado del jugador (Lesionado, Duda…).
 * - ConfirmDialog: confirmación para acciones destructivas o regresivas.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { SPRINGS, TWEENS } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import type { Urgency, PlayerStatus } from '../_data';

const URGENCY_META: Record<Exclude<Urgency, null>, { color: string; label: string; pulse: boolean }> = {
  h48: { color: 'bg-status-warning', label: 'Vence en menos de 48 h', pulse: true },
  h24: { color: 'bg-destructive', label: 'Vence en menos de 24 h', pulse: true },
  overdue: { color: 'bg-destructive', label: 'Atrasado', pulse: false },
};

export function UrgencyDot({ urgency, className }: { urgency: Urgency; className?: string }) {
  if (!urgency) return null;
  const meta = URGENCY_META[urgency];
  return meta.pulse ? (
    <motion.span
      animate={{ opacity: [0.35, 1, 0.35] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      title={meta.label}
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', meta.color, className)}
    />
  ) : (
    <span
      title={meta.label}
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', meta.color, className)}
    />
  );
}

const PLAYER_STATUS_STYLES: Record<Exclude<PlayerStatus, null>, string> = {
  Lesionado: 'bg-destructive/10 text-destructive',
  Sancionado: 'bg-panel-hover text-muted-foreground',
  Duda: 'bg-status-warning/15 text-status-warning',
  'Última hora': 'bg-primary/15 text-primary',
};

export function PlayerStatusTag({ status }: { status: PlayerStatus }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        PLAYER_STATUS_STYLES[status]
      )}
    >
      {status}
    </span>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TWEENS.base}
            onClick={onCancel}
            className="glass-scrim fixed inset-0 z-[70]"
          />
          <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={SPRINGS.smooth}
              className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card p-lg shadow-overlay"
            >
              <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={onCancel}
                  className="flex h-9 items-center rounded-xl px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-panel-hover/40 hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className={cn(
                    'flex h-9 items-center rounded-xl px-4 text-xs font-semibold transition-colors',
                    destructive
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
