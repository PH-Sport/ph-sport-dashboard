'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type UrgencyLevel = 'overdue' | 'h24' | 'h48' | null;

/**
 * Nivel de urgencia derivado del deadline ISO y el estado.
 * Un diseño entregado nunca es urgente.
 */
export function getUrgency(deadlineAt: string, delivered: boolean): UrgencyLevel {
  if (delivered) return null;
  const hoursLeft = (new Date(deadlineAt).getTime() - Date.now()) / 3_600_000;
  if (hoursLeft < 0) return 'overdue';
  if (hoursLeft < 24) return 'h24';
  if (hoursLeft < 48) return 'h48';
  return null;
}

const META: Record<Exclude<UrgencyLevel, null>, { color: string; label: string; pulse: boolean }> = {
  h48: { color: 'bg-status-warning', label: 'Vence en menos de 48 h', pulse: true },
  h24: { color: 'bg-destructive', label: 'Vence en menos de 24 h', pulse: true },
  overdue: { color: 'bg-destructive', label: 'Atrasado', pulse: false },
};

/**
 * Punto de color con pulso sutil según el tiempo restante — sustituye iconos de
 * fuego/peligro por un acento contenido y premium. Ámbar <48 h, rojo <24 h,
 * rojo fijo si está vencido. Respeta prefers-reduced-motion vía MotionConfig.
 */
export function UrgencyDot({ level, className }: { level: UrgencyLevel; className?: string }) {
  if (!level) return null;
  const meta = META[level];
  const base = cn('inline-block h-2 w-2 shrink-0 rounded-full', meta.color, className);
  return meta.pulse ? (
    <motion.span
      aria-hidden
      title={meta.label}
      animate={{ opacity: [0.35, 1, 0.35] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      className={base}
    />
  ) : (
    <span aria-hidden title={meta.label} className={base} />
  );
}
