import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';

/**
 * Fallback de navegación (App Router): se muestra al instante al clicar el
 * enlace, mientras llega el RSC de /inicio. Elimina la sensación de "clic
 * muerto". El variant admin es el caso denso; al montar la página, su propio
 * skeleton (SWR) toma el relevo con el variant correcto por rol.
 */
export default function Loading() {
  return <DashboardSkeleton variant="admin" />;
}
