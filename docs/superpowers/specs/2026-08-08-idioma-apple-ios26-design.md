# PHSPORT en idioma Apple — conformidad con iOS 26

**Fecha:** 2026-08-08
**Alcance:** móvil (`<md`). El escritorio queda para una fase 2, según lo acordado.
**Objetivo:** que la PWA instalada se lea como una app nativa de iOS 26, con la tipografía y la paleta de PHSPORT.

---

## 1. Por qué existe este documento

«Parecerse a Apple» no es una instrucción ejecutable. Este documento la convierte en una: extrae las
reglas concretas del sistema de diseño de iOS 26, las convierte en una rúbrica puntuable, audita el
estado actual contra ella, y asigna a cada pantalla de PHSPORT el patrón que le corresponde **según la
función que cumple**, no según lo que se le parezca.

La vara de medir es explícita para que «90% de compatibilidad» signifique algo verificable y no una
sensación.

---

## 2. Fuentes

**Primarias (Apple):**

- [Meet Liquid Glass — WWDC25, sesión 219](https://developer.apple.com/videos/play/wwdc2025/219/) — las dos capas, variantes del material, reglas de legibilidad y de tinte.
- [Get to know the new design system — WWDC25, sesión 356](https://developer.apple.com/videos/play/wwdc2025/356/) — arquitectura de la información, formas concéntricas, barras, scroll edge effects, continuidad.
- [Liquid Glass — Technology Overviews](https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)

**Secundarias (comunidad):**

- [Maximiliano Firtman — PWA Power Tips](https://firt.dev/pwa-design-tips/) — sensación nativa en PWA iOS.
- [Corner concentricity in SwiftUI on iOS 26 — Nil Coalescing](https://nilcoalescing.com/blog/ConcentricRectangleInSwiftUI/)
- [UI Changes in iOS 26 That's Not About Liquid Glass — Design for Native](https://designfornative.com/ui-changes-in-ios-26-thats-not-about-liquid-glass/)
- [Inset grouped List / separator insets — Sarunw](https://sarunw.com/posts/inset-grouped-in-swiftui/)
- [PWA iOS Limitations and Safari Support 2026 — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

---

## 3. El idioma, en seis reglas

Todo lo demás se deriva de estas. Cada una va con su cita textual de Apple.

### R1 · Dos capas, y el cristal solo vive en una

> «Liquid Glass … best reserved for the navigation layer that floats above the content of your app.»
> «making it Liquid Glass would make it compete with other elements and muddy the hierarchy. So keep it in the content layer instead.» — sesión 219

Hay una **capa de contenido** (los datos: filas, listas, texto) y una **capa funcional** (lo que flota
encima: barras, tab bar, menús, sheets). El cristal, el desenfoque y la elevación pertenecen **solo** a
la capa funcional. El contenido se agrupa con rellenos y tonos.

Corolario explícito: **nunca cristal sobre cristal.** «Stacking Liquid Glass elements on top of each
other can quickly make the interface feel cluttered and confusing.»

### R2 · La jerarquía se expresa con disposición y agrupación, no con decoración

> «We've all added extra backgrounds or borders to give buttons the right weight … Instead of relying
> on decoration, hierarchy should be expressed through layout and grouping.» — sesión 356

Ésta es la regla que gobierna el rediseño entero. iOS no tiene un color «borde» de propósito general
para agrupar: tiene una escalera de fondos. Un grupo es un peldaño distinto del lienzo.

### R3 · Dos estilos de lista, elegidos por semántica

- **Inset grouped** — cuando los elementos forman **grupos con significado** (Ajustes). Bloque tonal
  con esquinas redondeadas, a 16pt del cristal, sin borde. El aire entre grupos es lo que separa.
- **Plain** — cuando el contenido es **una misma fila repetida muchas veces** (Mensajes). A sangre,
  sin bloque, estructurado solo por el separador.

En ambos, **el separador arranca donde arranca el texto**, no en el cristal.

### R4 · Concentricidad

> «Concentric Shapes: calculate radius by subtracting padding from the parent's radius.» — sesión 356

`radio_interior = radio_exterior − padding`. Y el aviso: «Watch for corners that feel too pinched—or
flared. They can create tension and break the sense of balance.»

### R5 · Los bordes duros se sustituyen por scroll edge effects

> «Scroll edge effects reinforce that boundary, replacing hard dividers with subtle blur to reduce
> clutter and keep UI legible.» — sesión 356

Con dos límites: **uno por vista**, y «shouldn't be used where there aren't any floating UI elements».
No son decorativos.

### R6 · El tinte es un recurso escaso

> «Avoid tinting all your elements. When every element is tinted, nothing stands out … If you want to
> imbue color into your app, do it in the content layer instead.» — sesión 219

El dorado de PHSPORT es tinte de **acción primaria**. No es color de marca para repartir.

---

## 4. La rúbrica (100 puntos)

| | Dimensión | Peso |
|---|---|---|
| **A** | Arquitectura de capas | 20 |
| **B** | Superficies y agrupación | 20 |
| **C** | Forma y concentricidad | 10 |
| **D** | Navegación y arquitectura de la información | 15 |
| **E** | Color y tinte | 10 |
| **F** | Gestos y respuesta | 10 |
| **G** | Métricas y tipografía | 10 |
| **H** | Sensación nativa de PWA | 5 |

### Criterios

**A · Capas (20)** — A1 cristal solo en capa funcional (6) · A2 nunca cristal sobre cristal (5) ·
A3 el contenido se agrupa con tono, no con material (5) · A4 sin intersecciones contenido/cristal en reposo (4)

**B · Superficies (20)** — B1 agrupación por fondo tonal, no por borde (7) · B2 los dos estilos de
lista, elegidos por semántica (6) · B3 separador con sangría al texto (4) · B4 sin decoración
redundante (sombras/bordes que repiten lo que el tono ya dice) (3)

**C · Forma (10)** — C1 radio interior derivado del exterior (5) · C2 cápsulas en controles táctiles (3) ·
C3 sin radios pinzados ni abocardados (2)

**D · Navegación (15)** — D1 tab bar de 2–5 destinos sin acciones de pantalla (3) · D2 un solo título,
que colapsa (5) · D3 scroll edge effect en lugar de divisor duro, uno por vista (4) · D4 barras sin
fondos ni bordes añadidos (2) · D5 agrupación de acciones por función y frecuencia (1)

**E · Color (10)** — E1 tinte reservado a la acción primaria (4) · E2 no tintar todo (3) · E3 el color
expresivo vive en la capa de contenido (2) · E4 colores semánticos, no literales (1)

**F · Gestos (10)** — F1 swipe actions (trailing destructivo, leading contextual) (3) · F2
pull-to-refresh (2) · F3 menú contextual por pulsación larga (2) · F4 hápticos en momentos clave (2) ·
F5 no capturar los gestos del sistema (1)

**G · Métricas (10)** — G1 objetivos táctiles de 44pt (2) · G2 márgenes de 16pt y escala 4/8/16/24 (2) ·
G3 escala tipográfica semántica (2) · G4 respeta el tamaño de texto del sistema (2) · G5 suelo
tipográfico de 11pt (2)

**H · PWA (5)** — H1 safe areas en los cuatro lados + `viewport-fit=cover` (1) · H2 overscroll
controlado (1) · H3 sin resalte de toque ni selección de texto en el cromo (1) · H4 sin callout al
mantener pulsado (1) · H5 alturas dinámicas (`svh`/`dvh`) (1)

---

## 5. Auditoría del estado actual — **48 / 100**

| Dim. | Puntos | Qué está bien | Qué falla |
|---|---|---|---|
| A | **16**/20 | `glass-sidebar` solo en la `MobileTabBar` (capa funcional, correcto). `glass-scrim` solo en overlays. Sin apilamientos. El `pb-[5.25rem]` del `PageContainer` evita que el contenido se cruce con la tab bar. | `glass-panel` se usa en `logout-overlay` a pantalla completa — cristal de superficie grande sin justificación. |
| B | **4**/20 | La escalera de tonos ya existe: `--background` 8% → `--card` 12%. | Todo se agrupa con `border border-border`, que **repite** lo que el tono ya dice. Un solo estilo de lista para grupos y para repeticiones. Sin separadores. `shadow-raised` añade una tercera señal redundante. |
| C | **3**/10 | La `MobileTabBar` y su botón comparten `rounded-2xl` — misma familia. | `rounded-2xl` (16px) anidado dentro de `rounded-xl` (12px): el hijo es **más redondo que el padre**. No hay relación radio/padding en ninguna parte. |
| D | **7**/15 | Tab bar de 3 destinos, con la acción separada a la derecha — patrón Apple Music, correcto. | Título duplicado: «SEMANA» en el header y «Mi semana» en el H1, 141px antes del primer dato. `border-b` duro en el header en lugar de scroll edge effect. |
| E | **6**/10 | Tokens semánticos en todo (`--primary`, `--status-*`), nada hardcodeado. | El dorado aparece en tab activa, botón crear, valores de KPI, iconos de cabecera y puntos de urgencia. Cuando todo está tintado, nada destaca. |
| F | **2**/10 | No se capturan gestos del sistema. | Sin swipe actions: «Entregar» es un botón `h-11` **permanente en cada fila**, que roba ~90px de ancho. Sin pull-to-refresh. Sin menú contextual. |
| G | **7**/10 | Objetivos de 44pt aplicados (`min-h-11`). Escala 4pt semántica. Escala tipográfica con nombres semánticos. | 41 usos de tamaños crudos por debajo del token (`text-[10px]`, `text-[11px]`). Escala declarada «fija, no fluida». |
| H | **3**/5 | `viewportFit: 'cover'`, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`, `min-h-svh`. | Sin `overscroll-behavior`, sin `-webkit-touch-callout: none`, sin `user-select: none` en el cromo. |

**El diagnóstico en una frase:** la infraestructura ya habla el idioma (tokens, safe areas, targets de
44pt, cristal en el sitio correcto); lo que no lo habla es la **capa de presentación**, que sigue
agrupando con bordes en vez de con tono.

---

## 6. Techos reales — lo que una PWA no puede hacer

Honestidad antes que optimismo. Estos puntos están **descontados** del objetivo:

| Limitación | Consecuencia | Verificado |
|---|---|---|
| **WebKit no expone `navigator.vibrate`** | **Sin hápticos en iOS.** El truco del `<input type="checkbox" switch>` que circulaba fue **parcheado por Apple en iOS 26.5**. F4 queda en 0/2 permanentemente. | Sí |
| **`overscroll-behavior` no es fiable en Safari iOS** | El pull-to-refresh hay que construirlo con eventos táctiles; el rebote del sistema no se puede suprimir del todo. | Sí |
| **Sin gesto «atrás» del sistema en standalone** | La navegación de vuelta debe ser explícita dentro del contenido. Refuerza la necesidad de un botón atrás con la etiqueta del origen. | Sí |
| **Sin Dynamic Type real** | Solo se puede respetar el zoom del navegador con `rem`. G4 tiene techo de 1/2. | — |
| **`backdrop-filter` no refracta** | El lensing de Liquid Glass es una aproximación: desenfoque + saturación, sin desviación de luz. | — |

**Techo de plataforma: 97/100** (F pierde 2 puntos por los hápticos, G pierde 1 por Dynamic Type).
El objetivo de 90 es exigente pero real.

---

## 7. El mapeo — cada pantalla según su función

El criterio no es «qué se le parece» sino **qué hace el usuario ahí**.

### 7.1 `/inicio` — orientación diaria

**Función:** responder «¿qué tengo hoy?» de un vistazo. Bloques heterogéneos, cada uno una puerta a
otro sitio.
**Análogo Apple:** el Resumen de Salud/Fitness.

| Elemento | Hoy | Patrón iOS 26 |
|---|---|---|
| Saludo rotativo | H1 + subtítulo estáticos | **Large title colapsable.** Es la única pantalla donde el título es contenido, no etiqueta. Colapsa a «Inicio». |
| KPIs (3) | 3 `KpiPlate` con borde y sombra cada uno | **Un solo bloque inset grouped** dividido en tres columnas por separadores verticales, como el bloque de Actividad. Un contenedor, no tres. |
| Hero de urgencia | Sección con borde `destructive/30` | **El único bloque tintado de la pantalla.** Es la acción primaria del día: se gana el color (R6). |
| «Tu cola» | Sección con borde + lista | **Plain list**, separador sangrado. Sin bloque. |
| «Compañeros» | Sección con borde | **Inset grouped**, filas con avatar. Secundario a propósito. |

**Gestos:** pull-to-refresh (revalida SWR). Toque en fila → sheet de detalle.

### 7.2 `/mi-semana` — cola personal

**Función:** lista de trabajo con una acción de cierre.
**Análogo Apple:** Recordatorios. Es un calco funcional.

| Elemento | Hoy | Patrón iOS 26 |
|---|---|---|
| Cabecera | Header + H1 duplicados | Large title «Mi semana» → colapsa a la barra |
| Pendientes | Sección con borde | **Plain list** con separador sangrado |
| **Botón «Entregar»** | Botón `h-11` **visible en cada fila** | **Swipe action trailing.** Recupera ~90px de ancho por fila y es el gesto que un usuario de iPhone ya tiene en los dedos. En escritorio se conserva el botón al pasar el ratón. |
| Entregadas por semana | Secciones colapsables con borde | **Inset grouped** con cabecera de sección; el desplegable se mantiene |
| «Volver a pendiente» | Botón icono por fila | **Swipe leading** (contextual, no destructivo) |

**Confirmación al entregar:** hoy hay un `ConfirmDialog`. En iOS, una acción reversible con swipe no
pide confirmación: se ejecuta y ofrece **deshacer**. Recomendación: swipe → ejecuta → toast con
«Deshacer». Menos fricción y más nativo. *Es un cambio de comportamiento: queda a tu decisión.*

### 7.3 `/equipo` — panorámica del equipo (admin)

**Función:** ver de un vistazo quién lleva qué esta semana.
**Análogo Apple:** lista de conversaciones de Mensajes.

- Large title «Semana».
- `WeekNav` → **cápsula segmentada en el toolbar**, bajo el título. Agrupada por función (R2/D5).
- Cada diseñador → **bloque inset grouped** con sus diseños dentro. En móvil, una columna.
- Toque en persona → navegación a `/equipo/[id]`, con botón atrás etiquetado **«Semana»** (nunca «Atrás»).

### 7.4 `/equipo/[id]` — ficha de un diseñador

**Función:** ficha de persona + su carga.
**Análogo Apple:** ficha de Contacto.

- **Cabecera de perfil:** avatar grande centrado, nombre, píldora de rol. Sobre el lienzo, sin tarjeta.
- Debajo, **secciones inset grouped**: métricas, diseños asignados.
- El «· exmiembro» va como texto secundario en la cabecera, no como badge con borde.

### 7.5 `/disenos` — catálogo completo

**Función:** exploración, búsqueda y gestión masiva. La pantalla más «de escritorio» de todas, y la
que más trabajo necesita.

| Elemento | Hoy | Patrón iOS 26 |
|---|---|---|
| Búsqueda | Input dentro de una card con borde | **Barra de búsqueda bajo el large title**, que se oculta al desplazar (patrón `searchable`) |
| Filtros (4 selects) | Card con borde, plegable en móvil | **Menú del toolbar** tras un botón de filtro con indicador de estado. El punto dorado que ya tienes es el instinto correcto. |
| Lista / Calendario | `Tabs` con `TabsList` | **Control segmentado en cápsula** — ya está muy cerca |
| Filas | `DesignCardItem` en `<ul>` | **Plain list** con separador sangrado |
| Editar / Eliminar | Botones por fila | **Swipe trailing = Eliminar** (rojo, destructivo). **Swipe leading = Editar.** **Pulsación larga = menú contextual** con todo. |
| Paginación | Paginador numérico | **No existe en iOS.** Scroll infinito o «Mostrar más» al final. *Cambio funcional — decisión tuya.* |

### 7.6 `/ajustes` — preferencias

**Función:** configurar. **Análogo Apple:** Ajustes, literalmente. Es la pantalla que más gratis sale.

- **Inset grouped puro.** Tus `Section label + hint` ya son exactamente el header y el footer de
  sección de iOS: solo hay que quitarles el borde y darles el bloque tonal.
- Filas: etiqueta a la izquierda, control o valor a la derecha, chevron en las que navegan.
- Tabs General/Miembros → control segmentado.
- **Guardado inmediato:** en iOS los ajustes no tienen botón «Guardar». *Cambio de comportamiento —
  decisión tuya.* Si se mantiene el botón, que sea la única acción tintada de la pantalla.

### 7.7 `/login`, `/invite/[token]`, `/reset-password` — entrada

> «Typography … now bolder and left-aligned to improve readability in key moments like alerts and
> onboarding.» — sesión 356

- Título grande **alineado a la izquierda**, en negrita. Es literal de iOS 26.
- Campos en **un bloque inset grouped**, separados por hairline sangrado.
- Botón primario en **cápsula, ancho completo**, anclado abajo con safe area. El único elemento tintado.

### 7.8 `DesignDetailSheet` — detalle de un diseño

**Función:** ver y actuar sobre una pieza.

- En móvil, **bottom sheet con detents** (medio / grande), no panel lateral.
- **Grabber** (barrita) en la parte superior.
- Cristal + capa de atenuación — `glass-scrim` ya lo hace bien (R1: sheet = capa funcional ✓).
- El contenido interior **no lleva cristal** (R1: nunca cristal sobre cristal).
- Acciones destructivas en rojo, al final, separadas del resto.
- Cierre con **botón de icono**, no de texto (cambio de iOS 26 en modales).

### 7.9 `CreateDesignDialog` — crear / editar

- **Form sheet a pantalla completa** con «Cancelar» a la izquierda y la acción primaria tintada a la derecha.
- El taller de tarjetas y el compositor del agente son **capa de contenido**: sin cristal, agrupados por tono.

### 7.10 Notificaciones, menú de usuario

- En móvil, el dropdown de notificaciones debe ser **sheet**, no menú flotante.
- El menú de usuario puede seguir siendo menú: es capa funcional y va sobre cristal (R1 ✓).

### 7.11 Estados: vacío, error, offline

**Análogo Apple:** `ContentUnavailableView` — símbolo grande atenuado, título, descripción, una acción.
Tu `EmptyState` ya está muy cerca; solo hay que quitarle la tarjeta con borde.

### 7.12 Calendario (FullCalendar)

El menos nativizable. Recomendación acotada: quitarle el envoltorio con borde, heredar la tipografía y
los tonos del sistema, y no invertir más ahí. Se marca como excepción consciente.

---

## 8. Cambios en el sistema

Estos son transversales y habilitan todo lo anterior.

1. **`<Surface>`** — sustituye el uso decorativo de `Card` en móvil. Variantes: `grouped` (bloque tonal
   inset, sin borde) y `plain` (a sangre). En `md:` recupera el borde para escritorio, que sigue en fase 1.
2. **`<Row>`** — fila de lista con separador sangrado configurable (alineado al texto, no al cristal),
   altura mínima de 44pt y zona táctil completa.
3. **`<SwipeRow>`** — acciones leading/trailing con umbral y retorno elástico.
4. **Radios concéntricos** — tokens derivados: `--r-outer: 22px`, y una utilidad que calcula
   `interior = exterior − padding` en vez de números sueltos.
5. **Cabecera colapsable** — un componente de layout que sustituye `PageHeader` + el rótulo del `Header`.
   Un solo título, dos estados.
6. **Scroll edge effect** — sustituye `border-b` en el header por un degradado con desenfoque. Uno por vista.
7. **Suelo tipográfico** — eliminar los 41 tamaños crudos; mínimo 11pt vía token.
8. **CSS de sensación nativa** — `-webkit-touch-callout: none` y `user-select: none` en el cromo
   (nunca en los datos), `overscroll-behavior` donde Safari lo respete.

---

## 9. Iteraciones hasta el objetivo

Tres pasadas, con la puntuación recalculada en cada una.

### Pasada 1 — Superficies (48 → 73)

Aplicar R1–R3: fuera los bordes de agrupación, dentro los dos estilos de lista, separadores sangrados,
`<Surface>` y `<Row>`.

`A 16→18 · B 4→18 · C 3→5 · D 7→8 · E 6→7 · F 2→2 · G 7→8 · H 3→3` = **69**

*Revisión:* se queda corto. La auditoría destapa que quitar bordes sin resolver el título duplicado deja
la pantalla igual de cargada por arriba, y que `shadow-raised` sigue siendo decoración redundante (B4).
Se añade a la pasada: eliminar `shadow-raised` de las superficies de contenido (la elevación es de la
capa funcional) y unificar el radio exterior.

`B 18→19 · C 5→7 · A 18→19` = **73**

### Pasada 2 — Navegación y gestos (73 → 87)

Cabecera colapsable, scroll edge effect, swipe actions, pull-to-refresh, menú contextual.

`C 7→8 · D 8→14 · F 2→8 · G 8→9` = **87**

*Revisión:* F llega a 8 y no a 10 — los hápticos son imposibles (sección 6). Se compensa reforzando la
respuesta **visual**: el swipe revela la acción progresivamente y la fila se anima al confirmar, que es
la parte del feedback que sí está a nuestro alcance.

### Pasada 3 — Detalle fino (87 → 92)

Concentricidad completa, disciplina de tinte, suelo tipográfico, CSS nativo de PWA.

`C 8→9 · E 7→9 · H 3→5` = **92**

### Marcador final proyectado

| Dim. | Actual | Objetivo | Techo de plataforma |
|---|---|---|---|
| A · Capas | 16 | **19** | 20 |
| B · Superficies | 4 | **19** | 20 |
| C · Forma | 3 | **9** | 10 |
| D · Navegación | 7 | **14** | 15 |
| E · Color | 6 | **9** | 10 |
| F · Gestos | 2 | **8** | 8 *(hápticos imposibles)* |
| G · Métricas | 7 | **9** | 9 *(sin Dynamic Type)* |
| H · PWA | 3 | **5** | 5 |
| **Total** | **48** | **92** | **97** |

**92 / 100**, con el techo de plataforma en 97. Los 5 puntos que quedan sobre la mesa son la última
milla: concentricidad perfecta dentro de componentes de terceros (FullCalendar, Radix) y pulido fino
de agrupación y navegación en pantallas de baja frecuencia. Coste alto, retorno bajo — se dejan
conscientemente, no por olvido.

---

## 10. Fases de implementación

| Fase | Contenido | Riesgo |
|---|---|---|
| **1** | `<Surface>` + `<Row>` + retirada de bordes y sombras de agrupación | Bajo — solo presentación |
| **2** | Cabecera colapsable + scroll edge effect | **Medio** — toca el layout compartido de todas las páginas |
| **3** | `<SwipeRow>` + pull-to-refresh + menú contextual | Medio — comportamiento nuevo |
| **4** | Concentricidad, tinte, suelo tipográfico, CSS nativo | Bajo |
| **5** | Sheets con detents, grabber, form sheets | Medio |

---

## 11. Decisiones que necesitan tu visto bueno

Tres son **cambios de comportamiento**, no de aspecto, y no las doy por hechas:

1. **Entregar sin confirmación**, con «Deshacer» en el toast (§7.2).
2. **Paginación → scroll infinito o «Mostrar más»** en `/disenos` (§7.5).
3. **Ajustes con guardado inmediato**, sin botón «Guardar» (§7.6).

Y una cuarta, de alcance: la **fase 2 toca el layout de todas las páginas** a la vez. Es la de mayor
riesgo y la que más cambia la sensación. Puede ir sola, en su propia tanda de validación.
