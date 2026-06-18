import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

/** Anchos variados para que las filas parezcan títulos reales, no barras iguales. */
const ROW_WIDTHS = ['w-40', 'w-28', 'w-44'];

/**
 * Skeleton de /equipo — espeja el grid de placas de diseñador (2 columnas):
 * cabecera con avatar + nombre + carga, y una lista de diseños debajo.
 * No es un grid de 4 columnas con stats; eso era de una versión anterior.
 */
export function TeamSkeleton() {
  return (
    <PageContainer>
      {/* Header: título + subtítulo + WeekNav */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="mb-2 h-9 w-40" />
          <Skeleton className="h-5 w-56" />
        </div>
        {/* Placa WeekNav (chevron · etiqueta · chevron) */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-raised">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
      </div>

      {/* Grid de placas de diseñador */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-lg shadow-raised"
          >
            <div className="mb-3 flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <ul className="-mx-2 space-y-1">
              {ROW_WIDTHS.map((w, j) => (
                <li key={j} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <Skeleton className="h-1.5 w-1.5 shrink-0 rounded-full" />
                  <Skeleton className={`h-4 ${w}`} />
                  <div className="flex-1" />
                  <Skeleton className="h-3 w-16 shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
