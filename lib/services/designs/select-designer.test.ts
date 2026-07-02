import { describe, it, expect } from 'vitest';
import { selectDesignerByLoad } from './select-designer';

describe('selectDesignerByLoad', () => {
  it('elige al diseñador con menor carga', () => {
    const loads = new Map([['A', 5], ['B', 2], ['C', 8]]);
    expect(selectDesignerByLoad(['A', 'B', 'C'], loads).id).toBe('B');
  });

  it('en empate rota desde startIndex', () => {
    const loads = new Map([['A', 0], ['B', 0], ['C', 0]]);
    const first = selectDesignerByLoad(['A', 'B', 'C'], loads, 0);
    expect(first.id).toBe('A');
    const second = selectDesignerByLoad(['A', 'B', 'C'], loads, first.nextIndex);
    expect(second.id).toBe('B');
  });

  it('sin diseñadores devuelve id null', () => {
    expect(selectDesignerByLoad([], new Map())).toEqual({ id: null, nextIndex: 0 });
  });
});
