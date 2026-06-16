/**
 * Cuentas developer — pueden ver la app como Mánager o Diseñador (preview visual).
 * El gate es COSMÉTICO: el backend sigue exigiendo ADMIN real. No tiene
 * implicación de seguridad. Para añadir devs, ampliar la lista.
 */
export const DEV_EMAILS: readonly string[] = ['mariorodpz@gmail.com'];

export function isDevAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEV_EMAILS.includes(email.toLowerCase());
}
