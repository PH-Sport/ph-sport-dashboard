'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit2,
  Trash2,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  AlertTriangle,
  MoreHorizontal,
  Calendar,
} from 'lucide-react';
import type { Design, DesignStatus } from '@/lib/types/design';
import { STATUS_LABELS } from '@/lib/types/design';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
import type { DesignSortColumn, SortDirection } from '@/lib/hooks/use-designs-table';

interface Designer {
  id: string;
  name: string;
}

interface DesignsTableProps {
  paginatedItems: Design[];
  designers: Designer[];
  totalItems: number;
  totalUnfilteredCount: number;
  searchQueryActive: boolean;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  sortColumn: DesignSortColumn;
  sortDirection: SortDirection;
  onSort: (column: DesignSortColumn) => void;
  onItemsPerPageChange: (n: number) => void;
  onPageChange: (next: number | ((prev: number) => number)) => void;
  onOpenDetail: (designId: string) => void;
  onEdit: (design: Design) => void;
  onDelete: (design: Design) => void;
  onStatusChange: (design: Design, newStatus: DesignStatus) => void;
  updatingId: string | null;
  isAdmin: boolean;
  deletingId: string | null;
}

function getUrgency(design: Design) {
  const hoursLeft = (new Date(design.deadline_at).getTime() - Date.now()) / (1000 * 60 * 60);
  const pending = design.status !== 'DELIVERED';
  return {
    hoursLeft,
    isCritical: pending && hoursLeft > 0 && hoursLeft < 24,
    isUrgent: pending && hoursLeft >= 24 && hoursLeft < 48,
  };
}

function UrgencyBadges({ design }: { design: Design }) {
  const { hoursLeft, isCritical, isUrgent } = getUrgency(design);
  if (isCritical) {
    return (
      <Badge variant="destructive" className="h-6 shrink-0 gap-1">
        <Flame className="h-3 w-3" />
        {Math.floor(hoursLeft)}h
      </Badge>
    );
  }
  if (isUrgent) {
    return (
      <Badge variant="warning" className="h-6 shrink-0 gap-1">
        <AlertTriangle className="h-3 w-3" />
        {Math.floor(hoursLeft)}h
      </Badge>
    );
  }
  return null;
}

/** Acciones de fila tras menú ⋯ — borrar deja de ser un objetivo siempre visible. */
function RowActions({
  design,
  isAdmin,
  deletingId,
  onEdit,
  onDelete,
}: {
  design: Design;
  isAdmin: boolean;
  deletingId: string | null;
  onEdit: (design: Design) => void;
  onDelete: (design: Design) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`Acciones — ${design.title}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {design.folder_url && (
          <DropdownMenuItem asChild>
            <a href={design.folder_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir en Drive
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onEdit(design)}>
          <Edit2 className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem
            onClick={() => onDelete(design)}
            disabled={deletingId === design.id}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusSelect({
  design,
  onStatusChange,
  disabled,
}: {
  design: Design;
  onStatusChange: (design: Design, newStatus: DesignStatus) => void;
  disabled: boolean;
}) {
  return (
    <Select
      value={design.status}
      onValueChange={(v) => onStatusChange(design, v as DesignStatus)}
      disabled={disabled}
    >
      <SelectTrigger className="h-8 w-[130px] text-xs" aria-label="Cambiar estado">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="BACKLOG">{STATUS_LABELS.BACKLOG}</SelectItem>
        <SelectItem value="DELIVERED">{STATUS_LABELS.DELIVERED}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function DesignsTable({
  paginatedItems,
  designers,
  totalItems,
  totalUnfilteredCount,
  searchQueryActive,
  itemsPerPage,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  sortColumn,
  sortDirection,
  onSort,
  onItemsPerPageChange,
  onPageChange,
  onOpenDetail,
  onEdit,
  onDelete,
  onStatusChange,
  updatingId,
  isAdmin,
  deletingId,
}: DesignsTableProps) {
  const renderSortIcon = (column: DesignSortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const sortableHead = (column: DesignSortColumn, label: string) => (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="flex select-none items-center gap-1 rounded-sm outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
      {renderSortIcon(column)}
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Lista de Diseños</CardTitle>
            <CardDescription>
              {totalItems} diseño{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
              {searchQueryActive && ` (filtrado de ${totalUnfilteredCount} total${totalUnfilteredCount !== 1 ? 'es' : ''})`}
            </CardDescription>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Label className="text-sm text-muted-foreground">Mostrar</Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(v) => onItemsPerPageChange(Number(v))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Móvil: lista de cards (la tabla de 6 columnas no se encoge, se adapta) */}
        <div className="space-y-2 md:hidden">
          {paginatedItems.map((design) => (
            <Card key={design.id} density="compact">
              <CardContent className="pt-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => onOpenDetail(design.id)}
                      className="truncate text-left font-medium transition-colors hover:text-primary"
                    >
                      {design.title}
                    </button>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      {design.player}
                      {design.player_status && (
                        <PlayerStatusTag status={design.player_status} variant="compact" />
                      )}
                      <span>· {design.match_home} vs {design.match_away}</span>
                    </p>
                  </div>
                  <RowActions
                    design={design}
                    isAdmin={isAdmin}
                    deletingId={deletingId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusSelect
                      design={design}
                      onStatusChange={onStatusChange}
                      disabled={updatingId === design.id}
                    />
                    <UrgencyBadges design={design} />
                  </div>
                  <span className="mono tabular flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {format(new Date(design.deadline_at), 'dd MMM HH:mm', { locale: es })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop: tabla */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{sortableHead('title', 'Título')}</TableHead>
                <TableHead>{sortableHead('player', 'Contexto')}</TableHead>
                <TableHead>Diseñador</TableHead>
                <TableHead>{sortableHead('status', 'Estado')}</TableHead>
                <TableHead>{sortableHead('deadline', 'Fecha de entrega')}</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((design) => {
                const designer = designers.find((d) => d.id === design.designer_id);

                return (
                  <TableRow key={design.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => onOpenDetail(design.id)}
                        className="text-left transition-colors hover:text-primary"
                      >
                        {design.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{design.player}</span>
                          {design.player_status && (
                            <PlayerStatusTag status={design.player_status} variant="compact" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {design.match_home} vs {design.match_away}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {designer ? (
                        <div className="flex items-center gap-2" title={designer.name}>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {designer.name.charAt(0)}
                          </div>
                          <span className="max-w-[100px] truncate text-sm">
                            {designer.name.split(' ')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-status-warning">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusSelect
                          design={design}
                          onStatusChange={onStatusChange}
                          disabled={updatingId === design.id}
                        />
                        <UrgencyBadges design={design} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{format(new Date(design.deadline_at), 'dd MMM', { locale: es })}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(design.deadline_at), 'HH:mm')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <RowActions
                          design={design}
                          isAdmin={isAdmin}
                          deletingId={deletingId}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Controles de paginación */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Anterior
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
