'use client';

/**
 * CONCEPTO D — Modal «Crear diseños».
 * Repiensa la creación: SIEMPRE en lote (añades piezas a una lista y creas
 * todas de una), por TIPOS (no solo Matchday: presentación, cumpleaños,
 * firma…), y con pestaña Asistente: pegas el calendario/texto del club y
 * te genera el borrador de filas para revisar (mock del intake con IA).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkles, ChevronDown, Trash2 } from 'lucide-react';
import { SPRINGS, TWEENS } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { DESIGN_TYPES, ASSISTANT_DRAFT, TEAM, type DesignType } from '../../_data';

type BatchRow = {
  id: number;
  type: DesignType;
  player: string;
  home: string;
  away: string;
  title: string;
  deadline: string;
  designer: string;
};

const AUTO = 'Reparto automático';

const TITLE_PLACEHOLDER: Record<DesignType, string> = {
  Matchday: '',
  Presentación: 'Presentación · post',
  Cumpleaños: 'Cumpleaños · stories',
  Firma: 'Firma · anuncio',
  Otro: 'Título del diseño',
};

const EMPTY_DRAFT = { player: '', home: '', away: '', title: '', deadline: '' };

const inputCls =
  'mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring';
const labelCls = 'font-mono text-eyebrow uppercase text-muted-foreground';

export function CreateDesignsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<'manual' | 'asistente'>('manual');
  const [type, setType] = useState<DesignType>('Matchday');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [batch, setBatch] = useState<BatchRow[]>([]);
  const [nextId, setNextId] = useState(1);
  const [moreOpen, setMoreOpen] = useState(false);
  const [designer, setDesigner] = useState(AUTO);
  const [editRowId, setEditRowId] = useState<number | null>(null);
  const [assistantText, setAssistantText] = useState('');

  const draftValid = draft.player.trim() !== '' && draft.deadline.trim() !== '';
  const count = batch.length + (draftValid ? 1 : 0);

  const set = (field: keyof typeof EMPTY_DRAFT) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));

  const addToBatch = () => {
    if (!draftValid) return;
    setBatch((b) => [...b, { id: nextId, type, designer, ...draft }]);
    setNextId((n) => n + 1);
    setDraft(EMPTY_DRAFT);
  };

  const generateDraft = () => {
    setBatch(ASSISTANT_DRAFT.map((r, i) => ({ id: 100 + i, designer: AUTO, ...r })));
    setNextId(200);
    setMode('manual');
    setAssistantText('');
  };

  const close = () => {
    onClose();
    setDraft(EMPTY_DRAFT);
    setBatch([]);
    setMode('manual');
    setMoreOpen(false);
    setEditRowId(null);
    setDesigner(AUTO);
  };

  const hasAuto =
    batch.some((r) => r.designer === AUTO) || (draftValid && designer === AUTO);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TWEENS.base}
            onClick={close}
            className="glass-scrim fixed inset-0 z-50"
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={SPRINGS.smooth}
              className="pointer-events-auto flex max-h-[calc(100dvh-32px)] w-full max-w-xl flex-col rounded-2xl border border-border bg-card shadow-overlay"
            >
              {/* Header con conmutador Manual / Asistente */}
              <div className="flex items-center justify-between gap-4 border-b border-border/60 p-lg pb-md">
                <div>
                  <p className="font-mono text-eyebrow uppercase text-muted-foreground">Nuevo</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
                    Crear diseños
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 rounded-xl border border-border bg-background p-1">
                    <button
                      onClick={() => setMode('manual')}
                      className={cn(
                        'h-8 rounded-lg px-3 text-xs font-medium transition-colors',
                        mode === 'manual'
                          ? 'bg-panel-hover text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Manual
                    </button>
                    <button
                      onClick={() => setMode('asistente')}
                      className={cn(
                        'flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors',
                        mode === 'asistente'
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Asistente
                    </button>
                  </div>
                  <button
                    onClick={close}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-panel-hover/60 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {mode === 'asistente' ? (
                  /* ── Asistente: texto del club → borrador de filas ── */
                  <div className="space-y-4 p-lg">
                    <p className="text-sm text-muted-foreground">
                      Pega el calendario del club, una lista de tareas o el mensaje que te hayan
                      pasado. El asistente lo convierte en filas listas para revisar.
                    </p>
                    <textarea
                      value={assistantText}
                      onChange={(e) => setAssistantText(e.target.value)}
                      rows={6}
                      placeholder={
                        'Ej.: «Sábado 13:00 Real Madrid–Getafe (Mbappé). El viernes cumple Courtois. El domingo presentamos a Zubimendi.»'
                      }
                      className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground/70">
                      También podrás arrastrar una captura o un PDF.
                    </p>
                    <button
                      onClick={generateDraft}
                      disabled={assistantText.trim() === ''}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generar borrador
                    </button>
                  </div>
                ) : (
                  /* ── Manual: tipo → campos → añadir al lote ── */
                  <div className="space-y-4 p-lg">
                    {/* Tipo de pieza */}
                    <div>
                      <span className={labelCls}>Tipo de pieza</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {DESIGN_TYPES.map((t) => (
                          <button
                            key={t}
                            onClick={() => setType(t)}
                            className={cn(
                              'h-8 rounded-full px-3.5 text-xs font-medium transition-colors',
                              type === t
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Campos según tipo */}
                    {type !== 'Matchday' && (
                      <div>
                        <label className={labelCls}>Título</label>
                        <input
                          value={draft.title}
                          onChange={set('title')}
                          placeholder={TITLE_PLACEHOLDER[type]}
                          className={inputCls}
                        />
                      </div>
                    )}
                    <div>
                      <label className={labelCls}>Jugador</label>
                      <input
                        value={draft.player}
                        onChange={set('player')}
                        placeholder="Vinicius Jr"
                        className={inputCls}
                      />
                    </div>
                    {type === 'Matchday' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Local</label>
                          <input
                            value={draft.home}
                            onChange={set('home')}
                            placeholder="Real Madrid"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Visitante</label>
                          <input
                            value={draft.away}
                            onChange={set('away')}
                            placeholder="FC Barcelona"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className={labelCls}>Entrega</label>
                      <input
                        value={draft.deadline}
                        onChange={set('deadline')}
                        placeholder="13 jun · 18:00"
                        className={cn(inputCls, 'font-mono')}
                      />
                    </div>

                    {/* Diseñador — a la vista: auto por defecto, asignar en un clic */}
                    <div>
                      <span className={labelCls}>Diseñador</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {[AUTO, ...TEAM.map((m) => m.name)].map((n) => (
                          <button
                            key={n}
                            onClick={() => setDesigner(n)}
                            className={cn(
                              'h-8 rounded-full px-3 text-xs font-medium transition-colors',
                              designer === n
                                ? n === AUTO
                                  ? 'bg-primary text-primary-foreground'
                                  : 'border border-primary/40 bg-primary/10 text-foreground'
                                : 'border border-border bg-background text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Más opciones (Drive) */}
                    <div>
                      <button
                        onClick={() => setMoreOpen((v) => !v)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                      >
                        <motion.span
                          initial={false}
                          animate={{ rotate: moreOpen ? 180 : 0 }}
                          transition={SPRINGS.snappy}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </motion.span>
                        Más opciones
                      </button>
                      <AnimatePresence initial={false}>
                        {moreOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={SPRINGS.smooth}
                            className="overflow-hidden"
                          >
                            <div className="pt-4">
                              <label className={labelCls}>Carpeta Drive (opcional)</label>
                              <input placeholder="https://drive.google.com/…" className={inputCls} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Añadir al lote */}
                    <button
                      onClick={addToBatch}
                      disabled={!draftValid}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                      Añadir otra pieza al lote
                    </button>

                    {/* El lote */}
                    {batch.length > 0 && (
                      <div>
                        <span className={labelCls}>En el lote · {batch.length}</span>
                        <ul className="mt-1.5 space-y-1">
                          <AnimatePresence initial={false}>
                            {batch.map((r) => (
                              <motion.li
                                key={r.id}
                                layout
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={SPRINGS.snappy}
                                className="rounded-xl border border-border/60 bg-background px-3 py-2"
                              >
                                <div className="group flex items-center gap-3">
                                  <span className="shrink-0 rounded-full bg-panel-hover px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {r.type}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate text-sm">
                                    {r.type === 'Matchday'
                                      ? `${r.home || '—'} vs ${r.away || '—'}`
                                      : r.title || TITLE_PLACEHOLDER[r.type]}
                                    <span className="text-muted-foreground"> · {r.player}</span>
                                  </span>
                                  <button
                                    onClick={() =>
                                      setEditRowId((id) => (id === r.id ? null : r.id))
                                    }
                                    title="Cambiar diseñador"
                                    className={cn(
                                      'flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition-colors',
                                      r.designer === AUTO
                                        ? 'bg-primary/15 text-primary hover:bg-primary/25'
                                        : 'bg-panel-hover text-foreground hover:bg-panel-hover/70'
                                    )}
                                  >
                                    {r.designer === AUTO ? '⚡ Auto' : r.designer}
                                  </button>
                                  <span className="shrink-0 font-mono tabular text-xs text-muted-foreground">
                                    {r.deadline}
                                  </span>
                                  <button
                                    onClick={() => setBatch((b) => b.filter((x) => x.id !== r.id))}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <AnimatePresence initial={false}>
                                  {editRowId === r.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={SPRINGS.smooth}
                                      className="overflow-hidden"
                                    >
                                      <div className="flex flex-wrap gap-1.5 pt-2.5">
                                        {[AUTO, ...TEAM.map((m) => m.name)].map((n) => (
                                          <button
                                            key={n}
                                            onClick={() => {
                                              setBatch((b) =>
                                                b.map((x) =>
                                                  x.id === r.id ? { ...x, designer: n } : x
                                                )
                                              );
                                              setEditRowId(null);
                                            }}
                                            className={cn(
                                              'h-7 rounded-full border px-2.5 text-[11px] font-medium transition-colors',
                                              r.designer === n
                                                ? 'border-primary/40 bg-primary/10 text-foreground'
                                                : 'border-border bg-card text-muted-foreground hover:text-foreground'
                                            )}
                                          >
                                            {n === AUTO ? '⚡ Auto' : n}
                                          </button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.li>
                            ))}
                          </AnimatePresence>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-2 border-t border-border/60 p-lg pt-md">
                <span className="font-mono text-xs text-muted-foreground">
                  {count === 0
                    ? ''
                    : hasAuto
                      ? 'Las piezas en ⚡ Auto se reparten por carga'
                      : 'Asignación manual'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={close}
                    className="flex h-10 items-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-panel-hover/40 hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={close}
                    disabled={count === 0}
                    className="flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                  >
                    {count === 0
                      ? 'Crear diseños'
                      : count === 1
                        ? 'Crear 1 diseño'
                        : `Crear ${count} diseños`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
