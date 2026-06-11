'use client';

/**
 * CONCEPTO D — Ajustes: UNA sola vista con subapartados al scrollear
 * (Cuenta · Apariencia · Notificaciones). Lo único separado es Miembros,
 * con cards clicables → popup de acciones (nombre, rol, eliminar).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Plus, X, Trash2 } from 'lucide-react';
import { SPRINGS, TWEENS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { MEMBERS, PENDING_INVITE, NOTIF_PREFS } from '../../_data';

type Member = (typeof MEMBERS)[number];

const TABS = ['General', 'Miembros'] as const;
type Tab = (typeof TABS)[number];

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

function Pill({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors',
        on ? 'bg-primary' : 'bg-panel-hover'
      )}
    >
      <span
        className={cn('h-4 w-4 rounded-full bg-background transition-transform', on && 'translate-x-4')}
      />
    </span>
  );
}

/** Subapartado: rótulo eyebrow + descripción a la izquierda del scroll, placa debajo. */
function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="font-mono text-eyebrow uppercase text-primary">{label}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
      <div className="mt-3 rounded-2xl border border-border bg-card p-lg shadow-raised">
        {children}
      </div>
    </section>
  );
}

export default function ConceptDAjustes() {
  const [tab, setTab] = useState<Tab>('General');
  const [member, setMember] = useState<Member | null>(null);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
      className="space-y-4"
    >
      <motion.div variants={rise}>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Tu cuenta, apariencia, notificaciones y la gestión del equipo
        </p>
      </motion.div>

      {/* Pestañas: General (todo en un scroll) · Miembros (gestión, aparte) */}
      <motion.div
        variants={rise}
        className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-card p-1 shadow-raised"
      >
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'h-8 rounded-lg px-3.5 text-xs font-medium transition-colors',
              tab === t
                ? 'bg-panel-hover text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
          </button>
        ))}
      </motion.div>

      {tab === 'General' && (
        <motion.div variants={rise} className="max-w-2xl space-y-xl pb-xl">
          <Section label="Cuenta" hint="Tu nombre y datos de acceso">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-lg font-semibold text-primary">
                M
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  defaultValue="Mario Rodríguez"
                  className="h-10 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="font-mono text-xs text-muted-foreground">
                  mario@phsport.es ·{' '}
                  <span className="uppercase tracking-wider text-primary">Mánager</span>
                </p>
              </div>
            </div>
            <button className="mt-5 flex h-9 items-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Guardar cambios
            </button>
          </Section>

          <Section label="Apariencia" hint="Cómo se ve la app en este dispositivo">
            <div className="grid grid-cols-2 gap-3">
              <button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border text-sm text-muted-foreground transition-colors hover:bg-panel-hover/40">
                <Sun className="h-4 w-4" />
                Claro
              </button>
              <button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 text-sm font-medium">
                <Moon className="h-4 w-4" />
                Oscuro
              </button>
            </div>
          </Section>

          <Section label="Notificaciones" hint="Qué te avisa la app y por dónde">
            <ul className="space-y-4">
              {NOTIF_PREFS.map((p) => (
                <li key={p.label} className="flex items-center justify-between gap-4">
                  <span className="text-sm">{p.label}</span>
                  <span className="flex shrink-0 items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        App
                      </span>
                      <Pill on={p.app} />
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Email
                      </span>
                      <Pill on={p.email} />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </motion.div>
      )}

      {tab === 'Miembros' && (
        <motion.div variants={rise} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MEMBERS.map((m) => (
              <button
                key={m.email}
                onClick={() => setMember(m)}
                className="rounded-2xl border border-border bg-card p-lg text-left shadow-raised transition-colors hover:border-primary/30"
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full font-mono text-base font-semibold',
                    m.admin ? 'bg-primary/15 text-primary' : 'bg-panel-hover text-foreground'
                  )}
                >
                  {m.name.charAt(0)}
                </div>
                <p className="mt-3 truncate font-heading text-base font-semibold">{m.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{m.email}</p>
                <span
                  className={cn(
                    'mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                    m.admin ? 'bg-primary/15 text-primary' : 'bg-panel-hover text-muted-foreground'
                  )}
                >
                  {m.role}
                </span>
              </button>
            ))}
            <button className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Invitar miembro</span>
            </button>
          </div>

          <section className="rounded-2xl border border-border bg-card p-lg shadow-raised">
            <p className="font-mono text-eyebrow uppercase text-muted-foreground">
              Invitación pendiente
            </p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <span className="truncate font-mono text-sm">{PENDING_INVITE.email}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{PENDING_INVITE.note}</span>
            </div>
          </section>
        </motion.div>
      )}

      {/* ───── Popup de acciones sobre un miembro ───── */}
      <AnimatePresence>
        {member && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TWEENS.base}
              onClick={() => setMember(null)}
              className="glass-scrim fixed inset-0 z-50"
            />
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={SPRINGS.smooth}
                className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card shadow-overlay"
              >
                <div className="flex items-start justify-between p-lg pb-0">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-full font-mono text-base font-semibold',
                      member.admin ? 'bg-primary/15 text-primary' : 'bg-panel-hover text-foreground'
                    )}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <button
                    onClick={() => setMember(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-panel-hover/60 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 p-lg">
                  <div>
                    <label className="font-mono text-eyebrow uppercase text-muted-foreground">
                      Nombre
                    </label>
                    <input
                      defaultValue={member.name}
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-eyebrow uppercase text-muted-foreground">
                      Rol
                    </label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {['Mánager', 'Diseñador'].map((r) => {
                        const active = member.role.startsWith(r.slice(0, 6));
                        return (
                          <button
                            key={r}
                            className={cn(
                              'h-9 rounded-xl border text-xs font-medium transition-colors',
                              active
                                ? 'border-primary/40 bg-primary/10 text-foreground'
                                : 'border-border text-muted-foreground hover:bg-panel-hover/40'
                            )}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{member.email}</p>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 p-lg pt-md">
                  <button className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar usuario
                  </button>
                  <button
                    onClick={() => setMember(null)}
                    className="flex h-9 items-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Guardar
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
