import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/auth/auth-context';

export interface ServerAuth {
  user: User | null;
  profile: Profile | null;
}

/**
 * Resuelve sesión + perfil EN EL SERVIDOR — Fase 2 del "caching inteligente".
 *
 * Se llama desde el root layout para que el AuthProvider arranque ya
 * AUTHENTICATED con datos verificados por el servidor. Así:
 *   - No hay spinner de auth en cliente (el HTML llega ya autenticado).
 *   - Se elimina el getUser() + profile bloqueante que se hacía en cliente
 *     en cada arranque en frío.
 *
 * Fallo seguro: ante cualquier error → { null, null }; el AuthProvider cae al
 * flujo de inicialización en cliente (comportamiento previo a Fase 2).
 */
export async function getServerAuth(): Promise<ServerAuth> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return { user: null, profile: null };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) return { user, profile: null };

    return { user, profile: profile as Profile };
  } catch {
    return { user: null, profile: null };
  }
}
