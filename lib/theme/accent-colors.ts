/**
 * Acentos personalizables — fuente ÚNICA de verdad.
 *
 * Toda la app pinta el acento desde un solo par de variables CSS
 * (`--primary` / `--primary-foreground`, más `--ring`). Cambiar de acento =
 * sobrescribir esas tres variables; ningún componente se toca.
 *
 * Cada acento define su valor HSL para claro y oscuro y el color de texto
 * que va ENCIMA del acento (botones). Todos los pares texto/acento están
 * verificados a WCAG AA (≥ 4.5:1) en ambos modos.
 *
 * El dorado de PH (Champions) es el predeterminado de fábrica y un acento más.
 * Persistencia: clave del acento (no el HSL) en `profiles.accent_color`, para
 * poder reafinar los tonos sin migrar datos.
 */

export type AccentKey =
  | 'gold'
  | 'red'
  | 'orange'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'teal';

interface AccentVariant {
  /** Triplete HSL "H S% L%" del acento (sin envolver en hsl()). */
  primary: string;
  /** Triplete HSL del texto/icono que va encima del acento. */
  foreground: string;
}

export interface AccentColor {
  key: AccentKey;
  /** Etiqueta visible en el selector. */
  label: string;
  light: AccentVariant;
  dark: AccentVariant;
}

/** Acento de fábrica: el dorado Champions de PH. */
export const DEFAULT_ACCENT: AccentKey = 'gold';

// Texto sobre acentos claros (dorado): charcoal, igual que el resto de la UI.
const FG_DARK = '220 14% 11%';
const FG_DARK_DM = '220 14% 8%';
// Texto sobre acentos saturados: blanco.
const FG_LIGHT = '0 0% 100%';

/**
 * Paleta curada: dorado (default) + 7. Tonos afinados por modo para que el
 * texto blanco mantenga contraste AA sin perder viveza sobre charcoal/cream.
 */
export const ACCENT_COLORS: AccentColor[] = [
  {
    key: 'gold',
    label: 'Dorado',
    light: { primary: '41 70% 52%', foreground: FG_DARK },
    dark: { primary: '41 70% 56%', foreground: FG_DARK_DM },
  },
  {
    key: 'red',
    label: 'Rojo',
    light: { primary: '0 72% 48%', foreground: FG_LIGHT },
    dark: { primary: '0 74% 52%', foreground: FG_LIGHT },
  },
  {
    key: 'orange',
    label: 'Naranja',
    light: { primary: '24 95% 36%', foreground: FG_LIGHT },
    dark: { primary: '26 92% 38%', foreground: FG_LIGHT },
  },
  {
    key: 'green',
    label: 'Verde',
    light: { primary: '145 63% 30%', foreground: FG_LIGHT },
    dark: { primary: '148 58% 31%', foreground: FG_LIGHT },
  },
  {
    key: 'blue',
    label: 'Azul',
    light: { primary: '217 80% 48%', foreground: FG_LIGHT },
    dark: { primary: '215 82% 50%', foreground: FG_LIGHT },
  },
  {
    key: 'purple',
    label: 'Morado',
    light: { primary: '262 70% 56%', foreground: FG_LIGHT },
    dark: { primary: '264 72% 60%', foreground: FG_LIGHT },
  },
  {
    key: 'pink',
    label: 'Rosa',
    light: { primary: '330 72% 46%', foreground: FG_LIGHT },
    dark: { primary: '332 74% 50%', foreground: FG_LIGHT },
  },
  {
    key: 'teal',
    label: 'Turquesa',
    light: { primary: '184 82% 27%', foreground: FG_LIGHT },
    dark: { primary: '183 80% 28%', foreground: FG_LIGHT },
  },
];

const ACCENT_KEYS = new Set<string>(ACCENT_COLORS.map((c) => c.key));

/** Type guard: ¿`value` es una clave de acento válida? */
export function isAccentKey(value: unknown): value is AccentKey {
  return typeof value === 'string' && ACCENT_KEYS.has(value);
}

/** Color de la muestra (dot) del selector — usa el tono del modo claro. */
export function accentSwatch(color: AccentColor): string {
  return `hsl(${color.light.primary})`;
}

/**
 * CSS de los acentos: una regla por clave para claro y oscuro, seleccionada por
 * `[data-accent]` en <html>. Las reglas .dark van DESPUÉS (misma especificidad
 * que :root) para ganar en modo oscuro por orden de cascada. Se inyecta
 * server-side en <head>, así que no hay parpadeo en el primer pintado.
 */
export function accentThemeCss(): string {
  return ACCENT_COLORS.map((c) => {
    const vars = (v: AccentVariant) =>
      `--primary:${v.primary};--primary-foreground:${v.foreground};--ring:${v.primary};`;
    return (
      `:root[data-accent="${c.key}"]{${vars(c.light)}}` +
      `.dark[data-accent="${c.key}"]{${vars(c.dark)}}`
    );
  }).join('');
}

/**
 * Script inline para <head>: aplica el acento cacheado en localStorage antes
 * del primer pintado (evita el flash del dorado). La cuenta (Supabase) reconcilia
 * después vía AccentSync. Se devuelve como string para `dangerouslySetInnerHTML`.
 */
export function accentInitScript(storageKey: string): string {
  const keys = JSON.stringify(ACCENT_COLORS.map((c) => c.key));
  return (
    `(function(){try{` +
    `var k=localStorage.getItem(${JSON.stringify(storageKey)});` +
    `if(${keys}.indexOf(k)<0)k=${JSON.stringify(DEFAULT_ACCENT)};` +
    `document.documentElement.setAttribute('data-accent',k);` +
    `}catch(e){document.documentElement.setAttribute('data-accent',${JSON.stringify(DEFAULT_ACCENT)});}})();`
  );
}
