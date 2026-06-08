'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { MyWeekSkeleton } from '@/components/skeletons/my-week-skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, ExternalLink, AlertTriangle, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import type { DesignStatus } from '@/lib/types/filters';
import { STATUS_LABELS } from '@/lib/types/design';
import type { Design } from '@/lib/types/design';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
import { useConfirm } from '@/lib/hooks/use-confirm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DesignDetailSheet } from '@/components/features/designs/design-detail-sheet';
import { useMyWeek } from '@/lib/hooks/use-my-week';

const STATUS_ORDER: Record<DesignStatus, number> = {
  BACKLOG: 0,
  DELIVERED: 1,
};

const INITIAL_VISIBLE_DELIVERED_WEEKS = 2;

export default function MyWeekPage() {
  const router = useRouter();
  const { profile, status } = useAuth();
  const { items, isLoading, mutate } = useMyWeek();
  const [updating, setUpdating] = useState<string | null>(null);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();
  
  // Estado para panel de detalles
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [deliveredOpen, setDeliveredOpen] = useState(false);
  const [showAllDeliveredWeeks, setShowAllDeliveredWeeks] = useState(false);

  // Redireccionar admins a /team
  useEffect(() => {
    if (status === 'AUTHENTICATED' && profile && profile.role === 'ADMIN') {
      router.replace('/team');
    }
  }, [status, profile, router]);

  const handleStatusChange = async (design: Design, newStatus: DesignStatus) => {
    // Confirmar si es un cambio regresivo
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

      if (!response.ok) {
        throw new Error('Error al actualizar estado');
      }

      toast.success('Estado actualizado');
      // Revalidate SWR cache
      mutate();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };

  const { inProgress, deliveredGroups, deliveredCount } = useMemo(() => {
    const inProgressItems = items
      .filter((d) => d.status !== 'DELIVERED')
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime());

    const deliveredItems = items
      .filter((d) => d.status === 'DELIVERED')
      .sort((a, b) => new Date(b.deadline_at).getTime() - new Date(a.deadline_at).getTime());

    const byWeek = deliveredItems.reduce<Map<number, Design[]>>((acc, design) => {
      const weekStart = startOfWeek(new Date(design.deadline_at), { weekStartsOn: 1 });
      const weekKey = weekStart.getTime();
      if (!acc.has(weekKey)) acc.set(weekKey, []);
      acc.get(weekKey)!.push(design);
      return acc;
    }, new Map());

    const groups = Array.from(byWeek.entries())
      .sort(([a], [b]) => b - a)
      .map(([weekStartMs, weekItems]) => {
        const weekStart = new Date(weekStartMs);
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        return {
          key: String(weekStartMs),
          label: `${format(weekStart, "d 'de' MMM", { locale: es })} - ${format(weekEnd, "d 'de' MMM", { locale: es })}`,
          items: [...weekItems].sort(
            (a, b) => new Date(b.deadline_at).getTime() - new Date(a.deadline_at).getTime()
          ),
        };
      });

    return {
      inProgress: inProgressItems,
      deliveredGroups: groups,
      deliveredCount: deliveredItems.length,
    };
  }, [items]);

  const hasAnyItems = inProgress.length > 0 || deliveredCount > 0;

  const getUrgencyBadge = (design: Design) => {
    if (design.status === 'DELIVERED') return null;
    
    const now = new Date();
    const deadline = new Date(design.deadline_at);
    const hoursUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil < 0) {
      return <Badge variant="destructive" className="shrink-0">Atrasado</Badge>;
    } else if (hoursUntil < 24) {
      return (
        <Badge variant="destructive" className="shrink-0 gap-1">
          <Flame className="h-3 w-3" />
          {Math.floor(hoursUntil)}h
        </Badge>
      );
    } else if (hoursUntil < 48) {
      return (
        <Badge variant="warning" className="shrink-0 gap-1">
          <AlertTriangle className="h-3 w-3" />
          {Math.floor(hoursUntil)}h
        </Badge>
      );
    }
    
    return null;
  };

  // Only show skeleton on initial load (no cached data yet)
  const showSkeleton = isLoading && items.length === 0;
  const visibleDeliveredGroups = showAllDeliveredWeeks
    ? deliveredGroups
    : deliveredGroups.slice(0, INITIAL_VISIBLE_DELIVERED_WEEKS);
  const hasHiddenDeliveredWeeks = deliveredGroups.length > INITIAL_VISIBLE_DELIVERED_WEEKS;

  const renderDesignCard = (design: Design, options?: { muted?: boolean }) => {
    const urgencyBadge = getUrgencyBadge(design);
    const isMuted = options?.muted ?? false;

    return (
      <Card key={design.id} className={isMuted ? 'opacity-75' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedDesignId(design.id);
                    setDetailSheetOpen(true);
                  }}
                  className="font-medium hover:text-primary transition-colors text-left"
                >
                  {design.title}
                </button>
                {design.player_status && (
                  <PlayerStatusTag status={design.player_status} />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {design.player} · {design.match_home} vs {design.match_away}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Calendar className="h-4 w-4" />
              {format(new Date(design.deadline_at), 'dd MMM HH:mm', { locale: es })}
            </div>
            {urgencyBadge}
            <Select
              value={design.status}
              onValueChange={(value) => handleStatusChange(design, value as DesignStatus)}
              disabled={updating === design.id}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BACKLOG">{STATUS_LABELS.BACKLOG}</SelectItem>
                <SelectItem value="DELIVERED">{STATUS_LABELS.DELIVERED}</SelectItem>
              </SelectContent>
            </Select>
            {design.folder_url && (
              <Button variant="ghost" size="icon" asChild className="shrink-0">
                <a href={design.folder_url} target="_blank" rel="noopener noreferrer" aria-label="Abrir carpeta Drive">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">
                  No tienes tareas asignadas
                </p>
                <Button asChild>
                  <Link href="/designs">Ver backlog</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Sección Pendientes */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                Pendientes
                <Badge variant="secondary" className="font-normal">
                  {inProgress.length}
                </Badge>
              </h2>
              {inProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nada pendiente</p>
              ) : (
                <div className="space-y-2">
                  {inProgress.map((design) => renderDesignCard(design))}
                </div>
              )}
            </section>

            {/* Sección Entregados (agrupados por semana) */}
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  Entregados
                  <Badge variant="outline" className="font-normal">
                    {deliveredCount}
                  </Badge>
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeliveredOpen((prev) => {
                      const next = !prev;
                      if (!next) setShowAllDeliveredWeeks(false);
                      return next;
                    });
                  }}
                  className="gap-1"
                >
                  {deliveredOpen ? (
                    <>
                      Ocultar
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Ver
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {deliveredCount === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay entregas</p>
              ) : !deliveredOpen ? (
                <p className="text-sm text-muted-foreground">
                  Sección colapsada para reducir ruido visual.
                </p>
              ) : (
                <div className="space-y-6">
                  {visibleDeliveredGroups.map((group) => (
                    <div key={group.key} className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Semana {group.label}
                      </h3>
                      <div className="space-y-2">
                        {group.items.map((design) => renderDesignCard(design, { muted: true }))}
                      </div>
                    </div>
                  ))}

                  {hasHiddenDeliveredWeeks && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAllDeliveredWeeks((prev) => !prev)}
                    >
                      {showAllDeliveredWeeks ? 'Ver menos semanas' : 'Ver mas semanas'}
                    </Button>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

      {/* Confirm dialog for regressive status changes */}
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

      {/* Design detail sheet */}
      <DesignDetailSheet
        designId={selectedDesignId}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onDesignUpdated={() => mutate()}
      />
    </DashboardPage>
  );
}
