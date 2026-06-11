/**
 * Saludos del dashboard — tono PHSPORT: directo, seguro, cálido. Sin chistes.
 * El saludo es DETERMINISTA por día y franja horaria (no cambia entre renders
 * ni al refrescar): la personalidad de la app debe ser estable, no aleatoria.
 */

const MORNING_GREETINGS = [
  'Buenos días, {name}',
  'Hola, {name}',
  '{name}, empieza el día',
];

const AFTERNOON_GREETINGS = [
  'Buenas tardes, {name}',
  'Hola, {name}',
  '{name}, sigamos',
];

const EVENING_GREETINGS = [
  'Buenas tardes, {name}',
  '{name}, última pasada',
  'Hola, {name}',
];

const NIGHT_GREETINGS = ['Buenas noches, {name}', 'Hola, {name}'];

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

/** Saludo estable durante todo el día (rota entre días, no entre renders). */
export function getDailyGreeting(name: string, now: Date = new Date()): string {
  const slot = getSlot(now.getHours());
  const pool = getPool(slot);
  const dayIndex = Math.floor(now.getTime() / 86_400_000);
  return fillTemplate(pool[dayIndex % pool.length], name);
}

export function getStaticGreeting(name: string, now: Date = new Date()): string {
  const slot = getSlot(now.getHours());
  return name ? `${FALLBACKS[slot]}, ${name}` : FALLBACKS[slot];
}
