'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Toaster de la app.
 *
 * Sonner no pinta nada si este componente no está montado en ningún sitio: las
 * llamadas a `toast()` se ejecutan sin error y sin dibujar. Estuvo sin montar
 * desde el principio del proyecto, así que ningún aviso —ni de error ni de
 * éxito— llegó nunca a verse. El síntoma no era «no sale el toast», sino
 * botones que parecían no hacer nada al fallar.
 *
 * Se monta en el layout raíz para que cubra también las pantallas de auth, que
 * viven fuera del shell del dashboard.
 */
export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      // Arriba y centrado: en móvil la tab bar flota sobre el borde inferior y
      // un toast abajo cae justo encima.
      position="top-center"
      theme={(resolvedTheme as ToasterProps['theme']) ?? 'system'}
      // Los errores hay que poder leerlos con calma; el resto se va solo.
      duration={5000}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group flex items-center gap-3 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          error: 'border-status-error/30 text-status-error',
          success: 'border-status-success/30 text-status-success',
          warning: 'border-status-warning/30 text-status-warning',
          info: 'border-status-info/30 text-status-info',
        },
      }}
      {...props}
    />
  );
}
