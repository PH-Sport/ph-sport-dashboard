'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Share, X } from 'lucide-react';
import { SPRINGS } from '@/components/ui/animations';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** El evento no está en la lib estándar de TS; tipamos lo que usamos. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'phsport-install-dismissed';

/** ¿La app ya corre instalada (standalone)? Entonces no ofrecemos instalar. */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari expone navigator.standalone (no estándar).
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  const ua = window.navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ se hace pasar por Mac: lo detectamos por el táctil.
  const iPadOS = ua.includes('Macintosh') && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

/**
 * Ayuda a instalar la PWA, adaptada a la asimetría Chrome/Safari:
 *   - Chrome/Android/escritorio: capta `beforeinstallprompt` y ofrece un botón
 *     «Instalar» que dispara el prompt nativo.
 *   - iOS Safari: no existe ese evento → mostramos el gesto manual
 *     (Compartir → Añadir a inicio).
 * Descartable (se recuerda en localStorage). Nada si ya está instalada.
 */
export function InstallPrompt() {
  const [mode, setMode] = useState<'chrome' | 'ios' | null>(null);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* almacenamiento no disponible: da igual, solo no recordamos el descarte */
    }
    setMode(null);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* sin acceso a localStorage: seguimos, simplemente no habrá memoria de descarte */
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // evita el mini-infobar de Chrome; lo lanzamos nosotros
      deferred.current = e as BeforeInstallPromptEvent;
      setMode('chrome');
    };

    const onInstalled = () => dismiss();

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS nunca dispara beforeinstallprompt: decidimos por plataforma.
    if (isIOS()) setMode('ios');

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [dismiss]);

  const handleInstall = useCallback(async () => {
    const evt = deferred.current;
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    deferred.current = null;
    dismiss(); // instale o no, no volvemos a insistir
  }, [dismiss]);

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          role="dialog"
          aria-label="Instalar PHSPORT"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={SPRINGS.smooth}
          className={cn(
            'fixed z-50 rounded-2xl border border-border bg-card text-card-foreground shadow-overlay',
            'inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5rem)]',
            'md:inset-x-auto md:right-6 md:bottom-6 md:w-[22rem]'
          )}
        >
          <div className="flex items-start gap-3 p-4">
            <span
              aria-hidden
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
            >
              <Download className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Instala PHSPORT</p>
              {mode === 'chrome' ? (
                <>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Accede como una app: más rápido y desde tu pantalla de inicio.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={handleInstall}>
                      Instalar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={dismiss}>
                      Ahora no
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Toca{' '}
                  <Share className="inline h-3.5 w-3.5 -translate-y-px" aria-label="Compartir" /> y
                  luego <span className="font-medium text-foreground">«Añadir a inicio»</span>.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Cerrar"
              className="-m-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
