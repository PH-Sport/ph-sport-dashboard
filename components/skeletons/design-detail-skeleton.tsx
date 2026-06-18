import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton del modal de detalle de diseño — espeja el Dialog centrado real:
 * cabecera (eyebrow + título + contexto) sobre línea, y cuerpo con las filas
 * Estado / Diseñador / Entrega más la acción principal y los botones.
 * Vive dentro de un DialogContent max-w-md, así que no lleva contenedor propio.
 */
export function DesignDetailSkeleton() {
  return (
    <>
      {/* Cabecera */}
      <div className="border-b border-border/60 p-lg">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-1.5 h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      {/* Cuerpo */}
      <div className="space-y-5 p-lg">
        {/* Estado */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Diseñador */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Entrega */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>

        {/* Acción principal */}
        <Skeleton className="h-11 w-full rounded-xl" />

        {/* Editar / Drive */}
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </>
  );
}
