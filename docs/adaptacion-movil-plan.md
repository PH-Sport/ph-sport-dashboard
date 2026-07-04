# Plan — Adaptación móvil completa (base del porteo a PWA)

**Rama:** `adaptacion-movil` · **Fecha:** 2026-07-04 · **Objetivo:** que toda la app sea usable y se sienta nativa en móvil (360–430 px), sin tocar el backend ni degradar escritorio. El porteo a PWA (manifest + service worker + offline) queda para una fase posterior; aquí se deja el terreno listo (viewport, safe-areas, theme-color).

## Estado de partida (auditoría 2026-07-04)

Lo que YA funciona en móvil: sidebar → Sheet con hamburguesa; tabla de Diseños con variante de tarjetas `md:hidden`; filtros apilables; dashboards y Semana en columnas que colapsan; auth con panel de marca oculto `<lg`.

Lo que NO funciona:

| Problema | Dónde |
|---|---|
| Sin `viewport` export (viewport-fit/theme-color) ni safe-areas | `app/layout.tsx`, shell, overlays |
| Inputs a 14 px → zoom automático en iOS al enfocar | `input.tsx`, `textarea.tsx`, inputs crudos |
| Dialog sin max-height/scroll; se corta en pantallas bajas y con teclado | `dialog.tsx`, popup de miembros |
| FullCalendar solo vista mes: inusable a 360 px | `design-calendar.tsx` |
| Acciones solo-hover invisibles en táctil | `notifications-dropdown.tsx` |
| Targets táctiles <40 px (cierres, chevrons, week-nav) | primitivos y shell |
| Bulk form: tabla ancha fija dentro del modal | `design-form-bulk.tsx` (mínimo: scroll horizontal; lo reemplaza la Fase 3 del taller de tarjetas) |
| Grids de 2 columnas de formulario apretados a 360 px | `design-form-single.tsx`, `account-tab.tsx` |

## Fases (commit por fase)

- **A — Fundamentos**: `viewport` export (cover + themeColor charcoal/cream), tap-highlight transparente, `text-base md:text-sm` en Input/Textarea, guard de overflow horizontal.
- **B — Shell**: header con safe-area top y hamburguesa 44 px, Sheet del sidebar con safe-areas y filas 44 px, `PageContainer` `p-4 sm:p-6 md:p-8` + safe-area inferior, `PageHeader` título fluido + acciones con wrap, dropdown de notificaciones acotado al viewport y con borrar visible en táctil.
- **C — Overlays**: `DialogContent` con `max-h` en `dvh` + scroll interno + esquinas 2xl siempre + cierre 44 px; `SheetContent` con safe-areas; popup de miembros con max-height.
- **D — Páginas**: calendario con vista lista en móvil (`@fullcalendar/list`, dep nueva) y mes en escritorio; KPIs con padding/tipo fluidos; ajustes/cuenta apilables; auth con padding móvil.
- **E — Formularios**: form single apilable, bulk con scroll horizontal digno, date-time-picker e invitaciones revisados.
- **F — Validación**: `npm test` + `type-check` + `lint` + `next build`; verificación visual Playwright (390×844, 360×740) sobre `next start` en lo alcanzable sin sesión; push de la rama → Vercel Preview para probar en teléfono real.

## Criterios

1. Sin scroll horizontal en ninguna página a 360 px.
2. Ningún control esencial oculto tras hover.
3. Formularios usables con teclado en pantalla (sin zoom iOS, sin cortes).
4. Escritorio pixel-idéntico salvo mejoras deliberadas (targets, wrap).
5. La rama NO se mergea a main: el usuario valida en Vercel Preview.

## Ronda 2 — feedback del usuario (2026-07-04)

Tres cambios tras revisar la Preview en DevTools:

1. **Filtros de Diseños plegables en móvil**: búsqueda siempre visible + botón de filtros (punto dorado si hay activos) que despliega estado/diseñador/fechas con `Collapse`. Escritorio intacto. Además el botón de crear pasa a "Crear" en móvil para que tabs+crear compartan fila. Nuevo hook `useIsMobile` (`lib/hooks/use-is-mobile.ts`) como única fuente del corte 767px en JS.
2. **Piel PHSPORT para FullCalendar**: botones tipo placa neutra con activo dorado (idioma del WeekNav), título mono tabular uppercase, cabeceras de día estilo eyebrow, horas en mono. Vale para la vista agenda (móvil) y el mes (escritorio).
3. **Tab bar inferior en móvil** (patrón PWA, ref. Apple Music): placa flotante `glass-sidebar` con pill dorada deslizante (`layoutId`), 4 secciones (Inicio · Semana · Diseños · Ajustes), safe-area inferior. Sustituye al hamburger+Sheet en móvil (eliminados); escritorio sigue con la sidebar. Si se quisiera SOLO en la app instalada, gatear el componente con `@media (display-mode: standalone)`.

## Nota de convivencia con `worktree-rediseno-creacion-disenos-fase3-4`

Esa rama elimina `design-form-single/bulk` (−571 líneas). Aquí se les aplica el mínimo para que no estén rotos en móvil; el conflicto al mergear será trivial (borrado gana).
