# Inventario de estado actual — PH Sport Dashboard

> **Propósito:** quitar la venda antes del rediseño. Mapa capa por capa y pantalla por pantalla de lo que hay HOY, marcando qué es **viga** (estructura/lógica, se reutiliza) y qué es **pared/acabado** (presentación, entra al rediseño).
> **Fecha:** 2026-06-08. Verificado contra el árbol de trabajo actual (no contra memorias antiguas).
> **Analogía guía del usuario:** "lápices de colores sobre plantillas" — plantilla (estructura) estable, color (presentación) borrable y re-pintable sin romper la plantilla.

---

## TL;DR — el mapa en una frase

El ~60-70% del proyecto (datos, API, DB, auth, routing, tipos, lógica de formularios) es **viga sana y reutilizable**, más sólida de lo que el usuario recuerda. El rediseño se concentra en: **(1) completar el sistema de diseño** (faltan escalas de espaciado/tipografía/elevación/movimiento — los "lápices" incompletos), **(2) la capa de movimiento/interacción** (greenfield: el tacto premium no existe aún), y **(3) la capa visual de las pantallas** (repintar sobre la lógica que ya está). Backend y frontend tuvieron trabajo de seguridad y descomposición reales; el modelo mental de "desorganizado y vulnerable" es de hace 5 meses.

Leyenda de veredictos:
- 🟢 **VIGA** — reutilizar tal cual, no tocar.
- 🟡 **NORMALIZAR** — bueno pero con *drift*; unificar, no reescribir.
- 🔵 **REPINTAR** — la lógica se queda; la presentación se rediseña.
- 🟠 **RESTRUCTURAR** — cambia la forma (no solo el color).
- ⚪ **GREENFIELD** — casi inexistente hoy; se construye nuevo.
- ❓ **DECIDIR** — decisión de producto pendiente del usuario.
- 🔴 **RIESGO/DEUDA** — atender aparte del rediseño.

---

## Capa 1 — Datos y dominio (las vigas más profundas) · 🟢 VIGA

| Pieza | Estado | Veredicto |
|---|---|---|
| Modelo de dominio (`lib/types/design.ts`, `filters.ts`) | Estado **binario** `BACKLOG \| DELIVERED` (deliberado, migración 022) | 🟢 + ❓ (¿binario basta? ver decisiones) |
| Hooks de datos SWR (`use-dashboard`, `use-designs`, `use-my-week`) | Usan `designsFetcher` compartido sobre `/api` | 🟢 |
| Cliente API (`lib/utils/api-fetcher.ts`) + `SWRProvider` | `ApiError` con status, fetcher global | 🟢 |
| Schemas zod (`lib/api/schemas.ts`) | Contrato de entrada server-side, source of truth de tipos de input | 🟢 |
| Hooks de equipo/usuarios (`use-team-data`, `use-users-data`) | SWR + Supabase **directo** (no pasan por `/api`) | 🟡 (decidir si se sancionan) |
| `use-notifications` | `useState/useEffect` + realtime, sin SWR | 🟡 |

**Fugas a corregir (lógica metida en la pintura):** `design-detail-sheet.tsx` hace `fetch` crudo inline (3×, con *race condition* sin `AbortController`). Hay que extraerlo a un hook `useDesign(id)` con SWR. Tipos muertos duplicados en `design.ts` que colisionan con los de `schemas.ts`.

---

## Capa 2 — Backend / API / DB · 🟢 VIGA (con verificación de seguridad pendiente)

| Pieza | Estado | Veredicto |
|---|---|---|
| API routes Next (6: designs CRUD, status, assignee, bulk, assign) | Endurecidas: zod `.strict()`, helpers de error con `reqId`, checks de rol/propiedad | 🟢 |
| Algoritmo de asignación (`select-designer.ts`, `assignment.ts`) | Función pura extraída + reparto por carga | 🟢 (lógica de carga de datos duplicada 3× — deuda menor) |
| Supabase (`client`, `server`, `middleware`, `auth-context`) | Auth + SSR + logout que borra solo claves `sb-*` | 🟢 |
| **29 migraciones** | Schema, sistema de notificaciones por email (outbox/dispatcher/retry, 017-020), avatares | 🟢 (infra más rica de lo recordado) |
| Tanda de seguridad (021–029) | RLS diseños/tablas públicas, `search_path` funciones, rol invitación server-side, restringir inserts notis a admin, restringir listado avatares | 🟢 pero ⚠️ **sin verificar línea a línea** |
| Edge function `send-notification-email` | Pipeline de email transaccional (react-email) | 🟢 |

**Deuda/limpieza en esta capa:**
- 🔴 Tablas de **comentarios** (migraciones 003/007/008) probablemente **siguen en la DB** aunque el feature se borró del frontend → superficie muerta.
- 🔴 Triggers SQL (009/014/016) + edge function aún emiten links a **`/communications`** (ruta borrada) → solo los salva un redirect 308 a `/inicio`. Cambiar a `/disenos?open=<id>`.
- ⚠️ **Auditoría de seguridad RLS pendiente** — tarea acotada y recomendada si "no vulnerable" es prioridad real. NO es motivo para reescribir nada del frontend.

---

## Capa 3 — Sistema de diseño / tokens (los "lápices") · 🟠 ~60%, COMPLETAR

| Token | Estado |
|---|---|
| Color (`--background`, `--card`, `--panel`, `--primary` dorado, `--status-*`) | 🟢 completo, disciplinado, HSL, dark/light, contrastes WCAG verificados |
| Radius | 🟡 un solo `--radius`; usos sueltos `rounded-full/xl/2xl` |
| **Espaciado** | 🔴 **NO EXISTE escala** → `p-4/p-5/p-6` ad-hoc según el fichero |
| **Tipografía** | 🔴 **NO EXISTE escala** → títulos en `text-lg/xl/2xl/3xl`, `font-bold` vs `font-semibold` sin regla |
| **Elevación / sombra** | 🔴 sin tokens; `shadow-md` metido en *cada* card |
| **Movimiento** | 🟡 `animations.ts` existe pero mínimo (ver Capa 6) |

**Este es el corazón del "lápiz borrable".** Sin escalas de espaciado/tipografía/elevación/movimiento, un rebranding aún obliga a entrar a tocar clases dentro de los componentes. Completar estas escalas = que la goma de borrar llegue a todo. **Prioridad nº1 de fundamentos del rediseño.**

---

## Capa 4 — Primitivas UI (`components/ui/*`) · 🟡 NORMALIZAR

Base shadcn coherente. *Drift* a unificar (no reescribir):
- Anillo de foco en **4 variantes** (`ring-primary` vs `ring-ring`, `offset-2` vs `offset-0`).
- Radio de inputs partido (`Input rounded-md` vs `Select/Textarea rounded-lg`).
- `Card` con `shadow-md + hover:shadow-lg` global → sombra en todo + doble sombra en card-in-card.
- `Calendar` es de otra era shadcn (`has-focus:`, `shadow-xs`) — diverge del resto.
- `<Badge>` se salta sus variantes pasando `className` con colores crudos.
- Eyebrow mono copy-pasteado **9×** (debería ser `<Eyebrow>` o utilidad).

**Huérfanos (0 importadores) → borrar o cablear:** `error-state.tsx`, `textarea.tsx`, `tooltip.tsx`, `calendar/design-calendar.tsx`, `lib/hooks/use-dashboard-kpis.ts`.

---

## Capa 5 — Pantallas (el lienzo del rediseño)

| Pantalla | Qué hace | Lógica (viga) | Presentación | Notas clave |
|---|---|---|---|---|
| **Auth** (login/reset/invite + layout) | Entrada, recuperar, aceptar invitación | 🟢 componentes auth factorizados | 🔵 ligero (es lo más on-brand ya) | Panel de marca = punto álgido. Fix: input password del invite, min-length débil, guard `uses` roto |
| **/inicio** (admin + designer) | Dashboard de inicio | 🟢 hooks | 🔵 alto | Admin: ~6 bloques apilados sin jerarquía, "Sin asignar" ×3. Designer: **KPI redundante/contradictorio** (bug). Sin estados de error |
| **/disenos** (filtros, tabla, calendario, crear, detalle) | Núcleo operativo | 🟢 hooks, submit, schemas | 🔵 alto | **Falta cambiar estado** desde aquí (acción diaria núcleo). Calendario huérfano (❓). Modal-sobre-sheet. Sin estrategia responsive. Detail-sheet con fetch crudo |
| **/mi-semana** | Cola del diseñador por deadline | 🟢 hooks | 🔵 medio | `DesignCard` = tira que hace `flex-wrap` impredecible. Copy interno filtrado a UI |
| **/equipo** | Carga del equipo | 🟢 hooks | 🔵🟠 medio-alto | `designer-card` mide **% completado**, no carga real → enlaza con sistema pendiente de "% de carga". Roza hero-metric. `hover:scale` |
| **/ajustes** (+ usuarios) | Preferencias, usuarios, invitaciones | 🟢 hooks | 🟠 **restructurar** | `/ajustes` es un **modal disfrazado de página**; "Apariencia" **sin toggle de tema**; guarda con `window.location.reload()`; borrar invitación instantáneo sin confirmar |

---

## Capa 6 — Movimiento e interacción · ⚪ GREENFIELD (la mayor oportunidad premium)

**Lo que hay:** `components/ui/animations.ts` (centralizado 🟢) con tweens de duración (`fade 0.15s`, `modal 0.25s`, `layout 0.4s`, curva Material `[0.4,0,0.2,1]`) y 4 variantes (fade/fadeSlide/scale/slideHorizontal). `framer-motion` en 8 ficheros, casi todo `AnimatePresence` para crossfades. `PageTransition` hace crossfade skeleton↔contenido.

**Lo que NO hay (= lo que pediste):**
- 🔴 **Física de muelle real**: solo 1 `spring` (stiffness 200/damping 25) y se usa para animar *layout* (anti-patrón). El tacto "vivo/físico" no existe.
- 🔴 **Respuesta instantánea / UI optimista**: hay `window.location.reload()` al guardar, espejo `localItems` que provoca doble render, updates no optimistas → sensación de lentitud.
- 🔴 **Movimiento interrumpible/continuo**, *view transitions*, *shared element transitions*.
- 🔴 **`prefers-reduced-motion`** no respetado (a11y + pulido).
- 🟡 **Dos sistemas paralelos**: keyframes Tailwind (fade/slide/page-enter/blink/pulse-slow) + `animations.ts` framer → sin fuente única.

**Veredicto:** se construye casi de cero, **sobre** `animations.ts` (lo extendemos a sistema de tokens de movimiento: muelles, duraciones, easings premium, reduced-motion, transiciones de vista). Aquí está el mayor salto de "se siente premium" y casi no hay legacy que pelear.

---

## Cross-cutting

- **Routing/Nav** · 🟢 — rutas español, redirects 308 desde inglés, middleware role-aware, sin enlaces rotos. (Detalle: `/` redirige client-side con flash "Cargando…".)
- **i18n** · 🟢 — es-ES consistente. Fuga: rol "Manager" en inglés junto a "Diseñador".
- **Skeletons** · 🟡 — existen los 6 pero **no coinciden** con el layout real → *layout shift*.
- **Marca** · 🟡 — favicons/logout aún apuntan al logo *gold* viejo pese al rebrand.

---

## 🔴 Riesgo operativo (atender YA, independiente del rediseño)

- **35 ficheros sin commitear**, incluidos `lib/api/` (zod, lo importan los 6 routes), `app-sidebar.tsx` (la nav entera), `features/{auth,users,my-week}`. Un `git stash`/`checkout` los borraría. → commit de seguridad antes de tocar nada.
- ~25 PNGs de screenshots + `.playwright-mcp/` sin ignorar → `.gitignore`.
- **Gap publicado vs árbol de trabajo:** los usuarios usan la versión *anterior* a este refactor (el refactor está sin commitear/desplegar).

---

## ❓ Decisiones de producto a resolver (alimentan la sesión de diseño)

1. **Estado binario** `Pendiente/Entregado` (deliberado, mig. 022) — ¿basta, o hace falta "En curso"/"En revisión"? La tabla y los KPIs cargan poca info por esto.
2. **Vista Calendario** — construida pero huérfana + la preferencia "Vista por defecto" no hace nada. ¿Se cablea (Lista/Calendario) o se borra todo junto?
3. **Sistema de "% de carga real"** (petición previa en standby) — el `designer-card` actual mide lo equivocado; encaja aquí.
4. **Cambiar estado desde /disenos** — falta la acción diaria núcleo; decidir patrón (inline en tabla / en el detail sheet / ambos).

---

## Clasificación maestra viga / pared

**🟢 VIGA (reutilizar — no tocar):** capa de datos/hooks, cliente API + SWR, schemas zod, 6 API routes, Supabase/auth/middleware, 29 migraciones + pipeline de email, routing/redirects, tokens de **color**, lógica de formularios/submit/asignación.

**🟡 NORMALIZAR (unificar, no reescribir):** primitivas `components/ui/*` (foco, radio, sombra de Card, Badge variants, Calendar, Eyebrow), patrones de fetching (4→unificar), skeletons.

**🔵 REPINTAR / 🟠 RESTRUCTURAR (el rediseño):** capa visual de las 6 pantallas; `/ajustes` modal→página; `design-detail-sheet` fetch→hook.

**⚪ GREENFIELD (construir nuevo):** sistema de movimiento premium (muelles, reduced-motion, view transitions, UI optimista); escalas de **espaciado/tipografía/elevación/movimiento**.

**🔴 DEUDA/SEGURIDAD (aparte):** commit de seguridad git; auditoría RLS línea a línea; limpiar tablas de comentarios + links `/communications`; borrar huérfanos y código muerto.

---

## Próximo paso

**(B) Sesión de dirección de diseño** — fijar el lenguaje premium-charcoal ANTES de pintar pantallas: sistema de movimiento (curvas, muelles, qué se anima), modelo de profundidad, escalas que faltan (espaciado/tipografía), nueva navegación/IA, y el único territorio donde se permite brillo (Champions Pulse). De ahí sale un *brief* de diseño que guía toda la implementación, y un nuevo plan de Fase 7 por sub-fases (como el refactor: por dependencias, validando entre pasos).
