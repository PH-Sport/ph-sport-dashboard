'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Hint } from '@/components/ui/tooltip';
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
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Design } from '@/lib/types/design';
import { STATUS_LABELS, getDesignContext } from '@/lib/types/design';
import { PlayerStatusTag } from '@/components/features/designs/tags/player-status-tag';
import { UrgencyDot, getUrgency } from '@/components/ui/urgency-dot';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { DesignSortColumn, SortDirection } from '@/lib/hooks/use-designs-table';

interface Designer {
  id: string;
  name: string;
  avatar_url?: string | null;
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
  deletingId: string | null;
}

/** Texto del deadline con énfasis si es crítico/vencido. */
function deadlineTone(design: Design): string {
  const u = getUrgency(design.deadline_at, design.status === 'DELIVERED');
  return u === 'h24' || u === 'overdue' ? 'font-semibold text-destructive' : 'text-foreground';
}

/** Acciones de fila tras menú ⋯ — borrar deja de ser un objetivo siempre visible. */
function RowActions({
  design,
  deletingId,
  onEdit,
  onDelete,
}: {
  design: Design;
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
        <DropdownMenuItem
          onClick={() => onDelete(design)}
          disabled={deletingId === design.id}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  deletingId,
}: DesignsTableProps) {
  const renderSortIcon = (column: DesignSortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
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
    <div className="rounded-2xl border border-border bg-card p-md shadow-raised">
      {/* Barra superior discreta: recuento + items por página */}
      <div className="flex items-center justify-between gap-4 px-2 pb-2 pt-1">
        <Eyebrow>
          {totalItems} diseño{totalItems !== 1 ? 's' : ''}
          {searchQueryActive &&
            ` · filtrado de ${totalUnfilteredCount} total${totalUnfilteredCount !== 1 ? 'es' : ''}`}
        </Eyebrow>
        <div className="hidden items-center gap-2 sm:flex">
          <Label className="text-xs text-muted-foreground">Mostrar</Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(v) => onItemsPerPageChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-[4.5rem] rounded-lg text-xs">
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

      {/* Móvil: lista de filas (la tabla de 6 columnas no se encoge) */}
      <ul className="space-y-0.5 md:hidden">
        {paginatedItems.map((design) => {
          const designer = designers.find((d) => d.id === design.designer_id);
          return (
            <li key={design.id} className="rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onOpenDetail(design.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-medium">{design.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {design.player}
                    <PlayerStatusTag status={design.player_status} variant="compact" />
                    <span>· {designer ? designer.name : 'Sin asignar'}</span>
                  </p>
                </button>
                <RowActions
                  design={design}
                  deletingId={deletingId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <Badge status={design.status}>{STATUS_LABELS[design.status]}</Badge>
                <span className="flex items-center gap-2">
                  <UrgencyDot level={getUrgency(design.deadline_at, design.status === 'DELIVERED')} />
                  <span className={cn('font-mono tabular text-xs', deadlineTone(design))}>
                    {format(new Date(design.deadline_at), 'dd MMM HH:mm', { locale: es })}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop: tabla */}
      <div className="hidden md:block">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">{sortableHead('title', 'Título')}</TableHead>
              <TableHead className="w-[28%]">{sortableHead('player', 'Contexto')}</TableHead>
              <TableHead className="w-[13%]">Diseñador</TableHead>
              <TableHead className="w-[12%]">{sortableHead('status', 'Estado')}</TableHead>
              <TableHead className="w-[16%]">{sortableHead('deadline', 'Fecha de entrega')}</TableHead>
              <TableHead className="w-[11%] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((design) => {
              const designer = designers.find((d) => d.id === design.designer_id);
              return (
                <TableRow key={design.id}>
                  <TableCell>
                    <Hint label={design.title}>
                      <button
                        onClick={() => onOpenDetail(design.id)}
                        className="block w-full truncate text-left text-[15px] font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {design.title}
                      </button>
                    </Hint>
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{design.player}</span>
                        <PlayerStatusTag status={design.player_status} variant="compact" />
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {getDesignContext(design)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {designer ? (
                      <Hint label={designer.name}>
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={designer.name}
                          src={designer.avatar_url}
                          className="h-6 w-6"
                          fallbackClassName="bg-role-designer/15 text-xs font-medium text-role-designer"
                        />
                        <span className="max-w-[100px] truncate text-sm">
                          {designer.name.split(' ')[0]}
                        </span>
                      </div>
                      </Hint>
                    ) : (
                      <span className="text-sm text-status-warning">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge status={design.status}>{STATUS_LABELS[design.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UrgencyDot
                        level={getUrgency(design.deadline_at, design.status === 'DELIVERED')}
                      />
                      <div className="flex flex-col text-sm">
                        <span className={cn('font-mono tabular', deadlineTone(design))}>
                          {format(new Date(design.deadline_at), 'dd MMM', { locale: es })}
                        </span>
                        <span className="font-mono tabular text-xs text-muted-foreground">
                          {format(new Date(design.deadline_at), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <RowActions
                        design={design}
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

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
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
    </div>
  );
}
