'use client';

import { Switch } from '@/components/ui/switch';
import { Mail, Smartphone } from 'lucide-react';
import type {
  NotificationChannel,
  NotificationEvent,
  NotificationPreferences,
} from '@/lib/utils/notification-preferences';

interface NotificationsTabProps {
  preferences: NotificationPreferences;
  onToggle: (channel: NotificationChannel, type: NotificationEvent) => void;
}

interface EventRow {
  type: NotificationEvent;
  label: string;
  description: string;
}

const EVENT_ROWS: EventRow[] = [
  {
    type: 'assignment',
    label: 'Nuevas Asignaciones',
    description: 'Cuando se te asigna un diseño',
  },
  {
    type: 'statusChanges',
    label: 'Cambios de Estado',
    description: 'Cuando cambia el estado de tus diseños',
  },
  {
    type: 'upcomingDeadlines',
    label: 'Deadlines Próximos',
    description: 'Recordatorios de fechas límite',
  },
  {
    type: 'comments',
    label: 'Nuevos Comentarios',
    description: 'Cuando alguien comenta en tu diseño',
  },
];

export function NotificationsTab({ preferences, onToggle }: NotificationsTabProps) {
  return (
    <div className="space-y-6 py-2">
      <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
        <h3 className="text-sm font-medium text-foreground mb-1">Preferencias de canales</h3>
        <p className="text-xs text-muted-foreground">
          Elige cómo quieres recibir las notificaciones para cada tipo de evento.
        </p>
      </div>

      <div className="space-y-6">
        {/* Headers */}
        <div className="grid grid-cols-3 gap-4 pb-2 border-b border-border/50">
          <span className="text-sm font-medium text-muted-foreground">Evento</span>
          <div className="flex flex-col items-center justify-center">
            <Mail className="h-4 w-4 mb-1 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Email</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Smartphone className="h-4 w-4 mb-1 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">In-App</span>
          </div>
        </div>

        {EVENT_ROWS.map((row) => (
          <div key={row.type} className="grid grid-cols-3 gap-4 items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{row.label}</span>
              <span className="text-xs text-muted-foreground">{row.description}</span>
            </div>
            <div className="flex justify-center">
              <Switch
                checked={preferences.email[row.type]}
                onCheckedChange={() => onToggle('email', row.type)}
              />
            </div>
            <div className="flex justify-center">
              <Switch
                checked={preferences.in_app[row.type]}
                onCheckedChange={() => onToggle('in_app', row.type)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
