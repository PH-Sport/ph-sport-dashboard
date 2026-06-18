'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import {
  ACCENT_COLORS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  isAccentKey,
  type AccentKey,
} from './accent-colors';

// Reexport por comodidad: los consumidores del hook ya importan de aquí.
export { ACCENT_STORAGE_KEY };

/**
 * Aplica el acento al INSTANTE, sin red: atributo en <html> (recolorea toda la
 * UI vía CSS vars) + cache en localStorage (lo lee el script de <head>). Es la
 * única vía para tocar el DOM; el resto del módulo solo orquesta.
 */
export function applyAccent(key: AccentKey): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-accent', key);
  }
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, key);
  } catch {
    /* almacenamiento no disponible (modo privado, etc.) — el atributo basta para esta sesión */
  }
}

interface UseAccentColorResult {
  accent: AccentKey;
  setAccent: (key: AccentKey) => void;
  options: typeof ACCENT_COLORS;
}

/**
 * Selector de acento, al estilo `useTheme`: instantáneo en el dispositivo y
 * persistido en la cuenta (Supabase) para que siga al usuario entre dispositivos.
 */
export function useAccentColor(): UseAccentColorResult {
  const { user } = useAuth();
  const supabase = createClient();
  const [accent, setAccentState] = useState<AccentKey>(DEFAULT_ACCENT);

  // Inicializa desde el atributo que el script de <head> ya fijó (evita parpadeo
  // y desajustes de hidratación: el estado nace del DOM real, no de un default).
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-accent');
    if (isAccentKey(current)) setAccentState(current);
  }, []);

  const setAccent = useCallback(
    (key: AccentKey) => {
      setAccentState(key);
      applyAccent(key); // recoloreado inmediato

      if (!user) return;
      // Persistencia por cuenta — no bloquea la UI; el cambio ya se ve.
      void supabase
        .from('profiles')
        .update({ accent_color: key })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            logger.error('[Accent] No se pudo guardar el color de acento:', error);
            toast.error('No se pudo guardar el color en tu cuenta. Se aplicó solo en este dispositivo.');
          }
        });
    },
    [supabase, user]
  );

  return { accent, setAccent, options: ACCENT_COLORS };
}
