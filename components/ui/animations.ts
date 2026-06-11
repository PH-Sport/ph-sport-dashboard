'use client';

import type { Transition } from 'framer-motion';

// ============================================
// Sistema de movimiento PHSPORT — Fase 7
// Física de muelle "fluida con autoridad": damping alto,
// el elemento aterriza limpio en su sitio, CERO rebote.
// Tweens (easeOutExpo) solo para opacidad/color, nunca posición.
// ============================================

/** easeOutExpo — arranque decidido, frenada suave. Para tweens de opacidad/color. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const SPRINGS = {
  /** Feedback de UI: botones, toggles, flip de estado (~150ms percibidos) */
  snappy: { type: 'spring', stiffness: 420, damping: 32 } as Transition,

  /** Paneles, sheets, colapsar sidebar, cambios de layout */
  smooth: { type: 'spring', stiffness: 300, damping: 34 } as Transition,

  /** Entradas de página/contenido, reveals grandes */
  gentle: { type: 'spring', stiffness: 220, damping: 30 } as Transition,
} as const;

export const TWEENS = {
  /** Micro-fades: tooltips, hovers, swaps pequeños */
  fast: { duration: 0.12, ease: EASE_OUT_EXPO } as Transition,

  /** Fades estándar: skeleton↔contenido, overlays */
  base: { duration: 0.2, ease: EASE_OUT_EXPO } as Transition,
} as const;

/** Retardo entre hijos en entradas orquestadas (stagger) */
export const STAGGER = 0.04;

// ============================================
// Transitions legacy (API estable — internals re-apuntados al sistema nuevo)
// ============================================

export const TRANSITIONS = {
  /** Para contenido que carga/descarga rápidamente */
  fade: TWEENS.fast,

  /** Para diálogos, modales y overlays */
  modal: TWEENS.base,

  /** Para cambios de layout y redimensionado */
  layout: SPRINGS.smooth,

  /** Para redimensionado de contenedores */
  layoutSpring: SPRINGS.smooth,
} as const;

// ============================================
// Animations (movimientos: initial → animate → exit)
// ============================================

export const animations = {
  /** Solo opacidad */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  /** Opacidad + movimiento vertical sutil (contenido que aparece) */
  fadeSlide: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
  },
  
  /** Opacidad + escala (modales/dialogs) */
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
  },
  
  /** Movimiento horizontal (tabs/cambio de opciones) */
  slideHorizontal: {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 },
  },
} as const;
