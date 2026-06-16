'use client';

import { useEffect, useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { WeekNav } from '@/components/ui/week-nav';
import { SPRINGS, STAGGER } from '@/components/ui/animations';
import { CalendarRange, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { TeamSkeleton } from '@/components/skeletons/team-skeleton';
import { useTeamData, type DesignerWithDesigns } from '@/lib/hooks/use-team-data';
import { DesignDetailSheet } from '@/components/features/designs/design-detail-sheet';
import { UrgencyDot, getUrgency } from '@/components/ui/urgency-dot';
import { cn } from '@/lib/utils';
import type { Design } from '@/lib/types/design';

const OVERLOAD_THRESHOLD = 5;

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

/** Ordena: pendientes por entrega ascendente, luego entregados. */
function sortDesigns(designs: Design[]): Design[] {
  return [...designs].sort((a, b) => {
    const da = a.status === 'DELIVERED' ? 1 : 0;
    const db = b.status === 'DELIVERED' ? 1 : 0;
    if (da !== db) return da - db;
    return new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime();
  });
}

function DesignerPlate({
  designer,
  onHeaderClick,
  onDesignClick,
}: {
  designer: DesignerWithDesigns;
  onHeaderClick: () => void;
  onDesignClick: (id: string) => void;
}) {
  const designs = sortDesigns(designer.designs);
  const active = designer.designs.filter((d) => d.status === 'BACKLOG').length;
  const overloaded = active > OVERLOAD_THRESHOLD;

  return (
    <motion.section
      variants={rise}
      className="rounded-2xl border border-border bg-card p-lg shadow-raised"
    >
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onHeaderClick}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
            {designer.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-1 truncate text-base font-semibold">
              {designer.full_name}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
            </h2>
            <p className="font-mono tabular text-xs text-muted-foreground">{active} activas</p>
          </div>
        </button>
        {overloaded && (
          <span className="shrink-0 rounded-full bg-status-warning/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-status-warning">
            Sobrecarga
          </span>
        )}
      </div>

      {designs.length === 0 ? (
        <p className="px-2 py-md text-sm text-muted-foreground">Sin asignaciones esta semana.</p>
      ) : (
        <ul className="-mx-2">
          {designs.map((d) => {
            const delivered = d.status === 'DELIVERED';
            const urgency = getUrgency(d.deadline_at, delivered);
            const overdue = urgency === 'overdue';
            const short = format(new Date(d.deadline_at), "d MMM · HH:mm", { locale: es });
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onDesignClick(d.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/40"
                >
                  {delivered ? (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-success" />
                  ) : urgency ? (
                    <UrgencyDot level={urgency} className="!h-1.5 !w-1.5" />
                  ) : (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm',
                      delivered ? 'text-muted-foreground line-through' : 'font-medium text-foreground'
                    )}
                  >
                    {d.title}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-mono tabular text-xs',
                      !delivered && (urgency === 'h24' || overdue)
                        ? 'font-semibold text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {delivered ? 'Entregado' : overdue ? `Atrasada · ${short}` : short}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}

export default function TeamPage() {
  const router = useRouter();
  const { profile, status } = useAuth();
  const authLoading = status === 'INITIALIZING';
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const weekStart = useMemo(() => startOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);
  const weekEnd = useMemo(() => endOfWeek(selectedWeek, { weekStartsOn: 1 }), [selectedWeek]);

  const { designers, isLoading, mutate } = useTeamData(weekStart, weekEnd);

  // Solo admins; los diseñadores van a su propia semana.
  useEffect(() => {
    if (!authLoading && profile && profile.role !== 'ADMIN') {
      router.replace('/mi-semana');
    }
  }, [authLoading, profile, router]);

  const handleDesignerClick = (designerId: string) => {
    const param = format(weekStart, 'yyyy-MM-dd');
    router.push(`/equipo/${designerId}?semana=${param}`);
  };

  const handleDesignClick = (id: string) => {
    setSelectedDesignId(id);
    setDetailOpen(true);
  };

  if (!authLoading && profile && profile.role !== 'ADMIN') {
    return null;
  }

  const weekLabel = `${format(weekStart, "d 'de' MMM", { locale: es })} - ${format(weekEnd, "d 'de' MMM", { locale: es })}`;
  const isCurrentWeek =
    format(weekStart, 'yyyy-MM-dd') ===
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const showSkeleton = (isLoading && designers.length === 0) || authLoading;

  return (
    <DashboardPage
      title="Semana"
      icon={CalendarRange}
      subtitle="Quién lleva qué esta semana"
      loading={showSkeleton}
      skeleton={<TeamSkeleton />}
      actions={
        <WeekNav
          label={weekLabel}
          isCurrent={isCurrentWeek}
          onPrev={() => setSelectedWeek((p) => subWeeks(p, 1))}
          onNext={() => setSelectedWeek((p) => addWeeks(p, 1))}
          onCurrent={() => setSelectedWeek(new Date())}
        />
      }
    >
      {designers.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <div className="space-y-3 text-center">
              <p className="font-medium text-foreground">Aún no hay diseñadores en el equipo</p>
              <p className="text-sm text-muted-foreground">
                Invítalos y aparecerán aquí con su carga semanal.
              </p>
              <Button asChild variant="outline">
                <Link href="/ajustes?tab=miembros">Invitar al equipo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: STAGGER } } }}
          className="grid gap-4 lg:grid-cols-2"
        >
          {designers.map((designer) => (
            <DesignerPlate
              key={designer.id}
              designer={designer}
              onHeaderClick={() => handleDesignerClick(designer.id)}
              onDesignClick={handleDesignClick}
            />
          ))}
        </motion.div>
      )}

      <DesignDetailSheet
        designId={selectedDesignId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setTimeout(() => setSelectedDesignId(null), 300);
        }}
        onDesignUpdated={() => mutate()}
        isAdmin
      />
    </DashboardPage>
  );
}
