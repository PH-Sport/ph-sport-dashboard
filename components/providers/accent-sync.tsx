'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { applyAccent } from '@/lib/theme/use-accent-color';
import { DEFAULT_ACCENT, isAccentKey } from '@/lib/theme/accent-colors';

/**
 * Reconcilia el acento del dispositivo con la fuente de verdad de la cuenta
 * (Supabase) al iniciar sesión o cuando cambia en otro dispositivo/pestaña.
 *
 * El PRIMER pintado ya lo resuelve el script de <head> con la cache de
 * localStorage; esto solo corrige si la cuenta trae un valor distinto (p. ej.
 * primer login en un dispositivo nuevo). No renderiza nada.
 */
export function AccentSync() {
  const { profile } = useAuth();
  const accentColor = profile?.accent_color;

  useEffect(() => {
    if (!profile) return;
    applyAccent(isAccentKey(accentColor) ? accentColor : DEFAULT_ACCENT);
  }, [profile, accentColor]);

  return null;
}
