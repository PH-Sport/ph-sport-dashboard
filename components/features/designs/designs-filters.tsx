'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, X } from 'lucide-react';
import type { DesignStatus } from '@/lib/types/filters';

interface Designer {
  id: string;
  name: string;
}

interface DesignsFiltersProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  statusFilter: DesignStatus | 'all';
  onStatusFilterChange: (v: DesignStatus | 'all') => void;
  designerFilter: string | 'all';
  onDesignerFilterChange: (v: string | 'all') => void;
  weekStartFilter: Date | undefined;
  onWeekStartChange: (date: Date | undefined) => void;
  weekEndFilter: Date | undefined;
  onWeekEndChange: (date: Date | undefined) => void;
  designers: Designer[];
  hasActiveFilters: boolean;
  onReset: () => void;
}

/**
 * Barra de filtros única — búsqueda + selectores en una sola superficie,
 * con "Limpiar" visible cuando algo difiere del default. Sin tarjetas apiladas
 * ni panel "Avanzados" que no se colapsa.
 */
export function DesignsFilters({
  searchQuery,
  onSearchQueryChange,
  statusFilter,
  onStatusFilterChange,
  designerFilter,
  onDesignerFilterChange,
  weekStartFilter,
  onWeekStartChange,
  weekEndFilter,
  onWeekEndChange,
  designers,
  hasActiveFilters,
  onReset,
}: DesignsFiltersProps) {
  return (
    <Card density="compact">
      <CardContent className="pt-md">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {/* Búsqueda */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por título, jugador o partido…"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-9"
              aria-label="Buscar diseños"
            />
          </div>

          {/* Selectores */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:flex xl:items-center">
            <Select
              value={statusFilter}
              onValueChange={(v) => onStatusFilterChange(v as DesignStatus | 'all')}
            >
              <SelectTrigger className="xl:w-[160px]" aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="BACKLOG">Pendiente</SelectItem>
                <SelectItem value="DELIVERED">Entregado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={designerFilter} onValueChange={(v) => onDesignerFilterChange(v)}>
              <SelectTrigger className="xl:w-[180px]" aria-label="Filtrar por diseñador">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los diseñadores</SelectItem>
                {designers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DatePicker value={weekStartFilter} onChange={onWeekStartChange} placeholder="Desde" />
            <DatePicker
              value={weekEndFilter}
              onChange={onWeekEndChange}
              placeholder="Hasta"
              minDate={weekStartFilter}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="shrink-0 self-start text-muted-foreground xl:self-auto"
            >
              <X className="mr-1.5 h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
