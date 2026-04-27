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
  Edit2,
  Trash2,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import type { Design } from '@/lib/types/design';
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
  isAdmin: boolean;
  deletingId: string | null;
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lista de Diseños</CardTitle>
            <CardDescription>
              {totalItems} diseño{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
              {searchQueryActive && ` (filtrado de ${totalUnfilteredCount} total${totalUnfilteredCount !== 1 ? 'es' : ''})`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => onSort('title')}
              >
                <div className="flex items-center gap-1">
                  Título
                  {renderSortIcon('title')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => onSort('player')}
              >
                <div className="flex items-center gap-1">
                  Contexto
                  {renderSortIcon('player')}
                </div>
              </TableHead>
              <TableHead>Diseñador</TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => onSort('status')}
              >
                <div className="flex items-center gap-1">
                  Estado
                  {renderSortIcon('status')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-primary transition-colors select-none"
                onClick={() => onSort('deadline')}
              >
                <div className="flex items-center gap-1">
                  Fecha de entrega
                  {renderSortIcon('deadline')}
                </div>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((design) => {
              const designer = designers.find((d) => d.id === design.designer_id);

              const now = new Date();
              const deadline = new Date(design.deadline_at);
              const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
              const isUrgent = hoursUntilDeadline < 48 && hoursUntilDeadline > 0 && design.status !== 'DELIVERED';
              const isCritical = hoursUntilDeadline < 24 && hoursUntilDeadline > 0 && design.status !== 'DELIVERED';

              return (
                <TableRow key={design.id}>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => onOpenDetail(design.id)}
                      className="hover:text-primary transition-colors text-left"
                    >
                      {design.title}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{design.player}</span>
                        {design.player_status && <PlayerStatusTag status={design.player_status} variant="compact" />}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {design.match_home} vs {design.match_away}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {designer ? (
                      <div className="flex items-center gap-2" title={designer.name}>
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {designer.name.charAt(0)}
                        </div>
                        <span className="text-sm truncate max-w-[100px]">{designer.name.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge status={design.status} className="h-6">
                        {STATUS_LABELS[design.status]}
                      </Badge>
                      {isCritical && (
                        <Badge variant="destructive" className="h-6 gap-1 shrink-0">
                          <Flame className="h-3 w-3" />
                          {Math.floor(hoursUntilDeadline)}h
                        </Badge>
                      )}
                      {isUrgent && !isCritical && (
                        <Badge variant="warning" className="h-6 gap-1 shrink-0">
                          <AlertTriangle className="h-3 w-3" />
                          {Math.floor(hoursUntilDeadline)}h
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span>{format(new Date(design.deadline_at), 'dd MMM', { locale: es })}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(design.deadline_at), 'HH:mm')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {design.folder_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={design.folder_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir carpeta Drive"
                            aria-label="Abrir carpeta Drive"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(design)}
                        title="Editar diseño"
                        aria-label="Editar diseño"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(design)}
                        disabled={!isAdmin || deletingId === design.id}
                        title={
                          isAdmin
                            ? 'Eliminar diseño'
                            : 'Solo administradores pueden eliminar diseños'
                        }
                        aria-label="Eliminar diseño"
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Controles de paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
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
                <ChevronLeft className="h-4 w-4 mr-1" />
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
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
