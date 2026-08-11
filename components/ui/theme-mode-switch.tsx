'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { THEME_MODES } from '@/lib/theme/theme-modes';

/**
 * Conmutador de tema compacto: tres destinos a la vista (Claro, Oscuro,
 * Dispositivo) en vez de un botón que cicla a ciegas. Vive dentro del menú de
 * perfil, no en la barra: cambiar de tema es un ajuste, no una acción diaria.
 */
export function ThemeModeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  // El tema no se conoce en SSR: hasta montar, ninguno se marca activo.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className={cn('px-2 py-1.5', className)}>
      <p className="mb-1.5 text-xs text-muted-foreground">Tema</p>
      <div
        role="radiogroup"
        aria-label="Tema de la aplicación"
        className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
      >
        {THEME_MODES.map(({ value, label, icon: Icon }) => {
          const active = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={label}
              // El menú no se cierra al cambiar de tema: se ve el efecto en el sitio.
              onClick={(e) => {
                e.preventDefault();
                setTheme(value);
              }}
              className={cn(
                'flex min-h-9 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-background text-foreground shadow-raised'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
