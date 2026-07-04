'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapse } from '@/components/ui/collapse';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks/use-is-mobile';
import type { DesignStatus } from '@/lib/types/filters';

interface Designer {
  id: string;
  name: string;
  displayName: string;
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
  formerDesigners: { id: string; name: string }[];
  hasActiveFilters: boolean;
  onReset: () => void;
}

/**
 * Barra de filtros única — búsqueda + selectores en una sola superficie.
 *
 * Móvil: la búsqueda queda siempre a mano y los selectores se pliegan tras el
 * botón de filtros (con punto dorado si hay filtros activos) — la pantalla es
 * de los diseños, no de los controles. Escritorio: todo visible, como siempre.
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
  formerDesigners,
  hasActiveFilters,
  onReset,
}: DesignsFiltersProps) {
  const isMobile = useIsMobile();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const selectorsVisible = !isMobile || mobileFiltersOpen;

  return (
    <div className="rounded-2xl border border-border bg-card p-md shadow-raised">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {/* Búsqueda + toggle de filtros (el toggle solo existe en móvil) */}
          <div className="flex items-center gap-2 xl:min-w-0 xl:flex-1">
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
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              aria-expanded={mobileFiltersOpen}
              aria-label={mobileFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
              className={cn(
                'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border outline-none transition-colors md:hidden',
                'focus-visible:ring-2 focus-visible:ring-ring',
                mobileFiltersOpen
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary"
                  aria-hidden
                />
              )}
            </button>
          </div>

          {/* Selectores — siempre visibles en escritorio; plegados en móvil */}
          <Collapse open={selectorsVisible}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:flex xl:items-center">
            <Select
              value={statusFilter}
              onValueChange={(v) => onStatusFilterChange(v as DesignStatus | 'all')}
            >
              <SelectTrigger className="shrink-0 xl:w-[150px]" aria-label="Filtrar por estado">
                <span>
                  <span className="text-muted-foreground">Estado:</span> <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="BACKLOG">Pendiente</SelectItem>
                <SelectItem value="DELIVERED">Entregado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={designerFilter} onValueChange={(v) => onDesignerFilterChange(v)}>
              <SelectTrigger className="shrink-0 xl:w-[185px]" aria-label="Filtrar por diseñador">
                <span>
                  <span className="text-muted-foreground">Diseñador:</span> <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {designers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.displayName}
                  </SelectItem>
                ))}
                {formerDesigners.length > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                        Exmiembros
                      </SelectLabel>
                      {formerDesigners.map((f) => (
                        <SelectItem key={`former:${f.id}`} value={`former:${f.id}`}>
                          {f.name} (exmiembro)
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
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
          </Collapse>

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
      </div>
  );
}
