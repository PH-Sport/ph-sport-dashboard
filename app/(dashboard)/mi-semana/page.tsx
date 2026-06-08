'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { MyWeekSkeleton } from '@/components/skeletons/my-week-skeleton';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { STATUS_LABELS } from '@/lib/types/design';
import type { Design, DesignStatus } from '@/lib/types/design';
import { useConfirm } from '@/lib/hooks/use-confirm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DesignDetailSheet } from '@/components/features/designs/design-detail-sheet';
import { DesignCard } from '@/components/features/designs/design-card';
import { DeliveredSection } from '@/components/features/my-week/delivered-section';
import { useMyWeek } from '@/lib/hooks/use-my-week';
import { useMyWeekData } from '@/lib/hooks/use-my-week-data';

const STATUS_ORDER: Record<DesignStatus, number> = {
  BACKLOG: 0,
  DELIVERED: 1,
};

export default function MyWeekPage() {
  const router = useRouter();
  const { profile, status } = useAuth();
  const { items, isLoading, mutate } = useMyWeek();
  const { inProgress, deliveredGroups, deliveredCount } = useMyWeekData(items);

  const [updating, setUpdating] = useState<string | null>(null);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  // Redireccionar admins a /equipo
  useEffect(() => {
    if (status === 'AUTHENTICATED' && profile && profile.role === 'ADMIN') {
      router.replace('/equipo');
    }
  }, [status, profile, router]);

  const handleStatusChange = async (design: Design, newStatus: DesignStatus) => {
    const isRegressive = STATUS_ORDER[newStatus] < STATUS_ORDER[design.status];

    if (isRegressive) {
      const confirmed = await confirm({
        title: '¿Volver atrás?',
        description: `¿Estás seguro de cambiar "${design.title}" de ${STATUS_LABELS[design.status]} a ${STATUS_LABELS[newStatus]}?`,
        confirmText: 'Sí, cambiar',
        cancelText: 'Cancelar',
      });
      if (!confirmed) return;
    }

    setUpdating(design.id);
    try {
      const response = await fetch(`/api/designs/${design.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Error al actualizar estado');

      toast.success('Estado actualizado');
      mutate();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };

  const handleSelectDesign = (designId: string) => {
    setSelectedDesignId(designId);
    setDetailSheetOpen(true);
  };

  const hasAnyItems = inProgress.length > 0 || deliveredCount > 0;
  const showSkeleton = isLoading && items.length === 0;

  return (
    <DashboardPage
      title="Mi Semana"
      icon={Calendar}
      subtitle="Gestiona tus tareas y entregas"
      loading={showSkeleton || status === 'INITIALIZING'}
      skeleton={<MyWeekSkeleton />}
    >
      {!hasAnyItems ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <div className="space-y-3 text-center">
              <p className="text-muted-foreground">No tienes tareas asignadas</p>
              <Button asChild>
                <Link href="/disenos">Ver backlog</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
              Pendientes
              <Badge variant="secondary" className="font-normal">
                {inProgress.length}
              </Badge>
            </h2>
            {inProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada pendiente</p>
            ) : (
              <div className="space-y-2">
                {inProgress.map((design) => (
                  <DesignCard
                    key={design.id}
                    design={design}
                    onSelect={handleSelectDesign}
                    onStatusChange={handleStatusChange}
                    updating={updating === design.id}
                  />
                ))}
              </div>
            )}
          </section>

          <DeliveredSection
            groups={deliveredGroups}
            totalCount={deliveredCount}
            onSelect={handleSelectDesign}
            onStatusChange={handleStatusChange}
            updatingId={updating}
          />
        </div>
      )}

      {options && (
        <ConfirmDialog
          open={isOpen}
          onOpenChange={handleCancel}
          onConfirm={handleConfirm}
          title={options.title}
          description={options.description}
          confirmLabel={options.confirmText || 'Confirmar'}
          cancelLabel={options.cancelText || 'Cancelar'}
          variant={options.variant || 'warning'}
        />
      )}

      <DesignDetailSheet
        designId={selectedDesignId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onDesignUpdated={() => mutate()}
      />
    </DashboardPage>
  );
}
