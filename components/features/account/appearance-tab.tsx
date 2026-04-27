'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DefaultView } from '@/lib/hooks/use-user-preferences';

interface AppearanceTabProps {
  defaultView: DefaultView;
  onDefaultViewChange: (v: DefaultView) => void;
}

export function AppearanceTab({ defaultView, onDefaultViewChange }: AppearanceTabProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-4">
        <div className="space-y-3">
          <Label>Vista predeterminada del Dashboard</Label>
          <Select
            value={defaultView}
            onValueChange={(value) => onDefaultViewChange(value as DefaultView)}
          >
            <SelectTrigger className="w-full bg-background border-input">
              <SelectValue placeholder="Selecciona una vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">Vista de Lista</SelectItem>
              <SelectItem value="calendar">Vista de Calendario</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Elige cómo quieres ver tus tareas al iniciar sesión.
          </p>
        </div>
      </div>
    </div>
  );
}
