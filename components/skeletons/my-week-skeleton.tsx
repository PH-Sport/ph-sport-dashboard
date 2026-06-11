import { Card, CardContent } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton de /mi-semana — espeja el layout real: título de sección +
 * filas compactas de dos zonas (identidad | meta). Sin paginación inventada.
 */
export function MyWeekSkeleton() {
  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="mb-2 h-9 w-44" />
          <Skeleton className="h-5 w-64" />
        </div>
      </div>

      {/* Sección Pendientes */}
      <div>
        <Skeleton className="mb-3 h-6 w-36" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} density="compact">
              <CardContent className="pt-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="mb-2 h-4 w-56" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-[140px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Sección Entregados (cabecera plegada) */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-16" />
      </div>
    </PageContainer>
  );
}
