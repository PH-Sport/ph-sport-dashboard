'use client';

import { useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { CreateDesignButton } from '@/components/features/designs/dialogs/create-design-button';
import { useAuth } from '@/lib/auth/auth-context';
import { DesignerDashboard } from '@/components/features/dashboard/designer-dashboard';
import { AdminDashboard } from '@/components/features/dashboard/admin-dashboard';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { getDailyGreeting } from '@/lib/utils/greeting';

function getFirstName(fullName: string | null | undefined, email: string | null | undefined): string {
  if (fullName) return fullName.split(' ')[0];
  if (email) return email.split('@')[0];
  return '';
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { items, isLoading, mutate, error } = useDashboard();
  const [assigning, setAssigning] = useState(false);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const dateRangeLabel = `${format(weekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM', { locale: es })}`;

  const firstName = getFirstName(profile?.full_name, user?.email);
  // Determinista por día: mismo saludo en server y cliente, sin flash post-hidratación
  const title = getDailyGreeting(firstName);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const response = await fetch('/api/designs/assign', {
        method: 'POST',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error al repartir diseños');
      }

      const result = await response.json();
      toast.success(result.message || 'Diseños repartidos exitosamente');
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al repartir diseños');
    } finally {
      setAssigning(false);
    }
  };

  const showSkeleton = isLoading && items.length === 0;
  // Sin esto, un fetch caído pintaría un dashboard vacío "sano" (fallo silencioso)
  const showError = Boolean(error) && items.length === 0 && !isLoading;

  return (
    <DashboardPage
      title={title}
      subtitle={`Semana del ${dateRangeLabel}`}
      actions={<CreateDesignButton onDesignCreated={() => mutate()} variant="outline" />}
      loading={showSkeleton}
      skeleton={<DashboardSkeleton variant={profile?.role === 'ADMIN' ? 'admin' : 'designer'} />}
    >
      {showError ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">No se pudo cargar el dashboard</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Comprueba tu conexión e inténtalo de nuevo.
                </p>
              </div>
              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : profile?.role === 'ADMIN' ? (
        <AdminDashboard items={items} onAssign={handleAssign} assigning={assigning} />
      ) : user ? (
        <DesignerDashboard items={items} userId={user.id} />
      ) : null}
    </DashboardPage>
  );
}
