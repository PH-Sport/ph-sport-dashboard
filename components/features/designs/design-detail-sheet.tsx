'use client';

/**
 * Detalle de un diseño — modal CENTRADO (lenguaje del concepto D), no el sheet
 * lateral anterior. Usa el primitivo Dialog (Radix: focus-trap, escape, scrim
 * de cristal, scale animado). Incluye asignación de diseñador en un clic.
 * Datos vía useDesign (SWR), mutaciones optimistas con rollback.
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { SPRINGS } from '@/components/ui/animations';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DesignDetailSkeleton } from '@/components/skeletons/design-detail-skeleton';
import {
  Pencil,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  SearchX,
  RefreshCw,
  CheckCircle2,
  Undo2,
  Loader2,
  Trash2,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useDesigners } from '@/lib/hooks/use-designers';
import { useDesign } from '@/lib/hooks/use-design';
import { useConfirm } from '@/lib/hooks/use-confirm';
import { ApiError } from '@/lib/utils/api-fetcher';
import { cn } from '@/lib/utils';
import type { Design, DesignStatus } from '@/lib/types/design';
import { STATUS_LABELS, getDesignContext } from '@/lib/types/design';
import { UrgencyDot, getUrgency } from '@/components/ui/urgency-dot';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';

interface DesignDetailSheetProps {
  designId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignUpdated?: () => void;
  /** Conecta con el flujo de borrado de la página (cierra el modal y confirma allí). */
  onRequestDelete?: (design: Design) => void;
}

export function DesignDetailSheet({
  designId,
  open,
  onOpenChange,
  onDesignUpdated,
  onRequestDelete,
}: DesignDetailSheetProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const { design, error, isLoading, mutate } = useDesign(designId, open);
  const { designers } = useDesigners();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const designer = design?.designer_id
    ? designers.find((u) => u.id === design.designer_id)
    : null;
  const notFound = error instanceof ApiError && error.status === 404;
  const urgency = design ? getUrgency(design.deadline_at, design.status === 'DELIVERED') : null;

  const handleEditComplete = () => {
    mutate();
    onDesignUpdated?.();
  };

  const handleStatusChange = async (newStatus: DesignStatus) => {
    if (!design) return;
    const toDelivered = newStatus === 'DELIVERED';
    const confirmed = await confirm({
      title: toDelivered ? '¿Marcar como entregado?' : '¿Volver a pendiente?',
      description: toDelivered
        ? `«${design.title}» pasará a entregados.`
        : `¿Seguro que quieres cambiar «${design.title}» de ${STATUS_LABELS[design.status]} a ${STATUS_LABELS[newStatus]}?`,
      confirmText: toDelivered ? 'Sí, entregar' : 'Sí, cambiar',
      cancelText: 'Cancelar',
      variant: toDelivered ? 'info' : 'warning',
    });
    if (!confirmed) return;

    setUpdating(true);
    try {
      await mutate(
        async () => {
          const response = await fetch(`/api/designs/${design.id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
          if (!response.ok) throw new Error('Error al actualizar estado');
          return { ...design, status: newStatus };
        },
        { optimisticData: { ...design, status: newStatus }, rollbackOnError: true, revalidate: true }
      );
      toast.success('Estado actualizado');
      onDesignUpdated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (designerId: string) => {
    if (!design) return;
    setAssignOpen(false);
    if (design.designer_id === designerId) return;
    const targetName = designers.find((u) => u.id === designerId)?.name ?? 'Sin asignar';
    const confirmed = await confirm({
      title: 'Reasignar diseño',
      description: `¿Asignar «${design.title}» a ${targetName}?`,
      confirmText: 'Reasignar',
      cancelText: 'Cancelar',
      variant: 'info',
    });
    if (!confirmed) return;
    try {
      await mutate(
        async () => {
          const response = await fetch(`/api/designs/${design.id}/assignee`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ designer_id: designerId }),
          });
          if (!response.ok) throw new Error('Error al asignar');
          return { ...design, designer_id: designerId };
        },
        {
          optimisticData: { ...design, designer_id: designerId },
          rollbackOnError: true,
          revalidate: true,
        }
      );
      toast.success('Diseño reasignado');
      onDesignUpdated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al asignar');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl">
          {isLoading ? (
            <>
              <DialogTitle className="sr-only">Cargando diseño</DialogTitle>
              <DesignDetailSkeleton />
            </>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-5 px-6 py-12 text-center">
              <DialogTitle className="sr-only">
                {notFound ? 'Diseño no encontrado' : 'Error al cargar'}
              </DialogTitle>
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-full',
                  notFound ? 'bg-status-warning/10' : 'bg-destructive/10'
                )}
              >
                {notFound ? (
                  <SearchX className="h-7 w-7 text-status-warning" />
                ) : (
                  <AlertCircle className="h-7 w-7 text-destructive" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-semibold">
                  {notFound ? 'Diseño no encontrado' : 'Error al cargar'}
                </h3>
                <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                  {notFound
                    ? 'Este diseño puede haber sido eliminado o el enlace es incorrecto.'
                    : 'No se pudo cargar la información. Comprueba tu conexión e inténtalo de nuevo.'}
                </p>
              </div>
              {!notFound && (
                <button
                  onClick={() => mutate()}
                  className="flex h-9 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium transition-colors hover:bg-muted/40"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </button>
              )}
            </div>
          ) : design ? (
            <>
              {/* Cabecera */}
              <div className="border-b border-border/60 p-lg">
                <p className="font-mono text-eyebrow uppercase text-muted-foreground">Diseño</p>
                <DialogTitle className="mt-1 truncate font-heading text-xl font-semibold tracking-tight">
                  {design.title}
                </DialogTitle>
                <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="truncate">
                    {[design.player, getDesignContext(design)].filter(Boolean).join(' · ')}
                  </span>
                  <PlayerStatusTag status={design.player_status} />
                </p>
              </div>

              {/* Cuerpo */}
              <div className="space-y-5 p-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estado</span>
                  <motion.div
                    key={design.status}
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={SPRINGS.snappy}
                  >
                    <Badge status={design.status}>{STATUS_LABELS[design.status]}</Badge>
                  </motion.div>
                </div>

                {/* Diseñador — reasignable en un clic */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Diseñador</span>
                    <button
                      onClick={() => setAssignOpen((v) => !v)}
                      className="-mr-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium transition-colors hover:bg-muted/40"
                    >
                      {designer ? (
                        <>
                          <UserAvatar
                            name={designer.name}
                            src={designer.avatar_url}
                            className="h-6 w-6"
                            fallbackClassName="bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                          />
                          {designer.name}
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
                  </div>
                  <AnimatePresence initial={false}>
                    {assignOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={SPRINGS.smooth}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-1.5 pt-3">
                          {designers.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleAssign(m.id)}
                              className={cn(
                                'h-8 rounded-full border px-3 text-xs font-medium transition-colors',
                                design.designer_id === m.id
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

                {/* Entrega */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Entrega</span>
                  <span className="flex items-center gap-2">
                    <UrgencyDot level={urgency} />
                    <span
                      className={cn(
                        'font-mono tabular text-sm',
                        urgency === 'h24' || urgency === 'overdue'
                          ? 'font-semibold text-destructive'
                          : 'text-foreground'
                      )}
                    >
                      {format(new Date(design.deadline_at), "d MMM yyyy, HH:mm", { locale: es })}
                    </span>
                  </span>
                </div>

                {/* Acción principal de estado */}
                {design.status === 'BACKLOG' ? (
                  <button
                    onClick={() => handleStatusChange('DELIVERED')}
                    disabled={updating}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Marcar como entregado
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange('BACKLOG')}
                    disabled={updating}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-60"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                    Volver a pendiente
                  </button>
                )}

                {/* Editar / Drive */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsEditDialogOpen(true)}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted/40"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  {design.folder_url ? (
                    <a
                      href={design.folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted/40"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Drive
                    </a>
                  ) : (
                    <span className="flex h-10 items-center justify-center gap-2 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground/50">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Sin Drive
                    </span>
                  )}
                </div>
              </div>

              {/* Eliminar */}
              {onRequestDelete && (
                <div className="border-t border-border/60 p-lg pt-md">
                  <button
                    onClick={() => {
                      onOpenChange(false);
                      onRequestDelete(design);
                    }}
                    className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar diseño
                  </button>
                </div>
              )}
            </>
          ) : (
            <DialogTitle className="sr-only">Diseño</DialogTitle>
          )}
        </DialogContent>
      </Dialog>

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

      {design && (
        <CreateDesignDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onDesignCreated={handleEditComplete}
          design={design}
        />
      )}
    </>
  );
}
