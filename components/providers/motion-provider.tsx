'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Config global de framer-motion.
 *
 * `reducedMotion="user"` respeta `prefers-reduced-motion` del sistema:
 * desactiva animaciones de transform/layout (los muelles pasan a instantáneo)
 * y conserva las de opacidad — quedan solo fades, según el sistema de
 * movimiento de Fase 7 (`components/ui/animations.ts`).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
