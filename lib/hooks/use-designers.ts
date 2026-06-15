'use client';

import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

export interface Designer {
  id: string;
  name: string;
  avatar_url?: string;
}

async function fetchDesigners(): Promise<Designer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'DESIGNER');

  if (error) throw error;

  return (data || []).map((p) => ({
    id: p.id,
    name: p.full_name || 'Sin nombre',
  }));
}

/**
 * Lista de diseñadores. Key SWR compartida ('designers') → una sola query por
 * sesión aunque el hook se monte varias veces en la misma página (toolbar,
 * detail sheet, diálogo de crear). Antes era useEffect+fetch sin caché → N queries.
 */
export function useDesigners() {
  const { data, error, isLoading } = useSWR<Designer[]>('designers', fetchDesigners);

  return {
    designers: data ?? [],
    loading: isLoading,
    error: error ? 'Error al cargar diseñadores' : null,
  };
}
