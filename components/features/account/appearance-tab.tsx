'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
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

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
] as const;

export function AppearanceTab({ defaultView, onDefaultViewChange }: AppearanceTabProps) {
  const { theme, setTheme } = useTheme();
  // Evita mismatch de hidratación: next-themes no conoce el tema en SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-lg py-2">
      <div className="space-y-3">
        <Label>Tema</Label>
        <div className="grid grid-cols-2 gap-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = mounted && theme === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                aria-pressed={active}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
                  active
                    ? 'border-primary/50 bg-primary/10 text-foreground'
                    : 'border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          Se aplica al instante en este dispositivo.
        </p>
      </div>

      <div className="space-y-3">
        <Label>Vista predeterminada de Diseños</Label>
        <Select
          value={defaultView}
          onValueChange={(value) => onDefaultViewChange(value as DefaultView)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una vista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="list">Lista</SelectItem>
            <SelectItem value="calendar">Calendario</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Cómo se abre la página de Diseños por defecto.
        </p>
      </div>
    </div>
  );
}
