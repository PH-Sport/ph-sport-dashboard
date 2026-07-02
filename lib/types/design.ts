// Tipos unificados para la aplicación PH Sport
// Estos tipos se usan tanto en modo demo como en producción

import type { DesignStatus } from './filters';

// Tipo de estado del diseño (ya definido en filters.ts pero lo re-exportamos)
export type { DesignStatus } from './filters';

// Orden único de estados para toda la aplicación
export const DESIGN_STATUS_ORDER = ['BACKLOG', 'DELIVERED'] as const;

// ─── Tipos de pieza ──────────────────────────────────────────
// Conjunto único y EXTENSIBLE: añadir un tipo = añadir su slug aquí + su
// label + su peso. Solo 'matchday' tiene partido (match_home/match_away);
// el resto, no.
export const DESIGN_TYPES = [
  'matchday',
  'cumpleanos',
  'convocatoria',
  'debut',
  'internacionalidad',
  'fichaje',
  'cesion',
  'firma',
  'playoff',
  'welcome',
  'md_conjunto',
  'md_animado',
  'cv',
  'presentacion_captacion',
] as const;
export type DesignType = (typeof DESIGN_TYPES)[number];
export const DEFAULT_DESIGN_TYPE: DesignType = 'matchday';

export const DESIGN_TYPE_LABELS: Record<DesignType, string> = {
  matchday: 'Matchday',
  cumpleanos: 'Cumpleaños',
  convocatoria: 'Convocatorias',
  debut: 'Debuts',
  internacionalidad: 'Internacionalidades',
  fichaje: 'Fichajes',
  cesion: 'Cesiones',
  firma: 'Firmas',
  playoff: 'Playoffs',
  welcome: 'Welcome',
  md_conjunto: 'MD conjuntos',
  md_animado: 'MD Animados',
  cv: 'CV',
  presentacion_captacion: 'Presentación para captación',
};

/** Peso de esfuerzo de cada tipo de pieza (usado por la Fase 2 para ponderar el reparto de carga). */
export type DesignWeight = 'RAPIDA' | 'MEDIA' | 'PESADA';

export const DESIGN_TYPE_WEIGHT: Record<DesignType, DesignWeight> = {
  matchday: 'RAPIDA',
  cumpleanos: 'RAPIDA',
  convocatoria: 'RAPIDA',
  debut: 'MEDIA',
  internacionalidad: 'MEDIA',
  fichaje: 'MEDIA',
  cesion: 'MEDIA',
  firma: 'MEDIA',
  playoff: 'MEDIA',
  welcome: 'MEDIA',
  md_conjunto: 'MEDIA',
  md_animado: 'PESADA',
  cv: 'PESADA',
  presentacion_captacion: 'PESADA',
};

/** Valor numérico de cada peso. Pesada > el doble de Media: una pieza pesada
 * suele equivaler en tiempo real a varias piezas rápidas, no a "un poco más". */
export const DESIGN_WEIGHT_VALUES: Record<DesignWeight, number> = {
  RAPIDA: 1,
  MEDIA: 2,
  PESADA: 4,
};

/** Resuelve un tipo de pieza directamente a su peso numérico. */
export function getDesignWeightValue(type: DesignType | undefined): number {
  const weight = DESIGN_TYPE_WEIGHT[type ?? DEFAULT_DESIGN_TYPE];
  return DESIGN_WEIGHT_VALUES[weight];
}

/** Tipos con partido (muestran/exigen equipos). De momento solo matchday. */
export function typeHasMatch(type: DesignType | undefined): boolean {
  return (type ?? DEFAULT_DESIGN_TYPE) === 'matchday';
}

/**
 * Texto de contexto de un diseño según su tipo: el partido si es matchday,
 * o la etiqueta del tipo (Cumpleaños, Presentación...) en caso contrario.
 */
export function getDesignContext(d: {
  type?: DesignType;
  match_home?: string | null;
  match_away?: string | null;
}): string {
  if (typeHasMatch(d.type)) {
    return d.match_home && d.match_away ? `${d.match_home} vs ${d.match_away}` : '';
  }
  return DESIGN_TYPE_LABELS[(d.type ?? DEFAULT_DESIGN_TYPE)] ?? '';
}

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
  type?: DesignType; // Tipo de pieza (matchday por defecto si falta)
  player: string;
  match_home?: string; // Solo matchday
  match_away?: string; // Solo matchday
  details?: string; // Texto libre con lo específico del tipo de pieza (rival, club, selección...)
  folder_url?: string;
  deadline_at: string; // ISO 8601 string
  status: DesignStatus;
  designer_id?: string;
  created_at?: string; // ISO 8601 string (opcional, para historial)
  updated_at?: string; // ISO 8601 string (opcional, para historial)
  created_by?: string; // UUID (opcional)
  reviewed_by?: string; // UUID (opcional)
  former_designer_id?: string; // UUID del diseñador eliminado (registro histórico)
  former_designer_name?: string; // display_name congelado del diseñador eliminado
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
