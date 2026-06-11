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

/* ── Semana (vista Manager: el trabajo de cada diseñador) ── */
export const WEEK_GROUPS = [
  {
    designer: 'Marta',
    active: 6,
    overloaded: true,
    designs: [
      { title: 'Matchday Real Madrid', deadline: 'Hoy, 18:00', delivered: false, critical: true },
      { title: 'Gol post · Bellingham', deadline: 'Hoy, 21:30', delivered: false, critical: true },
      { title: 'Stories previa derbi', deadline: 'Mañana, 09:00', delivered: false, critical: false },
      { title: 'Asistencia · reel', deadline: 'Lun, 12:00', delivered: true, critical: false },
    ],
  },
  {
    designer: 'Pablo',
    active: 3,
    overloaded: false,
    designs: [
      { title: 'Stats semanales LaLiga', deadline: 'Mañana, 10:30', delivered: false, critical: false },
      { title: 'MVP del mes', deadline: 'Jue, 17:00', delivered: false, critical: false },
      { title: 'Doblete · post', deadline: 'Lun, 10:00', delivered: true, critical: false },
    ],
  },
  {
    designer: 'Lucía',
    active: 2,
    overloaded: false,
    designs: [
      { title: 'Cumpleaños · stories', deadline: 'Mañana, 16:00', delivered: false, critical: false },
      { title: 'Convocatoria selección', deadline: 'Vie, 11:00', delivered: false, critical: false },
    ],
  },
];

/* ── Diseños (la mini base de datos) ── */
export const DESIGNS_DB = [
  { title: 'Matchday Real Madrid', player: 'Vinicius Jr', designer: 'Marta', deadline: '11 jun · 18:00', delivered: false, critical: true },
  { title: 'Gol post · Champions', player: 'Bellingham', designer: null, deadline: '11 jun · 21:30', delivered: false, critical: true },
  { title: 'Stats semanales LaLiga', player: 'Lewandowski', designer: 'Pablo', deadline: '12 jun · 10:30', delivered: false, critical: false },
  { title: 'Cumpleaños · stories', player: 'Pedri', designer: 'Lucía', deadline: '12 jun · 16:00', delivered: false, critical: false },
  { title: 'Renovación · anuncio', player: 'Gavi', designer: 'Hugo', deadline: '13 jun · 12:00', delivered: false, critical: false },
  { title: 'Convocatoria selección', player: 'Nico Williams', designer: 'Lucía', deadline: '13 jun · 11:00', delivered: false, critical: false },
  { title: 'MVP del mes', player: 'Griezmann', designer: 'Pablo', deadline: '12 jun · 17:00', delivered: false, critical: false },
  { title: 'Doblete · post', player: 'Morata', designer: 'Pablo', deadline: '9 jun · 10:00', delivered: true, critical: false },
  { title: 'Asistencia · reel', player: 'Modric', designer: 'Marta', deadline: '9 jun · 12:00', delivered: true, critical: false },
];

/* ── Miembros ── */
export const MEMBERS = [
  { name: 'Mario Rodríguez', email: 'mario@phsport.es', role: 'Mánager', admin: true },
  { name: 'Marta García', email: 'marta@phsport.es', role: 'Diseñadora', admin: false },
  { name: 'Pablo Ortiz', email: 'pablo@phsport.es', role: 'Diseñador', admin: false },
  { name: 'Lucía Fernández', email: 'lucia@phsport.es', role: 'Diseñadora', admin: false },
  { name: 'Hugo Navarro', email: 'hugo@phsport.es', role: 'Diseñador', admin: false },
  { name: 'Sara Molina', email: 'sara@phsport.es', role: 'Diseñadora', admin: false },
];

export const PENDING_INVITE = { email: 'nuevo@phsport.es', note: 'Expira en 6 días' };

/* ── Ajustes ── */
export const NOTIF_PREFS = [
  { label: 'Nueva asignación', app: true, email: true },
  { label: 'Deadline en menos de 24 h', app: true, email: false },
  { label: 'Resumen semanal', app: false, email: true },
];
