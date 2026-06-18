'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

// useLayoutEffect en cliente (flip antes del primer paint → sin parpadeo),
// useEffect en servidor (no-op, evita el warning de SSR).
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Devuelve `false` durante el render de servidor y el primer render de cliente
 * (la hidratación), y `true` tras montar.
 *
 * Sirve para diferir contenido que depende de estado SOLO-cliente —p. ej. la
 * caché SWR persistida en localStorage (Fase 1)— y así evitar mismatches de
 * hidratación cuando el servidor renderiza el shell autenticado (Fase 2). El
 * flip ocurre en un layout effect, antes del primer paint, por lo que no hay
 * parpadeo perceptible.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useIsomorphicLayoutEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
