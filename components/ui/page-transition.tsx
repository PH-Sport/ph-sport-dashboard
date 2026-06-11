'use client';

import { AnimatePresence, motion, Transition } from 'framer-motion';
import { ReactNode } from 'react';
import { animations, SPRINGS, TRANSITIONS, TWEENS } from './animations';

// ============================================
// PageTransition Component
// ============================================

type TransitionSpeed = 'fast' | 'normal' | 'slow';

interface PageTransitionProps {
  children: ReactNode;
  loading: boolean;
  skeleton: ReactNode;
  /** Animation variant: 'fade' (opacity only) or 'fadeSlide' (opacity + vertical movement) */
  variant?: 'fade' | 'fadeSlide';
  /** Transition speed preset */
  speed?: TransitionSpeed;
  /** Custom transition (overrides speed preset) */
  transition?: Transition;
}

/**
 * Wrapper component that handles smooth transitions between loading skeleton and content.
 * Uses Framer Motion's AnimatePresence for crossfade effect.
 * 
 * @example
 * <PageTransition loading={loading} skeleton={<Skeleton />}>
 *   <Content />
 * </PageTransition>
 * 
 * @example With custom options
 * <PageTransition 
 *   loading={loading} 
 *   skeleton={<Skeleton />}
 *   variant="fadeSlide"
 *   speed="slow"
 * >
 *   <Content />
 * </PageTransition>
 */
export function PageTransition({
  children,
  loading,
  skeleton,
  variant = 'fade',
  speed = 'normal',
  transition,
}: PageTransitionProps) {
  const selectedAnimation = animations[variant];
  
  // Map speed to centralized transitions
  const speedToTransition: Record<TransitionSpeed, Transition> = {
    fast: TRANSITIONS.fade,
    normal: TRANSITIONS.modal,
    slow: TRANSITIONS.layout,
  };
  
  // fadeSlide "se asienta": posición con muelle gentle, opacidad con tween
  const resolvedTransition =
    transition ??
    (variant === 'fadeSlide'
      ? ({ opacity: TWEENS.base, y: SPRINGS.gentle } as Transition)
      : speedToTransition[speed]);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="skeleton"
          initial={selectedAnimation.initial}
          animate={selectedAnimation.animate}
          exit={selectedAnimation.exit}
          transition={resolvedTransition}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={selectedAnimation.initial}
          animate={selectedAnimation.animate}
          exit={selectedAnimation.exit}
          transition={resolvedTransition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Re-export from animations.ts for convenience
export { animations, TRANSITIONS };
