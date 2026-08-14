import { describe, it, expect } from 'vitest';
import {
  pickRotatingTemplate,
  fillGreeting,
  GREETING_MAX_CHARS_MOBILE,
  type GreetingFit,
} from './greeting';

// 14:00 → franja de tarde. La franja siempre manda; el ajuste solo elige dentro.
const TARDE = new Date(2026, 7, 14, 14, 0);
const MANANA = new Date(2026, 7, 14, 9, 0);
const NOCHE = new Date(2026, 7, 14, 23, 0);

/** Recorre todas las variantes de una franja forzando el rng. */
function todasLasVariantes(now: Date, fit?: GreetingFit): string[] {
  const vistas = new Set<string>();
  for (let i = 0; i < 100; i++) {
    vistas.add(pickRotatingTemplate(null, now, () => i / 100, fit));
  }
  return [...vistas];
}

describe('pickRotatingTemplate · sin ajuste de ancho', () => {
  it('puede devolver saludos largos cuando no se le pone tope', () => {
    expect(todasLasVariantes(TARDE)).toContain('Buenas tardes, {name}');
  });
});

describe('pickRotatingTemplate · con tope de ancho', () => {
  const fit: GreetingFit = { name: 'Mario', maxChars: GREETING_MAX_CHARS_MOBILE };

  it('descarta los que no caben ya montados con el nombre', () => {
    const variantes = todasLasVariantes(TARDE, fit);
    expect(variantes).not.toContain('Buenas tardes, {name}'); // 20 caracteres
    expect(variantes).toContain('{name}, a tope'); // 13
  });

  it('ninguna variante superviviente se pasa del tope', () => {
    for (const now of [MANANA, TARDE, NOCHE]) {
      for (const plantilla of todasLasVariantes(now, fit)) {
        expect(fillGreeting(plantilla, 'Mario').length).toBeLessThanOrEqual(
          GREETING_MAX_CHARS_MOBILE
        );
      }
    }
  });

  it('un nombre largo deja menos variantes en pie, pero nunca cero', () => {
    const largo: GreetingFit = { name: 'Cristina', maxChars: GREETING_MAX_CHARS_MOBILE };
    const variantes = todasLasVariantes(TARDE, largo);
    expect(variantes.length).toBeGreaterThan(0);
    expect(variantes).toContain('{name}, a tope'); // 16 con Cristina
  });

  it('si no cabe ninguno, prefiere uno cortado a dejar el saludo mudo', () => {
    const imposible: GreetingFit = { name: 'Bartolomé de las Casas', maxChars: 5 };
    const variantes = todasLasVariantes(TARDE, imposible);
    expect(variantes.length).toBeGreaterThan(0);
  });

  it('sigue evitando repetir el último mostrado', () => {
    const repeticiones = new Set<string>();
    for (let i = 0; i < 100; i++) {
      repeticiones.add(pickRotatingTemplate('{name}, a tope', TARDE, () => i / 100, fit));
    }
    expect(repeticiones).not.toContain('{name}, a tope');
  });
});
