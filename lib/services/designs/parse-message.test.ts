import { describe, it, expect } from 'vitest';
import {
  PROPOSE_DESIGNS_TOOL,
  buildSystemPrompt,
  normalizeName,
  matchDesigner,
  normalizeCandidate,
  type ParseDesigner,
} from './parse-message';

describe('normalizeName', () => {
  it('pasa a minúsculas y quita diacríticos', () => {
    expect(normalizeName('Álex')).toBe('alex');
  });

  it('quita diacríticos de varias vocales y mayúsculas', () => {
    expect(normalizeName('José María Núñez')).toBe('jose maria nunez');
  });
});

describe('matchDesigner', () => {
  const designers: ParseDesigner[] = [
    { id: 'd1', display_name: 'Álex', full_name: 'Álex García' },
    { id: 'd2', display_name: 'Marta', full_name: 'Marta López Ruiz' },
    { id: 'd3', display_name: null, full_name: 'Rodrigo Pérez' },
  ];

  it('encuentra por display_name ignorando tilde y mayúsculas', () => {
    expect(matchDesigner('alex', designers)).toBe('d1');
    expect(matchDesigner('ÁLEX', designers)).toBe('d1');
  });

  it('encuentra por el primer token de full_name cuando no hay display_name', () => {
    expect(matchDesigner('rodrigo', designers)).toBe('d3');
    expect(matchDesigner('Rodrigo', designers)).toBe('d3');
  });

  it('sin match devuelve null', () => {
    expect(matchDesigner('nadie', designers)).toBeNull();
  });
});

describe('buildSystemPrompt', () => {
  it('interpola la fecha de hoy y la lista de diseñadores', () => {
    const prompt = buildSystemPrompt({ today: '2024-06-01', designerNames: ['Álex', 'Marta'] });
    expect(prompt).toContain('Hoy es 2024-06-01');
    expect(prompt).toContain('Álex, Marta');
  });
});

describe('PROPOSE_DESIGNS_TOOL', () => {
  it('tiene el nombre y el esquema esperados', () => {
    expect(PROPOSE_DESIGNS_TOOL.name).toBe('propose_designs');
    expect(PROPOSE_DESIGNS_TOOL.input_schema.required).toEqual(['designs']);
  });
});

describe('normalizeCandidate', () => {
  const designers: ParseDesigner[] = [
    { id: 'd1', display_name: 'Álex', full_name: 'Álex García' },
  ];
  const now = new Date('2024-06-01T09:00:00');

  it('acepta un tipo válido', () => {
    const result = normalizeCandidate({ type: 'matchday', details: 'x' }, designers, now);
    expect(result.type).toBe('matchday');
    expect(result.warnings).not.toContain('tipo_no_reconocido');
  });

  it('tipo desconocido cae a null con warning', () => {
    const result = normalizeCandidate({ type: 'poster', details: 'x' }, designers, now);
    expect(result.type).toBeNull();
    expect(result.warnings).toContain('tipo_no_reconocido');
  });

  it('sin tipo no añade warning', () => {
    const result = normalizeCandidate({ details: 'x' }, designers, now);
    expect(result.type).toBeNull();
    expect(result.warnings).not.toContain('tipo_no_reconocido');
  });

  it('resuelve designer_name a designer_id vía matchDesigner', () => {
    const result = normalizeCandidate(
      { designer_name: 'álex', details: 'x' },
      designers,
      now
    );
    expect(result.designer_id).toBe('d1');
    expect(result.warnings).not.toContain('disenador_no_encontrado');
  });

  it('designer inexistente cae a null con warning', () => {
    const result = normalizeCandidate(
      { designer_name: 'Nadie', details: 'x' },
      designers,
      now
    );
    expect(result.designer_id).toBeNull();
    expect(result.warnings).toContain('disenador_no_encontrado');
  });

  it('fecha válida futura se conserva íntegra sin warning', () => {
    const result = normalizeCandidate(
      { deadline_at: '2024-06-02T10:00', details: 'x' },
      designers,
      now
    );
    expect(result.deadline_at).toBe('2024-06-02T10:00');
    expect(result.warnings).not.toContain('fecha_pasada');
    expect(result.warnings).not.toContain('fecha_no_reconocida');
  });

  it('fecha pasada (más de 1h antes de now) se conserva con warning fecha_pasada', () => {
    const result = normalizeCandidate(
      { deadline_at: '2020-01-01T10:00', details: 'x' },
      designers,
      now
    );
    expect(result.deadline_at).toBe('2020-01-01T10:00');
    expect(result.warnings).toContain('fecha_pasada');
  });

  it('fecha no reconocida cae a null con warning fecha_no_reconocida', () => {
    const result = normalizeCandidate(
      { deadline_at: 'el viernes', details: 'x' },
      designers,
      now
    );
    expect(result.deadline_at).toBeNull();
    expect(result.warnings).toContain('fecha_no_reconocida');
  });

  it('sin deadline_at no añade warning y devuelve null', () => {
    const result = normalizeCandidate({ details: 'x' }, designers, now);
    expect(result.deadline_at).toBeNull();
    expect(result.warnings).not.toContain('fecha_no_reconocida');
    expect(result.warnings).not.toContain('fecha_pasada');
  });

  it('needs_review se vuelca en warnings', () => {
    const result = normalizeCandidate(
      { details: 'x', needs_review: ['hora_asumida'] },
      designers,
      now
    );
    expect(result.warnings).toContain('hora_asumida');
  });

  it('details siempre es string, aunque no vengan otros campos', () => {
    const result = normalizeCandidate({ details: 'algo' }, designers, now);
    expect(typeof result.details).toBe('string');
    expect(result.details).toBe('algo');
    expect(result.player).toBe('');
    expect(result.match_home).toBe('');
    expect(result.match_away).toBe('');
  });

  it('recorta espacios en los campos de texto', () => {
    const result = normalizeCandidate(
      { details: '  algo  ', player: '  Juan  ', match_home: ' A ', match_away: ' B ' },
      designers,
      now
    );
    expect(result.details).toBe('algo');
    expect(result.player).toBe('Juan');
    expect(result.match_home).toBe('A');
    expect(result.match_away).toBe('B');
  });
});
