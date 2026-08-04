import { describe, it, expect } from 'vitest';
import { safeNextPath } from './safe-redirect';

describe('safeNextPath', () => {
  it('acepta rutas internas', () => {
    expect(safeNextPath('/reset-password')).toBe('/reset-password');
    expect(safeNextPath('/disenos?estado=en-curso')).toBe('/disenos?estado=en-curso');
  });

  it('cae al fallback cuando no hay valor', () => {
    expect(safeNextPath(null)).toBe('/');
    expect(safeNextPath('')).toBe('/');
    expect(safeNextPath(null, '/mi-semana')).toBe('/mi-semana');
  });

  it('rechaza URLs absolutas a otro host', () => {
    expect(safeNextPath('https://evil.com')).toBe('/');
    expect(safeNextPath('http://evil.com/phishing')).toBe('/');
  });

  it('rechaza rutas protocol-relative que escapan del dominio', () => {
    // new URL('//evil.com', 'https://phsport.app') => 'https://evil.com'
    expect(safeNextPath('//evil.com')).toBe('/');
    expect(safeNextPath('//evil.com/robo-de-sesion')).toBe('/');
  });

  it('rechaza rutas que no empiezan por barra', () => {
    expect(safeNextPath('reset-password')).toBe('/');
    expect(safeNextPath('javascript:alert(1)')).toBe('/');
  });

  it('rechaza barras invertidas, que algunos navegadores tratan como //', () => {
    expect(safeNextPath('/\\evil.com')).toBe('/');
    expect(safeNextPath('\\\\evil.com')).toBe('/');
  });
});
