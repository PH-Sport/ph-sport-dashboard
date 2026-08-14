import path from 'node:path';

/**
 * Dónde queda la sesión que graba `sesion.setup.ts`.
 *
 * Vive en su propio módulo porque Playwright prohíbe que un spec importe otro
 * spec, y tanto el setup como los tests que la consumen necesitan esta ruta.
 *
 * El directorio está en .gitignore: contiene credenciales de sesión.
 */
export const RUTA_SESION = path.join(__dirname, '.sesion', 'usuario.json');
