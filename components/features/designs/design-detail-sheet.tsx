'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { TRANSITIONS, animations } from '@/components/ui/animations';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DesignDetailSkeleton } from '@/components/skeletons/design-detail-skeleton';
import { Edit2, ExternalLink, Calendar, User, X, AlertCircle, SearchX, RefreshCw } from 'lucide-react';
import { useDesigners } from '@/lib/hooks/use-designers';
import type { Design } from '@/lib/types/design';
import { STATUS_LABELS } from '@/lib/types/design';
import { CreateDesignDialog } from '@/components/features/designs/dialogs/create-design-dialog';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
import { CommentsSection } from '@/components/features/comments/comments-section';

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
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { designers } = useDesigners();

  useEffect(() => {
    if (!designId || !open) {
      setDesign(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/designs/${designId}`)
      .then((r) => {
        if (!r.ok) {
          if (r.status === 404) throw new Error('Diseño no encontrado');
          throw new Error('Error al cargar diseño');
        }
        return r.json();
      })
      .then((data) => setDesign(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Error desconocido'))
      .finally(() => setLoading(false));
  }, [designId, open]);

  const designer = design?.designer_id ? designers.find((u) => u.id === design.designer_id) : null;

  const handleEditComplete = () => {
    // Refresh design data
    if (designId) {
      fetch(`/api/designs/${designId}`)
        .then((r) => r.json())
        .then((data) => setDesign(data));
    }
    onDesignUpdated?.();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0" hideCloseButton>
          <AnimatePresence mode="wait">
            {loading ? (
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
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                  error === 'Diseño no encontrado' 
                    ? 'bg-yellow-500/10' 
                    : 'bg-red-500/10'
                }`}>
                  {error === 'Diseño no encontrado' ? (
                    <SearchX className="h-8 w-8 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  )}
                </div>
                
                {/* Mensaje */}
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {error === 'Diseño no encontrado' 
                      ? 'Diseño no encontrado' 
                      : 'Error al cargar'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {error === 'Diseño no encontrado'
                      ? 'Este diseño puede haber sido eliminado o el enlace es incorrecto.'
                      : 'No se pudo cargar la información del diseño. Comprueba tu conexión e inténtalo de nuevo.'}
                  </p>
                </div>
                
                {/* Botones */}
                <div className="flex gap-3">
                  {error !== 'Diseño no encontrado' && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setError(null);
                        setLoading(true);
                        fetch(`/api/designs/${designId}`)
                          .then((r) => {
                            if (!r.ok) {
                              if (r.status === 404) throw new Error('Diseño no encontrado');
                              throw new Error('Error al cargar diseño');
                            }
                            return r.json();
                          })
                          .then((data) => setDesign(data))
                          .catch((err) => setError(err instanceof Error ? err.message : 'Error desconocido'))
                          .finally(() => setLoading(false));
                      }}
                    >
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
                <SheetHeader className="pb-4 border-b border-gray-100 dark:border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white truncate">
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
                        className="p-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-500/10 transition-colors group"
                        title="Abrir carpeta en Drive"
                      >
                        <ExternalLink className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gold-400" />
                      </a>
                    )}
                    <button
                      onClick={() => setIsEditDialogOpen(true)}
                        className="p-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-500/10 transition-colors group"
                        title="Editar"
                      >
                        <Edit2 className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gold-400" />
                      </button>
                      <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 rounded-lg hover:bg-gold-50 dark:hover:bg-gold-500/10 transition-colors group"
                        title="Cerrar"
                      >
                        <X className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gold-400" />
                      </button>
                    </div>
                  </div>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Estado
                    </span>
                    <Badge status={design.status}>{STATUS_LABELS[design.status]}</Badge>
                  </div>

                  {/* Player Status */}
                  {design.player_status && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Estado del Jugador
                      </span>
                      <PlayerStatusTag status={design.player_status} />
                    </div>
                  )}

                  {/* Deadline */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de entrega
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(design.deadline_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                    </span>
                  </div>

                  {/* Designer */}
                  {designer && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Diseñador
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {designer.name}
                        </p>
                      </div>
                    </div>
                  )}


                </div>

                </div>

                {/* Comments Section - Fixed input at bottom */}
                <div className="flex-1 flex flex-col min-h-0">
                  <CommentsSection designId={design.id} />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

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
