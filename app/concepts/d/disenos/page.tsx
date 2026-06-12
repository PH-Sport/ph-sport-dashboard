'use client';

/**
 * CONCEPTO D — Diseños: la mini base de datos completa, ahora con uso real:
 * búsqueda y filtros FUNCIONALES (estado + diseñador), navegación de semana,
 * urgencia con punto pulsante, tags de estado del jugador, cambio de estado
 * optimista (regresivo pide confirmación), eliminar con confirmación, y
 * vista por rol (el diseñador ve solo lo suyo, sin crear/editar/borrar).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  List,
  CalendarDays,
  ChevronDown,
  X,
  ExternalLink,
  CheckCircle2,
  Pencil,
  Trash2,
  Undo2,
  SearchX,
} from 'lucide-react';
import { SPRINGS, TWEENS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { DESIGNS_DB, TEAM, PERSONAS, CURRENT_WEEK } from '../../_data';
import { useRole } from '../_role';
import { UrgencyDot, PlayerStatusTag, ConfirmDialog, WeekNav } from '../_ui';
import { CreateDesignsModal } from './_create';

type Row = (typeof DESIGNS_DB)[number] & { id: number };

/* Junio 2026 — empieza en lunes; hoy es jueves 11 */
const TODAY = 11;
const CAL_EVENTS: Record<number, { t: string; tone: 'crit' | 'pend' | 'done' }[]> = {
  9: [
    { t: 'Doblete · post', tone: 'done' },
    { t: 'Asistencia · reel', tone: 'done' },
  ],
  10: [{ t: 'Stories previa', tone: 'crit' }],
  11: [
    { t: 'Matchday RM', tone: 'crit' },
    { t: 'Gol post', tone: 'crit' },
  ],
  12: [
    { t: 'Stats LaLiga', tone: 'pend' },
    { t: 'Cumpleaños', tone: 'pend' },
    { t: 'MVP del mes', tone: 'pend' },
  ],
  13: [
    { t: 'Renovación', tone: 'pend' },
    { t: 'Convocatoria', tone: 'pend' },
  ],
};

const EVENT_TONE: Record<string, string> = {
  crit: 'bg-destructive/15 text-destructive',
  pend: 'bg-panel-hover text-foreground/80',
  done: 'bg-status-success/15 text-status-success line-through',
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

export default function ConceptDDisenos() {
  const { role } = useRole();
  const isManager = role === 'manager';

  const [rows, setRows] = useState<Row[]>(() => DESIGNS_DB.map((d, i) => ({ ...d, id: i })));
  const [view, setView] = useState<'lista' | 'calendario'>('lista');
  const [week, setWeek] = useState(CURRENT_WEEK);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [designerFilter, setDesignerFilter] = useState('Todos');
  const [designerOpen, setDesignerOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusFilters = isManager
    ? ['Todos', 'Pendientes', 'Entregados', 'Sin asignar']
    : ['Todos', 'Pendientes', 'Entregados'];

  const detail = rows.find((r) => r.id === detailId) ?? null;

  const visible = rows.filter((r) => {
    if (!isManager && r.designer !== PERSONAS.designer.first) return false;
    if (query && !`${r.title} ${r.player}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    if (statusFilter === 'Pendientes' && r.delivered) return false;
    if (statusFilter === 'Entregados' && !r.delivered) return false;
    if (statusFilter === 'Sin asignar' && r.designer) return false;
    if (designerFilter !== 'Todos' && r.designer !== designerFilter) return false;
    return true;
  });

  const hasActiveFilters = query !== '' || statusFilter !== 'Todos' || designerFilter !== 'Todos';
  const resetFilters = () => {
    setQuery('');
    setStatusFilter('Todos');
    setDesignerFilter('Todos');
  };

  const setDelivered = (id: number, delivered: boolean) =>
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, delivered, urgency: delivered ? null : r.urgency } : r))
    );

  const setAssignee = (id: number, designer: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, designer } : r)));

  const closeDetail = () => {
    setDetailId(null);
    setAssignOpen(false);
  };

  return (
    <motion.div
      key={role}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
      className="space-y-4"
    >
      {/* Toolbar completa */}
      <motion.div variants={rise} className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative w-full xl:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, jugador…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm shadow-raised placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'h-8 rounded-full px-3.5 text-xs font-medium transition-colors',
                statusFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}

          {/* Filtro por diseñador — solo tiene sentido para el mánager */}
          {isManager && (
            <div className="relative">
              <button
                onClick={() => setDesignerOpen((v) => !v)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors',
                  designerFilter !== 'Todos'
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                )}
              >
                Diseñador · {designerFilter}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <AnimatePresence>
                {designerOpen && (
                  <motion.ul
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={SPRINGS.snappy}
                    className="glass-panel absolute left-0 top-10 z-40 w-44 rounded-xl p-1.5 shadow-overlay"
                  >
                    {['Todos', ...TEAM.map((m) => m.name)].map((name) => (
                      <li key={name}>
                        <button
                          onClick={() => {
                            setDesignerFilter(name);
                            setDesignerOpen(false);
                          }}
                          className={cn(
                            'w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors',
                            name === designerFilter
                              ? 'bg-primary/15 text-primary'
                              : 'text-panel-foreground/80 hover:bg-panel-hover'
                          )}
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="h-8 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Semana + toggle Lista/Calendario + Crear */}
        <div className="flex shrink-0 items-center gap-2">
          {view === 'lista' && <WeekNav week={week} setWeek={setWeek} />}
          <div className="flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-raised">
            {(
              [
                { id: 'lista', icon: List, label: 'Lista' },
                { id: 'calendario', icon: CalendarDays, label: 'Calendario' },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors',
                  view === v.id
                    ? 'bg-panel-hover text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            ))}
          </div>
          {isManager && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Crear
            </button>
          )}
        </div>
      </motion.div>

      {/* Vista Lista */}
      {view === 'lista' ? (
        week !== CURRENT_WEEK ? (
          <motion.section
            variants={rise}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-3xl text-center"
          >
            <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">
              {week < CURRENT_WEEK ? 'Sin diseños esa semana' : 'Aún no hay diseños programados'}
            </p>
            {isManager && week > CURRENT_WEEK && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-4 flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" />
                Crear diseños
              </button>
            )}
          </motion.section>
        ) : visible.length === 0 ? (
          <motion.section
            variants={rise}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-3xl text-center"
          >
            <SearchX className="h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No se encontraron resultados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Prueba con otros filtros o limpia la búsqueda.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 flex h-9 items-center rounded-xl border border-border px-4 text-xs font-medium transition-colors hover:bg-panel-hover/40"
            >
              Limpiar filtros
            </button>
          </motion.section>
        ) : (
          <motion.section
            variants={rise}
            className="rounded-2xl border border-border bg-card p-md shadow-raised"
          >
            <ul className="space-y-0.5">
              <AnimatePresence initial={false}>
                {visible.map((d) => (
                  <motion.li key={d.id} layout transition={SPRINGS.smooth}>
                    <button
                      onClick={() => {
                        setDetailId(d.id);
                        setAssignOpen(false);
                      }}
                      className="flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-panel-hover/40"
                    >
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold',
                          d.designer
                            ? 'bg-panel-hover text-foreground'
                            : 'bg-status-warning/15 text-status-warning'
                        )}
                      >
                        {d.designer ? d.designer.charAt(0) : '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'flex items-center gap-2 truncate text-sm font-medium',
                            d.delivered && 'text-muted-foreground line-through'
                          )}
                        >
                          {d.title}
                        </p>
                        <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                          <span className="truncate">
                            {d.player} ·{' '}
                            {d.designer ? (
                              d.designer
                            ) : (
                              <span className="text-status-warning">Sin asignar</span>
                            )}
                          </span>
                          <PlayerStatusTag status={d.playerStatus} />
                        </p>
                      </div>
                      <span
                        className={cn(
                          'hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider sm:inline',
                          d.delivered
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-panel-hover text-muted-foreground'
                        )}
                      >
                        {d.delivered ? 'Entregado' : 'Pendiente'}
                      </span>
                      <span className="flex w-32 shrink-0 items-center justify-end gap-2">
                        {!d.delivered && <UrgencyDot urgency={d.urgency} />}
                        <span
                          className={cn(
                            'font-mono tabular text-xs',
                            !d.delivered && (d.urgency === 'h24' || d.urgency === 'overdue')
                              ? 'font-semibold text-destructive'
                              : 'text-muted-foreground'
                          )}
                        >
                          {!d.delivered && d.urgency === 'overdue' ? 'Atrasada' : d.deadline}
                        </span>
                      </span>
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.section>
        )
      ) : (
        /* Vista Calendario — junio 2026 */
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-lg shadow-raised"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Junio 2026</h2>
            <span className="font-mono text-eyebrow uppercase text-muted-foreground">
              {visible.length} piezas este mes
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <span key={d} className="pb-2">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i + 1;
              const inMonth = day <= 30;
              const events = CAL_EVENTS[day] ?? [];
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[84px] rounded-lg border p-1.5',
                    inMonth ? 'border-border/60' : 'border-transparent opacity-30',
                    day === TODAY && 'border-primary/50 bg-primary/[0.04]'
                  )}
                >
                  <span
                    className={cn(
                      'font-mono tabular text-[11px]',
                      day === TODAY ? 'font-semibold text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {inMonth ? day : day - 30}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {events.map((e) => (
                      <div
                        key={e.t}
                        className={cn(
                          'cursor-pointer truncate rounded px-1 py-0.5 text-[10px] font-medium',
                          EVENT_TONE[e.tone]
                        )}
                      >
                        {e.t}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* ───── Modal: detalle de diseño (contenedor centrado, simétrico) ───── */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TWEENS.base}
              onClick={closeDetail}
              className="glass-scrim fixed inset-0 z-50"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={SPRINGS.smooth}
                className="pointer-events-auto flex max-h-[calc(100dvh-32px)] w-full max-w-md flex-col rounded-2xl border border-border bg-card shadow-overlay"
              >
                <div className="flex items-start justify-between gap-4 border-b border-border/60 p-lg">
                  <div className="min-w-0">
                    <p className="font-mono text-eyebrow uppercase text-muted-foreground">Diseño</p>
                    <h2 className="mt-1 truncate font-heading text-xl font-semibold tracking-tight">
                      {detail.title}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                      {detail.player}
                      <PlayerStatusTag status={detail.playerStatus} />
                    </p>
                  </div>
                  <button
                    onClick={closeDetail}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-panel-hover/60 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado</span>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                        detail.delivered
                          ? 'bg-status-success/15 text-status-success'
                          : 'bg-panel-hover text-foreground'
                      )}
                    >
                      {detail.delivered ? 'Entregado' : 'Pendiente'}
                    </span>
                  </div>

                  {/* Diseñador — reasignable en un clic para el mánager */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Diseñador</span>
                      {isManager ? (
                        <button
                          onClick={() => setAssignOpen((v) => !v)}
                          className="-mr-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium transition-colors hover:bg-panel-hover/40"
                        >
                          {detail.designer ? (
                            <>
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-semibold text-primary">
                                {detail.designer.charAt(0)}
                              </span>
                              {detail.designer}
                            </>
                          ) : (
                            <span className="text-status-warning">Sin asignar</span>
                          )}
                          <motion.span
                            initial={false}
                            animate={{ rotate: assignOpen ? 180 : 0 }}
                            transition={SPRINGS.snappy}
                          >
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          </motion.span>
                        </button>
                      ) : detail.designer ? (
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-semibold text-primary">
                            {detail.designer.charAt(0)}
                          </span>
                          {detail.designer}
                        </span>
                      ) : (
                        <span className="text-sm text-status-warning">Sin asignar</span>
                      )}
                    </div>
                    <AnimatePresence initial={false}>
                      {assignOpen && isManager && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={SPRINGS.smooth}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-1.5 pt-3">
                            {TEAM.map((m) => (
                              <button
                                key={m.name}
                                onClick={() => {
                                  setAssignee(detail.id, m.name);
                                  setAssignOpen(false);
                                }}
                                className={cn(
                                  'h-8 rounded-full border px-3 text-xs font-medium transition-colors',
                                  detail.designer === m.name
                                    ? 'border-primary/40 bg-primary/10 text-foreground'
                                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                )}
                              >
                                {m.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Entrega</span>
                    <span className="flex items-center gap-2">
                      {!detail.delivered && <UrgencyDot urgency={detail.urgency} />}
                      <span
                        className={cn(
                          'font-mono tabular text-sm',
                          !detail.delivered && (detail.urgency === 'h24' || detail.urgency === 'overdue')
                            ? 'font-semibold text-destructive'
                            : 'text-foreground'
                        )}
                      >
                        {!detail.delivered && detail.urgency === 'overdue'
                          ? `Atrasada · ${detail.deadline}`
                          : detail.deadline}
                      </span>
                    </span>
                  </div>

                  {detail.delivered ? (
                    <button
                      onClick={() => setConfirmRevert(true)}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-panel-hover/40 hover:text-foreground"
                    >
                      <Undo2 className="h-4 w-4" />
                      Volver a pendiente
                    </button>
                  ) : (
                    <button
                      onClick={() => setDelivered(detail.id, true)}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Marcar como entregado
                    </button>
                  )}

                  <div className={cn('grid gap-2', isManager ? 'grid-cols-2' : 'grid-cols-1')}>
                    {isManager && (
                      <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-panel-hover/40">
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    )}
                    <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-panel-hover/40">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Drive
                    </button>
                  </div>
                </div>

                {isManager && (
                  <div className="border-t border-border/60 p-lg pt-md">
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar diseño
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmaciones */}
      <ConfirmDialog
        open={confirmRevert}
        title="¿Volver a pendiente?"
        description={`«${detail?.title}» dejará de contar como entregado.`}
        confirmLabel="Volver atrás"
        onConfirm={() => {
          if (detail) setDelivered(detail.id, false);
          setConfirmRevert(false);
        }}
        onCancel={() => setConfirmRevert(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar este diseño?"
        description={`«${detail?.title}» se eliminará para todo el equipo. No se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (detail) {
            setRows((rs) => rs.filter((r) => r.id !== detail.id));
            closeDetail();
          }
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* ───── Modal: crear diseños (lote, tipos, asistente) ───── */}
      <CreateDesignsModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </motion.div>
  );
}
