# Estado del proyecto y traspaso

> **Actualizado:** 2026-08-16, al cerrar los dos remates de la cabecera móvil y
> antes de continuar desde otro equipo.
> **Para qué sirve:** que quien retome —persona o Claude Code, en cualquier
> máquina— sepa dónde está cada cosa, por qué se decidió así y qué falta. Las
> convenciones de trabajo están en `CLAUDE.md`.

---

## Dónde está cada cosa

| Rama | Contenido |
|---|---|
| `main` | Lo que corre en producción. Último: `4e6f929`. |
| `preview` | **87 commits por delante de `main`.** Todo lo de abajo vive aquí. Último: `b8e26eb`. |

Ese desfase no es de esta tanda: arrastra el chat de creación de diseños, la fase
1 del rediseño iOS 26 y el trabajo de superficies. **Subir a producción no es un
merge de trámite**; hay que decidir si va entero o por partes.

### Cuidado: la base de datos va por delante del código

La migración `041_fix_assignment_notification_link.sql` **ya está aplicada en la
base de datos de producción**, aunque su código siga sin desplegarse. Al mergear
a `main` no hay nada que ejecutar en Supabase. Volver a lanzarla sería inofensivo
pero innecesario.

Consecuencia práctica: producción ya emite los avisos de asignación con el enlace
correcto, aunque el resto de la tanda no esté desplegado.

---

## Qué se hizo en agosto de 2026, y por qué

Todo salió de un aviso: «Izan reasignó tres diseños a Lluís y a Lluís no le
salen».

### 1. La reasignación nunca estuvo rota

El `UPDATE` se escribía bien; el `audit_log` lo confirmaba. Lluís no los
encontraba porque **entregaban el lunes siguiente**, y ninguna vista por defecto
llega tan lejos: Inicio y Diseños se ciñen a la semana en curso, y «Mi semana»
mira de −7 a +21 días. El trabajo estaba bien asignado y era invisible.

### 2. El enlace de los avisos de asignación (`d5ce575`)

`notify_on_assignment` escribía `/communications/<id>`, una ruta retirada hace
tiempo que `next.config.js` redirige a `/inicio` **descartando el id**. Quien
pulsaba «Te han asignado el diseño X» aterrizaba en Inicio sin rastro de nada.
Llevaba roto desde el 28 de enero: 90 avisos, todos sin leer.

Ahora apunta a `/disenos?open=<id>`, que la página ya sabía interpretar y que
abre el detalle cargándolo por id, al margen del filtro de semana. Los 90
antiguos se reescribieron en la misma migración; los tres triggers de la tabla
son `AFTER INSERT`, así que ese `UPDATE` no reenvió correos ni push.

### 3. Aviso de trabajo en semanas futuras (`df43fd5`, `1ee583b`)

El rótulo de Inicio dice ahora también lo que espera detrás: «Semana del 10 ago –
16 ago · 2 más a partir del lun 17 ago». Decisiones tomadas:

- **Mudo, sin enlace.** Lo que resuelve el problema es enterarse. Hacerlo
  clicable obligaba a enseñar a `/disenos` a leer el rango desde la URL, porque
  `useDesignsFilters` es estado local, y para un admin `/mi-semana` no sirve.
- **Con fecha, no «la semana que viene»**, que mentiría si lo siguiente cae a un
  mes vista.
- **Techo de 8 semanas.** El horizonte real de PHSPORT es de 2-3, así que no
  recorta nada real y evita que una fecha mal tecleada asome como trabajo.
- **En móvil, un punto con haz en vez de la frase**, que no cabía y se partía. Es
  el mismo gesto que la campana usa para «tienes algo sin leer», con el texto
  completo en `sr-only`.

Lógica pura en `lib/utils/upcoming-work.ts` con tests; el fetch, aparte en
`lib/hooks/use-upcoming-work.ts`, para no ensanchar `useDashboard` ni tocar sus
KPIs ni su caché.

### 4. La cabecera móvil (`e17f6e6`, `653fbb2`, `136bd43`, `c7ae6a9`)

- **La píldora de rol salió de la barra.** Anunciaba algo que no cambia y que ya
  aparece en el menú de perfil. Se conserva el aviso «Viendo como Diseñador · X»,
  que no es decorativo: avisa de un estado temporal y es la salida de un clic.
  El componente pasó a llamarse `ViewAsPill`.
- **La barra dejó de reservar 56px en móvil**, que con el título grande a la
  vista no compraban nada. Se consigue con `sticky` + margen inferior negativo,
  **no con `fixed`**: `fixed` fue el primer intento y se portó mal en iPhone. La
  barra cuelga de un `motion.div`, y un ancestro animado por framer-motion puede
  establecer *containing block*, con lo que `fixed` deja de referirse al
  viewport.
- **Los saludos largos se descartan en móvil.** Con menos ancho se cortaban. El
  filtro mide el saludo **ya montado con el nombre**, en vez de mantener una
  segunda lista que se desincronizaría; así aguanta nombres largos. Con nombres
  de 5 letras se pierden 5 de 19 saludos, entre ellos «Buenas tardes» y «Buenas
  noches». Si molesta: bajar el título a `text-xl` en móvil los recupera casi
  todos.

### 5. El fallo que costó cuatro intentos (`c7ae6a9`)

Al quitar los 56px, el título pasó a nacer **dentro** de la franja de la barra,
mientras el `IntersectionObserver` de `page-header.tsx` seguía descontando el
alto de la barra por arriba. Daba el título por pasado nada más cargar: la barra
se ponía opaca al instante y **el título grande no se veía nunca en móvil**. Se
leía el rótulo pequeño encima del título a medio tapar.

**No era Safari.** Pasaba en todos los motores; en escritorio no se notaba porque
allí la barra sigue empujando el contenido. Antes de dar con ello se acusó sin
pruebas al recorte de capas opacas de Safari 26 y a `position: fixed` bajo
framer-motion. Se diagnosticó en minutos al poder **mirar** la app con capturas.

Dos cambios que salieron de aquellas teorías se quedan, comentados, porque son
inofensivos: el fondo con alpha `0.99` (red de seguridad ante Safari 26) y la
vuelta a `sticky`, que es preferible con o sin bug.

### 6. Los dos remates de la cabecera móvil (`0f4ebe5`, `b8e26eb`)

Cerraban la lista de pendientes del rediseño iOS 26. Los dos son de aspecto, sin
lógica detrás.

- **El contenido se desvanece bajo la tab bar.** La barra flota, así que el
  contenido le pasa por detrás y asomaba nítido y cortado a media altura en el
  hueco que queda hasta el borde. Una capa fija de degradado lo apaga contra el
  fondo antes de llegar ahí: es el otro extremo del *scroll edge effect* que la
  cabecera ya tenía arriba. Tres paradas y no dos —la intermedia al 50%— porque
  con dos se ve una banda gris sobre el contenido.
- **Los títulos de página se quedaron sin icono.** Ajustes, Mail y Salud no
  ilustran sus títulos grandes; con un icono al lado, el título parecía más el
  encabezado de una tarjeta que el de una pantalla. Fuera las cuatro props
  `icon=`. La prop sigue en la firma de `PageHeader` sin usuarios: quitarla no
  aporta y toca dos componentes más.
- **De propina:** tres skeletons seguían reservando la línea del subtítulo que se
  eliminó de esas páginas en agosto, y saltaban al cargar. El de `/inicio` la
  conserva porque allí el subtítulo **sí** existe: es el rango de la semana, que
  es un dato y no una descripción.

Con esto **la «tanda D» del rediseño iOS 26 deja de existir como lista propia**.
Era una enumeración de remates sueltos, y lo que quedaba de ella lo absorbió el
criterio de superficies («la caja marca lo que se toca, el plano lo que se lee»),
que es mejor guía. No busques un plan de tanda D: no lo hay ni hace falta.

### 7. Matriz de navegadores (`ad6bfb2`, `db516ec`)

Cuatro proyectos de Playwright y 40 tests. **Lee `docs/testing-navegadores.md`
antes de fiarte de un verde**: Playwright emula dispositivos, no sistemas
operativos, y trae una sola build de cada motor. No hay «iOS 18 frente a 26», y
`ios-safari-aprox` no es Safari de iPhone.

---

## Qué queda pendiente

### 1. Subir a producción

Los 87 commits. Decidir si entero o por partes. Recordar que la migración 041 ya
está viva en la base de datos.

### 2. Una cuenta de pruebas

Los tests de navegador que necesitan sesión se saltan si no hay credenciales:

```bash
PLAYWRIGHT_USER=… PLAYWRIGHT_PASS=… npm run e2e
```

Hasta ahora se han ejecutado con la cuenta real de Mario, que es de mánager, con
`is_dev`, y apunta a **producción**. Los tests actuales solo leen. En cuanto haya
alguno que cree o borre diseños, hace falta una cuenta aparte.

### 3. Validación pendiente

El arreglo de la cabecera se comprobó en iPhone el 2026-08-16 y a primera vista
va bien. El resto de la tanda —el aviso de semanas futuras, la barra sin la
píldora— no se ha usado en el día a día todavía.

**Sin ver en dispositivo:** el fundido de la tab bar y los títulos sin icono
(§6). Del fundido, lo que hay que mirar es la cantidad: si sabe a poco o a
demasiado, es un número —`6.5rem` en los dos archivos del acoplamiento— y se
ajusta en un minuto.

### 4. Ideas anotadas, sin decidir

- **Llevar el aviso de semanas futuras a Diseños.** Hoy solo está en Inicio.
  Requiere pensar dónde: esa página no tiene subtítulo y la semana vive en dos
  `DatePicker`.
- **El ritmo del punto con haz.** Late mientras haya trabajo detrás. Si cansa, se
  ralentiza con una clase o se le dan unos pocos latidos.
- **Desvanecer el título grande al acercarse a la barra**, como hace iOS, en vez
  de dejar que se meta debajo. **Ojo, no confundir con el fundido de la tab bar
  (§6), que ya está hecho:** aquel apaga el contenido contra el borde *inferior*;
  esto es el borde *superior*, y sigue sin hacerse.
- **Instalar Xcode** para probar iOS real (18 y 26) sin depender del móvil de
  Mario. No está instalado; se maneja con `xcrun simctl`, no con Playwright.

---

## Cosas que conviene saber y no se deducen del código

- **El fundido de la tab bar y el `pb` del contenido van acoplados.** Los dos
  valen `6.5rem`: la altura del degradado en `mobile-tab-bar.tsx` y el
  `pb-[calc(env(safe-area-inset-bottom)+6.5rem)]` de `page-container.tsx`. Si el
  contenido termina **dentro** de la franja del degradado, la última fila se lee
  atenuada al llegar al final del scroll. Cambiar uno obliga a cambiar el otro;
  está comentado en ambos archivos.
- **Safari 26 ya no lee `theme-color`.** Tinta su barra muestreando el fondo de
  los elementos fijos o pegajosos cercanos al borde, incluso si tienen
  `opacity: 0`. El `themeColor` de `app/layout.tsx` no hace nada en iOS 26. Si
  aparece un tinte raro, mirar ahí.
- **Los dos «2ª PORTUGAL - J2» no son un duplicado**: son dos piezas del mismo
  partido, para jugadores distintos. El modelo lo permite y es correcto.
- **El README está desactualizado** en la parte de «Comunicaciones»: describe un
  chat por diseño que retiró la migración 031.
