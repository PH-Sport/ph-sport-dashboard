'use client';

import { Eye } from 'lucide-react';
import { Hint } from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth/auth-context';
import { useViewAs } from '@/lib/auth/view-as-context';

/**
 * Aviso de «Ver como» en la barra superior — azul, con la salida de un clic.
 *
 * Antes esta píldora mostraba también el rol de cualquier usuario, de forma
 * permanente. Se retiró: tu propio rol no cambia y no hace falta tenerlo delante
 * todo el rato; vive en el menú de perfil, junto al nombre y el correo, que es
 * donde se va a mirar cuando se quiere consultar.
 *
 * Lo que sí se queda es esto: estar viendo la app como otra persona es un estado
 * anómalo y temporal, fácil de olvidar, y su aviso tiene que estar a la vista
 * mientras dure.
 */
export function ViewAsPill() {
  const { status, profile } = useAuth();
  const { simulating, simulatedDesignerName, exitToManager } = useViewAs();

  if (status !== 'AUTHENTICATED' || !profile || !simulating) return null;

  return (
    <Hint label="Volver a Mánager" side="bottom">
      <button
        type="button"
        onClick={exitToManager}
        aria-label={`Viendo como Diseñador ${simulatedDesignerName} — volver a Mánager`}
        className="flex items-center gap-1.5 rounded-full bg-role-designer/15 px-2.5 py-1 text-[11px] md:text-[10px] font-semibold uppercase tracking-wider text-role-designer transition-colors hover:bg-role-designer/25"
      >
        <Eye className="h-3 w-3" />
        <span className="hidden sm:inline">Viendo como </span>
        Diseñador · {simulatedDesignerName}
      </button>
    </Hint>
  );
}
