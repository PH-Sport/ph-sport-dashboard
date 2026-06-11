'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { SPRINGS, TRANSITIONS, animations } from '@/components/ui/animations';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DesignDetailSkeleton } from '@/components/skeletons/design-detail-skeleton';
import {
  Edit2,
  ExternalLink,
  Calendar,
  User,
  X,
  AlertCircle,
  SearchX,
  RefreshCw,
  CheckCircle2,
  Undo2,
  Loader2,
} from 'lucide-react';
import { useDesigners } from '@/lib/hooks/use-designers';
import { useDesign } from '@/lib/hooks/use-design';
import { useConfirm } from '@/lib/hooks/use-confirm';
import { ApiError } from '@/lib/utils/api-fetcher';
import type { DesignStatus } from '@/lib/types/design';
import { STATUS_LABELS, DESIGN_STATUS_ORDER } from '@/lib/types/design';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';

interface DesignDetailSheetProps {
  designId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignUpdated?: () => void;
}

export function DesignDetailSheet({
  designId,
  open,
  onOpenChange,
  onDesignUpdated,
}: DesignDetailSheetProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const { design, error, isLoading, mutate } = useDesign(designId, open);
  const { designers } = useDesigners();
  const { confirm, isOpen, options, handleConfirm, handleCancel } = useConfirm();

  const designer = design?.designer_id
    ? designers.find((u) => u.id === design.designer_id)
    : null;

  const notFound = error instanceof ApiError && error.status === 404;

  const handleEditComplete = () => {
    mutate();
    onDesignUpdated?.();
  };

  const handleStatusChange = async (newStatus: DesignStatus) => {
    if (!design) return;

    const isRegressive =
      DESIGN_STATUS_ORDER.indexOf(newStatus) < DESIGN_STATUS_ORDER.indexOf(design.status);
    if (isRegressive) {
      const confirmed = await confirm({
        title: '¿Volver atrás?',
        description: `¿Estás seguro de cambiar "${design.title}" de ${STATUS_LABELS[design.status]} a ${STATUS_LABELS[newStatus]}?`,
        confirmText: 'Sí, cambiar',
        cancelText: 'Cancelar',
      });
      if (!confirmed) return;
    }

    setUpdating(true);
    try {
      // Optimista: pinta el nuevo estado al instante, sincroniza por detrás
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
        {
          optimisticData: { ...design, status: newStatus },
          rollbackOnError: true,
          revalidate: true,
        }
      );
      toast.success('Estado actualizado');
      onDesignUpdated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0" hideCloseButton>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="skeleton"
                initial={animations.fadeSlide.initial}
                animate={animations.fadeSlide.animate}
                exit={animations.fadeSlide.exit}
                transition={TRANSITIONS.fade}
              >
                <DesignDetailSkeleton />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={animations.fadeSlide.initial}
                animate={animations.fadeSlide.animate}
                exit={animations.fadeSlide.exit}
                transition={TRANSITIONS.fade}
                className="flex flex-col items-center justify-center h-full gap-6 px-6"
              >
                {/* Icono según tipo de error */}
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full ${
                    notFound ? 'bg-status-warning/10' : 'bg-destructive/10'
                  }`}
                >
                  {notFound ? (
                    <SearchX className="h-8 w-8 text-status-warning" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  )}
                </div>

                {/* Mensaje */}
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {notFound ? 'Diseño no encontrado' : 'Error al cargar'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {notFound
                      ? 'Este diseño puede haber sido eliminado o el enlace es incorrecto.'
                      : 'No se pudo cargar la información del diseño. Comprueba tu conexión e inténtalo de nuevo.'}
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  {!notFound && (
                    <Button variant="outline" onClick={() => mutate()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reintentar
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => onOpenChange(false)}>
                    Cerrar
                  </Button>
                </div>
              </motion.div>
            ) : design ? (
              <motion.div
                key="content"
                initial={animations.fadeSlide.initial}
                animate={animations.fadeSlide.animate}
                exit={animations.fadeSlide.exit}
                transition={TRANSITIONS.modal}
                className="flex flex-col h-full"
              >
                {/* Scrollable design info section */}
                <div className="overflow-y-auto p-6 pb-0">
                  <SheetHeader className="pb-4 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <SheetTitle className="text-xl font-bold text-foreground truncate">
                          {design.title}
                        </SheetTitle>
                        <SheetDescription className="mt-1">
                          {design.player} · {design.match_home} vs {design.match_away}
                        </SheetDescription>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-4">
                        {design.folder_url && (
                          <a
                            href={design.folder_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-primary/10 transition-colors group"
                            title="Abrir carpeta en Drive"
                          >
                            <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                          </a>
                        )}
                        <button
                          onClick={() => setIsEditDialogOpen(true)}
                          className="p-2 rounded-lg hover:bg-primary/10 transition-colors group"
                          title="Editar"
                        >
                          <Edit2 className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        </button>
                        <button
                          onClick={() => onOpenChange(false)}
                          className="p-2 rounded-lg hover:bg-primary/10 transition-colors group"
                          title="Cerrar"
                        >
                          <X className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        </button>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="py-6 space-y-6">
                    {/* Status — acción principal del detalle */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Estado</span>
                      <motion.div
                        key={design.status}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={SPRINGS.snappy}
                      >
                        <Badge status={design.status}>{STATUS_LABELS[design.status]}</Badge>
                      </motion.div>
                    </div>

                    {design.status === 'BACKLOG' ? (
                      <Button
                        onClick={() => handleStatusChange('DELIVERED')}
                        disabled={updating}
                        className="w-full"
                      >
                        {updating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Marcar como entregado
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange('BACKLOG')}
                        disabled={updating}
                        className="w-full"
                      >
                        {updating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Undo2 className="mr-2 h-4 w-4" />
                        )}
                        Volver a pendiente
                      </Button>
                    )}

                    {/* Player Status */}
                    {design.player_status && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Estado del Jugador
                        </span>
                        <PlayerStatusTag status={design.player_status} />
                      </div>
                    )}

                    {/* Deadline */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Fecha de entrega
                      </span>
                      <span className="text-sm text-foreground">
                        {format(new Date(design.deadline_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                      </span>
                    </div>

                    {/* Designer */}
                    {designer && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Diseñador
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{designer.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

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
