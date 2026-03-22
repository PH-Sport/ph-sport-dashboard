'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PhSportMark } from '@/components/layout/ph-sport-mark';

const CLICK_EFFECT_DURATION_MS = 150;
/** Mismo ritmo que `transition-all duration-300` del `<aside>` en `sidebar.tsx`. */
const SIDEBAR_WIDTH_TRANSITION_MS = 300;

interface SidebarLogoProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarLogo({ collapsed, onToggle }: SidebarLogoProps) {
  const [isClicking, setIsClicking] = useState(false);
  /** Evita aplicar centrado hasta que el carril haya terminado de estrecharse. */
  const [collapseLayoutSettled, setCollapseLayoutSettled] = useState(false);

  useEffect(() => {
    if (!collapsed) {
      setCollapseLayoutSettled(false);
      return;
    }
    const id = window.setTimeout(() => {
      setCollapseLayoutSettled(true);
    }, SIDEBAR_WIDTH_TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [collapsed]);

  const handleMouseDown = () => {
    setIsClicking(true);
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      setIsClicking(false);
      onToggle();
    }, CLICK_EFFECT_DURATION_MS);
  };

  const narrowLogo = collapsed && collapseLayoutSettled;

  return (
    <div className="flex h-16 items-center px-4 transition-all duration-300 ease-in-out">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsClicking(false)}
        className={cn(
          'relative flex h-10 w-full min-w-0 cursor-pointer items-center justify-start overflow-hidden',
          narrowLogo &&
            'pl-[calc((100%-2.25rem)/2)] transition-[padding-left] duration-500 ease-out motion-reduce:transition-none',
          collapsed && !collapseLayoutSettled && 'pl-0'
        )}
        aria-label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
      >
        <PhSportMark
          className={cn(
            'inline-block shrink-0 text-primary will-change-transform',
            /* El resize “suave”: solo `scale` (GPU); tamaño layout fijo h-10 + w-auto */
            'h-10 w-auto max-w-[min(100%,11rem)] transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none motion-reduce:duration-0',
            narrowLogo ? 'origin-center' : 'origin-left',
            narrowLogo
              ? isClicking
                ? 'scale-[0.81] opacity-90'
                : 'scale-90 opacity-100'
              : isClicking
                ? 'scale-[0.98] opacity-90'
                : 'scale-100 opacity-100'
          )}
          decorative
        />
      </button>
    </div>
  );
}
