'use client';

/**
 * CONCEPTO D — Semana. Dos caras según rol:
 * - Mánager: placas por diseñador (quién lleva qué).
 * - Diseñador: MI semana — pendientes con entrega en un toque (optimista)
 *   y entregadas agrupadas por semana, plegables. Volver atrás pide confirmación.
 * Navegación de semanas funcional con estados vacíos.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Undo2, CalendarRange } from 'lucide-react';
import { SPRINGS, STAGGER, TWEENS } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { CURRENT_WEEK, WEEK_GROUPS, MY_WEEK } from '../../_data';
import { useRole } from '../_role';
import { UrgencyDot, ConfirmDialog, WeekNav } from '../_ui';

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

type PendingItem = (typeof MY_WEEK.pending)[number];
type DeliveredItem = { title: string; player: string; deadline: string };

function EmptyWeek({ past, designer }: { past: boolean; designer: boolean }) {
  return (
    <motion.section
      variants={rise}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-3xl text-center"
    >
      <CalendarRange className="h-8 w-8 text-muted-foreground/40" />
      <p className="mt-3 text-sm font-medium">
        {past ? 'Sin actividad esa semana' : 'Aún no hay diseños programados'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {past
          ? 'No quedó nada registrado.'
          : designer
            ? 'Cuando te asignen trabajo, aparecerá aquí.'
            : 'Crea los diseños de la semana cuando tengas el calendario.'}
      </p>
    </motion.section>
  );
}

/* ───────────────────────── Cara Mánager ───────────────────────── */

function ManagerSemana() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {WEEK_GROUPS.map((group) => (
        <motion.section
          key={group.designer}
          variants={rise}
          className="rounded-2xl border border-border bg-card p-lg shadow-raised"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
              {group.designer.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold">{group.designer}</h2>
              <p className="font-mono tabular text-xs text-muted-foreground">
                {group.active} activas
              </p>
            </div>
            {group.overloaded && (
              <span className="rounded-full bg-status-warning/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-status-warning">
                Sobrecarga
              </span>
            )}
          </div>
          <ul className="-mx-2">
            {group.designs.map((d) => (
              <li
                key={d.title}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
              >
                {d.delivered ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-success" />
                ) : d.urgency ? (
                  <UrgencyDot urgency={d.urgency} className="!h-1.5 !w-1.5" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                )}
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm',
                    d.delivered
                      ? 'text-muted-foreground line-through'
                      : 'font-medium text-foreground'
                  )}
                >
                  {d.title}
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono tabular text-xs',
                    !d.delivered && (d.urgency === 'h24' || d.urgency === 'overdue')
                      ? 'font-semibold text-destructive'
                      : 'text-muted-foreground'
                  )}
                >
                  {d.delivered ? 'Entregado' : d.urgency === 'overdue' ? `Atrasada · ${d.deadline}` : d.deadline}
                </span>
              </li>
            ))}
          </ul>
        </motion.section>
      ))}
    </div>
  );
}

/* ───────────────────────── Cara Diseñador ───────────────────────── */

function DesignerSemana() {
  const [pending, setPending] = useState<PendingItem[]>(MY_WEEK.pending);
  const [weeks, setWeeks] = useState(MY_WEEK.deliveredWeeks);
  const [openWeeks, setOpenWeeks] = useState<string[]>(['Esta semana']);
  const [revertTarget, setRevertTarget] = useState<DeliveredItem | null>(null);

  const deliver = (item: PendingItem) => {
    setPending((p) => p.filter((d) => d.title !== item.title));
    setWeeks((ws) =>
      ws.map((w, i) =>
        i === 0
          ? { ...w, designs: [{ title: item.title, player: item.player, deadline: item.deadline }, ...w.designs] }
          : w
      )
    );
  };

  const revert = (item: DeliveredItem) => {
    setWeeks((ws) => ws.map((w) => ({ ...w, designs: w.designs.filter((d) => d.title !== item.title) })));
    setPending((p) => [...p, { ...item, urgency: null }]);
  };

  return (
    <div className="space-y-4">
      {/* Pendientes */}
      <motion.section
        variants={rise}
        className="rounded-2xl border border-border bg-card p-lg shadow-raised"
      >
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-base font-semibold">Pendientes</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono tabular text-[11px] text-muted-foreground">
            {pending.length}
          </span>
        </div>
        {pending.length === 0 ? (
          <p className="py-md text-sm text-muted-foreground">
            Semana despejada — no te queda nada por entregar. 🎉
          </p>
        ) : (
          <ul className="-mx-2">
            <AnimatePresence initial={false}>
              {pending.map((d) => (
                <motion.li
                  key={d.title}
                  layout
                  exit={{ opacity: 0, x: 24, transition: TWEENS.base }}
                  transition={SPRINGS.smooth}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/40"
                >
                  <UrgencyDot urgency={d.urgency} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.player}</p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 font-mono tabular text-xs',
                      d.urgency === 'h24' || d.urgency === 'overdue'
                        ? 'font-semibold text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {d.urgency === 'overdue' ? `Atrasada · ${d.deadline}` : d.deadline}
                  </span>
                  <button
                    onClick={() => deliver(d)}
                    title="Marcar como entregada"
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground opacity-0 transition-all hover:border-status-success/40 hover:bg-status-success/10 hover:text-status-success focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Entregar
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.section>

      {/* Entregadas, por semana */}
      <motion.section
        variants={rise}
        className="rounded-2xl border border-border bg-card p-lg shadow-raised"
      >
        <h2 className="text-base font-semibold">Entregadas</h2>
        <div className="mt-2 space-y-1">
          {weeks.map((w) => {
            const open = openWeeks.includes(w.label);
            return (
              <div key={w.label} className="-mx-2">
                <button
                  onClick={() =>
                    setOpenWeeks((ws) =>
                      open ? ws.filter((x) => x !== w.label) : [...ws, w.label]
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
                    {w.designs.length}
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
                      {w.designs.length === 0 && (
                        <li className="px-9 py-2 text-xs text-muted-foreground">Nada entregado.</li>
                      )}
                      {w.designs.map((d) => (
                        <motion.li
                          key={d.title}
                          layout
                          className="group flex items-center gap-3 rounded-xl py-2 pl-9 pr-2 transition-colors hover:bg-muted/40"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-success" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-muted-foreground line-through">
                              {d.title}
                            </p>
                          </div>
                          <span className="shrink-0 font-mono tabular text-xs text-muted-foreground">
                            {d.deadline}
                          </span>
                          <button
                            onClick={() => setRevertTarget(d)}
                            title="Volver a pendiente"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.section>

      <ConfirmDialog
        open={revertTarget !== null}
        title="¿Volver a pendiente?"
        description={`«${revertTarget?.title}» dejará de contar como entregada y volverá a tu cola.`}
        confirmLabel="Volver atrás"
        onConfirm={() => {
          if (revertTarget) revert(revertTarget);
          setRevertTarget(null);
        }}
        onCancel={() => setRevertTarget(null)}
      />
    </div>
  );
}

export default function ConceptDSemana() {
  const { role } = useRole();
  const [week, setWeek] = useState(CURRENT_WEEK);

  return (
    <motion.div
      key={role}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
      className="space-y-4"
    >
      <motion.div variants={rise} className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {role === 'manager' ? 'Trabajo del equipo' : 'Mi semana'}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {role === 'manager' ? 'Quién lleva qué esta semana' : 'Tu cola, ordenada por entrega'}
          </p>
        </div>
        <WeekNav week={week} setWeek={setWeek} />
      </motion.div>

      {week !== CURRENT_WEEK ? (
        <EmptyWeek past={week < CURRENT_WEEK} designer={role === 'designer'} />
      ) : role === 'manager' ? (
        <ManagerSemana />
      ) : (
        <DesignerSemana />
      )}
    </motion.div>
  );
}
