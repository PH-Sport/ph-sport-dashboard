import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { Surface } from '@/components/ui/surface';

interface DashboardSkeletonProps {
  /** 'admin' → 4 KPIs + carga del equipo; 'designer' → 3 KPIs + compañeros. */
  variant?: 'admin' | 'designer';
}

/**
 * Skeleton de /inicio — espeja el dashboard real según rol: tira de KPIs
 * (un bloque tonal en móvil, tarjetas sueltas en escritorio) + dos columnas
 * [2fr,1fr] (lista de vencimientos/cola + panel lateral de carga/compañeros).
 */
export function DashboardSkeleton({ variant = 'designer' }: DashboardSkeletonProps) {
  const isAdmin = variant === 'admin';
  return (
    <PageContainer>
      {/* Header: saludo + subtítulo · acción (solo admin) */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="mb-2 h-9 w-56" />
          <Skeleton className="h-5 w-40" />
        </div>
        {isAdmin && <Skeleton className="h-10 w-36" />}
      </div>

      {/* KPIs */}
      {/* Espejo exacto del layout real: un bloque tonal en móvil (divide-x/y),
          rejilla de tarjetas sueltas a partir de md — así el skeleton no da
          salto al cargar. */}
      {isAdmin ? (
        <section className="grid grid-cols-2 rounded-surface bg-card divide-x divide-y divide-border md:gap-4 md:rounded-none md:bg-transparent md:divide-x-0 md:divide-y-0 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-sm sm:p-lg md:rounded-2xl md:border md:border-border md:bg-card md:shadow-raised"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-9 w-14" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))}
        </section>
      ) : (
        <section className="flex rounded-surface bg-card divide-x divide-border md:grid md:grid-cols-3 md:gap-4 md:rounded-none md:bg-transparent md:divide-x-0">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex-1 p-sm sm:p-lg md:rounded-2xl md:border md:border-border md:bg-card md:shadow-raised"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-2 h-9 w-14" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
          ))}
        </section>
      )}

      {/* Dos columnas: lista principal (2fr) + panel lateral (1fr) */}
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        {/* Izquierda: vencimientos / tu cola — siempre 'plain' en ambos roles */}
        <Surface as="section" variant="plain">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <ul className="-mx-2">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl px-2 py-2">
                {isAdmin ? (
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                ) : (
                  <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-3 w-20 shrink-0" />
              </li>
            ))}
          </ul>
        </Surface>

        {/* Derecha: carga del equipo (admin, 'plain') / compañeros (designer, 'grouped') */}
        <Surface as="section" variant={isAdmin ? 'plain' : 'grouped'}>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-32" />
          </div>
          {isAdmin ? (
            <ul className="mt-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <li key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-3 w-6" />
                  </div>
                  <Skeleton className="h-1 w-full rounded-full" />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mt-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </PageContainer>
  );
}
