import { Card, CardContent } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton de /inicio — espeja el layout real (tira de KPIs + lista de
 * vencimientos + bloque de equipo). Sin icon-boxes ni pills que no existen.
 */
export function DashboardSkeleton() {
  return (
    <PageContainer>
      {/* Header: saludo + subtítulo + acción */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="mb-2 h-9 w-56" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Tira de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-3 p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-16" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de vencimientos */}
      <Card>
        <CardContent className="pt-lg">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <Skeleton className="mb-2 h-3 w-28" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="divide-y divide-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <Skeleton className="mb-2 h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-4 w-24 shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bloque de equipo / compañeros */}
      <Card>
        <CardContent className="pt-lg">
          <div className="mb-5">
            <Skeleton className="mb-2 h-3 w-28" />
            <Skeleton className="h-5 w-56" />
          </div>
          <div className="space-y-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
