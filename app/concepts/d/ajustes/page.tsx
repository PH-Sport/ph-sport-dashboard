'use client';

/**
 * CONCEPTO D — Ajustes: UNA sola vista con subapartados al scrollear
 * (Cuenta · Apariencia · Notificaciones). Lo único separado es Miembros,
 * con cards clicables → popup de acciones (nombre, rol, eliminar).
 */

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Plus, X, Trash2, Copy, Check, List, CalendarDays } from 'lucide-react';
import { SPRINGS, TWEENS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { MEMBERS, PENDING_INVITE, NOTIF_PREFS, PERSONAS } from '../../_data';
import { useRole } from '../_role';
import { ConfirmDialog } from '../_ui';

type Member = (typeof MEMBERS)[number];

type Tab = 'General' | 'Miembros';

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

function Pill({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-9 items-center rounded-full px-0.5 transition-colors',
        on ? 'bg-primary' : 'bg-muted'
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
  const { role } = useRole();
  const persona = PERSONAS[role];
  const [rawTab, setTab] = useState<Tab>('General');
  const [members, setMembers] = useState(MEMBERS);
  const [member, setMember] = useState<Member | null>(null);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState('Diseñador');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<typeof PENDING_INVITE | null>(PENDING_INVITE);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [defaultView, setDefaultView] = useState<'Lista' | 'Calendario'>('Lista');
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted || resolvedTheme === 'dark';

  // Miembros es gestión: solo existe para el mánager
  const tabs: Tab[] = role === 'manager' ? ['General', 'Miembros'] : ['General'];
  const tab: Tab = role === 'manager' ? rawTab : 'General';

  const closeInvite = () => {
    setInviteOpen(false);
    setInviteLink(null);
    setCopied(false);
    setInviteRole('Diseñador');
  };

  const copyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'h-8 rounded-lg px-3.5 text-xs font-medium transition-colors',
              tab === t
                ? 'bg-muted text-foreground'
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
                {persona.initial}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  key={persona.name}
                  defaultValue={persona.name}
                  className="h-10 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="font-mono text-xs text-muted-foreground">
                  {persona.email} ·{' '}
                  <span className="uppercase tracking-wider text-primary">{persona.role}</span>
                </p>
              </div>
            </div>
            <button className="mt-5 flex h-9 items-center rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Guardar cambios
            </button>
          </Section>

          <Section label="Apariencia" hint="Cómo se ve la app en este dispositivo">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm transition-colors',
                  !isDark
                    ? 'border-primary/40 bg-primary/10 font-medium'
                    : 'border-border text-muted-foreground hover:bg-muted/40'
                )}
              >
                <Sun className="h-4 w-4" />
                Claro
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm transition-colors',
                  isDark
                    ? 'border-primary/40 bg-primary/10 font-medium'
                    : 'border-border text-muted-foreground hover:bg-muted/40'
                )}
              >
                <Moon className="h-4 w-4" />
                Oscuro
              </button>
            </div>
            <div className="mt-5 border-t border-border/60 pt-5">
              <p className="text-sm font-medium">Vista por defecto en Diseños</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Con qué vista se abre la página de Diseños
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(
                  [
                    { id: 'Lista', icon: List },
                    { id: 'Calendario', icon: CalendarDays },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setDefaultView(v.id)}
                    className={cn(
                      'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm transition-colors',
                      defaultView === v.id
                        ? 'border-primary/40 bg-primary/10 font-medium'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    )}
                  >
                    <v.icon className="h-4 w-4" />
                    {v.id}
                  </button>
                ))}
              </div>
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
            {members.map((m) => (
              <button
                key={m.email}
                onClick={() => setMember(m)}
                className="rounded-2xl border border-border bg-card p-lg text-left shadow-raised transition-colors hover:border-primary/30"
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full font-mono text-base font-semibold',
                    m.admin ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground'
                  )}
                >
                  {m.name.charAt(0)}
                </div>
                <p className="mt-3 truncate font-heading text-base font-semibold">{m.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{m.email}</p>
                <span
                  className={cn(
                    'mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                    m.admin ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {m.role}
                </span>
              </button>
            ))}
            <button
              onClick={() => setInviteOpen(true)}
              className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Invitar miembro</span>
            </button>
          </div>

          {pendingInvite && (
            <section className="rounded-2xl border border-border bg-card p-lg shadow-raised">
              <p className="font-mono text-eyebrow uppercase text-muted-foreground">
                Invitación pendiente
              </p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="truncate font-mono text-sm">{pendingInvite.email}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted-foreground">{pendingInvite.note}</span>
                  <button
                    onClick={copyLink}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    onClick={() => setConfirmRevoke(true)}
                    className="flex h-8 items-center rounded-lg px-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Revocar
                  </button>
                </span>
              </div>
            </section>
          )}
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
                      member.admin ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground'
                    )}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <button
                    onClick={() => setMember(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
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
                                : 'border-border text-muted-foreground hover:bg-muted/40'
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
                  <button
                    onClick={() => setConfirmDeleteMember(true)}
                    className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
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

      {/* ───── Popup: invitar miembro ───── */}
      <AnimatePresence>
        {inviteOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TWEENS.base}
              onClick={closeInvite}
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
                  <div>
                    <p className="font-mono text-eyebrow uppercase text-muted-foreground">Equipo</p>
                    <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight">
                      Invitar miembro
                    </h2>
                  </div>
                  <button
                    onClick={closeInvite}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 p-lg">
                  <div>
                    <label className="font-mono text-eyebrow uppercase text-muted-foreground">
                      Rol
                    </label>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {['Mánager', 'Diseñador'].map((r) => (
                        <button
                          key={r}
                          onClick={() => setInviteRole(r)}
                          className={cn(
                            'h-9 rounded-xl border text-xs font-medium transition-colors',
                            inviteRole === r
                              ? 'border-primary/40 bg-primary/10 text-foreground'
                              : 'border-border text-muted-foreground hover:bg-muted/40'
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {inviteLink ? (
                    <div>
                      <label className="font-mono text-eyebrow uppercase text-muted-foreground">
                        Enlace de invitación
                      </label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-xs text-muted-foreground">
                          {inviteLink}
                        </span>
                        <button
                          onClick={copyLink}
                          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium transition-colors hover:bg-muted/40"
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-status-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copied ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Expira en 7 días · 1 uso
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setInviteLink('phsport.app/invite/k7x2-mv8q-4hd1')}
                      className="flex h-10 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Generar enlace de invitación
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Confirmaciones */}
      <ConfirmDialog
        open={confirmDeleteMember}
        title="¿Eliminar usuario?"
        description={`${member?.name ?? ''} perderá el acceso al panel. Sus diseños y entregas se conservan. No se puede deshacer.`}
        confirmLabel="Eliminar usuario"
        destructive
        onConfirm={() => {
          if (member) {
            setMembers((ms) => ms.filter((m) => m.email !== member.email));
            setMember(null);
          }
          setConfirmDeleteMember(false);
        }}
        onCancel={() => setConfirmDeleteMember(false)}
      />
      <ConfirmDialog
        open={confirmRevoke}
        title="¿Revocar invitación?"
        description="El enlace dejará de funcionar inmediatamente."
        confirmLabel="Revocar"
        destructive
        onConfirm={() => {
          setPendingInvite(null);
          setConfirmRevoke(false);
        }}
        onCancel={() => setConfirmRevoke(false)}
      />
    </motion.div>
  );
}
