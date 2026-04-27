// Tipos unificados para la aplicación PH Sport
// Estos tipos se usan tanto en modo demo como en producción

import type { DesignStatus } from './filters';

// Tipo de estado del diseño (ya definido en filters.ts pero lo re-exportamos)
export type { DesignStatus } from './filters';

// Orden único de estados para toda la aplicación
export const DESIGN_STATUS_ORDER = ['BACKLOG', 'DELIVERED'] as const;

// Etiquetas legibles por estado
export const STATUS_LABELS: Record<DesignStatus, string> = {
  BACKLOG: 'Pendiente',
  DELIVERED: 'Entregado',
};

// Color mapping por estado para UI consistente.
// Los valores usan los CSS vars definidos en globals.css para que respeten el tema activo.
export const STATUS_COLORS = {
  BACKLOG: {
    background: 'hsl(var(--muted))',
    border: 'hsl(var(--muted-foreground) / 0.5)',
    text: 'hsl(var(--muted-foreground))',
    badgeVariant: 'outline' as const,
  },
  DELIVERED: {
    background: 'hsl(var(--status-success) / 0.2)',
    border: 'hsl(var(--status-success) / 0.7)',
    text: 'hsl(var(--status-success))',
    badgeVariant: 'secondary' as const,
  },
} as const;

// Flujo de transiciones permitidas entre estados
export const STATUS_FLOW: Record<DesignStatus, DesignStatus[]> = {
  BACKLOG: ['DELIVERED'],
  DELIVERED: ['BACKLOG'],
};

// Interfaz unificada para Design (compatible con MockDesign y Supabase)
export interface Design {
  id: string;
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  player_status?: 'injured' | 'suspended' | 'doubt' | 'last_minute'; // Estado del jugador
  folder_url?: string;
  deadline_at: string; // ISO 8601 string
  status: DesignStatus;
  designer_id?: string;
  created_at?: string; // ISO 8601 string (opcional, para historial)
  updated_at?: string; // ISO 8601 string (opcional, para historial)
  created_by?: string; // UUID (opcional)
  reviewed_by?: string; // UUID (opcional)
  delivered_at?: string; // ISO 8601 string (opcional)
}

// Input para crear un nuevo design
export interface CreateDesignInput {
  title: string;
  player: string;
  match_home: string;
  match_away: string;
  folder_url?: string;
  deadline_at: string; // ISO 8601 string
  designer_id?: string;
}

// Input para actualizar un design
export interface UpdateDesignInput {
  title?: string;
  player?: string;
  match_home?: string;
  match_away?: string;
  folder_url?: string;
  deadline_at?: string;
  status?: DesignStatus;
  designer_id?: string;
}

// Historial de cambios (para detalle de design)
export interface DesignHistoryItem {
  id: string;
  design_id: string;
  action: string; // 'created', 'updated', 'status_changed', 'assigned', etc.
  actor_id?: string;
  actor_name?: string;
  payload?: Record<string, unknown>;
  created_at: string; // ISO 8601 string
}
