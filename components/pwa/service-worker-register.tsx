'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

/**
 * Registra el service worker (/sw.js) una vez que la página ha cargado. No pinta
 * nada. Un fallo aquí degrada a web normal (sin instalación/offline) pero nunca
 * rompe la app. En dev no registramos: evita cachés molestas con HMR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        logger.warn('Service worker registration failed:', error);
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
