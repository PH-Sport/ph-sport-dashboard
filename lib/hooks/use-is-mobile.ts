'use client';

import { useEffect, useState } from 'react';

const QUERY = '(max-width: 767px)';

/**
 * true por debajo de md (768px) — el MISMO corte que usa el shell (sidebar,
 * tab bar, calendario). Única fuente de verdad del breakpoint móvil en JS.
 */
export function useIsMobile(): boolean {
  // Inicializa con el valor real si hay window (componentes solo-cliente);
  // en SSR cae a false y el efecto lo corrige tras hidratar.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isMobile;
}
