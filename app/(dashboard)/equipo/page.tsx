'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { DesignerCard } from '@/components/features/team/designer-card';
import { TeamSkeleton } from '@/components/skeletons/team-skeleton';
import { useTeamData } from '@/lib/hooks/use-team-data';

export default function TeamPage() {
  const router = useRouter();
  const { profile, status } = useAuth();
  const authLoading = status === 'INITIALIZING';
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  // Calcular rango de la semana seleccionada (lunes a domingo)
  const weekStart = useMemo(() => startOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  const weekEnd = useMemo(() => endOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);

  // Use SWR hook for team data
  const { designers, isLoading } = useTeamData(weekStart, weekEnd);

  // Redireccionar si no es admin
  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'ADMIN') {
      router.replace('/mi-semana');
    }
  }, [authLoading, profile, router]);

  // Navegación canónica: cada diseñador tiene su página, con la semana en la URL
  const handleDesignerClick = (designerId: string) => {
    const param = format(weekStart, 'yyyy-MM-dd');
    router.push(`/equipo/${designerId}?semana=${param}`);
  };

  const handlePrevWeek = () => setSelectedWeek(prev => subWeeks(prev, 1));
  const handleNextWeek = () => setSelectedWeek(prev => addWeeks(prev, 1));
  const handleCurrentWeek = () => setSelectedWeek(new Date());

  // Si no es admin, no renderizar nada (se redireccionará)
  if (!authLoading && profile && profile.role !== 'ADMIN') {
    return null;
  }

  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: es })} - ${format(weekEnd, "d 'de' MMM", { locale: es })}`;
  const isCurrentWeek = format(weekStart, 'yyyy-MM-dd') === format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Only show skeleton on initial load (no cached data yet)
  const showSkeleton = (isLoading && designers.length === 0) || authLoading;

  return (
    <DashboardPage
      title="Equipo"
      icon={Users}
      subtitle="Supervisa el progreso de tu equipo"
      loading={showSkeleton}
      skeleton={<TeamSkeleton />}
      actions={
        <>
          <Button variant="outline" size="icon" onClick={handlePrevWeek} aria-label="Semana anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isCurrentWeek ? 'default' : 'outline'}
            onClick={handleCurrentWeek}
            className="min-w-[180px]"
          >
            {weekLabel}
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek} aria-label="Semana siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      }
    >
        {/* Grid de diseñadores */}
        {designers.length === 0 ? (
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <div className="space-y-3 text-center">
                <p className="font-medium text-foreground">Aún no hay diseñadores en el equipo</p>
                <p className="text-sm text-muted-foreground">
                  Invítalos y aparecerán aquí con su carga semanal.
                </p>
                <Button asChild variant="outline">
                  <Link href="/ajustes/usuarios">Invitar al equipo</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designers.map(designer => (
              <DesignerCard
                key={designer.id}
                designer={designer}
                onClick={() => handleDesignerClick(designer.id)}
              />
            ))}
          </div>
        )}
    </DashboardPage>
  );
}
