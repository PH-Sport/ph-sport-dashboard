'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SPRINGS } from '@/components/ui/animations';
import { cn } from '@/lib/utils';

interface CollapseProps {
  /** true → el contenido se despliega; false → se pliega. */
  open: boolean;
  children: React.ReactNode;
  /** Clases extra para el contenedor animado (se añaden a overflow-hidden). */
  className?: string;
}

/**
 * "Extensión suave" — token de movimiento único de la app para plegar/desplegar.
 *
 * Anima `height: 0 ↔ auto` + `opacity` con el muelle `SPRINGS.smooth` (damping
 * alto → aterriza limpio, CERO rebote). Es la ÚNICA fuente de verdad de este
 * efecto: cámbialo aquí y se propaga a toda la app. Úsalo para cualquier
 * show/hide de contenido secundario (zonas avanzadas, detalles, listas
 * plegables) y así mantener el mismo movimiento en todos lados.
 *
 * El contenido se DESMONTA al plegar (no solo se oculta). Para el chevron que
 * lo acompaña, rótalo aparte con `SPRINGS.snappy`.
 */
export function Collapse({ open, children, className }: CollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={SPRINGS.smooth}
          className={cn('overflow-hidden', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
