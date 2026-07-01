'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

export interface FormerDesigner {
  id: string; // former_designer_id
  name: string; // former_designer_name (display_name congelado)
}

async function fetchFormerDesigners(): Promise<FormerDesigner[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('designs')
    .select('former_designer_id, former_designer_name')
    .not('former_designer_id', 'is', null);

  if (error) throw error;

  const seen = new Map<string, string>();
  for (const row of data ?? []) {
    const id = row.former_designer_id as string | null;
    if (id && !seen.has(id)) {
      seen.set(id, (row.former_designer_name as string | null) ?? 'Exmiembro');
    }
  }
  return Array.from(seen, ([id, name]) => ({ id, name }));
}

/**
 * Exmiembros (diseñadores eliminados) que aún tienen diseños. Alimenta la
 * sección "Exmiembros" del filtro. Vacío ⇒ la sección no se pinta. Key SWR
 * propia; el filtro `.not(former_designer_id is null)` la hace barata (0 filas
 * hasta el primer borrado).
 */
export function useFormerDesigners() {
  const { data, error, isLoading } = useSWR<FormerDesigner[]>(
    'former-designers',
    fetchFormerDesigners
  );
  return {
    formerDesigners: data ?? [],
    loading: isLoading,
    error: error ? 'Error al cargar exmiembros' : null,
  };
}
