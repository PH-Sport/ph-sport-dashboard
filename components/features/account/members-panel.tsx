'use client';

/**
 * Panel de Miembros (dentro de Ajustes, solo Mánager) — lenguaje del concepto D.
 * Tarjetas del equipo (clic → popup), invitar e invitaciones pendientes.
 *
 * Acciones sobre un miembro:
 * - Renombrar: a la vista (acción normal).
 * - Cambiar rol / Eliminar: en "Zona avanzada" (plegada) — acciones extraordinarias,
 *   siempre con confirmación, solo Mánager. Eliminar conserva los diseños del usuario.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, ChevronDown, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { SPRINGS, TWEENS, STAGGER } from '@/components/ui/animations';
import { cn } from '@/lib/utils';
import { ROLE_ACCENT } from '@/lib/utils/role';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useUsersData, type Profile } from '@/lib/hooks/use-users-data';
import { CreateInvitationDialog } from '@/components/invitations/create-invitation-dialog';
import { InvitationsCard } from '@/components/features/users/invitations-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const ROLE_LABELS: Record<Profile['role'], string> = {
  ADMIN: 'Mánager',
  DESIGNER: 'Diseñador',
};

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRINGS.gentle },
};

function getInitial(name: string): string {
  return (name?.trim()?.charAt(0) || '·').toUpperCase();
}

export function MembersPanel() {
  const { profile } = useAuth();
  const { users, invitations, mutate } = useUsersData();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [member, setMember] = useState<Profile | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [busy, setBusy] = useState<null | 'save' | 'role' | 'delete'>(null);
  const [confirmRole, setConfirmRole] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSelf = member?.id === profile?.id;
  const targetRole = member?.role;
  const nextRole: Profile['role'] = targetRole === 'ADMIN' ? 'DESIGNER' : 'ADMIN';

  const openMember = (m: Profile) => {
    setMember(m);
    setNameDraft(m.full_name || '');
    setAdvancedOpen(false);
  };

  const closeMember = () => {
    setMember(null);
    setAdvancedOpen(false);
  };

  const patchUser = async (payload: { full_name?: string; role?: Profile['role'] }) => {
    if (!member) return false;
    const res = await fetch(`/api/users/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'No se pudo actualizar');
    }
    return true;
  };

  const handleSaveName = async () => {
    if (!member) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === member.full_name) {
      closeMember();
      return;
    }
    setBusy('save');
    try {
      await patchUser({ full_name: trimmed });
      toast.success('Nombre actualizado');
      mutate();
      closeMember();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo actualizar');
    } finally {
      setBusy(null);
    }
  };

  const handleChangeRole = async () => {
    if (!member) return;
    setBusy('role');
    try {
      await patchUser({ role: nextRole });
      toast.success(`Ahora es ${ROLE_LABELS[nextRole]}`);
      mutate();
      setConfirmRole(false);
      closeMember();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cambiar el rol');
      setConfirmRole(false);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    setBusy('delete');
    try {
      const supabase = createClient();
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: member.id },
      });
      if (error) throw error;
      toast.success('Usuario eliminado. Sus diseños se conservan, sin asignar.');
      mutate();
      setConfirmDelete(false);
      closeMember();
    } catch {
      toast.error('No se pudo eliminar el usuario');
      setConfirmDelete(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: STAGGER } } }}
      className="space-y-4"
    >
      <motion.div variants={rise} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((m) => {
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => openMember(m)}
              className="rounded-2xl border border-border bg-card p-lg text-left shadow-raised outline-none transition-colors hover:border-primary/30 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full font-mono text-base font-semibold',
                  ROLE_ACCENT[m.role]
                )}
              >
                {getInitial(m.full_name)}
              </div>
              <p className="mt-3 truncate font-heading text-base font-semibold">
                {m.full_name || 'Sin nombre'}
              </p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                Desde {formatDistanceToNow(new Date(m.created_at), { locale: es, addSuffix: true })}
              </p>
              <span
                className={cn(
                  'mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
                  ROLE_ACCENT[m.role]
                )}
              >
                {ROLE_LABELS[m.role]}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm font-medium">Invitar miembro</span>
        </button>
      </motion.div>

      <motion.div variants={rise}>
        <InvitationsCard invitations={invitations} onMutate={mutate} />
      </motion.div>

      <CreateInvitationDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onCreated={() => mutate()}
      />

      {/* ───── Popup de acciones sobre un miembro ───── */}
      <AnimatePresence>
        {member && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={TWEENS.base}
              onClick={closeMember}
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
                      ROLE_ACCENT[member.role]
                    )}
                  >
                    {getInitial(member.full_name)}
                  </div>
                  <button
                    type="button"
                    onClick={closeMember}
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
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                        ROLE_ACCENT[member.role]
                      )}
                    >
                      {ROLE_LABELS[member.role]}
                    </span>
                    Desde {formatDistanceToNow(new Date(member.created_at), { locale: es, addSuffix: true })}
                  </p>

                  {/* Zona avanzada: rol + eliminar (extraordinario). Oculta para uno mismo. */}
                  {!isSelf && (
                    <div className="rounded-xl border border-border/60">
                      <button
                        type="button"
                        onClick={() => setAdvancedOpen((v) => !v)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span className="flex-1">Zona avanzada</span>
                        <motion.span
                          initial={false}
                          animate={{ rotate: advancedOpen ? 0 : -90 }}
                          transition={SPRINGS.snappy}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {advancedOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={SPRINGS.smooth}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2 px-3 pb-3 pt-1">
                              <button
                                type="button"
                                onClick={() => setConfirmRole(true)}
                                className="flex h-9 w-full items-center justify-between rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                              >
                                <span>Cambiar rol a {ROLE_LABELS[nextRole]}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="flex h-9 w-full items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Eliminar usuario
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border/60 p-lg pt-md">
                  <button
                    type="button"
                    onClick={closeMember}
                    className="flex h-9 items-center rounded-xl px-4 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={busy === 'save'}
                    className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {busy === 'save' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmRole}
        onOpenChange={(o) => !o && setConfirmRole(false)}
        onConfirm={handleChangeRole}
        title={`¿Cambiar rol a ${member ? ROLE_LABELS[nextRole] : ''}?`}
        description={
          nextRole === 'ADMIN'
            ? `${member?.full_name || 'Este usuario'} tendrá acceso total: gestión de equipo, diseños y ajustes.`
            : `${member?.full_name || 'Este usuario'} dejará de ser Mánager y pasará a ser Diseñador.`
        }
        confirmLabel="Cambiar rol"
        variant="warning"
        loading={busy === 'role'}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="¿Eliminar usuario?"
        description={`${member?.full_name || 'Este usuario'} perderá el acceso al panel. Sus diseños se conservan (quedan sin asignar). No se puede deshacer.`}
        confirmLabel="Eliminar usuario"
        variant="danger"
        loading={busy === 'delete'}
      />
    </motion.div>
  );
}
