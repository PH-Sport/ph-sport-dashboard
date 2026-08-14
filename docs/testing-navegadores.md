# Pruebas de navegador

Matriz de Playwright para la PWA. **Lee primero «Lo que esto no cubre»**: un verde
aquí no significa que funcione en el iPhone de nadie, y conviene saber por qué
antes de fiarse.

## Cómo se ejecuta

```bash
npm run e2e              # los cuatro proyectos
npm run e2e -- --project=ios-safari-aprox
npm run e2e:ui           # modo interactivo, para depurar
npm run e2e:informe      # abre el último informe HTML
npm run e2e:capturas     # regenera las capturas de referencia
```

Levanta solo el servidor con `next build && next start` en el puerto 3100. Nunca
sobre `next dev`: en desarrollo el CSS y el JS van sin optimizar y las
diferencias de pintado no son las reales.

Para lo que exige estar dentro de la app:

```bash
PLAYWRIGHT_USER=cuenta-de-pruebas@… PLAYWRIGHT_PASS=… npm run e2e
```

Sin esas variables el arranque de sesión se salta y los tests que la necesitan se
marcan como omitidos, con el motivo escrito. El resto sigue corriendo. Usa una
**cuenta de pruebas**, no la tuya: los tests navegan por la app y podrían escribir.

## Los cuatro proyectos

| Proyecto | Motor | Perfil | A qué corresponde en la vida real |
|---|---|---|---|
| `windows-chrome` | Chromium 151 | 1440×900 | Windows 10 y 11, y Chrome/Edge en cualquier escritorio |
| `macos-safari` | WebKit 26.5 | 1440×900 | Safari de Mac |
| `ios-safari-aprox` | WebKit 26.5 | iPhone 15 | Aproximación a iPhone — **ver abajo** |
| `android-chrome` | Chromium 151 | Pixel 7 | Chrome de Android |

## Lo que esto no cubre

**Playwright emula dispositivos, no sistemas operativos.** Un «device» cambia
viewport, densidad de píxeles, soporte táctil y user-agent. No cambia el motor de
render ni su versión, ni el sistema donde corre.

**Trae una sola build de cada motor.** Hoy Chromium 151, Firefox 153 y WebKit
26.5. No existe un «WebKit de iOS 18» que instalar. Por eso no hay proyectos
separados por versión de sistema: pedir Windows 10 y 11 por separado daría dos
ejecuciones idénticas del mismo Chrome, y eso es cobertura falsa, que es peor que
no tener ninguna. Lo mismo con Android 14 y 15.

**`ios-safari-aprox` no es Safari de iPhone.** Es WebKit de escritorio con el
tamaño de un iPhone. Comparte la base del motor, así que atrapa buena parte de
las divergencias de CSS frente a Chrome. Pero no tiene el compositing de iOS, ni
la barra de direcciones que se encoge al desplazar, ni las safe-area de verdad, y
su WebKit 26.5 se corresponde con Safari 26 — más nuevo que un iPhone con iOS 18.

Caso real, agosto de 2026: la barra superior dejó de reservar altura en móvil y
el contenido empezó a colarse por debajo **solo en iPhone**, mientras en Chrome y
en las herramientas de desarrollo se veía perfecto. Costó cuatro intentos. Esta
matriz **no lo habría detectado**: el fallo dependía de cómo iOS compone una capa
posicionada, que es justo lo que aquí no se reproduce. Sí habría atrapado el
fallo intermedio —el título leyéndose a través de la barra translúcida—, porque
ese era de CSS y salía en cualquier WebKit.

## Cómo cubrir lo que falta

Por orden de coste:

1. **Un iPhone de verdad, a mano.** Lo que se ha estado haciendo. Gratis y
   fiable, pero solo cubre la versión de iOS que tenga ese aparato.
2. **Simulador de iOS (Xcode).** Corre Safari de iOS real y admite varios
   runtimes instalados a la vez, así que sí permite comparar iOS 18 con 26.
   Requiere Xcode, que hoy **no está instalado en este Mac** (`xcrun simctl` no
   existe). Son varios GB. Se automatiza con `xcrun simctl`, no con Playwright.
3. **Granja de dispositivos en la nube** (BrowserStack, LambdaTest, Sauce Labs).
   Dispositivos y versiones reales bajo demanda, integrable en CI. Es de pago y
   es la única vía que da de verdad «iOS 18 y iOS 26» sin tener los dos aparatos.

## Capturas de referencia

Las de `e2e/__capturas__` **se versionan**: son la línea base. Cada proyecto
tiene la suya, así que una captura solo se compara consigo misma entre
ejecuciones — sirve para detectar que un motor se ha desviado, no para comparar
motores entre sí.

Al cambiar una pantalla a propósito, `npm run e2e:capturas` y revisa el diff
antes de commitear. Si una captura cambia y no sabes por qué, eso es justamente
el aviso que se buscaba.
