'use client';

import { useMemo } from 'react';
import { format, isToday, isTomorrow, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Clock, ArrowRight, CalendarClock, CheckCircle2, Layers } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Design } from '@/lib/types/design';
import { useDesigners } from '@/lib/hooks/use-designers';

interface AdminDashboardProps {
  items: Design[];
  onAssign: () => void;
  assigning: boolean;
}

interface DesignerLoad {
  id: string;
  name: string;
  active: number;
  delivered: number;
}

const UPCOMING_HOURS = 48;
const UPCOMING_LIMIT = 5;

function getDeadlineLabel(deadline: Date): string {
  if (isToday(deadline)) return `Hoy, ${format(deadline, 'HH:mm')}`;
  if (isTomorrow(deadline)) return `Mañana, ${format(deadline, 'HH:mm')}`;
  return format(deadline, "d MMM 'a las' HH:mm", { locale: es });
}

export function AdminDashboard({ items, onAssign, assigning }: AdminDashboardProps) {
  const { designers } = useDesigners();

  const nowMs = Date.now();
  const next48hMs = nowMs + 48 * 60 * 60 * 1000;

  const atRisk = items.filter((d) => {
    return new Date(d.deadline_at).getTime() < next48hMs && d.status !== 'DELIVERED';
  }).length;

  const stuckDesigns = items.filter((d) => {
    if (d.status !== 'BACKLOG') return false;
    const updated = new Date(d.updated_at || d.created_at || new Date()).getTime();
    const hoursSinceUpdate = (nowMs - updated) / (1000 * 60 * 60);
    return hoursSinceUpdate > 48;
  }).length;

  const unassignedCount = items.filter((d) => !d.designer_id).length;
  const activeCount = items.filter((d) => d.status === 'BACKLOG').length;
  const deliveredCount = items.filter((d) => d.status === 'DELIVERED').length;

  const designerLoads = useMemo<DesignerLoad[]>(() => {
    return designers
      .map((designer) => {
        const designerDesigns = items.filter((d) => d.designer_id === designer.id);
        return {
          id: designer.id,
          name: designer.name,
          active: designerDesigns.filter((d) => d.status !== 'DELIVERED').length,
          delivered: designerDesigns.filter((d) => d.status === 'DELIVERED').length,
        };
      })
      .sort((a, b) => b.active - a.active);
  }, [items, designers]);

  const overloadedDesigners = designerLoads.filter((d) => d.active > 5);
  const inactiveDesigners = designerLoads.filter((d) => d.delivered === 0 && d.active === 0);

  /** Próximos vencimientos — diseños que vencen en las siguientes 48 h, ordenados por deadline. */
  const upcoming = useMemo(() => {
    const cutoffMs = nowMs + UPCOMING_HOURS * 60 * 60 * 1000;
    return items
      .filter((d) => {
        return new Date(d.deadline_at).getTime() <= cutoffMs && d.status !== 'DELIVERED';
      })
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
      .slice(0, UPCOMING_LIMIT);
  }, [items, nowMs]);

  const criticalCount = upcoming.filter((d) => {
    const hoursLeft = (new Date(d.deadline_at).getTime() - nowMs) / (1000 * 60 * 60);
    return hoursLeft < 24;
  }).length;

  // El héroe de triage es la ÚNICA superficie de acción: riesgo + sin asignar viven aquí
  const hasAlerts =
    atRisk > 5 || overloadedDesigners.length > 0 || criticalCount > 0 || unassignedCount > 0;

  const activeDesignersCount = designerLoads.filter((d) => d.active > 0).length;

  const designerNameMap = useMemo(() => {
    return new Map(designers.map((d) => [d.id, d.name]));
  }, [designers]);

  return (
    <div className="flex flex-col gap-6">
      {/* Alertas que requieren atención — ancla tipográfica (recuento total), sin icono-box */}
      {hasAlerts && (() => {
        const totalAlerts =
          (criticalCount > 0 ? 1 : 0) +
          (atRisk > 5 ? 1 : 0) +
          (overloadedDesigners.length > 0 ? 1 : 0) +
          (unassignedCount > 0 ? 1 : 0);
        return (
          <Card className="border-primary/40 bg-primary/[0.04]">
            <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-stretch md:gap-8">
              {/* Recuento de alertas como ancla visual — único en la página */}
              <div className="flex shrink-0 flex-row items-end gap-3 md:flex-col md:items-start md:gap-2 md:border-r md:border-primary/20 md:pr-8">
                <span className="mono tabular text-5xl font-semibold leading-none text-primary">
                  {String(totalAlerts).padStart(2, '0')}
                </span>
                <span className="font-mono pb-1 text-eyebrow uppercase text-primary md:pb-0">
                  Avisos
                </span>
              </div>

              <div className="flex-1 space-y-2 text-sm">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  Hay cosas que mirar antes de seguir
                </h2>
                <ul className="space-y-1 text-muted-foreground">
                  {criticalCount > 0 && (
                    <li>
                      <span className="font-medium text-foreground">
                        {criticalCount} diseño{criticalCount !== 1 ? 's' : ''}
                      </span>{' '}
                      {criticalCount !== 1 ? 'vencen' : 'vence'} en menos de 24 h.
                    </li>
                  )}
                  {atRisk > 5 && (
                    <li>
                      <span className="font-medium text-foreground">{atRisk} diseños</span> en riesgo
                      de no llegar a tiempo.
                    </li>
                  )}
                  {overloadedDesigners.length > 0 && (
                    <li>
                      <span className="font-medium text-foreground">
                        {overloadedDesigners.length} diseñador
                        {overloadedDesigners.length !== 1 ? 'es' : ''}
                      </span>{' '}
                      con sobrecarga ({overloadedDesigners.map((d) => d.name).join(', ')}).
                    </li>
                  )}
                  {unassignedCount > 0 && (
                    <li>
                      <span className="font-medium text-foreground">
                        {unassignedCount} diseño{unassignedCount !== 1 ? 's' : ''}
                      </span>{' '}
                      sin asignar.
                    </li>
                  )}
                </ul>
              </div>
              {/* Acción directa donde está el problema — sin tarjetas intermedias */}
              <div className="flex shrink-0 flex-col gap-2 self-end md:justify-center md:self-center">
                {unassignedCount > 0 && (
                  <Button size="sm" onClick={onAssign} disabled={assigning}>
                    <Users className="mr-2 h-4 w-4" />
                    {assigning ? 'Repartiendo…' : 'Repartir sin asignar'}
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link href="/equipo">
                    Ver equipo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Tira de salud — datos sin acción; el riesgo y lo sin asignar viven en el héroe */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Activas"
          value={activeCount}
          description="Pendientes esta semana"
          variant="default"
          icon={Layers}
        />
        <KpiCard
          title="Entregados"
          value={deliveredCount}
          description="Completados esta semana"
          variant={deliveredCount > 0 ? 'success' : 'default'}
          icon={CheckCircle2}
        />
        <KpiCard
          title="Bloqueados"
          value={stuckDesigns}
          description="Sin movimiento >48 h"
          variant={stuckDesigns > 0 ? 'warning' : 'success'}
          icon={Clock}
        />
        <KpiCard
          title="Equipo activo"
          value={`${activeDesignersCount}/${designers.length}`}
          description="Con trabajo asignado"
          variant="primary"
          icon={Users}
        />
      </div>

      {/* Próximos vencimientos */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">
                Próximas 48 horas
              </p>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Próximos vencimientos
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/disenos">
                Ver todos
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <CalendarClock className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sin vencimientos próximos. Equipo al día.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((design) => {
                const deadline = new Date(design.deadline_at);
                const hoursLeft = (deadline.getTime() - nowMs) / (1000 * 60 * 60);
                const isOverdue = hoursLeft < 0;
                const isCritical = hoursLeft >= 0 && hoursLeft < 24;
                const designerName = design.designer_id
                  ? designerNameMap.get(design.designer_id)
                  : null;

                return (
                  <li
                    key={design.id}
                    className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{design.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {design.player} ·{' '}
                        {designerName ? (
                          <span className="text-foreground">{designerName}</span>
                        ) : (
                          <span className="text-status-warning">Sin asignar</span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          'mono tabular text-xs font-medium',
                          isOverdue
                            ? 'text-destructive'
                            : isCritical
                              ? 'text-status-warning'
                              : 'text-foreground'
                        )}
                      >
                        {isOverdue
                          ? `Vencido · ${formatDistanceToNowStrict(deadline, { locale: es })}`
                          : getDeadlineLabel(deadline)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Carga del equipo */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">
                Carga del equipo
              </p>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Top diseñadores por trabajo activo
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0">
              <Link href="/equipo">
                Ver todos
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="space-y-5">
            {designerLoads.slice(0, 5).map((designer) => (
              <div key={designer.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{designer.name}</span>
                  <div className="mono tabular flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">{designer.active}</span> activos
                      {' · '}
                      <span className="font-medium text-foreground">{designer.delivered}</span>{' '}
                      entregados
                    </span>
                    {designer.active > 5 && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                        sobrecarga
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={Math.min(100, (designer.active / 10) * 100)} className="h-1.5" />
              </div>
            ))}
            {designerLoads.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin actividad esta semana.</p>
            )}
          </div>

          {/* Inactivos plegados dentro del bloque de equipo — un solo bloque, menos ruido */}
          {inactiveDesigners.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Sin trabajo esta semana:</span>
                {inactiveDesigners.map((d) => (
                  <Badge key={d.id} variant="outline" className="font-normal">
                    {d.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
