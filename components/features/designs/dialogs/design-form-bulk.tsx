'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPRINGS } from '@/components/ui/animations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Trash2, ChevronRight, ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type BulkDesignRow,
  isRowValid,
  isRowEmpty,
  isOutsideWeek,
} from '@/lib/utils/design-form';
import { DESIGN_TYPES, DESIGN_TYPE_LABELS, typeHasMatch } from '@/lib/types/design';

interface Designer {
  id: string;
  name: string;
  displayName: string;
}

interface DesignFormBulkProps {
  bulkRows: BulkDesignRow[];
  onChange: (next: BulkDesignRow[]) => void;
  designers: Designer[];
  loadingDesigners: boolean;
  activeWeekStart?: Date;
  activeWeekEnd?: Date;
  weekRangeLabel: string | null;
}

export function DesignFormBulk({
  bulkRows,
  onChange,
  designers,
  loadingDesigners,
  activeWeekStart,
  activeWeekEnd,
  weekRangeLabel,
}: DesignFormBulkProps) {
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

  // Tipo del lote (todas las filas comparten tipo).
  const currentType = bulkRows[0]?.type ?? 'matchday';
  const hasMatch = typeHasMatch(currentType);
  const setLotType = (type: (typeof DESIGN_TYPES)[number]) =>
    onChange(bulkRows.map((r) => ({ ...r, type })));

  const outsideWeekCount = useMemo(() => {
    if (!activeWeekStart || !activeWeekEnd) return 0;
    return bulkRows.filter(
      (r) => isRowValid(r) && isOutsideWeek(r.deadline_at, activeWeekStart, activeWeekEnd)
    ).length;
  }, [bulkRows, activeWeekStart, activeWeekEnd]);

  const updateBulkRow = (
    id: string,
    field: keyof BulkDesignRow,
    value: string | Date | null | undefined
  ) => {
    onChange(bulkRows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeBulkRow = (id: string) => {
    if (bulkRows.length > 1) {
      onChange(bulkRows.filter((r) => r.id !== id));
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 min-h-0 flex flex-col pt-4">
        {/* Tipo de pieza — aplica a todo el lote */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm text-muted-foreground">Tipo:</span>
          {DESIGN_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setLotType(t)}
              className={cn(
                'h-8 rounded-full px-3 text-xs font-medium transition-colors',
                currentType === t
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {DESIGN_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {hasMatch
              ? 'Campos obligatorios: Jugador, Local, Visitante y Deadline.'
              : 'Campos obligatorios: Jugador y Deadline.'}
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
          <table className="w-full caption-bottom text-sm table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" aria-label="Expandir" />
                <TableHead className="w-10">#</TableHead>
                <TableHead className="w-[20%]">Jugador</TableHead>
                {hasMatch && <TableHead className="w-[14%]">Local</TableHead>}
                {hasMatch && <TableHead className="w-[14%]">Visitante</TableHead>}
                <TableHead className="w-[24%]">Diseñador</TableHead>
                <TableHead className="w-[22%]">Deadline</TableHead>
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
                    'border-b border-border/50 transition-colors hover:bg-muted/50',
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
                      {hasMatch && (
                        <>
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
                        </>
                      )}
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
                                  {user.displayName}
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
                      className="border-b border-border/50 bg-muted/30"
                    >
                      <td colSpan={hasMatch ? 8 : 6} className="p-0 align-top">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={SPRINGS.smooth}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className="p-4">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
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
  );
}
