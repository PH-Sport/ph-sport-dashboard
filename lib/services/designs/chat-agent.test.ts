import { describe, it, expect } from 'vitest';
import {
  serializeCards,
  normalizeUpdate,
  trimHistory,
  buildChatSystemPrompt,
  type CardSnapshot,
  type ChatTurn,
} from './chat-agent';
import type { ParseDesigner } from './parse-message';

const DESIGNERS: ParseDesigner[] = [
  { id: 'd-1', display_name: 'Lorenzo', full_name: 'Lorenzo Ruiz' },
  { id: 'd-2', display_name: 'Ana', full_name: 'Ana Pérez' },
];

function snapshot(overrides: Partial<CardSnapshot> = {}): CardSnapshot {
  return {
    id: 'c-1',
    type: 'matchday',
    player: 'Joan García',
    match_home: 'Espanyol',
    match_away: 'Getafe',
    deadline_at: '2026-08-14T12:00',
    designer_name: null,
    details: '',
    warnings: [],
    ...overrides,
  };
}

describe('serializeCards', () => {
  it('describe cada tarjeta en una línea con su id', () => {
    const out = serializeCards([snapshot()]);
    expect(out).toContain('c-1');
    expect(out).toContain('matchday');
    expect(out).toContain('Joan García');
  });

  it('omite las tarjetas vacías para no ensuciar el contexto', () => {
    const vacia = snapshot({
      id: 'c-2',
      type: null,
      player: '',
      match_home: '',
      match_away: '',
      deadline_at: null,
      details: '',
    });
    const out = serializeCards([snapshot(), vacia]);
    expect(out).not.toContain('c-2');
  });

  it('lo dice explícitamente cuando no hay ninguna tarjeta', () => {
    expect(serializeCards([])).toContain('ninguna');
  });
});

describe('normalizeUpdate', () => {
  const known = new Set(['c-1']);
  const now = new Date('2026-08-11T10:00:00');

  it('devuelve null si el id no existe en el taller', () => {
    expect(normalizeUpdate({ id: 'fantasma', player: 'X' }, known, DESIGNERS, now)).toBeNull();
  });

  it('devuelve null si la edición viene sin id', () => {
    expect(normalizeUpdate({ player: 'X' }, known, DESIGNERS, now)).toBeNull();
  });

  it('aplica solo los campos presentes', () => {
    const out = normalizeUpdate({ id: 'c-1', player: 'Marín' }, known, DESIGNERS, now);
    expect(out).toEqual({ id: 'c-1', player: 'Marín', warnings: [] });
  });

  it('descarta un tipo que no existe y deja aviso', () => {
    const out = normalizeUpdate({ id: 'c-1', type: 'inventado' }, known, DESIGNERS, now);
    expect(out?.type).toBeUndefined();
    expect(out?.warnings).toContain('tipo_no_reconocido');
  });

  it('acepta un tipo válido del catálogo', () => {
    const out = normalizeUpdate({ id: 'c-1', type: 'cumpleanos' }, known, DESIGNERS, now);
    expect(out?.type).toBe('cumpleanos');
    expect(out?.warnings).toEqual([]);
  });

  it('casa el diseñador por nombre ignorando tildes', () => {
    const out = normalizeUpdate({ id: 'c-1', designer_name: 'ana' }, known, DESIGNERS, now);
    expect(out?.designer_id).toBe('d-2');
  });

  it('deja aviso si el diseñador no está en plantilla', () => {
    const out = normalizeUpdate({ id: 'c-1', designer_name: 'Fulanito' }, known, DESIGNERS, now);
    expect(out?.designer_id).toBeNull();
    expect(out?.warnings).toContain('disenador_no_encontrado');
  });

  it('permite vaciar el diseñador con designer_name vacío', () => {
    const out = normalizeUpdate({ id: 'c-1', designer_name: '' }, known, DESIGNERS, now);
    expect(out?.designer_id).toBeNull();
    expect(out?.warnings).toEqual([]);
  });

  it('rechaza una fecha con formato inválido', () => {
    const out = normalizeUpdate({ id: 'c-1', deadline_at: 'el viernes' }, known, DESIGNERS, now);
    expect(out?.deadline_at).toBeUndefined();
    expect(out?.warnings).toContain('fecha_no_reconocida');
  });

  it('acepta una fecha bien formada', () => {
    const out = normalizeUpdate({ id: 'c-1', deadline_at: '2026-08-15T18:00' }, known, DESIGNERS, now);
    expect(out?.deadline_at).toBe('2026-08-15T18:00');
    expect(out?.warnings).toEqual([]);
  });

  it('avisa de una fecha ya pasada, pero la acepta', () => {
    const out = normalizeUpdate({ id: 'c-1', deadline_at: '2026-08-01T12:00' }, known, DESIGNERS, now);
    expect(out?.deadline_at).toBe('2026-08-01T12:00');
    expect(out?.warnings).toContain('fecha_pasada');
  });

  it('permite quitar la fecha con deadline_at vacío', () => {
    const out = normalizeUpdate({ id: 'c-1', deadline_at: '' }, known, DESIGNERS, now);
    expect(out?.deadline_at).toBeNull();
    expect(out?.warnings).toEqual([]);
  });
});

describe('trimHistory', () => {
  it('deja intacto un hilo corto', () => {
    const turns: ChatTurn[] = [
      { role: 'user', text: 'hola' },
      { role: 'assistant', text: 'qué tal' },
    ];
    expect(trimHistory(turns)).toEqual(turns);
  });

  it('conserva siempre el primer mensaje del usuario al recortar por número', () => {
    const turns: ChatTurn[] = [{ role: 'user', text: 'EL VOLCADO' }];
    for (let i = 0; i < 40; i++) {
      turns.push({ role: i % 2 === 0 ? 'assistant' : 'user', text: `t${i}` });
    }
    const out = trimHistory(turns);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out[0].text).toBe('EL VOLCADO');
    expect(out[out.length - 1].text).toBe('t39');
  });

  it('recorta también por tamaño total', () => {
    const gordo = 'x'.repeat(9000);
    const turns: ChatTurn[] = [
      { role: 'user', text: 'EL VOLCADO' },
      { role: 'assistant', text: gordo },
      { role: 'user', text: gordo },
      { role: 'assistant', text: gordo },
      { role: 'user', text: 'último' },
    ];
    const out = trimHistory(turns);
    const total = out.reduce((n, t) => n + t.text.length, 0);
    expect(total).toBeLessThanOrEqual(24_000);
    expect(out[0].text).toBe('EL VOLCADO');
    expect(out[out.length - 1].text).toBe('último');
  });

  it('devuelve vacío si no hay turnos', () => {
    expect(trimHistory([])).toEqual([]);
  });
});

describe('buildChatSystemPrompt', () => {
  it('incluye la fecha, los diseñadores y el estado del taller', () => {
    const prompt = buildChatSystemPrompt({
      today: 'martes, 11 de agosto de 2026',
      designerNames: ['Lorenzo', 'Ana'],
      cards: [snapshot()],
    });
    expect(prompt).toContain('11 de agosto de 2026');
    expect(prompt).toContain('Lorenzo');
    expect(prompt).toContain('c-1');
    expect(prompt).toContain('add_designs');
  });

  it('le prohíbe decir que ha creado los diseños de verdad', () => {
    const prompt = buildChatSystemPrompt({ today: 'hoy', designerNames: [], cards: [] });
    expect(prompt).toContain('NO CREAS NADA EN EL SISTEMA');
  });
});
