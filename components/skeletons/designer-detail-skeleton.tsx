import { Card, CardContent } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

/** Tarjeta de diseño compacta (espeja renderDesignItem de /equipo/[id]). */
function DesignCardSkeleton() {
  return (
    <Card elevation="raised" density="compact">
      <CardContent className="pt-md">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton de /equipo/[id] — detalle de UN diseñador (maxWidth 4xl):
 * cabecera con avatar + nombre + WeekNav, resumen de 3 cifras y secciones
 * de tarjetas compactas. Antes reutilizaba TeamSkeleton, que no encajaba.
 */
export function DesignerDetailSkeleton() {
  return (
    <PageContainer maxWidth="4xl">
      {/* Header: avatar + nombre + subtítulo · volver + WeekNav */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <Skeleton className="h-8 w-44" />
          </div>
          <Skeleton className="mt-2 h-5 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-raised">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="space-y-xl">
        {/* Resumen: Asignados · Pendientes · Entregados */}
        <div className="flex flex-wrap gap-xl">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-12" />
            </div>
          ))}
        </div>

        {/* Sección Pendientes */}
        <section className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <DesignCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Sección Entregados */}
        <section className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <DesignCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
