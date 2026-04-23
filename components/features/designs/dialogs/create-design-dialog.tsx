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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Save, Layers, Trash2, Loader2, ChevronRight, ChevronDown, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useDesigners } from '@/lib/hooks/use-designers';
import { PLAYER_STATUS_CONFIG } from '@/components/features/designs/tags/player-status-tag';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import type { Design } from '@/lib/types/design';

// Fila para el modo lote (cada fila es un diseño completo)
interface BulkDesignRow {
  id: string;
  title: string; // Opcional: si vacío, usa el nombre del jugador
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: Date | undefined;
  designer_id: string | null;
  folder_url: string; // Opcional
  player_status: 'injured' | 'suspended' | 'doubt' | 'last_minute' | null; // Opcional
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyRow(): BulkDesignRow {
  return {
    id: generateId(),
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined,
    designer_id: null,
    folder_url: '',
    player_status: null,
  };
}

// Validación: solo jugador, equipos y deadline son obligatorios
function isRowValid(row: BulkDesignRow): boolean {
  return !!(
    row.player.trim() &&
    row.match_home.trim() &&
    row.match_away.trim() &&
    row.deadline_at
  );
}

function isRowEmpty(row: BulkDesignRow): boolean {
  return (
    !row.title.trim() &&
    !row.player.trim() &&
    !row.match_home.trim() &&
    !row.match_away.trim() &&
    !row.deadline_at &&
    !row.folder_url.trim()
  );
}

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

function isOutsideWeek(date: Date | undefined, start?: Date, end?: Date): boolean {
  if (!date || !start || !end) return false;
  return date.getTime() < start.getTime() || date.getTime() > end.getTime();
}

export function CreateDesignDialog({
  open,
  onOpenChange,
  onDesignCreated,
  design,
  activeWeekStart,
  activeWeekEnd,
}: CreateDesignDialogProps) {
  const [loading, setLoading] = useState(false);
  const { designers, loading: loadingDesigners } = useDesigners();
  const isEditMode = !!design;

  // Datos del formulario individual
  const [formData, setFormData] = useState({
    title: '',
    player: '',
    match_home: '',
    match_away: '',
    deadline_at: undefined as Date | undefined,
    folder_url: '',
    designer_id: null as string | null,
    player_status: null as 'injured' | 'suspended' | 'doubt' | 'last_minute' | null,
  });

  // Datos para modo lote (filas completas)
  const [bulkRows, setBulkRows] = useState<BulkDesignRow[]>([createEmptyRow()]);
  // Filas expandidas (mostrar campos opcionales)
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  const toggleRowExpanded = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const expandAllRows = () => setExpandedRowIds(new Set(bulkRows.map((r) => r.id)));
  const collapseAllRows = () => setExpandedRowIds(new Set());
  const allExpanded = bulkRows.length > 0 && expandedRowIds.size === bulkRows.length;

  useEffect(() => {
    if (design) {
      setFormData({
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
      setExpandedRowIds(new Set());
    }
  }, [design, open]);

  const addBulkRow = () => {
    setBulkRows([...bulkRows, createEmptyRow()]);
  };

  const addMultipleBulkRows = (count: number) => {
    const newRows = Array.from({ length: count }, () => createEmptyRow());
    setBulkRows([...bulkRows, ...newRows]);
  };

  const removeBulkRow = (id: string) => {
    if (bulkRows.length > 1) {
      setBulkRows(bulkRows.filter((r) => r.id !== id));
    }
  };

  const updateBulkRow = (id: string, field: keyof BulkDesignRow, value: string | Date | null | undefined) => {
    setBulkRows(
      bulkRows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        // Edición
        if (!formData.deadline_at) {
          toast.error('Selecciona una fecha de entrega');
          setLoading(false);
          return;
        }

        const deadline = formData.deadline_at;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (!isEditMode && deadline < oneHourAgo) {
          toast.error('La fecha de deadline no puede ser tan antigua');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/designs/${design.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            deadline_at: deadline.toISOString(),
            designer_id: formData.designer_id || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar diseño');
        }

        toast.success('Diseño actualizado exitosamente');
      } else {
        // Modo lote: usar el nuevo endpoint /api/designs/bulk
        const validRows = bulkRows.filter(isRowValid);
        if (validRows.length === 0) {
          toast.error('Añade al menos un diseño completo');
          setLoading(false);
          return;
        }

        // Validar fechas
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        for (const row of validRows) {
          if (row.deadline_at && row.deadline_at < oneHourAgo) {
            toast.error(`"${row.title}": la fecha no puede ser tan antigua`);
            setLoading(false);
            return;
          }
        }

        const response = await fetch('/api/designs/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            designs: validRows.map((r) => ({
              title: r.title || undefined, // Si vacío, API usa player como fallback
              player: r.player,
              match_home: r.match_home,
              match_away: r.match_away,
              deadline_at: r.deadline_at!.toISOString(),
              designer_id: r.designer_id || undefined,
              folder_url: r.folder_url || undefined,
              player_status: r.player_status || undefined,
            })),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear diseños');
        }

        const result = await response.json();
        toast.success(
          `${result.created} diseño${result.created !== 1 ? 's' : ''} creado${result.created !== 1 ? 's' : ''} exitosamente`
        );
      }

      // Reset form
      setFormData({
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al crear diseño');
    } finally {
      setLoading(false);
    }
  };

  const validBulkCount = bulkRows.filter(isRowValid).length;
  const hasIncompleteRows = bulkRows.some((r) => !isRowValid(r) && !isRowEmpty(r));
  const outsideWeekCount = (activeWeekStart && activeWeekEnd)
    ? bulkRows.filter((r) => isRowValid(r) && isOutsideWeek(r.deadline_at, activeWeekStart, activeWeekEnd)).length
    : 0;
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

          <form
            onSubmit={handleSubmit}
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
                /* ========== MODO INDIVIDUAL ========== */
                <>
                  <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Partido</CardTitle>
                    <CardDescription>Datos del partido relacionado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="match_home">Equipo Local</Label>
                        <Input
                          id="match_home"
                          placeholder="Real Madrid"
                          required
                          value={formData.match_home}
                          onChange={(e) => setFormData({ ...formData, match_home: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="match_away">Equipo Visitante</Label>
                        <Input
                          id="match_away"
                          placeholder="Barcelona"
                          required
                          value={formData.match_away}
                          onChange={(e) => setFormData({ ...formData, match_away: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Fecha de entrega</Label>
                        <DateTimePicker
                          value={formData.deadline_at}
                          onChange={(date) => setFormData({ ...formData, deadline_at: date })}
                          placeholder="Selecciona fecha y hora"
                        />
                        {editDeadlineOutsideWeek && weekRangeLabel && (
                          <p className="text-xs text-amber-600 flex items-start gap-1.5 mt-1">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>Esta fecha cae fuera de la semana visible ({weekRangeLabel}). El diseño existirá pero no aparecerá en la vista actual hasta que cambies el filtro de semana.</span>
                          </p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="designer_id">Diseñador</Label>
                        <Select
                          value={formData.designer_id || 'auto'}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              designer_id: value === 'auto' ? null : value,
                            })
                          }
                        >
                          <SelectTrigger id="designer_id">
                            <SelectValue placeholder="Selecciona un diseñador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Automático</SelectItem>
                            {loadingDesigners ? (
                              <SelectItem value="loading" disabled>Cargando...</SelectItem>
                            ) : (
                              designers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="folder_url">URL Carpeta Drive (opcional)</Label>
                      <Input
                        id="folder_url"
                        type="url"
                        placeholder="https://drive.google.com/drive/folders/..."
                        value={formData.folder_url}
                        onChange={(e) => setFormData({ ...formData, folder_url: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalles del Diseño</CardTitle>
                    <CardDescription>Información específica de este diseño</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        placeholder="Matchday Real Madrid"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="player">Jugador/Equipo</Label>
                        <Input
                          id="player"
                          placeholder="Equipo / Jugador X"
                          required
                          value={formData.player}
                          onChange={(e) => setFormData({ ...formData, player: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="player_status">Estado Jugador (Opcional)</Label>
                        <Select
                          value={formData.player_status || 'none'}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              player_status: value === 'none' ? null : (value as 'injured' | 'suspended' | 'doubt' | 'last_minute'),
                            })
                          }
                        >
                          <SelectTrigger id="player_status">
                            <SelectValue placeholder="Sin estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin estado</SelectItem>
                            {Object.entries(PLAYER_STATUS_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <config.icon className="h-4 w-4" />
                                  <span>{config.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* ========== MODO EN LOTE (nuevo sistema con tabla) ========== */
              <>
                <Card className="h-full flex flex-col">
                  <CardContent className="flex-1 min-h-0 flex flex-col pt-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        Campos obligatorios: Jugador, Local, Visitante y Deadline.
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={allExpanded ? collapseAllRows : expandAllRows}
                      >
                        {allExpanded ? 'Colapsar todas' : 'Expandir todas'}
                      </Button>
                    </div>
                    {outsideWeekCount > 0 && weekRangeLabel && (
                      <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-600">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium">{outsideWeekCount} diseño{outsideWeekCount !== 1 ? 's' : ''}</span> con fecha fuera de la semana visible ({weekRangeLabel}).{' '}
                          <span className="text-amber-600/90">Se crearán correctamente, pero no aparecerán en la vista actual hasta que cambies el filtro de semana.</span>
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-gutter:stable_both-edges]">
                      <table className="w-full caption-bottom text-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10" aria-label="Expandir" />
                            <TableHead className="w-10">#</TableHead>
                            <TableHead className="min-w-[100px]">Jugador</TableHead>
                            <TableHead className="min-w-[90px]">Local</TableHead>
                            <TableHead className="min-w-[90px]">Visitante</TableHead>
                            <TableHead className="min-w-[120px]">Diseñador</TableHead>
                            <TableHead className="min-w-[140px]">Deadline</TableHead>
                            <TableHead className="w-10 text-right" aria-label="Quitar fila" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence initial={false}>
                            {bulkRows.flatMap((row, index) => {
                              const valid = isRowValid(row);
                              const empty = isRowEmpty(row);
                              const incomplete = !valid && !empty;
                              const isExpanded = expandedRowIds.has(row.id);

                              const rowClass = cn(
                                'border-b border-gray-300/50 dark:border-gray-700/50 transition-colors hover:bg-gray-100/50 dark:hover:bg-gray-800/30',
                                incomplete && 'bg-amber-500/5'
                              );

                              const mainRow = (
                                <motion.tr
                                  key={row.id}
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2, ease: 'easeOut' }}
                                  className={rowClass}
                                >
                                  <TableCell className="w-10">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => toggleRowExpanded(row.id)}
                                      aria-expanded={isExpanded}
                                      aria-label={isExpanded ? 'Ocultar detalles' : 'Ver opcionales'}
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TableCell>
                                  <TableCell className="tabular-nums text-muted-foreground">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      placeholder="Jugador"
                                      value={row.player}
                                      onChange={(e) => updateBulkRow(row.id, 'player', e.target.value)}
                                      className="h-9"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      placeholder="Local"
                                      value={row.match_home}
                                      onChange={(e) => updateBulkRow(row.id, 'match_home', e.target.value)}
                                      className="h-9"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      placeholder="Visitante"
                                      value={row.match_away}
                                      onChange={(e) => updateBulkRow(row.id, 'match_away', e.target.value)}
                                      className="h-9"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={row.designer_id || 'auto'}
                                      onValueChange={(value) =>
                                        updateBulkRow(row.id, 'designer_id', value === 'auto' ? null : value)
                                      }
                                    >
                                      <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Automático" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="auto">Automático</SelectItem>
                                        {loadingDesigners ? (
                                          <SelectItem value="loading" disabled>
                                            Cargando...
                                          </SelectItem>
                                        ) : (
                                          designers.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                              {user.name}
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <DateTimePicker
                                      value={row.deadline_at}
                                      onChange={(date) => updateBulkRow(row.id, 'deadline_at', date)}
                                      placeholder="Fecha"
                                      className="h-9"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => removeBulkRow(row.id)}
                                      disabled={bulkRows.length === 1}
                                      aria-label="Quitar fila"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </motion.tr>
                              );

                              const detailRow = isExpanded ? (
                                <motion.tr
                                  key={`${row.id}-detail`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="border-b border-gray-300/50 bg-muted/30 dark:border-gray-700/50"
                                >
                                      <td colSpan={8} className="p-0 align-top">
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                                          style={{ overflow: 'hidden' }}
                                        >
                                          <div className="p-4">
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                                              <div className="space-y-2">
                                                <Label>Título (opcional)</Label>
                                                <Input
                                                  placeholder="Auto: jugador"
                                                  value={row.title}
                                                  onChange={(e) => updateBulkRow(row.id, 'title', e.target.value)}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>URL Drive (opcional)</Label>
                                                <Input
                                                  type="url"
                                                  placeholder="https://drive.google.com/..."
                                                  value={row.folder_url}
                                                  onChange={(e) => updateBulkRow(row.id, 'folder_url', e.target.value)}
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label>Estado jugador</Label>
                                                <Select
                                                  value={row.player_status || 'none'}
                                                  onValueChange={(value) =>
                                                    updateBulkRow(row.id, 'player_status', value === 'none' ? null : value)
                                                  }
                                                >
                                                  <SelectTrigger>
                                                    <SelectValue placeholder="Sin estado" />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="none">Sin estado</SelectItem>
                                                    {Object.entries(PLAYER_STATUS_CONFIG).map(([key, config]) => (
                                                      <SelectItem key={key} value={key}>
                                                        <div className="flex items-center gap-2">
                                                          <config.icon className="h-3 w-3" />
                                                          <span>{config.label}</span>
                                                        </div>
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      </td>
                                    </motion.tr>
                              ) : null;

                              return [mainRow, detailRow].filter(Boolean);
                            })}
                          </AnimatePresence>
                        </TableBody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
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
