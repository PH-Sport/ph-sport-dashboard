---
target: UI móvil iOS 26 fase 1 (inicio, semana, diseños, mi-semana)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-11T00-06-58Z
slug: app-dashboard-inicio-page-tsx
---
⚠️ DEGRADED: single-context (instrucción del proyecto prohíbe lanzar subagentes sin petición explícita del usuario)

## Design Health Score

| # | Heurística | Score | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | Skeletons y SWR bien resueltos |
| 2 | Sistema ↔ mundo real | 3 | «Activas»/«Entregados»/«Atrasados» no concuerdan en género |
| 3 | Control y libertad | 3 | Deshacer presente en entregas |
| 4 | Consistencia | 2 | «Pendientes» fuera de superficie y «Entregadas» dentro (mi-semana) |
| 5 | Prevención de errores | 3 | ConfirmDialog en destructivos |
| 6 | Reconocer vs recordar | 3 | Todo etiquetado |
| 7 | Flexibilidad y eficiencia | 2 | Cero gestos; todo es tap |
| 8 | Estético y minimalista | 1 | El cromo consume ~70% de los píxeles |
| 9 | Recuperación de errores | 3 | Mensajes claros |
| 10 | Ayuda y documentación | 2 | Los «tips» son ruido con forma de ayuda |
| **Total** | | **25/40** | **Aceptable** |

## Design Specificity Verdict

La fase 1 migró el envoltorio (cajas con borde → bloques agrupados por tono) pero no tocó el
contenido dentro. El idioma de Apple no es un estilo de caja: es una política sobre qué texto
merece existir. Dentro de las superficies nuevas sigue viviendo contenido de dashboard web.

**Deterministic scan:** `detect.mjs --json` sobre admin-dashboard.tsx, mobile-tab-bar.tsx,
page-header.tsx, mi-semana/page.tsx y equipo/page.tsx → **0 hallazgos**. El sistema de tokens
está sano; el fallo es de densidad informativa y de voz tipográfica, invisible a detectores.

## Priority Issues

**[P1] Cinco rótulos antes del primer dato.** /diseños apila `DISEÑOS` (barra) + icono + `Diseños`
(h1) + subtítulo + `1 DISEÑO`. iOS tiene uno: el large title que colapsa. Fuentes:
`components/layout/header.tsx:29`, `components/ui/page-header.tsx:31`, `admin-dashboard.tsx:256`.
Fix: large title colapsable; la barra solo muestra el rótulo tras el scroll.

**[P1] Texto que no es dato.** `disenos/page.tsx:195`, `equipo/page.tsx:190`,
`mi-semana/page.tsx:104`, `ajustes/page.tsx:173`, las 4 `note` de `admin-dashboard.tsx:230-246`,
y el emoji de `mi-semana/page.tsx:140`. Todas repiten el título que tienen encima.
Fix: eliminar. Apple usa texto de apoyo solo como pie de sección y solo para consecuencias no evidentes.

**[P1] La mono en mayúsculas con tracking 0.18em es la voz equivocada.** 62 usos de `font-mono`;
token en `tailwind.config.ts:39`. Es el rasgo que más aleja de iOS: SF Pro usa footnote semibold
en caja de frase. Mono defendible solo para números tabulares (`1/3`, `0/10`).

**[P2] Espaciado sin sistema.** ~48px entre filas de «Entregadas» mientras el título va pegado al
grupo; estados vacíos reservando ~130px para una línea; tarjetas de persona sin asignaciones
ocupando ~200px para no decir nada. Fix: fila 44pt, separador sangrado, vacíos a una línea.

**[P2] Densidad invertida.** Una pantalla de Inicio entrega 4 números, un vacío y 2 nombres.

## Minor Observations

- Contador duplicado: «Entregadas ⑤» + «3 DE AGO – 9 DE AGO … 5».
- `0/10 · 0%`: el porcentaje no añade nada.
- Icono azul junto al large title (equipo, diseños): Apple no ilustra sus títulos.
- Tab bar flotante sin scroll edge effect; el padding sí existe (`page-container.tsx:36`).
- Tachado en entregadas: iOS usa color secundario + check, no tachado.
- Placeholder truncado: «Buscar por título, jugador o partic…».
- `/equipo` sigue con tarjetas sueltas y sombra (`equipo/page.tsx:222`): la fase 1 no llegó.

## Decisiones tomadas por el usuario (2026-08-11)

1. **Large title colapsable** — adelanta el trozo de mayor riesgo de la fase 2 (layout compartido).
2. **Recorte total** del texto explicativo (4 subtítulos + 4 notas de KPI + emoji).
3. **Antes de mergear a main** — la fase 1 se queda en preview hasta que el contenido esté a la altura.
