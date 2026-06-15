'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { UrgencyDot, getUrgency } from '@/components/ui/urgency-dot';
import { cn } from '@/lib/utils';
import type { Design } from '@/lib/types/design';
import { useDesigners } from '@/lib/hooks/use-designers';

interface DesignerDashboardProps {
  items: Design[];
  userId: string;
}

const UPCOMING_LIMIT = 5;
const TEAMMATE_LIMIT = 4;

const TONE_TEXT = {
  default: 'text-foreground',
  success: 'text-status-success',
  primary: 'text-primary',
} as const;

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

export function DesignerDashboard({ items, userId }: DesignerDashboardProps) {
  const { designers } = useDesigners();

  const myDesigns = useMemo(() => items.filter((d) => d.designer_id === userId), [items, userId]);

  const activeDesigns = myDesigns.filter((d) => d.status === 'BACKLOG').length;
  const completedThisWeek = myDesigns.filter((d) => d.status === 'DELIVERED').length;
  const total = activeDesigns + completedThisWeek;
  const completionPct = total > 0 ? Math.round((completedThisWeek / total) * 100) : 0;

  const upcoming = useMemo(() => {
    return myDesigns
      .filter((d) => d.status !== 'DELIVERED')
      .sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
      .slice(0, UPCOMING_LIMIT);
  }, [myDesigns]);

  const nextDeadline = upcoming[0];
  const hoursUntilNext = nextDeadline
    ? (new Date(nextDeadline.deadline_at).getTime() - Date.now()) / (1000 * 60 * 60)
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
        };
      })
      .sort((a, b) => b.active - a.active)
      .slice(0, TEAMMATE_LIMIT);
  }, [items, designers, userId]);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero de urgencia — la entrega más próxima manda cuando vence en <24 h */}
      {isUrgent && nextDeadline && (
        <section className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-destructive/[0.06] p-lg shadow-raised md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <span className="font-mono tabular text-5xl font-semibold leading-none text-destructive">
              {Math.floor(hoursUntilNext!)} h
            </span>
            <div>
              <p className="font-mono text-eyebrow uppercase text-destructive">Entrega más próxima</p>
              <p className="mt-0.5 text-sm font-medium">{nextDeadline.title}</p>
              <p className="text-xs text-muted-foreground">
                {nextDeadline.player} ·{' '}
                {format(new Date(nextDeadline.deadline_at), "d 'de' MMM 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          </div>
          <Link
            href="/mi-semana"
            className="flex h-9 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver mi semana
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}

      {/* KPIs personales */}
      <section className="grid grid-cols-3 gap-4">
        <KpiPlate
          label="Pendientes"
          value={activeDesigns}
          note="En tu cola esta semana"
          tone={activeDesigns > 0 ? 'primary' : 'default'}
        />
        <KpiPlate
          label="Entregadas"
          value={completedThisWeek}
          note="Esta semana"
          tone={completedThisWeek > 0 ? 'success' : 'default'}
        />
        <KpiPlate label="Completado" value={`${completionPct}%`} note="De tu semana" tone="primary" />
      </section>

      {/* Dos columnas: tu cola + compañeros (secundario a propósito) */}
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl border border-border bg-card p-lg shadow-raised">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">Tu cola</p>
              <h2 className="text-base font-semibold">Pendientes</h2>
            </div>
            <Link
              href="/mi-semana"
              className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Ver mi semana →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin entregas pendientes. Buen trabajo.
            </p>
          ) : (
            <ul className="-mx-2">
              {upcoming.map((design) => {
                const urgency = getUrgency(design.deadline_at, false);
                const deadline = new Date(design.deadline_at);
                const label =
                  urgency === 'overdue'
                    ? 'Atrasada'
                    : `${format(deadline, 'd MMM', { locale: es })} · ${format(deadline, 'HH:mm')}`;
                return (
                  <li
                    key={design.id}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
                  >
                    <UrgencyDot level={urgency} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{design.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{design.player}</p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 font-mono tabular text-xs',
                        urgency === 'h24' || urgency === 'overdue'
                          ? 'font-semibold text-destructive'
                          : 'text-muted-foreground'
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-lg shadow-raised">
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">Compañeros</p>
          <h2 className="text-base font-semibold">El resto del equipo</h2>
          {teammates.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sin compañeros con trabajo activo.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {teammates.map((mate) => (
                <li key={mate.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold">
                      {mate.name.charAt(0)}
                    </span>
                    {mate.name}
                  </span>
                  <span className="font-mono tabular text-xs text-muted-foreground">
                    {mate.active} activas
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
