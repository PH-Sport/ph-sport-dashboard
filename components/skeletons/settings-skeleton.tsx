import { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/** Subapartado: rótulo eyebrow + hint + placa (espejo de <Section> en /ajustes). */
function SectionSkeleton({ children }: { children: ReactNode }) {
  return (
    <section>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-1.5 h-4 w-48" />
      <div className="mt-3 rounded-2xl border border-border bg-card p-lg shadow-raised">
        {children}
      </div>
    </section>
  );
}

/**
 * Skeleton del cuerpo de /ajustes (la cabecera la pinta DashboardPage, así que
 * no se incluye). Espeja la pestaña General: Cuenta + Apariencia + Notificaciones
 * y el botón de guardar. El conmutador de pestañas solo se reserva para admin.
 */
export function SettingsSkeleton({ isAdmin = false }: { isAdmin?: boolean }) {
  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-raised">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      )}

      <div className="max-w-2xl space-y-xl pb-xl">
        {/* Cuenta */}
        <SectionSkeleton>
          <div className="space-y-6 py-2">
            <div className="flex flex-col items-center gap-4 py-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </SectionSkeleton>

        {/* Apariencia */}
        <SectionSkeleton>
          <div className="space-y-lg py-2">
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </SectionSkeleton>

        {/* Notificaciones */}
        <SectionSkeleton>
          <div className="space-y-6 py-2">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-1.5 h-3 w-full max-w-xs" />
            </div>
            <div className="space-y-6">
              {/* Cabecera de canales */}
              <div className="grid grid-cols-3 gap-4 border-b border-border/50 pb-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
              {/* Filas de eventos */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className="grid grid-cols-3 items-center gap-4">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionSkeleton>

        {/* Guardar */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-[150px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
