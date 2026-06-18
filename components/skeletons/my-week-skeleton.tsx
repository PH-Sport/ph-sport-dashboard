import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton de /mi-semana — espeja el layout real: una placa «Pendientes» con
 * filas internas (punto + identidad + fecha + acción) y la placa «Entregadas»
 * con sus grupos por semana plegados. No son tarjetas sueltas.
 */
export function MyWeekSkeleton() {
  return (
    <PageContainer>
      {/* Header: título + subtítulo (sin acciones) */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="mb-2 h-9 w-44" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Placa Pendientes */}
        <div className="rounded-2xl border border-border bg-card p-lg shadow-raised">
          <div className="mb-2 flex items-center gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-7 rounded-full" />
          </div>
          <ul className="-mx-2 space-y-1">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-20 shrink-0" />
                <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
              </li>
            ))}
          </ul>
        </div>

        {/* Placa Entregadas — grupos por semana plegados */}
        <div className="rounded-2xl border border-border bg-card p-lg shadow-raised">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-7 rounded-full" />
          </div>
          <div className="mt-2 space-y-1">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="-mx-2 flex items-center gap-2 rounded-xl px-2 py-2">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-3 w-32 flex-1" />
                <Skeleton className="h-3 w-6 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
