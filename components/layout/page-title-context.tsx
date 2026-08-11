'use client';

import { createContext, useCallback, useContext, useState } from 'react';

const CollapsedContext = createContext(false);
const ReporterContext = createContext<(collapsed: boolean) => void>(() => {});

/**
 * Estado compartido del large title: ¿el <h1> de la página ha pasado por debajo
 * de la barra? PageHeader lo publica (observando su propio título) y Header lo
 * consume para revelar su rótulo y su línea inferior.
 *
 * Solo tiene efecto en móvil: en escritorio el Header ignora el valor con sus
 * contrapartes `md:` y muestra rótulo y línea siempre, como antes de la fase 1.5.
 */
export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  // Identidad estable: si el reporter cambiara en cada render, el efecto que
  // monta el IntersectionObserver se re-ejecutaria en bucle.
  const report = useCallback((next: boolean) => setCollapsed(next), []);

  return (
    <ReporterContext.Provider value={report}>
      <CollapsedContext.Provider value={collapsed}>{children}</CollapsedContext.Provider>
    </ReporterContext.Provider>
  );
}

/** Lo lee el Header. */
export function usePageTitleCollapsed(): boolean {
  return useContext(CollapsedContext);
}

/** Lo escribe el PageHeader. */
export function usePageTitleReporter(): (collapsed: boolean) => void {
  return useContext(ReporterContext);
}
