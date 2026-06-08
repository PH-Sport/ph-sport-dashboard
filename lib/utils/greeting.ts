const MORNING_GREETINGS = [
  'Buenos días, {name}',
  'Hola, {name}',
  'Buen día, {name}',
  '¿Listo para empezar, {name}?',
  '{name}, ¿café cargado?',
  '{name}, empieza el día',
];

const AFTERNOON_GREETINGS = [
  'Buenas tardes, {name}',
  'Hola, {name}',
  '¿Cómo va el día, {name}?',
  '{name}, ¿qué tal?',
  '{name}, sigamos',
];

const EVENING_GREETINGS = [
  'Buenas tardes, {name}',
  'Hola, {name}',
  '¿Cierre del día, {name}?',
  '{name}, última pasada',
];

const NIGHT_GREETINGS = [
  'Buenas noches, {name}',
  'Hola, {name}',
  '¿Aún por aquí, {name}?',
  '{name}, ¿trabajando hasta tarde?',
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

export function pickGreeting(name: string, now: Date = new Date()): string {
  const slot = getSlot(now.getHours());
  const pool = getPool(slot);
  const template = pool[Math.floor(Math.random() * pool.length)];
  return fillTemplate(template, name);
}

export function getStaticGreeting(name: string, now: Date = new Date()): string {
  const slot = getSlot(now.getHours());
  return name ? `${FALLBACKS[slot]}, ${name}` : FALLBACKS[slot];
}
