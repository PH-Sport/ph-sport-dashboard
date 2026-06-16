'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Undo2, CalendarRange, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardPage } from '@/components/ui/dashboard-page';
import { MyWeekSkeleton } from '@/components/skeletons/my-week-skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SPRINGS, STAGGER, TWEENS } from '@/components/ui/animations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-context';
import { useConfirm } from '@/lib/hooks/use-confirm';
import { useMyWeek } from '@/lib/hooks/use-my-week';
import { useMyWeekData } from '@/lib/hooks/use-my-week-data';
import type { Design, DesignStatus } from '@/lib/types/design';
import { DesignDetailSheet } from '@/components/features/designs/design-detail-sheet';
import { UrgencyDot, getUrgency } from '@/components/ui/urgency-dot';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';

const STATUS_ORDER: Record<DesignStatus, number> = { BACKLOG: 0, DELIVERED: 1 };

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function MyWeekPage() {
  const router = useRouter();
  const { profile, status } = useAuth();
  const { items, isLoading, mutate } = useMyWeek();
  const { inProgress, deliveredGroups, deliveredCount } = useMyWeekData(items);

  const [updating, setUpdating] = useState<string | null>(null);
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Semanas de entregados abiertas (la más reciente, por defecto).
  const [openWeeks, setOpenWeeks] = useState<string[]>([]);
  useEffect(() => {
    if (deliveredGroups.length > 0) {
      setOpenWeeks((prev) => (prev.length === 0 ? [deliveredGroups[0].key] : prev));
    }
  }, [deliveredGroups]);

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
        title: '¿Volver a pendiente?',
        description: `«${design.title}» dejará de contar como entregada y volverá a tu cola.`,
        confirmText: 'Volver atrás',
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
      toast.success(newStatus === 'DELIVERED' ? 'Entregada' : 'Devuelta a pendientes');
      mutate();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };

  const openDetail = (id: string) => {
    setSelectedDesignId(id);
    setDetailOpen(true);
  };

  const hasAnyItems = inProgress.length > 0 || deliveredCount > 0;
  const showSkeleton = (isLoading && items.length === 0) || status === 'INITIALIZING';

  return (
    <DashboardPage
      title="Mi semana"
      icon={CalendarRange}
      subtitle="Tu cola, ordenada por entrega"
      loading={showSkeleton}
      skeleton={<MyWeekSkeleton />}
    >
      {!hasAnyItems ? (
        <Card>
          <CardContent className="flex h-64 items-center justify-center">
            <div className="space-y-3 text-center">
              <p className="font-medium text-foreground">Semana despejada</p>
              <p className="text-sm text-muted-foreground">
                Cuando te asignen trabajo, aparecerá aquí.
              </p>
              <Button asChild variant="outline">
                <Link href="/disenos">Ver el backlog del equipo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: STAGGER } } }}
          className="space-y-4"
        >
          {/* Pendientes */}
          <motion.section
            variants={rise}
            className="rounded-2xl border border-border bg-card p-lg shadow-raised"
          >
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-base font-semibold">Pendientes</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono tabular text-[11px] text-muted-foreground">
                {inProgress.length}
              </span>
            </div>
            {inProgress.length === 0 ? (
              <p className="py-md text-sm text-muted-foreground">
                Semana despejada — no te queda nada por entregar. 🎉
              </p>
            ) : (
              <ul className="-mx-2">
                <AnimatePresence initial={false}>
                  {inProgress.map((d) => {
                    const urgency = getUrgency(d.deadline_at, false);
                    const overdue = urgency === 'overdue';
                    const short = format(new Date(d.deadline_at), "d MMM · HH:mm", { locale: es });
                    const busy = updating === d.id;
                    return (
                      <motion.li
                        key={d.id}
                        layout
                        exit={{ opacity: 0, x: 24, transition: TWEENS.base }}
                        transition={SPRINGS.smooth}
                        className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
                      >
                        <UrgencyDot level={urgency} />
                        <button
                          type="button"
                          onClick={() => openDetail(d.id)}
                          className="min-w-0 flex-1 text-left outline-none"
                        >
                          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                            {d.title}
                            {d.player_status && <PlayerStatusTag status={d.player_status} />}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{d.player}</p>
                        </button>
                        <span
                          className={cn(
                            'shrink-0 font-mono tabular text-xs',
                            urgency === 'h24' || overdue
                              ? 'font-semibold text-destructive'
                              : 'text-muted-foreground'
                          )}
                        >
                          {overdue ? `Atrasada · ${short}` : short}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(d, 'DELIVERED')}
                          disabled={busy}
                          title="Marcar como entregada"
                          className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground opacity-100 transition-all hover:border-status-success/40 hover:bg-status-success/10 hover:text-status-success focus-visible:opacity-100 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Entregar
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </motion.section>

          {/* Entregadas, por semana */}
          {deliveredCount > 0 && (
            <motion.section
              variants={rise}
              className="rounded-2xl border border-border bg-card p-lg shadow-raised"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Entregadas</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono tabular text-[11px] text-muted-foreground">
                  {deliveredCount}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {deliveredGroups.map((w) => {
                  const open = openWeeks.includes(w.key);
                  return (
                    <div key={w.key} className="-mx-2">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenWeeks((ws) =>
                            open ? ws.filter((x) => x !== w.key) : [...ws, w.key]
                          )
                        }
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/40"
                      >
                        <motion.span
                          initial={false}
                          animate={{ rotate: open ? 0 : -90 }}
                          transition={SPRINGS.snappy}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.span>
                        <span className="flex-1 font-mono text-eyebrow uppercase text-muted-foreground">
                          {w.label}
                        </span>
                        <span className="font-mono tabular text-xs text-muted-foreground">
                          {w.items.length}
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={SPRINGS.smooth}
                            className="overflow-hidden"
                          >
                            {w.items.map((d) => {
                              const busy = updating === d.id;
                              const short = format(new Date(d.deadline_at), "d MMM", { locale: es });
                              return (
                                <motion.li
                                  key={d.id}
                                  layout
                                  className="group flex items-center gap-3 rounded-xl py-2 pl-9 pr-2 transition-colors hover:bg-muted/40"
                                >
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-success" />
                                  <button
                                    type="button"
                                    onClick={() => openDetail(d.id)}
                                    className="min-w-0 flex-1 truncate text-left text-sm text-muted-foreground line-through outline-none"
                                  >
                                    {d.title}
                                  </button>
                                  <span className="shrink-0 font-mono tabular text-xs text-muted-foreground">
                                    {short}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(d, 'BACKLOG')}
                                    disabled={busy}
                                    title="Volver a pendiente"
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-100 transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100"
                                  >
                                    {busy ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Undo2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </motion.li>
                              );
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </motion.div>
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
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setTimeout(() => setSelectedDesignId(null), 300);
        }}
        onDesignUpdated={() => mutate()}
      />
    </DashboardPage>
  );
}
