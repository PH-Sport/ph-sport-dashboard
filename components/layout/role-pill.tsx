'use client';

import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { useViewAs } from '@/lib/auth/view-as-context';
import { ROLE_LABEL, ROLE_ACCENT } from '@/lib/utils/role';

/**
 * Píldora de rol siempre visible:
 * - Usuario normal: su rol con su color (Mánager dorado / Diseñador azul).
 * - Dev simulando: indicador azul "Viendo como Diseñador · X" que revierte al clic.
 */
export function RolePill() {
  const { status, profile } = useAuth(); // rol EFECTIVO
  const { simulating, simulatedDesignerName, exitToManager } = useViewAs();

  if (status !== 'AUTHENTICATED' || !profile) return null;

  if (simulating) {
    return (
      <button
        type="button"
        onClick={exitToManager}
        title="Volver a Mánager"
        aria-label={`Viendo como Diseñador ${simulatedDesignerName} — volver a Mánager`}
        className="flex items-center gap-1.5 rounded-full bg-role-designer/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-role-designer transition-colors hover:bg-role-designer/25"
      >
        <Eye className="h-3 w-3" />
        <span className="hidden sm:inline">Viendo como </span>
        Diseñador · {simulatedDesignerName}
      </button>
    );
  }

  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
        ROLE_ACCENT[profile.role]
      )}
    >
      {ROLE_LABEL[profile.role]}
    </span>
  );
}
