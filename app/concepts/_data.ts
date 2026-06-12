/**
 * Datos de ejemplo compartidos por los 3 conceptos visuales.
 * Fechas como etiquetas fijas (no Date.now) para evitar mismatch de hidratación.
 */

export const GREETING = 'Buenos días, Mario';
export const WEEK_LABEL = '9 jun – 15 jun';

/* ── Urgencia (lógica real: tiempo restante hasta el deadline) ── */
export type Urgency = 'overdue' | 'h24' | 'h48' | null;

/* ── Estado del jugador (tags reales de la app) ── */
export type PlayerStatus = 'Lesionado' | 'Sancionado' | 'Duda' | 'Última hora' | null;

/* ── Personas por rol (vista de desarrollador) ── */
export const PERSONAS = {
  manager: {
    name: 'Mario Rodríguez',
    first: 'Mario',
    email: 'mario@phsport.es',
    role: 'Mánager',
    initial: 'M',
  },
  designer: {
    name: 'Marta García',
    first: 'Marta',
    email: 'marta@phsport.es',
    role: 'Diseñadora',
    initial: 'M',
  },
} as const;

/* ── Semanas navegables (la del medio es la actual) ── */
export const WEEKS = ['2 jun – 8 jun', '9 jun – 15 jun', '16 jun – 22 jun'];
export const CURRENT_WEEK = 1;

/* ── Notificaciones (campana) ── */
export const NOTIFICATIONS = [
  {
    id: 1,
    kind: 'deadline' as const,
    title: 'Vence pronto',
    body: 'Gol post · Champions vence en 4 h',
    time: 'hace 1 h',
    unread: true,
  },
  {
    id: 2,
    kind: 'assignment' as const,
    title: 'Nueva asignación',
    body: 'Matchday Real Madrid · hoy, 18:00',
    time: 'hace 2 h',
    unread: true,
  },
  {
    id: 3,
    kind: 'delivered' as const,
    title: 'Entrega registrada',
    body: 'Asistencia · reel marcada como entregada',
    time: 'ayer',
    unread: false,
  },
  {
    id: 4,
    kind: 'system' as const,
    title: 'Equipo',
    body: 'Sara Molina aceptó la invitación',
    time: 'lun',
    unread: false,
  },
];

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
  { label: 'Atrasados', value: '01', note: 'Vencidos sin entregar', tone: 'warning' as const },
  { label: 'Equipo activo', value: '4/5', note: 'Con trabajo asignado', tone: 'primary' as const },
];

export const UPCOMING = [
  { title: 'Matchday Real Madrid', player: 'Vinicius Jr', designer: 'Marta', deadline: 'Hoy, 18:00', critical: true, urgency: 'h24' as Urgency },
  { title: 'Gol post · Champions', player: 'Bellingham', designer: null, deadline: 'Hoy, 21:30', critical: true, urgency: 'h24' as Urgency },
  { title: 'Stats semanales LaLiga', player: 'Lewandowski', designer: 'Pablo', deadline: 'Mañana, 10:30', critical: false, urgency: 'h48' as Urgency },
  { title: 'Cumpleaños · stories', player: 'Pedri', designer: 'Lucía', deadline: 'Mañana, 16:00', critical: false, urgency: 'h48' as Urgency },
  { title: 'Renovación · anuncio', player: 'Gavi', designer: 'Hugo', deadline: 'Jue, 12:00', critical: false, urgency: null as Urgency },
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
      { title: 'Matchday Real Madrid', deadline: 'Hoy, 18:00', delivered: false, critical: true, urgency: 'h24' as Urgency },
      { title: 'Gol post · Bellingham', deadline: 'Hoy, 21:30', delivered: false, critical: true, urgency: 'h24' as Urgency },
      { title: 'Stories previa derbi', deadline: 'Ayer, 09:00', delivered: false, critical: false, urgency: 'overdue' as Urgency },
      { title: 'Asistencia · reel', deadline: 'Lun, 12:00', delivered: true, critical: false, urgency: null as Urgency },
    ],
  },
  {
    designer: 'Pablo',
    active: 3,
    overloaded: false,
    designs: [
      { title: 'Stats semanales LaLiga', deadline: 'Mañana, 10:30', delivered: false, critical: false, urgency: 'h48' as Urgency },
      { title: 'MVP del mes', deadline: 'Jue, 17:00', delivered: false, critical: false, urgency: null as Urgency },
      { title: 'Doblete · post', deadline: 'Lun, 10:00', delivered: true, critical: false, urgency: null as Urgency },
    ],
  },
  {
    designer: 'Lucía',
    active: 2,
    overloaded: false,
    designs: [
      { title: 'Cumpleaños · stories', deadline: 'Mañana, 16:00', delivered: false, critical: false, urgency: 'h48' as Urgency },
      { title: 'Convocatoria selección', deadline: 'Vie, 11:00', delivered: false, critical: false, urgency: null as Urgency },
    ],
  },
];

/* ── Diseños (la mini base de datos) ── */
export const DESIGNS_DB = [
  { title: 'Matchday Real Madrid', player: 'Vinicius Jr', designer: 'Marta', deadline: '11 jun · 18:00', delivered: false, critical: true, urgency: 'h24' as Urgency, playerStatus: 'Duda' as PlayerStatus },
  { title: 'Gol post · Champions', player: 'Bellingham', designer: null, deadline: '11 jun · 21:30', delivered: false, critical: true, urgency: 'h24' as Urgency, playerStatus: null as PlayerStatus },
  { title: 'Stories previa derbi', player: 'Bellingham', designer: 'Marta', deadline: '10 jun · 09:00', delivered: false, critical: false, urgency: 'overdue' as Urgency, playerStatus: null as PlayerStatus },
  { title: 'Stats semanales LaLiga', player: 'Lewandowski', designer: 'Pablo', deadline: '12 jun · 10:30', delivered: false, critical: false, urgency: 'h48' as Urgency, playerStatus: null as PlayerStatus },
  { title: 'Cumpleaños · stories', player: 'Pedri', designer: 'Lucía', deadline: '12 jun · 16:00', delivered: false, critical: false, urgency: 'h48' as Urgency, playerStatus: null as PlayerStatus },
  { title: 'Renovación · anuncio', player: 'Gavi', designer: 'Hugo', deadline: '13 jun · 12:00', delivered: false, critical: false, urgency: null as Urgency, playerStatus: null as PlayerStatus },
  { title: 'Convocatoria selección', player: 'Nico Williams', designer: 'Lucía', deadline: '13 jun · 11:00', delivered: false, critical: false, urgency: null as Urgency, playerStatus: 'Última hora' as PlayerStatus },
  { title: 'MVP del mes', player: 'Griezmann', designer: 'Pablo', deadline: '12 jun · 17:00', delivered: false, critical: false, urgency: 'h48' as Urgency, playerStatus: null as PlayerStatus },
  { title: 'Doblete · post', player: 'Morata', designer: 'Pablo', deadline: '9 jun · 10:00', delivered: true, critical: false, urgency: null as Urgency, playerStatus: null as PlayerStatus },
  { title: 'Asistencia · reel', player: 'Modric', designer: 'Marta', deadline: '9 jun · 12:00', delivered: true, critical: false, urgency: null as Urgency, playerStatus: null as PlayerStatus },
];

/* ── Mi semana (vista Diseñador — persona: Marta) ── */
export const MY_WEEK = {
  kpis: [
    { label: 'Pendientes', value: '03', note: 'En tu cola esta semana', tone: 'default' as const },
    { label: 'Entregadas', value: '01', note: 'Esta semana', tone: 'success' as const },
    { label: 'Completado', value: '25%', note: 'De tu semana', tone: 'primary' as const },
  ],
  hero: {
    title: 'Matchday Real Madrid',
    player: 'Vinicius Jr',
    deadline: 'Hoy, 18:00',
    hoursLeft: '4 h',
  },
  pending: [
    { title: 'Matchday Real Madrid', player: 'Vinicius Jr', deadline: 'Hoy, 18:00', urgency: 'h24' as Urgency },
    { title: 'Gol post · Bellingham', player: 'Bellingham', deadline: 'Hoy, 21:30', urgency: 'h24' as Urgency },
    { title: 'Stories previa derbi', player: 'Bellingham', deadline: 'Ayer, 09:00', urgency: 'overdue' as Urgency },
  ],
  deliveredWeeks: [
    {
      label: 'Esta semana',
      designs: [{ title: 'Asistencia · reel', player: 'Modric', deadline: 'Lun, 12:00' }],
    },
    {
      label: '2 jun – 8 jun',
      designs: [
        { title: 'Banner Champions', player: 'Valverde', deadline: 'Vie, 17:00' },
        { title: 'Post fichaje', player: 'Huijsen', deadline: 'Mié, 10:00' },
      ],
    },
  ],
};

/* ── Crear diseños: tipos de pieza (no solo Matchday) ── */
export const DESIGN_TYPES = ['Matchday', 'Presentación', 'Cumpleaños', 'Firma', 'Otro'] as const;
export type DesignType = (typeof DESIGN_TYPES)[number];

/* ── Borrador que "genera" el asistente en el mock ── */
export const ASSISTANT_DRAFT = [
  { type: 'Matchday' as DesignType, player: 'Mbappé', home: 'Real Madrid', away: 'Getafe', title: '', deadline: 'Sáb 14 · 13:00' },
  { type: 'Cumpleaños' as DesignType, player: 'Courtois', home: '', away: '', title: 'Cumpleaños · stories', deadline: 'Vie 13 · 09:00' },
  { type: 'Presentación' as DesignType, player: 'Zubimendi', home: '', away: '', title: 'Presentación · post', deadline: 'Dom 15 · 12:00' },
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
