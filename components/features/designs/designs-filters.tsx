'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Filter, Search } from 'lucide-react';
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
}

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
}: DesignsFiltersProps) {
  return (
    <>
      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por título, jugador o partido..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avanzados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as DesignStatus | 'all')}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="BACKLOG">Pendiente</SelectItem>
                  <SelectItem value="DELIVERED">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="designer-filter">Diseñador</Label>
              <Select value={designerFilter} onValueChange={(v) => onDesignerFilterChange(v)}>
                <SelectTrigger id="designer-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {designers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Semana inicio</Label>
              <DatePicker
                value={weekStartFilter}
                onChange={onWeekStartChange}
                placeholder="Fecha inicio"
              />
            </div>
            <div className="grid gap-2">
              <Label>Semana fin</Label>
              <DatePicker
                value={weekEndFilter}
                onChange={onWeekEndChange}
                placeholder="Fecha fin"
                minDate={weekStartFilter}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
