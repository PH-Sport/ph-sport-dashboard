/**
 * Datos de ejemplo compartidos por los 3 conceptos visuales.
 * Fechas como etiquetas fijas (no Date.now) para evitar mismatch de hidratación.
 */

export const GREETING = 'Buenos días, Mario';
export const WEEK_LABEL = '9 jun – 15 jun';

export const ALERTS = {
  total: 2,
  bullets: [
    { strong: '2 diseños', rest: 'vencen en menos de 24 h.' },
    { strong: '5 diseños', rest: 'sin asignar.' },
  ],
};

export const KPIS = [
  { label: 'Activas', value: '12', note: 'Pendientes esta semana', tone: 'default' as const },
  { label: 'Entregados', value: '07', note: 'Completados esta semana', tone: 'success' as const },
  { label: 'Bloqueados', value: '02', note: 'Sin movimiento >48 h', tone: 'warning' as const },
  { label: 'Equipo activo', value: '4/5', note: 'Con trabajo asignado', tone: 'primary' as const },
];

export const UPCOMING = [
  { title: 'Matchday Real Madrid', player: 'Vinicius Jr', designer: 'Marta', deadline: 'Hoy, 18:00', critical: true },
  { title: 'Gol post · Champions', player: 'Bellingham', designer: null, deadline: 'Hoy, 21:30', critical: true },
  { title: 'Stats semanales LaLiga', player: 'Lewandowski', designer: 'Pablo', deadline: 'Mañana, 10:30', critical: false },
  { title: 'Cumpleaños · stories', player: 'Pedri', designer: 'Lucía', deadline: 'Mañana, 16:00', critical: false },
  { title: 'Renovación · anuncio', player: 'Gavi', designer: 'Hugo', deadline: 'Jue, 12:00', critical: false },
];

export const TEAM = [
  { name: 'Marta', active: 6, delivered: 2, overloaded: true },
  { name: 'Pablo', active: 3, delivered: 2, overloaded: false },
  { name: 'Lucía', active: 2, delivered: 2, overloaded: false },
  { name: 'Hugo', active: 1, delivered: 1, overloaded: false },
  { name: 'Sara', active: 0, delivered: 0, overloaded: false },
];

export const NAV = ['Inicio', 'Semana', 'Diseños', 'Miembros'] as const;
