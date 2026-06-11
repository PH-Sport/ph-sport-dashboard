'use client';

/**
 * CONCEPTO D — Diseños: la mini base de datos completa.
 * Búsqueda + estado + DISEÑADOR + toggle Lista/Calendario + Crear.
 * Modales funcionando: detalle (sheet derecha) y crear (modal centrado),
 * ambos sobre velo de cristal esmerilado.
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
} from 'lucide-react';
import { SPRINGS, TWEENS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { DESIGNS_DB, TEAM } from '../../_data';

type DesignRow = (typeof DESIGNS_DB)[number];

const STATUS_FILTERS = ['Todos', 'Pendientes', 'Entregados', 'Sin asignar'];

/* Junio 2026 — empieza en lunes; hoy es jueves 11 */
const TODAY = 11;
const CAL_EVENTS: Record<number, { t: string; tone: 'crit' | 'pend' | 'done' }[]> = {
  9: [
    { t: 'Doblete · post', tone: 'done' },
    { t: 'Asistencia · reel', tone: 'done' },
  ],
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
  const [view, setView] = useState<'lista' | 'calendario'>('lista');
  const [designerFilter, setDesignerFilter] = useState('Todos');
  const [designerOpen, setDesignerOpen] = useState(false);
  const [detail, setDetail] = useState<DesignRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <motion.div
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
            placeholder="Buscar por título, jugador…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm shadow-raised placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f, i) => (
            <button
              key={f}
              className={cn(
                'h-8 rounded-full px-3.5 text-xs font-medium transition-colors',
                i === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              )}
            >
              {f}
            </button>
          ))}

          {/* Filtro por diseñador */}
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
        </div>

        {/* Toggle Lista/Calendario + Crear */}
        <div className="flex shrink-0 items-center gap-2">
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
          <button
            onClick={() => setCreateOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Crear
          </button>
        </div>
      </motion.div>

      {/* Vista Lista */}
      {view === 'lista' ? (
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-md shadow-raised"
        >
          <ul className="space-y-0.5">
            {DESIGNS_DB.map((d) => (
              <li key={d.title}>
                <button
                  onClick={() => setDetail(d)}
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
                        'truncate text-sm font-medium',
                        d.delivered && 'text-muted-foreground line-through'
                      )}
                    >
                      {d.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.player} ·{' '}
                      {d.designer ? d.designer : <span className="text-status-warning">Sin asignar</span>}
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
                  <span
                    className={cn(
                      'shrink-0 font-mono tabular text-xs',
                      d.critical && !d.delivered
                        ? 'font-semibold text-destructive'
                        : 'text-muted-foreground'
                    )}
                  >
                    {d.deadline}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </motion.section>
      ) : (
        /* Vista Calendario — junio 2026 */
        <motion.section
          variants={rise}
          className="rounded-2xl border border-border bg-card p-lg shadow-raised"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Junio 2026</h2>
            <span className="font-mono text-eyebrow uppercase text-muted-foreground">
              9 piezas este mes
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

      {/* ───── Modal: detalle de diseño (sheet derecha sobre velo de cristal) ───── */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TWEENS.base}
              onClick={() => setDetail(null)}
              className="glass-scrim fixed inset-0 z-50"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={SPRINGS.smooth}
              className="fixed inset-y-3 right-3 z-50 flex w-[min(420px,calc(100vw-24px))] flex-col rounded-2xl border border-border bg-card shadow-overlay"
            >
              <div className="flex items-start justify-between gap-4 border-b border-border/60 p-lg">
                <div className="min-w-0">
                  <p className="font-mono text-eyebrow uppercase text-muted-foreground">Diseño</p>
                  <h2 className="mt-1 truncate font-heading text-xl font-semibold tracking-tight">
                    {detail.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{detail.player}</p>
                </div>
                <button
                  onClick={() => setDetail(null)}
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Diseñador</span>
                  {detail.designer ? (
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Entrega</span>
                  <span
                    className={cn(
                      'font-mono tabular text-sm',
                      detail.critical && !detail.delivered
                        ? 'font-semibold text-destructive'
                        : 'text-foreground'
                    )}
                  >
                    {detail.deadline}
                  </span>
                </div>

                {!detail.delivered && (
                  <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                    <CheckCircle2 className="h-4 w-4" />
                    Marcar como entregado
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-panel-hover/40">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-panel-hover/40">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Drive
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ───── Modal: crear diseño (centrado sobre velo de cristal) ───── */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TWEENS.base}
              onClick={() => setCreateOpen(false)}
              className="glass-scrim fixed inset-0 z-50"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={SPRINGS.smooth}
                className="pointer-events-auto w-full max-w-lg rounded-2xl border border-border bg-card shadow-overlay"
              >
                <div className="flex items-center justify-between border-b border-border/60 p-lg">
                  <div>
                    <p className="font-mono text-eyebrow uppercase text-muted-foreground">Nuevo</p>
                    <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
                      Crear diseño
                    </h2>
                  </div>
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-panel-hover/60 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 p-lg">
                  <div>
                    <label className="font-mono text-eyebrow uppercase text-muted-foreground">
                      Jugador
                    </label>
                    <input
                      placeholder="Vinicius Jr"
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-mono text-eyebrow uppercase text-muted-foreground">
                        Local
                      </label>
                      <input
                        placeholder="Real Madrid"
                        className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-eyebrow uppercase text-muted-foreground">
                        Visitante
                      </label>
                      <input
                        placeholder="FC Barcelona"
                        className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-mono text-eyebrow uppercase text-muted-foreground">
                      Entrega
                    </label>
                    <input
                      defaultValue="13 jun · 18:00"
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary">
                    <Plus className="h-3.5 w-3.5" />
                    Título y carpeta Drive (opcional)
                  </button>
                </div>

                <div className="flex justify-end gap-2 border-t border-border/60 p-lg pt-md">
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="flex h-10 items-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-panel-hover/40 hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setCreateOpen(false)}
                    className="flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Crear 1 diseño
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
