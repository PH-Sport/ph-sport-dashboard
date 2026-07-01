import type { Design } from '@/lib/types/design';

export interface DesignerLike {
  id: string;
  name: string;
  displayName: string;
  avatar_url?: string | null;
}

export type ResolvedDesigner =
  | { kind: 'active'; name: string; displayName: string; avatarUrl?: string | null }
  | { kind: 'former'; name: string }
  | { kind: 'none' };

/**
 * Resuelve quién diseñó una pieza para la UI:
 * - 'active': el diseñador sigue en el equipo (designer_id resuelve en la lista).
 * - 'former': su cuenta se eliminó; nombre congelado (former_designer_name).
 * - 'none': sin asignar (o designer_id aún no cargado en la lista).
 * El activo tiene prioridad: former_* solo cuenta cuando designer_id es null.
 */
export function resolveDesigner(
  design: Pick<Design, 'designer_id' | 'former_designer_name'>,
  designers: DesignerLike[]
): ResolvedDesigner {
  if (design.designer_id) {
    const d = designers.find((x) => x.id === design.designer_id);
    return d
      ? { kind: 'active', name: d.name, displayName: d.displayName, avatarUrl: d.avatar_url }
      : { kind: 'none' };
  }
  const former = design.former_designer_name?.trim();
  return former ? { kind: 'former', name: former } : { kind: 'none' };
}
