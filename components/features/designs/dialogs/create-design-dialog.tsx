'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Save, Layers, Loader2, Sparkles } from 'lucide-react';
import { useDesigners } from '@/lib/hooks/use-designers';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import type { Design } from '@/lib/types/design';
import {
  type BulkDesignRow,
  type SingleDesignFormData,
  createEmptyRow,
  isRowValid,
  isRowEmpty,
  isOutsideWeek,
} from '@/lib/utils/design-form';
import { DesignFormSingle } from './design-form-single';
import { DesignFormBulk } from './design-form-bulk';
import { useDesignSubmit } from '@/lib/hooks/use-design-submit';

interface CreateDesignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDesignCreated: () => void;
  design?: Design | null;
  /** Start of the week currently visible in the designs page. When provided, the dialog
   * warns if a deadline falls outside this range (design would be created but not appear
   * in the active view). */
  activeWeekStart?: Date;
  /** End of the week currently visible in the designs page. */
  activeWeekEnd?: Date;
}

export function CreateDesignDialog({
  open,
  onOpenChange,
  onDesignCreated,
  design,
  activeWeekStart,
  activeWeekEnd,
}: CreateDesignDialogProps) {
  const { designers, loading: loadingDesigners } = useDesigners();
  const isEditMode = !!design;

  // Datos del formulario individual
  const [formData, setFormData] = useState<SingleDesignFormData>({
    type: 'matchday',
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined,
    folder_url: '',
    designer_id: null,
    player_status: null,
  });

  // Datos para modo lote (filas completas)
  const [bulkRows, setBulkRows] = useState<BulkDesignRow[]>([createEmptyRow()]);

  useEffect(() => {
    if (design) {
      setFormData({
        type: design.type || 'matchday',
        title: design.title || '',
        player: design.player || '',
        match_home: design.match_home || '',
        match_away: design.match_away || '',
        deadline_at: design.deadline_at ? new Date(design.deadline_at) : undefined,
        folder_url: design.folder_url || '',
        designer_id: design.designer_id || null,
        player_status: design.player_status || null,
      });
    } else {
      setFormData({
        type: 'matchday',
        title: '',
        player: '',
        match_home: '',
        match_away: '',
        deadline_at: undefined,
        folder_url: '',
        designer_id: null,
        player_status: null,
      });
      setBulkRows([createEmptyRow()]);
    }
  }, [design, open]);

  // Las filas nuevas heredan el tipo del lote (todas comparten tipo).
  const addBulkRow = () => {
    setBulkRows([...bulkRows, createEmptyRow(bulkRows[0]?.type)]);
  };

  const addMultipleBulkRows = (count: number) => {
    const newRows = Array.from({ length: count }, () => createEmptyRow(bulkRows[0]?.type));
    setBulkRows([...bulkRows, ...newRows]);
  };

  const { loading, submit } = useDesignSubmit({
    design,
    formData,
    bulkRows,
    onSuccess: () => {
      setFormData({
        type: 'matchday',
        title: '',
        player: '',
        match_home: '',
        match_away: '',
        deadline_at: undefined,
        folder_url: '',
        designer_id: null,
        player_status: null,
      });
      setBulkRows([createEmptyRow()]);
      onDesignCreated();
      onOpenChange(false);
    },
  });

  const validBulkCount = bulkRows.filter(isRowValid).length;
  const hasIncompleteRows = bulkRows.some((r) => !isRowValid(r) && !isRowEmpty(r));
  const editDeadlineOutsideWeek = isEditMode && isOutsideWeek(formData.deadline_at, activeWeekStart, activeWeekEnd);

  const weekRangeLabel = (activeWeekStart && activeWeekEnd)
    ? `${activeWeekStart.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} – ${activeWeekEnd.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`
    : null;

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn(
          "max-h-[90vh]",
          isEditMode
            ? "max-w-2xl overflow-y-auto"
            : "w-[90vw] max-w-[1100px] h-[78vh] max-h-[760px] overflow-hidden flex flex-col"
        )}>
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              {isEditMode ? (
                <>
                  <Edit className="h-6 w-6 text-primary" />
                  Editar Diseño
                </>
              ) : (
                <>
                  <Plus className="h-6 w-6 text-primary" />
                  Crear Diseños
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modifica los datos del diseño.' : 'Añade uno o varios diseños al equipo.'}
            </DialogDescription>
          </DialogHeader>

          {/* Modo de entrada: Manual (activo) · Asistente IA (próximamente) */}
          {!isEditMode && (
            <div className="mt-2 flex w-fit items-center gap-0.5 rounded-xl border border-border bg-background p-1">
              <span className="flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm">
                Manual
              </span>
              <span
                title="Asistente con IA — próximamente"
                aria-disabled
                className="flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground/50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Asistente
                <span className="ml-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                  Pronto
                </span>
              </span>
            </div>
          )}

          <form
            onSubmit={submit}
            className={cn(!isEditMode && "mt-4 flex flex-1 min-h-0 flex-col")}
          >
            <div className={cn("space-y-6 mt-4", !isEditMode && "mt-0 flex-1 min-h-0")}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isEditMode ? 'edit' : 'batch'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn("space-y-6", !isEditMode && "h-full")}
              >
              {isEditMode ? (
                <DesignFormSingle
                  formData={formData}
                  onChange={setFormData}
                  designers={designers}
                  loadingDesigners={loadingDesigners}
                  deadlineOutsideWeek={editDeadlineOutsideWeek}
                  weekRangeLabel={weekRangeLabel}
                />
              ) : (
                <DesignFormBulk
                  bulkRows={bulkRows}
                  onChange={setBulkRows}
                  designers={designers}
                  loadingDesigners={loadingDesigners}
                  activeWeekStart={activeWeekStart}
                  activeWeekEnd={activeWeekEnd}
                  weekRangeLabel={weekRangeLabel}
                />
            )}
              </motion.div>
            </AnimatePresence>
            </div>

          <DialogFooter
            className={cn(
              'mt-6 shrink-0',
              !isEditMode && 'border-t border-border bg-card pt-4 sm:justify-between sm:space-x-0'
            )}
          >
            {isEditMode ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (!isEditMode && validBulkCount === 0)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={addBulkRow}>
                    <Plus className="mr-1 h-4 w-4" />
                    +1 Fila
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addMultipleBulkRows(5)}>
                    +5 Filas
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => addMultipleBulkRows(10)}>
                    +10 Filas
                  </Button>
                  {hasIncompleteRows && (
                    <span className="text-sm text-amber-600">Hay filas incompletas</span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || validBulkCount === 0}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Layers className="mr-2 h-4 w-4" />
                        Crear {validBulkCount} Diseño{validBulkCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
