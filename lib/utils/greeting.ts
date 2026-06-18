/**
 * Saludos del dashboard — tono PHSPORT: directo, seguro, cálido. Sin chistes.
 *
 * Dos modos, según el caso de uso:
 *  - getDailyTemplate / getDailyGreeting: DETERMINISTA por día y franja (mismo
 *    valor en server y cliente). Sirve de SEED inicial para no romper la
 *    hidratación.
 *  - pickRotatingTemplate: rota entre las variantes de la franja en cada carga
 *    (refresco o navegar-y-volver). Solo en cliente, tras la hidratación.
 * La franja horaria SIEMPRE manda: la rotación elige variante dentro de ella.
 */

const MORNING_GREETINGS = [
  'Buenos días, {name}',
  'Hola, {name}',
  '{name}, empieza el día',
  '¡Arriba, {name}!',
  'Día nuevo, {name}',
];

const AFTERNOON_GREETINGS = [
  'Buenas tardes, {name}',
  'Hola, {name}',
  '{name}, sigamos',
  '{name}, a tope',
  '{name}, buen ritmo',
];

const EVENING_GREETINGS = [
  'Buenas tardes, {name}',
  '{name}, última pasada',
  'Hola, {name}',
  '{name}, recta final',
  'Casi está, {name}',
];

const NIGHT_GREETINGS = [
  'Buenas noches, {name}',
  'Hola, {name}',
  '{name}, a descansar',
  'Modo noche, {name}',
];

const FALLBACKS = {
  morning: 'Buenos días',
  afternoon: 'Buenas tardes',
  evening: 'Buenas tardes',
  night: 'Buenas noches',
} as const;

type Slot = keyof typeof FALLBACKS;

function getSlot(hour: number): Slot {
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 19) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

function getPool(slot: Slot): string[] {
  switch (slot) {
    case 'morning':
      return MORNING_GREETINGS;
    case 'afternoon':
      return AFTERNOON_GREETINGS;
    case 'evening':
      return EVENING_GREETINGS;
    case 'night':
      return NIGHT_GREETINGS;
  }
}

function fillTemplate(template: string, name: string): string {
  if (!name) {
    return template
      .replace(', {name}', '')
      .replace('{name}, ', '')
      .replace('{name}', '');
  }
  return template.replace('{name}', name);
}

/**
 * Plantilla determinista del día (misma en server y cliente): SEED inicial para
 * pintar algo coherente antes de que el cliente rote, sin mismatch de hidratación.
 */
export function getDailyTemplate(now: Date = new Date()): string {
  const pool = getPool(getSlot(now.getHours()));
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  return pool[dayIndex % pool.length];
}

/** Saludo estable durante todo el día (rota entre días, no entre renders). */
export function getDailyGreeting(name: string, now: Date = new Date()): string {
  return fillTemplate(getDailyTemplate(now), name);
}

/**
 * Escoge una plantilla al azar dentro de la franja horaria actual, evitando
 * `avoid` (la última mostrada) para que no se repita en cargas consecutivas.
 * Llamar SOLO en cliente, tras la hidratación: usa aleatoriedad no determinista.
 */
export function pickRotatingTemplate(
  avoid: string | null,
  now: Date = new Date(),
  rng: () => number = Math.random,
): string {
  const pool = getPool(getSlot(now.getHours()));
  const candidates = avoid && pool.length > 1 ? pool.filter((t) => t !== avoid) : pool;
  const choices = candidates.length > 0 ? candidates : pool;
  return choices[Math.floor(rng() * choices.length)];
}

/** Rellena {name} en una plantilla (combina con get*Template / pickRotatingTemplate). */
export function fillGreeting(template: string, name: string): string {
  return fillTemplate(template, name);
}

export function getStaticGreeting(name: string, now: Date = new Date()): string {
  const slot = getSlot(now.getHours());
  return name ? `${FALLBACKS[slot]}, ${name}` : FALLBACKS[slot];
}
