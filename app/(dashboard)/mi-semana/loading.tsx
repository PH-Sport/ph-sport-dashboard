import { MyWeekSkeleton } from '@/components/skeletons/my-week-skeleton';

/** Fallback de navegación de /mi-semana (clic instantáneo). */
export default function Loading() {
  return <MyWeekSkeleton />;
}
