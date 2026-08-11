import { Monitor, Moon, Sun } from 'lucide-react';

/**
 * Los tres modos de tema, definidos una sola vez: los usan el conmutador del
 * menú de perfil y la pestaña de Apariencia. 'system' es el valor por defecto
 * — la app obedece al dispositivo salvo que se elija otra cosa.
 */
export const THEME_MODES = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Dispositivo', icon: Monitor },
] as const;

export type ThemeMode = (typeof THEME_MODES)[number]['value'];

export const DEFAULT_THEME_MODE: ThemeMode = 'system';
