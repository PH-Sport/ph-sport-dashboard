# Plan de rediseño — Fase 7 (PHSPORT)

> Fuente de verdad de la Fase 7 (UX/estética). Complementa `refactor-plan.md` (cimientos 0-6) e `inventario-estado-actual.md` (estado real, viga/pared).
> Dos mitades: **(1) Estructura/IA — DEFINIDA** · **(2) Lenguaje visual + movimiento — EN CURSO**.
> Última actualización: 2026-06-09.

## Principios

- **Charcoal Authority** + dorado Champions como **acento raro** (60-30-10). "Sin ruido. Con intención."
- **Premium = física de muelle + fluidez + respuesta instantánea + profundidad + pulido.** NO glassmorphism.
- **Reutilizar vigas** (datos/API/lógica/routing), **re-pintar** la presentación. Todo token-driven → rebrand-safe ("lápices sobre plantillas").
- Estilo de trabajo: por fases con validación, no big-bang.

## Decisiones de producto (cerradas 2026-06-09)

1. **Inicio (Designer) = "Hoy"** vs **Mi Semana = "Semana"** — diferenciadas, sin solaparse.
2. **Diseños: vista Lista + Calendario** — cablear el `DesignCalendar` que ya existe.
3. **Estados: binario** Pendiente/Entregado — trabajos de ~20 min, no más estados.
4. **"Compañeros" (dashboard Designer): secundario e intencional** — algo que se mira a propósito, no un KPI habitual.

## Regla de interacción global

**Una superficie canónica por entidad, a la que se llega navegando — nunca apilada.** Por cosa, la superficie correcta:
- **Página** → entidades con identidad (un diseñador → `/equipo/[id]`, un diseño → `/disenos?open=id`, ajustes → `/ajustes`).
- **Sheet** → vistazo rápido que **no** apila otro encima.
- **Modal** → solo crear enfocado o confirmar/borrar.
- **Inline / popover** → cambios rápidos (estado, asignar).

Resultado: atrás del navegador funciona, URLs compartibles, fin de los modales-sobre-modales. Mata: sheet-sobre-sheet en Equipo, modal-de-editar-sobre-detalle en Diseños, `/ajustes` como modal disfrazado de página.

## Estructura por pantalla (qué muestra / qué cambia / cómo navega)

| Pantalla | Debería mostrar | Cambios clave de navegación/contenido |
|---|---|---|
| **Inicio · Manager** | Héroe de triage (en riesgo / sin asignar, con acción directa) + tira fina de salud + carga real del equipo | Quitar tarjeta "repartir" e "inactivos" sueltos; "Sin asignar" una sola vez; asignar inline; demote de "Crear" |
| **Inicio · Designer ("Hoy")** | "Tu siguiente" (diseño más urgente, acción directa) + cola del día | Quitar KPI duplicado y saludo cambiante; cambiar estado inline; "Compañeros" secundario |
| **Equipo · Manager** | Carga real por diseñador (saturado / libre) | Card sin "% completado"; clic → página `/equipo/[id]`; clic diseño → detalle canónico. Sin apilar. Encaja el sistema de **% de carga** |
| **Diseños** | Lista filtrable + Calendario; estado cambiable; detalle canónico | Una sola barra de filtros; **cambiar estado desde aquí**; editar dentro del detalle (no modal encima); cards en móvil |
| **Mi Semana · Designer ("Semana")** | Cola completa priorizada por deadline | Sin copy interno; entregados plegados; diferenciada de "Hoy" |
| **Ajustes** | Página real con pestañas (Cuenta/Apariencia/Notificaciones) | Página, no modal; tema dentro de Apariencia; guardar sin recargar; quitar "Vista por defecto" no-op |

## Mitad 2 — Lenguaje visual + movimiento (CERRADO 2026-06-09)

**Movimiento** (extender `components/ui/animations.ts`). Física de muelle, **fluida con autoridad, cero rebote** (damping alto → aterriza limpio, sin oscilar). Interrumpible. Optimista (update instantáneo, sync por detrás).
- `spring.snappy` `{stiffness 420, damping 32}` — feedback UI (botones, toggles, flip de estado).
- `spring.smooth` `{stiffness 300, damping 34}` — paneles, sheets, colapsar sidebar, layout.
- `spring.gentle` `{stiffness 220, damping 30}` — entradas de página/contenido.
- `tween.fast` 0.12s / `tween.base` 0.2s, ease `[0.16,1,0.3,1]` (easeOutExpo) — solo opacidad/color.
- `stagger` 0.04s. `prefers-reduced-motion` → muelles a instantáneo, solo fades.
- **Momentos firma:** (1) pill de nav activa con `layoutId` (shared-element); (2) contenido que se asienta (gentle+fade+stagger); (3) flip de estado optimista (snappy).

**Profundidad** — mate, **border-led**. Tokens de elevación:
- `flat` (default): sin sombra, separación por hairline + espaciado. (Mata la sombra global de `card.tsx`.)
- `raised` (interactivo): sombra suave charcoal-tintada, p.ej. `0 1px 2px -1px / 0 2px 8px -4px` baja opacidad.
- `overlay`: la sombra intencional de la sidebar `0 2px 24px -12px rgb(0 0 0 / 0.22)`.
- **Frosted glass** (acento raro, **anclado en marca** — los diseñadores PHSPORT lo usan en plantillas): charcoal ahumado, `bg hsl(var(--panel) / .72)` + `backdrop-blur(12px) saturate(120%)` + borde sutil. **Solo en overlays flotantes** (command palette, dialog, popover). Nunca sobre datos/cards/tablas.

**Tipografía** — Geist + JetBrains Mono. Escala fija (rem), **un peso de heading (semibold 600)**:
- page-title 28px · section 20px · card-title 16px · body 14px · caption 12px · eyebrow 11px mono uppercase `tracking .18em`.
- Tabular nums en datos. `<Eyebrow>` tokenizado (hoy copy-pasteado 9×).

**Espaciado** — escala 4pt semántica: `2xs 4 · xs 8 · sm 12 · md 16 · lg 24 · xl 32 · 2xl 48 · 3xl 64`. Card density: `compact = md(16)` / `default = lg(24)`. Fin del `p-4/5/6` ad-hoc.

**Acento** — dorado 60-30-10 (raro: CTA, nav activa, foco, una urgencia). Status colors como están.

**Territorios** — Charcoal (todo el chrome) · **Champions Pulse** (frosted glass + único highlight con brillo contenido) · Family Proof (calidez en empty states/onboarding).

**Command palette (⌘K)** — fuera del núcleo (opcional/después). El sistema se diseña para que entre limpio (encaja con el overlay de frosted glass).

---

## Plan de ejecución — Fase 7

> Orden por dependencias. Cada sub-fase: type-check + lint + build, validar, marcar `[x]`.

- [x] **7.1 — Fundamentos de tokens** ✅ (2026-06-11): `spacing` semántico 4pt (`2xs..3xl`) + `fontSize` escala fija (`page-title/section/card-title/body/caption/eyebrow`, heading weight 600) + `boxShadow.raised/overlay` + `ease-out-expo` en Tailwind; `SPRINGS/TWEENS/EASE_OUT_EXPO/STAGGER` en `animations.ts` (TRANSITIONS legacy re-apuntado al sistema nuevo); utilidades `.glass-panel`/`.glass-scrim` con fallback `@supports` en globals.css; `MotionProvider` (`reducedMotion="user"`) en layout raíz. Type-check + lint + build ✓.
- [x] **7.2 — Normalizar primitivas** ✅ (2026-06-11): `Card` border-led sin sombra global + props `elevation` (flat/raised) y `density` (default=p-lg/compact=p-md) vía context; `CardTitle` → `text-card-title`; foco unificado a `ring-ring` + `offset-2` (button/select/textarea); radio de controles unificado a `rounded-md`; Badge +variante `info`; `<Eyebrow>` primitiva + 11 sitios normalizados al token `text-eyebrow`; `glass-scrim` en overlays de dialog/sheet + `shadow-overlay` en sus paneles; `glass-panel` en logout-overlay; PageTransition hereda muelles vía TRANSITIONS (7.1). **Nota:** glass en panels de popover/dropdown diferido al repintado por pantalla (decisión de legibilidad en light mode); migración de `player-status-tag`/`invitations-card` a variantes Badge → en 7.4 con sus pantallas. Type-check + lint + build ✓.
- [x] **7.3 — Arquitectura de interacción** ✅ (2026-06-11), en 3 checkpoints:
  - **7.3a** `/ajustes` página real (DashboardPage + 3 pestañas inline; tema claro/oscuro dentro de Apariencia; `refreshSession()` en vez de `window.location.reload()`; user-menu navega a `/ajustes`, dialog eliminado, toggle de tema duplicado eliminado; estilo activo canónico horneado en Tabs; rol "Mánager" es; icono logout → logo nuevo).
  - **7.3b** Detalle de diseño canónico: hook `useDesign` SWR (mata fetch triplicado + race condition) + **cambio de estado desde el detalle** (optimista con rollback, confirm regresivo, flip snappy del badge). Accesible desde /disenos, /mi-semana y /equipo/[id].
  - **7.3c** `/equipo/[id]` página real (semana compartible vía `?semana=`, resumen + secciones, detalle canónico vía sheet único). `designer-detail-sheet` apilado **eliminado**; card de diseñador sin `hover:scale`.
  - **Diferido a 7.4:** editar inline dentro del sheet (hoy sigue modal-sobre-sheet), toggle de estado inline en la tabla de /disenos, rediseño del designer-card (carga real vs % completado). Type-check + lint + build ✓ en cada checkpoint.
- [x] **7.4 — Re-pintar pantallas** ✅ (2026-06-11). (Ajustes ya hecho en 7.3a.)
  - [x] **7.4a Inicio** ✅ (2026-06-11): saludo determinista por día (pool recortado a tono de marca, sin flash post-hidratación); estado de error con reintento (fin del fallo silencioso); "Crear" degradado a outline. **Manager:** héroe de triage absorbe "Repartir" (acción inline donde está el problema) + bullet de sin asignar; tira de KPIs sin duplicados (Activas · Entregados · Bloqueados · Equipo activo); inactivos plegados dentro de Carga del equipo (6 bloques → 4). **Designer:** KPIs honestos sin rama muerta ni número duplicado (Activas · Próxima entrega siempre · Entregadas); cola a ancho completo; Compañeros plegado e intencional (decisión #4). Skeleton reescrito espejando el layout real. Type-check + lint + build ✓.
  - [x] **7.4b Mi Semana** ✅: DesignCard de dos zonas (identidad | meta+acciones, apila predecible en móvil, urgencia dominante, select compacto); Entregados sin meta-copy interno; skeleton fiel (sin paginación inventada); subtítulo diferenciado "Hoy vs Semana"; empty state cálido.
  - [x] **7.4c Diseños** ✅ (3 commits): barra de filtros ÚNICA con "Limpiar" visible cuando difiere del default; espejo `localItems` eliminado (SWR fuente única); **vista Lista/Calendario** con tabs (?view= manda, si no `defaultView` de Ajustes — la preferencia por fin hace algo), calendario huérfano cableado con import dinámico y clic→detalle canónico; **estado inline optimista** en tabla y móvil con confirm regresivo; acciones de fila tras menú ⋯ (borrar ya no es objetivo siempre visible); cards bajo `md`; headers ordenables por teclado; "Sin asignar" visible en columna.
  - [x] **7.4d Equipo** ✅: DesignerCard lidera con CARGA (pendientes grande, umbral de sobrecarga) en vez del "% completado" engañoso; sin Progress/scale-hover. (El sistema "% de carga real" pendiente encajará aquí.)
  - [x] **7.4e Auth** ✅: invite usa `PasswordInput` compartido (show/hide, coherente con login/reset) + requisito de longitud visible inline.
- [x] **7.5 — Estados + momentos firma** ✅ (2026-06-11): **(1) pill de nav activa deslizante** entre items con `layoutId` + muelle smooth (firma Apple-grade); **(2) entrada que se asienta** — `fadeSlide` por defecto en DashboardPage con y:muelle gentle + opacidad:tween; **(3) flip de estado optimista** (hecho en 7.3b/7.4c3). Empty state de Equipo con salida (CTA a invitar). Pase mobile hecho en 7.4 (cards bajo md, filas de dos zonas). Type-check + lint + build ✓.

---

## Fase 8 — Cambio de look TOTAL (EN CURSO, 2026-06-12)

> La Fase 7 fue restyling; el usuario quiere **reinventar la interfaz** (shell, contenedores, modales, distribución). Mockups navegables en `/concepts` (datos fake, no tocan la app real; borrar carpeta al terminar).

**Veredicto del usuario sobre los 3 conceptos:** Sidebar SÍ (diseño fino después) · **B descartado** (lee como newsletter) · dirección = **A × C**: distribución/densidad de A sin su rejilla encasillada, materiales de C (placas suaves, Apple-like), usando el ancho real (C tenía demasiado aire lateral).

**Concepto D (`/concepts/d`) = la síntesis construida**, mini-app completa: rail+topbar, Inicio (triage+KPIs+2col en placas), Semana (placas por diseñador 2-col), Diseños (búsqueda + estado + **filtro diseñador** + **Lista/Calendario** + modales funcionando: detalle=sheet derecha, crear=modal centrado, sobre glass-scrim), Ajustes con pestaña **Miembros** (cards clicables → popup nombre/rol/eliminar). Nav final: Inicio · Semana · Diseños · ⚙Ajustes (Miembros DENTRO de Ajustes; "Semana" fusiona Equipo+Mi Semana por rol).

**Estado:** usuario vio D: "no está mal, buen punto de partida" — **iterando sus ajustes finos sobre D → congelar dirección → extender a la app real** (los tokens/hooks de Fase 7 hacen esto barato). Todo commiteado en main local, sin push.

**Ajustes del usuario aplicados (2026-06-12, ronda 1):**
- ✅ Sidebar **flotante estilo macOS 26**: placa glass-panel despegada de los bordes (inset 12px, rounded-2xl, shadow-overlay), **plegable** a solo-iconos (208↔64px con SPRINGS.smooth; el lienzo se desplaza con el mismo muelle). Pill activa deslizante `layoutId="d-nav-pill"`. Botón Contraer/Expandir abajo.
- ✅ Ajustes: **una sola vista con subapartados al scrollear** (Cuenta · Apariencia · Notificaciones, rótulo eyebrow + placa). Pestañas reducidas a **General · Miembros** — solo Miembros vive aparte (cards clicables → popup intactos).
**Ajustes del usuario aplicados (2026-06-12, ronda 2 — cerrar el gap concept↔app real):**
- ✅ **Conmutador de rol** (pill "dev" en topbar): ver toda la app como Mánager o como Diseñador (persona: Marta). En la app real será una **cuenta developer con flag** que no ocupa puesto ni aparece como miembro → FEATURE NUEVA de backend al portar.
- ✅ **Cara Diseñador completa**: Inicio (hero de urgencia con cuenta atrás "4 h", KPIs propios, cola, compañeros en secundario), Semana = Mi semana (entrega optimista en un toque, entregadas plegables por semana, volver atrás con confirmación), Diseños (solo lo suyo, sin crear/editar/borrar), Ajustes sin Miembros.
- ✅ **Shell vivo**: campana con dropdown (no leídas, marcar todas), menú de usuario (persona, Ajustes, logout con confirmación), tema claro/oscuro funcional.
- ✅ **Semana-céntrico**: navegación ◀ semana ▶ en Semana y Diseños (mock 3 semanas) con estados vacíos diseñados.
- ✅ **Lenguaje de urgencia**: punto pulsante sutil (ámbar <48 h, rojo <24 h, rojo fijo + "Atrasada") en vez de iconos de fuego — decisión del usuario. Tags de estado del jugador (Duda, Última hora…) — se revisarán más adelante.
- ✅ **KPI "Bloqueados" eliminado** (no tiene lógica real) → "Atrasados" (vencidos sin entregar).
- ✅ **Filtros funcionales** en Diseños (búsqueda, estado, diseñador, limpiar) + confirmaciones (estado regresivo, eliminar, logout).
- ✅ **Crear diseños repensado** (decisión del usuario: el lote es EL modo, no un extra): por tipos (Matchday/Presentación/Cumpleaños/Firma/Otro — ya no solo matchday), añades piezas a un lote y creas todas de una; diseñador = "Reparto automático" por defecto; pestaña **Asistente**: pegas el calendario/texto del club → genera borrador de filas para revisar (mock del intake IA pendiente, ver memoria project_pending_ai_design_intake).
- **Popup de Miembros** (renombrar, cambiar rol, eliminar usuario): el usuario CONFIRMA que lo quiere → FEATURE NUEVA con API al portar (hoy la app real solo lista usuarios, sin acciones).
**Ajustes del usuario aplicados (2026-06-12, ronda 3):**
- ✅ **Overlays centrados y simétricos** (decisión del usuario: nada de sheets desde el borde): el detalle de diseño pasa de sheet lateral a **modal centrado**; todos los popups del concepto comparten el mismo patrón (scale 0.96→1 sobre glass-scrim).
- ✅ **Asignación fácil por diseño**: el campo Diseñador es interactivo — en el detalle, clic sobre el diseñador → chips del equipo para reasignar al instante (optimista, la lista de detrás se actualiza); en Crear, el selector está a la vista (ya no en "Más opciones") con "⚡ Reparto automático" por defecto, y cada pieza del lote lleva su badge de diseñador clicable para cambiarla individualmente.
- ✅ Deep-links: aprobado por el usuario, se implementa al portar (el detalle centrado debe abrirse desde URL `?open=id`).
**Ajustes del usuario aplicados (2026-06-13, ronda 4 — gaps restantes + modo claro + auditorías):**
- ✅ **Editar diseño** (gap detectado por el usuario): modal centrado pre-rellenado; sustituye al detalle y vuelve a él al guardar/cancelar (intercambio secuencial, nunca apilado). Guardado optimista.
- ✅ **Invitar miembro**: popup con rol + "Generar enlace" + copiar (mock del flujo real de invitaciones). Invitación pendiente con Copiar/Revocar (revocar confirma).
- ✅ **Eliminar usuario con confirmación** (decisión del usuario: solo Mánager/dev y SIEMPRE con confirmación).
- ✅ **Calendario**: eventos clicables → abren el detalle (como la app real).
- ✅ **Vista por defecto de Diseños** (Lista/Calendario) en Ajustes → Apariencia.
- ✅ **Campana**: borrar notificación individual + estado vacío.
- ✅ **Modo claro adaptado** (decisión: dark-first + claro YA): toggle real vía next-themes (clase en `<html>`, como la app real, persiste). Fix de contraste: sidebar/dropdowns con tokens `panel-*` (el panel sigue charcoal en claro — decisión de marca), superficies de contenido con `muted` en vez de `panel-hover`. Incidente: un reemplazo masivo con PS 5.1 corrompió encoding (mojibake) — revertido con re-encode 1252→UTF-8, verificado.
- ✅ **Auditorías de seguridad y rendimiento** ejecutadas → `docs/auditoria-seguridad-rendimiento.md`. Seguridad: 2 críticos condicionales en invitaciones (creación client-side con rol arbitrario + lectura anónima de tokens), `designs` legible por anon (`OR true`), deriva de esquema (invitations no está en migrations). Rendimiento: top 5 = useDesigners→SWR, optimista en mi-semana, limpieza deps, getClaims+rol en JWT, LazyMotion.

**Decisiones del usuario (2026-06-13) para el porteo:**
- Estados de jugador: se quedan como están; en la app publicada no se usan — valorar quitarlos al portar y re-añadir si los piden.
- Sidebar flotante: aprobada ("mucho mejor que la publicada").
- Móvil: se adapta AL PORTAR (no en el concept).
- Cuenta developer: confirmada — login normal con flag `is_dev` en DB (no ocupa puesto, no aparece en listas/reparto, conmutador de rol en UI).
- Acciones sobre miembros: solo Mánager/dev + confirmación siempre (especialmente eliminar).
- Asistente IA: se portea DESHABILITADO (gris + "Próximamente") hasta que el usuario conecte API/modelo/créditos.
- Pendiente: respuesta del usuario a las auditorías (¿fase de fixes de seguridad antes del porteo?) → luego congelar dirección y portar.

**SEGURIDAD + RENDIMIENTO EJECUTADO (2026-06-15)** — ver `docs/auditoria-seguridad-rendimiento.md` (sección de actualización). Aplicado vía MCP Supabase, verificado contra prod, commits d57a609→1c9abbf.

**PORTEO DEL CONCEPTO D INICIADO (2026-06-15)** — dirección congelada. Plan por fases (tareas PORT-1…6):
- ✅ **PORT-1 Shell** (commit d6effc3): el shell real ya era sidebar flotante plegable (fase 7); llevado al material D (glass-panel, rounded-2xl, Ajustes en footer, label "Semana", header h-12 con section label, user-menu avatar-only). Sin tocar lógica. Build verde. **Primera vez que el usuario ve la dirección D en la app real — pendiente su validación visual (necesita su login).**
- ✅ **PORT-1 Shell** (d6effc3 + 474d238): sidebar reescrita con el MOVIMIENTO del concepto D (corrección del usuario: ancho con muelle, contenido en sincronía, etiquetas con fade — no transiciones CSS bruscas). Header h-12 + section label. user-menu avatar-only.
- ✅ **PORT-3 Inicio** (ecdf3f2): admin + designer dashboards en placas D; UrgencyDot real (punto pulsante desde deadline_at); KPI "Bloqueados"→"Atrasados".
- ✅ **PORT-4 Diseños** (9e0ad64 + e93530c): detalle de Sheet lateral → **modal centrado** (Dialog primitivo, accesible) con **asignación en un clic** (PATCH /assignee optimista); lista y toolbar en placas D; fueguitos → UrgencyDot. Conserva sort/paginación/estado-inline/acciones. Calendario hereda tokens (sin reescribir).
- ✅ **PORT-5 Crear + FEATURE tipos de pieza** (371fa62 + 4b5fa91): el usuario eligió "tipos de pieza ya". Tipos iniciales **Matchday · Presentación · Cumpleaños**, extensibles vía constante DESIGN_TYPES (no enum rígido). Migración 034 en prod (745 filas→matchday, match opcional, CHECK matchday-tiene-partido). Backend: tipos TS, zod condicional, API bulk/update, getDesignContext. UI: selector de tipo en form single (editar) y bulk (tipo global del lote), columnas de partido condicionales, asistente IA en gris ("Pronto"). Verificado: insert de cumpleaños sin partido pasa el CHECK.
- ⏳ **PORT-6 Semana/Ajustes** — repintado seguro (como Inicio), sin backend. + borrar /concepts al final.
- Regla del porteo: NO reescribir lo que ya es viga; ajustar presentación sobre hooks reales. NO inventar features de backend (tipos de pieza) sin decisión del usuario. Las páginas se repintan in-situ en main local (no afecta a prod hasta push).
- PlayerStatusTag ya existía en la app (reutilizado). UrgencyDot creado en components/ui/urgency-dot.tsx. WeekNav pendiente (lo necesita Semana).

**Backlog opcional post-Fase 7** (no bloqueante): skeletons de equipo/usuarios afinados al detalle; bulk-create en móvil (hoy scroll horizontal, uso real es desktop); migrar player-status-tag/invitations-card a variantes Badge; editar inline dentro del sheet (hoy modal-sobre-sheet); soft-delete con undo (necesita soporte API); command palette ⌘K (frosted glass listo).

**Fontanería independiente** (cuando convenga, no bloquea): borrar código muerto, `design-detail-sheet` fetch→hook, auditoría RLS de seguridad (aparte).
