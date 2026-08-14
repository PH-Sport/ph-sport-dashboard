'use client';

import { cn } from '@/lib/utils';

interface PulseDotProps {
  /** Lo que el punto significa. Invisible, pero lo leen los lectores de pantalla:
   *  el punto por sí solo no le dice nada a quien no puede verlo. */
  label: string;
  className?: string;
}

/**
 * Punto de acento con haz — el mismo gesto que la campana usa para «tienes algo
 * sin leer», que aquí dice «hay trabajo más allá de esta semana».
 *
 * Es señal, no mensaje: avisa de que hay algo detrás, no de cuánto. Se usa donde
 * la frase entera no cabe (móvil) y partirla ensuciaba el rótulo.
 *
 * El haz es `animate-ping`, CSS de Tailwind y no framer-motion, así que el
 * `MotionConfig reducedMotion="user"` de la app no lo alcanza: lleva su propio
 * `motion-reduce` para que quien pide menos movimiento vea el punto quieto en
 * lugar de latiendo.
 */
export function PulseDot({ label, className }: PulseDotProps) {
  return (
    <span className={cn('relative inline-flex h-2 w-2 shrink-0 align-middle', className)}>
      <span
        aria-hidden
        className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:hidden"
      />
      <span aria-hidden className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
