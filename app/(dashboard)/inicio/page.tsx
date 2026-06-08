'use client';

import { useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';
import { toast } from 'sonner';
import { CreateDesignButton } from '@/components/features/designs/dialogs/create-design-button';
import { useAuth } from '@/lib/auth/auth-context';
import { DesignerDashboard } from '@/components/features/dashboard/designer-dashboard';
import { AdminDashboard } from '@/components/features/dashboard/admin-dashboard';
import { useDashboard } from '@/lib/hooks/use-dashboard';
import { getStaticGreeting, pickGreeting } from '@/lib/utils/greeting';

function getFirstName(fullName: string | null | undefined, email: string | null | undefined): string {
  if (fullName) return fullName.split(' ')[0];
  if (email) return email.split('@')[0];
  return '';
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { items, isLoading, mutate } = useDashboard();
  const [assigning, setAssigning] = useState(false);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const dateRangeLabel = `${format(weekStart, 'd MMM', { locale: es })} – ${format(weekEnd, 'd MMM', { locale: es })}`;

  const firstName = getFirstName(profile?.full_name, user?.email);
  const [title, setTitle] = useState<string>(() => getStaticGreeting(firstName));
  useEffect(() => {
    setTitle(pickGreeting(firstName));
  }, [firstName]);

  const handleAssign = async () => {
    setAssigning(true);
    try {
      const response = await fetch('/api/designs/assign', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al repartir diseños');
      }

      const result = await response.json();
      toast.success(result.message || 'Diseños repartidos exitosamente');
      mutate();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al repartir diseños');
    } finally {
      setAssigning(false);
    }
  };

  const showSkeleton = isLoading && items.length === 0;

  return (
    <DashboardPage
      title={title}
      subtitle={`Semana del ${dateRangeLabel}`}
      actions={
        profile?.role === 'ADMIN' ? (
          <CreateDesignButton onDesignCreated={() => mutate()} size="lg" />
        ) : null
      }
      loading={showSkeleton}
      skeleton={<DashboardSkeleton />}
    >
      {profile?.role === 'ADMIN' ? (
        <AdminDashboard items={items} onAssign={handleAssign} assigning={assigning} />
      ) : user ? (
        <DesignerDashboard items={items} userId={user.id} />
      ) : null}
    </DashboardPage>
  );
}
