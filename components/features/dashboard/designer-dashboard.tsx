'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { UrgencyDot, getUrgency } from '@/components/ui/urgency-dot';
import { Collapse } from '@/components/ui/collapse';
import { Surface } from '@/components/ui/surface';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { Design } from '@/lib/types/design';
import { useDesigners } from '@/lib/hooks/use-designers';

interface DesignerDashboardProps {
  items: Design[];
  userId: string;
  /** Abre el detalle del diseño al tocar una fila de "Tu cola". */
  onDesignClick: (id: string) => void;
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
    // Columna de un bloque compartido en movil: sin superficie ni borde
    // propios. El separador vertical lo pone `divide-x` del contenedor (spec §7.1).
    // Escritorio (md:): recupera su tarjeta propia, borde + fondo + sombra,
    // igual que antes de la migracion a movil.
    <div className="flex-1 p-sm sm:p-lg md:rounded-2xl md:border md:border-border md:bg-card md:shadow-raised">
      <p className="font-mono text-eyebrow uppercase tracking-[0.08em] text-muted-foreground sm:tracking-[0.18em]">
        {label}
      </p>
      <p className={cn('mt-2 font-mono tabular text-3xl sm:text-4xl font-semibold leading-none', TONE_TEXT[tone])}>
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

export function DesignerDashboard({ items, userId, onDesignClick }: DesignerDashboardProps) {
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
          displayName: designer.displayName,
          avatar_url: designer.avatar_url,
          active: designerDesigns.filter((d) => d.status !== 'DELIVERED').length,
        };
      })
      .sort((a, b) => b.active - a.active)
      .slice(0, TEAMMATE_LIMIT);
  }, [items, designers, userId]);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero de urgencia — la entrega más próxima manda cuando vence en <24 h */}
      <Collapse open={isUrgent}>
        {nextDeadline && (
          <section className="flex flex-col gap-4 rounded-surface bg-destructive/[0.06] p-md sm:p-lg md:flex-row md:items-center md:justify-between md:rounded-2xl md:border md:border-destructive/30 md:shadow-raised">
            <div className="flex items-center gap-5">
              <span className="font-mono tabular text-4xl sm:text-5xl font-semibold leading-none text-destructive">
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
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 md:h-9"
            >
              Ver mi semana
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        )}
      </Collapse>

      {/* Movil: UN bloque, tres columnas separadas por hairline. Antes eran tres
          superficies con borde — 3 bordes + 3 sombras diciendo lo que el tono ya
          dice, y solo 77px utiles por tarjeta.
          Escritorio (md:): vuelve la rejilla de tres tarjetas de hoy, intacta.

          NO se usa <Surface> aqui: Surface asume que el bloque es la superficie
          en ambos tamanos, y en los KPI la superficie cambia de sitio segun el
          ancho (contenedor en movil, cada tarjeta en escritorio). */}
      <section className="flex rounded-surface bg-card divide-x divide-border md:grid md:grid-cols-3 md:gap-4 md:rounded-none md:bg-transparent md:divide-x-0">
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
        <Surface as="section" variant="plain">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">Tu cola</p>
              <h2 className="text-base font-semibold">Pendientes</h2>
            </div>
            <Link
              href="/mi-semana"
              className="flex min-h-11 shrink-0 items-center text-xs font-medium text-muted-foreground transition-colors hover:text-primary md:min-h-0"
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
                  <li key={design.id}>
                  {/* Fila-botón: el hover ya prometía interacción; ahora abre el detalle. */}
                  <button
                    type="button"
                    onClick={() => onDesignClick(design.id)}
                    className="flex min-h-14 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/40 md:min-h-0"
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
                  </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Surface>

        <Surface as="section" variant="grouped">
          <p className="font-mono text-eyebrow uppercase text-muted-foreground">Compañeros</p>
          <h2 className="text-base font-semibold">El resto del equipo</h2>
          {teammates.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Sin compañeros con trabajo activo.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {teammates.map((mate) => (
                <li key={mate.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserAvatar
                      name={mate.name}
                      src={mate.avatar_url}
                      className="h-6 w-6"
                      fallbackClassName="bg-muted font-mono text-[10px] font-semibold"
                    />
                    {mate.displayName}
                  </span>
                  <span className="font-mono tabular text-xs text-muted-foreground">
                    {mate.active} activas
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </div>
    </div>
  );
}
