'use client';

import { useMemo } from 'react';
import { format, isToday, isTomorrow, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SPRINGS } from '@/components/ui/animations';
import { Collapse } from '@/components/ui/collapse';
import { UrgencyDot, getUrgency } from '@/components/ui/urgency-dot';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { Design } from '@/lib/types/design';
import { useDesigners } from '@/lib/hooks/use-designers';

interface AdminDashboardProps {
  items: Design[];
  onAssign: () => void;
  assigning: boolean;
}

interface DesignerLoad {
  id: string;
  /** Nombre completo (para iniciales del avatar). */
  name: string;
  /** Nombre corto para mostrar (alias || nombre). */
  displayName: string;
  avatar_url?: string | null;
  active: number;
  delivered: number;
}

const UPCOMING_HOURS = 48;
const UPCOMING_LIMIT = 5;

const TONE_TEXT = {
  default: 'text-foreground',
  success: 'text-status-success',
  warning: 'text-status-warning',
  primary: 'text-primary',
} as const;

function getDeadlineLabel(deadline: Date): string {
  if (isToday(deadline)) return `Hoy, ${format(deadline, 'HH:mm')}`;
  if (isTomorrow(deadline)) return `Mañana, ${format(deadline, 'HH:mm')}`;
  return format(deadline, "d MMM 'a las' HH:mm", { locale: es });
}

function KpiPlate({
  label,
  value,
  note,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  note: string;
  tone?: keyof typeof TONE_TEXT;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-lg shadow-raised">
      <p className="font-mono text-eyebrow uppercase text-muted-foreground">{label}</p>
      <p className={cn('mt-2 font-mono tabular text-4xl font-semibold leading-none', TONE_TEXT[tone])}>
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export function AdminDashboard({ items, onAssign, assigning }: AdminDashboardProps) {
  const { designers } = useDesigners();

  const nowMs = Date.now();
  const next48hMs = nowMs + 48 * 60 * 60 * 1000;

  const atRisk = items.filter(
    (d) => new Date(d.deadline_at).getTime() < next48hMs && d.status !== 'DELIVERED'
  ).length;

  // Atrasados: vencidos sin entregar (métrica con lógica real, sustituye al antiguo "Bloqueados").
  const overdueCount = items.filter(
    (d) => d.status !== 'DELIVERED' && new Date(d.deadline_at).getTime() < nowMs
  ).length;

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
          displayName: designer.displayName,
          avatar_url: designer.avatar_url,
          active: designerDesigns.filter((d) => d.status !== 'DELIVERED').length,
          delivered: designerDesigns.filter((d) => d.status === 'DELIVERED').length,
        };
      })
      .sort((a, b) => b.active - a.active);
  }, [items, designers]);

  const overloadedDesigners = designerLoads.filter((d) => d.active > 5);
  const inactiveDesigners = designerLoads.filter((d) => d.delivered === 0 && d.active === 0);

  const upcoming = useMemo(() => {
    const cutoffMs = nowMs + UPCOMING_HOURS * 60 * 60 * 1000;
    return items
      .filter((d) => new Date(d.deadline_at).getTime() <= cutoffMs && d.status !== 'DELIVERED')
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
      .slice(0, UPCOMING_LIMIT);
  }, [items, nowMs]);

  const criticalCount = upcoming.filter((d) => {
    const hoursLeft = (new Date(d.deadline_at).getTime() - nowMs) / (1000 * 60 * 60);
    return hoursLeft >= 0 && hoursLeft < 24;
  }).length;

  const hasAlerts =
    atRisk > 5 || overloadedDesigners.length > 0 || criticalCount > 0 || unassignedCount > 0;

  const activeDesignersCount = designerLoads.filter((d) => d.active > 0).length;
  const designerNameMap = useMemo(
    () => new Map(designers.map((d) => [d.id, d.displayName])),
    [designers]
  );
  const designerAvatarMap = useMemo(
    () => new Map(designers.map((d) => [d.id, d.avatar_url ?? null])),
    [designers]
  );

  const totalAlerts =
    (criticalCount > 0 ? 1 : 0) +
    (atRisk > 5 ? 1 : 0) +
    (overloadedDesigners.length > 0 ? 1 : 0) +
    (unassignedCount > 0 ? 1 : 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Triage — única superficie de acción: avisos + reparto */}
      <Collapse open={hasAlerts}>
        <section className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-card p-lg shadow-raised md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <span className="font-mono tabular text-5xl font-semibold leading-none text-primary">
              {String(totalAlerts).padStart(2, '0')}
            </span>
            <div>
              <p className="font-mono text-eyebrow uppercase text-primary">Avisos</p>
              <ul className="mt-0.5 space-y-0.5 text-sm text-muted-foreground">
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
                    <span className="font-medium text-foreground">{atRisk} diseños</span> en riesgo de
                    no llegar a tiempo.
                  </li>
                )}
                {overloadedDesigners.length > 0 && (
                  <li>
                    <span className="font-medium text-foreground">
                      {overloadedDesigners.length} diseñador
                      {overloadedDesigners.length !== 1 ? 'es' : ''}
                    </span>{' '}
                    con sobrecarga ({overloadedDesigners.map((d) => d.displayName).join(', ')}).
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
          </div>
          <div className="flex shrink-0 gap-2">
            {unassignedCount > 0 && (
              <button
                onClick={onAssign}
                disabled={assigning}
                className="flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <Users className="h-3.5 w-3.5" />
                {assigning ? 'Repartiendo…' : 'Repartir sin asignar'}
              </button>
            )}
            <Link
              href="/equipo"
              className="flex h-9 items-center gap-2 rounded-xl border border-border px-4 text-xs font-medium transition-colors hover:bg-muted/40"
            >
              Ver equipo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </Collapse>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiPlate label="Activas" value={activeCount} note="Pendientes esta semana" />
        <KpiPlate
          label="Entregados"
          value={deliveredCount}
          note="Completados esta semana"
          tone={deliveredCount > 0 ? 'success' : 'default'}
        />
        <KpiPlate
          label="Atrasados"
          value={overdueCount}
          note="Vencidos sin entregar"
          tone={overdueCount > 0 ? 'warning' : 'default'}
        />
        <KpiPlate
          label="Equipo activo"
          value={`${activeDesignersCount}/${designers.length}`}
          note="Con trabajo asignado"
          tone="primary"
        />
      </section>

      {/* Dos columnas: vencimientos + carga */}
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl border border-border bg-card p-lg shadow-raised">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">
                Próximas 48 horas
              </p>
              <h2 className="text-base font-semibold">Vencimientos</h2>
            </div>
            <Link
              href="/disenos"
              className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Ver todos →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin vencimientos próximos. Equipo al día.
            </p>
          ) : (
            <ul className="-mx-2">
              {upcoming.map((design) => {
                const deadline = new Date(design.deadline_at);
                const urgency = getUrgency(design.deadline_at, false);
                const isOverdue = urgency === 'overdue';
                const designerName = design.designer_id
                  ? designerNameMap.get(design.designer_id)
                  : null;
                const designerAvatar = design.designer_id
                  ? designerAvatarMap.get(design.designer_id)
                  : null;

                return (
                  <li
                    key={design.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
                  >
                    {designerName ? (
                      <UserAvatar
                        name={designerName}
                        src={designerAvatar}
                        className="h-8 w-8 shrink-0"
                        fallbackClassName="bg-muted text-foreground font-mono text-[11px] font-semibold"
                      />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-warning/15 font-mono text-[11px] font-semibold text-status-warning">
                        ?
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{design.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {design.player} ·{' '}
                        {designerName ? (
                          designerName
                        ) : (
                          <span className="text-status-warning">Sin asignar</span>
                        )}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-2">
                      <UrgencyDot level={urgency} />
                      <span
                        className={cn(
                          'font-mono tabular text-xs',
                          urgency === 'h24' || isOverdue
                            ? 'font-semibold text-destructive'
                            : 'text-muted-foreground'
                        )}
                      >
                        {isOverdue
                          ? `Vencido · ${formatDistanceToNowStrict(deadline, { locale: es })}`
                          : getDeadlineLabel(deadline)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-lg shadow-raised">
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">Carga del equipo</p>
          <h2 className="text-base font-semibold">Trabajo activo</h2>

          {designerLoads.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sin actividad esta semana.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {designerLoads.slice(0, 5).map((designer) => {
                const overloaded = designer.active > 5;
                return (
                  <li key={designer.id}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <UserAvatar
                          name={designer.name}
                          src={designer.avatar_url}
                          className="h-6 w-6"
                          fallbackClassName="bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                        />
                        {designer.displayName}
                      </span>
                      <span className="font-mono tabular text-xs text-muted-foreground">
                        {designer.active}
                        {overloaded && <span className="ml-1.5 text-status-warning">▲</span>}
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (designer.active / 8) * 100)}%` }}
                        transition={SPRINGS.smooth}
                        className={cn(
                          'h-1 rounded-full',
                          overloaded ? 'bg-status-warning' : 'bg-primary/50'
                        )}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {inactiveDesigners.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">
                Sin trabajo esta semana
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {inactiveDesigners.map((d) => d.displayName).join(', ')}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
