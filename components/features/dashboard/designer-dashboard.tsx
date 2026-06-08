'use client';

import { useMemo } from 'react';
import { format, isToday, isTomorrow, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/kpi-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Design } from '@/lib/types/design';
import { useDesigners } from '@/lib/hooks/use-designers';

interface DesignerDashboardProps {
  items: Design[];
  userId: string;
}

const UPCOMING_LIMIT = 5;
const TEAMMATE_LIMIT = 4;

function getDeadlineLabel(deadline: Date): string {
  if (isToday(deadline)) return `Hoy, ${format(deadline, 'HH:mm')}`;
  if (isTomorrow(deadline)) return `Mañana, ${format(deadline, 'HH:mm')}`;
  return format(deadline, "d MMM 'a las' HH:mm", { locale: es });
}

export function DesignerDashboard({ items, userId }: DesignerDashboardProps) {
  const { designers } = useDesigners();

  const myDesigns = useMemo(() => items.filter((d) => d.designer_id === userId), [items, userId]);

  const activeDesigns = myDesigns.filter((d) => d.status === 'BACKLOG').length;
  const completedThisWeek = myDesigns.filter((d) => d.status === 'DELIVERED').length;

  const upcoming = useMemo(() => {
    return myDesigns
      .filter((d) => d.status !== 'DELIVERED')
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
      .slice(0, UPCOMING_LIMIT);
  }, [myDesigns]);

  const nextDeadline = upcoming[0];

  const hoursUntilNext = nextDeadline
    ? (new Date(nextDeadline.deadline_at).getTime() - new Date().getTime()) / (1000 * 60 * 60)
    : null;

  const isUrgent = hoursUntilNext !== null && hoursUntilNext > 0 && hoursUntilNext < 24;

  const teammates = useMemo(() => {
    return designers
      .filter((designer) => designer.id !== userId)
      .map((designer) => {
        const designerDesigns = items.filter((d) => d.designer_id === designer.id);
        return {
          id: designer.id,
          name: designer.name,
          active: designerDesigns.filter((d) => d.status !== 'DELIVERED').length,
          delivered: designerDesigns.filter((d) => d.status === 'DELIVERED').length,
        };
      })
      .sort((a, b) => b.active - a.active)
      .slice(0, TEAMMATE_LIMIT);
  }, [items, designers, userId]);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero — entrega urgente cuando hay <24 h. Countdown como ancla visual editorial. */}
      {isUrgent && nextDeadline && (
        <Card className="border-destructive/40 bg-destructive/[0.04]">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-stretch md:gap-8">
            {/* Countdown grande — funcional + visual, no se repite en otro sitio */}
            <div className="flex shrink-0 flex-row items-end gap-3 md:flex-col md:items-start md:gap-2 md:border-r md:border-destructive/20 md:pr-8">
              <span className="mono tabular text-5xl font-semibold leading-none text-destructive">
                {Math.floor(hoursUntilNext!)}h
              </span>
              <span className="mono pb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-destructive md:pb-0">
                Vence en
              </span>
            </div>

            <div className="flex-1 space-y-1.5">
              <p className="mono text-[10px] font-medium uppercase tracking-[0.18em] text-destructive">
                Entrega urgente
              </p>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {nextDeadline.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(new Date(nextDeadline.deadline_at), "d 'de' MMM 'a las' HH:mm", { locale: es })}
              </p>
            </div>
            <Button asChild className="shrink-0 self-end md:self-center">
              <Link href="/mi-semana">
                Ver detalles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Tareas activas"
          value={activeDesigns}
          description="Pendientes en tu cola"
          variant={activeDesigns > 0 ? 'primary' : 'default'}
        />

        {nextDeadline && !isUrgent ? (
          <KpiCard
            title="Próxima entrega"
            value={hoursUntilNext && hoursUntilNext > 0 ? `${Math.floor(hoursUntilNext)}h` : '—'}
            description={nextDeadline.title}
            variant={hoursUntilNext && hoursUntilNext < 48 ? 'warning' : 'default'}
            icon={Clock}
          />
        ) : !nextDeadline ? (
          <KpiCard
            title="Próxima entrega"
            value="—"
            description="Sin entregas pendientes"
            variant="success"
            icon={CheckCircle2}
          />
        ) : (
          <KpiCard
            title="Esta semana"
            value={completedThisWeek}
            description="Diseños entregados"
            variant="success"
            icon={TrendingUp}
          />
        )}

        <KpiCard
          title="Entregados"
          value={completedThisWeek}
          description="Completados esta semana"
          variant="success"
          icon={TrendingUp}
        />
      </div>

      {/* Próximas entregas + Trabajo del equipo */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Próximas entregas — span 2 cols en desktop */}
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Próximas entregas
                </p>
                <h2 className="font-heading text-base font-semibold text-foreground">
                  Tu cola por deadline
                </h2>
              </div>
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href="/mi-semana">
                  Ver todas
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <CheckCircle2 className="h-8 w-8 text-status-success" />
                <p className="text-sm text-muted-foreground">Sin entregas pendientes. Buen trabajo.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((design) => {
                  const deadline = new Date(design.deadline_at);
                  const hoursLeft = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);
                  const isOverdue = hoursLeft < 0;
                  const isSoon = hoursLeft >= 0 && hoursLeft < 24;

                  return (
                    <li key={design.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{design.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {design.player} · {design.match_home} vs {design.match_away}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            'mono tabular text-xs font-medium',
                            isOverdue
                              ? 'text-destructive'
                              : isSoon
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

        {/* Trabajo del equipo — preview compañeros */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4">
              <p className="mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Compañeros
              </p>
              <h2 className="font-heading text-base font-semibold text-foreground">
                Trabajo activo
              </h2>
            </div>

            {teammates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay otros diseñadores activos.</p>
            ) : (
              <ul className="space-y-3">
                {teammates.map((mate) => (
                  <li key={mate.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-foreground">{mate.name}</span>
                    <span className="mono tabular shrink-0 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{mate.active}</span> activos
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos — sin icono-box, cada link con peso visual diferenciado */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/mi-semana" className="group">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex items-center justify-between gap-6 p-5">
              <div className="space-y-1">
                <p className="mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Mi Semana
                </p>
                <p className="font-heading text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                  Lista completa de tu trabajo
                </p>
              </div>
              <Badge variant="secondary" className="mono tabular shrink-0 text-base font-semibold">
                {activeDesigns}
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <Link href="/disenos" className="group">
          <Card className="h-full transition-colors hover:border-primary/40">
            <CardContent className="flex items-center justify-between gap-6 p-5">
              <div className="space-y-1">
                <p className="mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Diseños
                </p>
                <p className="font-heading text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                  Backlog completo del equipo
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
