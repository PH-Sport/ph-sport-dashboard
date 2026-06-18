/**
 * Acentos personalizables — fuente ÚNICA de verdad.
 *
 * Toda la app pinta el acento desde un solo par de variables CSS
 * (`--primary` / `--primary-foreground`, más `--ring`). Cambiar de acento =
 * sobrescribir esas tres variables; ningún componente se toca.
 *
 * Convención de tonalidad por modo (favorece visibilidad en ambos fondos):
 *   - Claro  → tono SÓLIDO (saturado, algo más profundo) + texto blanco.
 *   - Oscuro → tono PASTEL (más claro, menos saturado) + texto charcoal;
 *     un pastel claro NO admite texto blanco, por eso el foreground se invierte.
 * Todos los pares texto/acento están verificados a WCAG AA (≥ 4.5:1) en ambos
 * modos. El pastel claro mejora además el texto coloreado (text-primary, p. ej.
 * el pill de la sidebar) sobre charcoal, igual que el sólido lo mejora sobre cream.
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

/** Clave de localStorage que cachea el acento para el primer pintado (anti-flash). */
export const ACCENT_STORAGE_KEY = 'ph-accent';

// Texto oscuro en modo CLARO (sobre el dorado sólido).
const FG_DARK_L = '220 14% 11%';
// Texto oscuro en modo OSCURO (charcoal sobre los pasteles claros).
const FG_DARK_D = '220 16% 10%';
// Texto blanco — solo en modo claro, sobre los tonos sólidos.
const FG_LIGHT = '0 0% 100%';

/**
 * Paleta curada: dorado (default) + 7. Claro = sólido + texto blanco (el dorado,
 * al ser claro, usa texto charcoal). Oscuro = pastel + texto charcoal. Todos
 * verificados a WCAG AA en ambos modos.
 */
export const ACCENT_COLORS: AccentColor[] = [
  {
    key: 'gold',
    label: 'Dorado',
    light: { primary: '41 80% 48%', foreground: FG_DARK_L },
    dark: { primary: '43 82% 64%', foreground: FG_DARK_D },
  },
  {
    key: 'red',
    label: 'Rojo',
    light: { primary: '0 72% 48%', foreground: FG_LIGHT },
    dark: { primary: '2 78% 70%', foreground: FG_DARK_D },
  },
  {
    key: 'orange',
    label: 'Naranja',
    light: { primary: '24 95% 38%', foreground: FG_LIGHT },
    dark: { primary: '28 88% 62%', foreground: FG_DARK_D },
  },
  {
    key: 'green',
    label: 'Verde',
    light: { primary: '145 60% 32%', foreground: FG_LIGHT },
    dark: { primary: '146 50% 60%', foreground: FG_DARK_D },
  },
  {
    key: 'blue',
    label: 'Azul',
    light: { primary: '217 80% 48%', foreground: FG_LIGHT },
    dark: { primary: '213 80% 70%', foreground: FG_DARK_D },
  },
  {
    key: 'purple',
    label: 'Morado',
    light: { primary: '262 68% 54%', foreground: FG_LIGHT },
    dark: { primary: '262 72% 74%', foreground: FG_DARK_D },
  },
  {
    key: 'pink',
    label: 'Rosa',
    light: { primary: '330 72% 47%', foreground: FG_LIGHT },
    dark: { primary: '330 78% 74%', foreground: FG_DARK_D },
  },
  {
    key: 'teal',
    label: 'Turquesa',
    light: { primary: '184 80% 30%', foreground: FG_LIGHT },
    dark: { primary: '180 52% 60%', foreground: FG_DARK_D },
  },
];

const ACCENT_KEYS = new Set<string>(ACCENT_COLORS.map((c) => c.key));

/** Type guard: ¿`value` es una clave de acento válida? */
export function isAccentKey(value: unknown): value is AccentKey {
  return typeof value === 'string' && ACCENT_KEYS.has(value);
}

/** Color de la muestra (dot) del selector, según el modo activo (sólido/pastel). */
export function accentSwatch(color: AccentColor, isDark = false): string {
  return `hsl(${(isDark ? color.dark : color.light).primary})`;
}

/** Color del check sobre la muestra activa — el foreground del mismo modo. */
export function accentSwatchForeground(color: AccentColor, isDark = false): string {
  return `hsl(${(isDark ? color.dark : color.light).foreground})`;
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
