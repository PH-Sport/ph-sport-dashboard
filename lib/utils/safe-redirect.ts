/**
 * Normaliza el `next` de los enlaces de auth a una ruta interna segura.
 *
 * `new URL(next, origin)` resuelve '//evil.com' como 'https://evil.com', así que
 * un `next` sin validar convierte cualquier callback de auth en un open redirect.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback;

  // Solo rutas internas: han de empezar por '/' y no escapar al host.
  if (!next.startsWith('/')) return fallback;
  if (next.startsWith('//')) return fallback;
  if (next.startsWith('/\\')) return fallback;

  return next;
}
