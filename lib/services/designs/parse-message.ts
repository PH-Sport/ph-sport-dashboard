import { DESIGN_TYPES, type DesignType } from '@/lib/types/design';

/**
 * Lógica pura del agente de parseo (Fase 4, Task 1): construcción del prompt
 * y del tool schema para Claude, y normalización del `tool_use` devuelto por
 * el modelo a candidatos de diseño ya validados contra el dominio de la app
 * (tipos, diseñadores, fechas). Sin HTTP, sin React: eso vive en las tasks
 * siguientes (ruta `/api/designs/parse` y UI).
 */

/** Diseñador tal y como lo necesita el matching (subconjunto de la fila real). */
export interface ParseDesigner {
  id: string;
  display_name: string | null;
  full_name: string | null;
}

/** Forma cruda de un diseño tal y como lo devuelve el tool_use del modelo. */
export interface RawModelDesign {
  type?: string;
  player?: string;
  match_home?: string;
  match_away?: string;
  deadline_at?: string;
  designer_name?: string;
  details: string;
  needs_review?: string[];
}

/** Candidato ya normalizado y validado contra el dominio de la app. */
export interface ParsedDesignCandidate {
  type: DesignType | null;
  player: string;
  match_home: string;
  match_away: string;
  deadline_at: string | null; // ISO local validado, o null
  designer_id: string | null;
  details: string;
  warnings: string[];
}

/** Tool schema pasado a la API de Anthropic para forzar salida estructurada. */
export const PROPOSE_DESIGNS_TOOL = {
  name: 'propose_designs',
  description: 'Devuelve los diseños detectados en el mensaje',
  input_schema: {
    type: 'object',
    properties: {
      designs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'slug del tipo de pieza' },
            player: { type: 'string' },
            match_home: { type: 'string' },
            match_away: { type: 'string' },
            deadline_at: { type: 'string', description: 'YYYY-MM-DDTHH:mm hora local' },
            designer_name: { type: 'string', description: 'solo si el mensaje asigna explícitamente' },
            details: { type: 'string' },
            needs_review: { type: 'array', items: { type: 'string' } },
          },
          required: ['details'],
        },
      },
    },
    required: ['designs'],
  },
} as const;

/** Construye el system prompt interpolando la fecha de hoy y los diseñadores disponibles. */
export function buildSystemPrompt(opts: { today: string; designerNames: string[] }): string {
  const designers = opts.designerNames.join(', ');
  return `Eres el asistente de alta de diseños de PHSPORT (agencia de representación futbolística). Extraes los diseños gráficos a crear a partir de un mensaje —a menudo pegado de WhatsApp— o de una instrucción directa.

Hoy es ${opts.today} (zona horaria Europe/Madrid).

Tipos válidos (slug — cuándo usarlo): matchday — partido de un jugador; cumpleanos; convocatoria; debut; internacionalidad — convocatoria con selección; fichaje; cesion; firma — renovación/firma de contrato; playoff; welcome; md_conjunto — matchday de varios jugadores; md_animado — matchday animado; cv — CV/vídeo de captación; presentacion_captacion.

Diseñadores del equipo: ${designers}. Solo puedes proponer asignación a estos nombres, y SOLO si el mensaje lo pide explícitamente.

Reglas:
- Un diseño por pieza pedida. No inventes diseños ni valores que el mensaje no diga.
- deadline_at: "viernes" = el próximo viernes desde hoy; sin año, el año en curso (o el siguiente si esa fecha ya pasó); sin hora, usa 12:00 y añade "hora_asumida" a needs_review.
- matchday: rellena match_home y match_away si el mensaje los da; el equipo del jugador suele ser el local salvo que se indique lo contrario.
- md_conjunto: player admite varios nombres separados por coma.
- details: la información específica que no cabe en los otros campos (motivo, club, dorsal, selección...). Si un campo te genera duda, déjalo fuera y añade su nombre a needs_review.`;
}

/** minúsculas + sin diacríticos (NFD), para comparar nombres de forma robusta. */
export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Busca un diseñador por nombre, ignorando tilde/mayúsculas. Prueba primero
 * contra `display_name` (nombre de uso diario) y, si no hay match, contra el
 * primer token de `full_name` (por si el modelo solo captura el nombre de pila).
 */
export function matchDesigner(name: string, designers: ParseDesigner[]): string | null {
  const target = normalizeName(name.trim());
  if (!target) return null;

  for (const d of designers) {
    if (d.display_name && normalizeName(d.display_name) === target) return d.id;
  }

  for (const d of designers) {
    if (d.full_name) {
      const firstToken = d.full_name.trim().split(/\s+/)[0];
      if (firstToken && normalizeName(firstToken) === target) return d.id;
    }
  }

  return null;
}

const DEADLINE_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const ONE_HOUR_MS = 60 * 60 * 1000;

/** Normaliza un diseño crudo del modelo a un candidato validado contra el dominio. */
export function normalizeCandidate(
  raw: RawModelDesign,
  designers: ParseDesigner[],
  now: Date
): ParsedDesignCandidate {
  const warnings: string[] = [];

  let type: DesignType | null = null;
  if (raw.type) {
    if ((DESIGN_TYPES as readonly string[]).includes(raw.type)) {
      type = raw.type as DesignType;
    } else {
      warnings.push('tipo_no_reconocido');
    }
  }

  let designer_id: string | null = null;
  if (raw.designer_name) {
    designer_id = matchDesigner(raw.designer_name, designers);
    if (!designer_id) {
      warnings.push('disenador_no_encontrado');
    }
  }

  let deadline_at: string | null = null;
  if (raw.deadline_at) {
    const value = raw.deadline_at.trim();
    const date = DEADLINE_FORMAT.test(value) ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      warnings.push('fecha_no_reconocida');
    } else {
      deadline_at = value;
      if (date.getTime() < now.getTime() - ONE_HOUR_MS) {
        warnings.push('fecha_pasada');
      }
    }
  }

  if (raw.needs_review) {
    warnings.push(...raw.needs_review);
  }

  return {
    type,
    player: (raw.player ?? '').trim(),
    match_home: (raw.match_home ?? '').trim(),
    match_away: (raw.match_away ?? '').trim(),
    deadline_at,
    designer_id,
    details: (raw.details ?? '').trim(),
    warnings,
  };
}
