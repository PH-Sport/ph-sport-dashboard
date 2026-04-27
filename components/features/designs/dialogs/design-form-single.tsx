'use client';

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
import { Info } from 'lucide-react';
import { PLAYER_STATUS_CONFIG } from '@/components/features/designs/tags/player-status-tag';
import type { PlayerStatus, SingleDesignFormData } from '@/lib/utils/design-form';

interface Designer {
  id: string;
  name: string;
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
  return (
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
                onChange={(e) => onChange({ ...formData, match_home: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="match_away">Equipo Visitante</Label>
              <Input
                id="match_away"
                placeholder="Barcelona"
                required
                value={formData.match_away}
                onChange={(e) => onChange({ ...formData, match_away: e.target.value })}
              />
            </div>
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
                  onChange({
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
              onChange={(e) => onChange({ ...formData, folder_url: e.target.value })}
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
              onChange={(e) => onChange({ ...formData, title: e.target.value })}
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
                onChange={(e) => onChange({ ...formData, player: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="player_status">Estado Jugador (Opcional)</Label>
              <Select
                value={formData.player_status || 'none'}
                onValueChange={(value) =>
                  onChange({
                    ...formData,
                    player_status: value === 'none' ? null : (value as PlayerStatus),
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
  );
}
