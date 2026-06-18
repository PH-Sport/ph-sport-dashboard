import { PageContainer } from '@/components/ui/page-container';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton de /disenos — espeja la barra de filtros única (búsqueda +
 * selectores en la misma superficie) y la tabla (recuento + 6 columnas con
 * anchos fijos, más la lista en móvil). Sin Cards de búsqueda/filtros sueltas.
 */
export function DesignsSkeleton() {
  return (
    <PageContainer>
      {/* Header: título + subtítulo · tabs + crear */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Skeleton className="mb-2 h-9 w-32" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Barra de filtros única: búsqueda + selectores en una superficie */}
      <div className="rounded-2xl border border-border bg-card p-md shadow-raised">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <Skeleton className="h-10 min-w-0 flex-1" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:flex xl:items-center">
            <Skeleton className="h-10 xl:w-[150px]" />
            <Skeleton className="h-10 xl:w-[185px]" />
            <Skeleton className="h-10 xl:w-[130px]" />
            <Skeleton className="h-10 xl:w-[130px]" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-border bg-card p-md shadow-raised">
        {/* Barra superior: recuento + items por página */}
        <div className="flex items-center justify-between gap-4 px-2 pb-2 pt-1">
          <Skeleton className="h-3 w-24" />
          <div className="hidden items-center gap-2 sm:flex">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-8 w-[4.5rem] rounded-lg" />
          </div>
        </div>

        {/* Móvil: lista de filas */}
        <ul className="space-y-0.5 md:hidden">
          {[...Array(6)].map((_, i) => (
            <li key={i} className="rounded-xl px-2 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            </li>
          ))}
        </ul>

        {/* Desktop: tabla de 6 columnas */}
        <div className="hidden md:block">
          {/* Cabecera */}
          <div className="flex items-center border-b border-border px-2 py-3">
            <div className="w-[20%] pr-3">
              <Skeleton className="h-3.5 w-16" />
            </div>
            <div className="w-[28%] pr-3">
              <Skeleton className="h-3.5 w-20" />
            </div>
            <div className="w-[13%] pr-3">
              <Skeleton className="h-3.5 w-16" />
            </div>
            <div className="w-[12%] pr-3">
              <Skeleton className="h-3.5 w-14" />
            </div>
            <div className="w-[16%] pr-3">
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex w-[11%] justify-end">
              <Skeleton className="h-3.5 w-14" />
            </div>
          </div>
          {/* Filas */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex items-center border-b border-border px-2 py-3 last:border-0"
            >
              <div className="w-[20%] pr-3">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="w-[28%] space-y-1.5 pr-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="flex w-[13%] items-center gap-2 pr-3">
                <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="w-[12%] pr-3">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex w-[16%] items-center gap-2 pr-3">
                <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-14" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
              <div className="flex w-[11%] justify-end">
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
