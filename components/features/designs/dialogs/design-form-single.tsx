'use client';

import { Card, CardContent } from '@/components/ui/card';
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
import { Info } from 'lucide-react';
import type { SingleDesignFormData } from '@/lib/utils/design-form';
import { DESIGN_TYPES, DESIGN_TYPE_LABELS, typeHasMatch } from '@/lib/types/design';
import { cn } from '@/lib/utils';

interface Designer {
  id: string;
  name: string;
  displayName: string;
}

interface DesignFormSingleProps {
  formData: SingleDesignFormData;
  onChange: (next: SingleDesignFormData) => void;
  designers: Designer[];
  loadingDesigners: boolean;
  /** Shown when the deadline falls outside the active week filter. */
  deadlineOutsideWeek: boolean;
  weekRangeLabel: string | null;
}

export function DesignFormSingle({
  formData,
  onChange,
  designers,
  loadingDesigners,
  deadlineOutsideWeek,
  weekRangeLabel,
}: DesignFormSingleProps) {
  const hasMatch = typeHasMatch(formData.type);

  return (
    <div className="space-y-4">
      {/* Tipo de pieza */}
      <div className="grid gap-2">
        <Label>Tipo de pieza</Label>
        <div className="flex flex-wrap gap-1.5">
          {DESIGN_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...formData, type: t })}
              className={cn(
                'h-9 rounded-xl px-3.5 text-sm font-medium transition-colors',
                formData.type === t
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {DESIGN_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Partido — solo matchday */}
          {hasMatch && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="match_home">Equipo Local</Label>
                <Input
                  id="match_home"
                  placeholder="Real Madrid"
                  value={formData.match_home}
                  onChange={(e) => onChange({ ...formData, match_home: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="match_away">Equipo Visitante</Label>
                <Input
                  id="match_away"
                  placeholder="Barcelona"
                  value={formData.match_away}
                  onChange={(e) => onChange({ ...formData, match_away: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder={hasMatch ? 'Matchday Real Madrid' : 'Título del diseño'}
              required
              value={formData.title}
              onChange={(e) => onChange({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="player">Jugador/Equipo</Label>
            <Input
              id="player"
              placeholder="Jugador o equipo"
              required
              value={formData.player}
              onChange={(e) => onChange({ ...formData, player: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Fecha de entrega</Label>
              <DateTimePicker
                value={formData.deadline_at}
                onChange={(date) => onChange({ ...formData, deadline_at: date })}
                placeholder="Selecciona fecha y hora"
              />
              {deadlineOutsideWeek && weekRangeLabel && (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-amber-600">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Esta fecha cae fuera de la semana visible ({weekRangeLabel}). El diseño existirá
                    pero no aparecerá en la vista actual hasta que cambies el filtro de semana.
                  </span>
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="designer_id">Diseñador</Label>
              <Select
                value={formData.designer_id || 'auto'}
                onValueChange={(value) =>
                  onChange({ ...formData, designer_id: value === 'auto' ? null : value })
                }
              >
                <SelectTrigger id="designer_id">
                  <SelectValue placeholder="Selecciona un diseñador" />
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
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="folder_url">URL Carpeta Drive (opcional)</Label>
            <Input
              id="folder_url"
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={formData.folder_url}
              onChange={(e) => onChange({ ...formData, folder_url: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
