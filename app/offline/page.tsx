import type { Metadata } from 'next';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Sin conexión · PHSPORT',
};

/**
 * Pantalla que el service worker sirve cuando una navegación falla por falta de
 * red. Deliberadamente estática y sin JS de cliente: el logo va inline (cero
 * peticiones) y «Reintentar» es un enlace que vuelve a navegar — funciona aunque
 * la página no haya llegado a hidratar. Al recuperar la red, carga la app; si
 * sigue sin red, el SW vuelve a servir esta misma pantalla.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <svg
        viewBox="0 0 259.8 206.1"
        role="img"
        aria-label="PHSPORT"
        className="h-16 w-auto text-primary"
      >
        <polyline
          fill="currentColor"
          points="0 206.1 58.2 206.1 57.9 145.5 158.1 45.4 112.7 0 0 0 0 52.6 76.9 52.6 0 128.7"
        />
        <polyline
          fill="currentColor"
          points="122.6 206.1 200.1 206.1 152.2 157.8 173 137.1 182.4 146.4 259.8 146.4 169.6 55.6 130.5 94.2 131.8 95.6 141.1 105.4 120.3 125.8 109.8 115.4 70.8 153.9"
        />
      </svg>

      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold text-foreground">Sin conexión</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          No hemos podido conectar. Revisa tu red e inténtalo de nuevo.
        </p>
      </div>

      {/* Anchor real (no <Link>) a propósito: «Reintentar» debe forzar una
          navegación de documento completa para que el service worker pueda
          re-servir /offline si seguimos sin red. Un <Link> haría un fetch RSC
          que fallaría offline y daría peor experiencia. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className={buttonVariants({ variant: 'default' })}>
        Reintentar
      </a>
    </main>
  );
}
