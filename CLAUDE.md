# PHSPORT Dashboard — guía para Claude Code

Dashboard interno del equipo de diseño de PHSPORT: se reparten diseños entre
diseñadores, con fecha de entrega, y se marcan como entregados. Next.js (App
Router) + Supabase. En castellano de principio a fin: interfaz, comentarios de
código y mensajes de commit.

## Al empezar una sesión

1. **Sitúate.** En qué rama estás, si el árbol está limpio y si el remoto se ha
   movido desde la última vez:

   ```bash
   git branch --show-current && git status --short
   git fetch origin && git log --oneline HEAD..@{u}
   ```

2. **Lee `docs/estado-y-traspaso.md`.** Es la foto viva: en qué rama está cada
   cosa, qué decisiones se tomaron y por qué, y qué queda pendiente. Este archivo
   describe cómo se trabaja; aquel, dónde estamos. Mira su fecha: si han pasado
   semanas, trátalo como una pista y verifica contra el repo antes de darlo por
   bueno.

3. **No sincronices por tu cuenta.** Nada de `pull`, cambios de rama ni `stash`
   sin pedirlo: puede haber otra sesión trabajando en este mismo directorio.
   Si el remoto va por delante, dilo y espera.

## Al cerrar una tanda

Si cambió el estado del proyecto —algo se mergeó, un pendiente se resolvió, se
tomó una decisión con la que habrá que convivir—, **actualiza
`docs/estado-y-traspaso.md` en el mismo commit o en uno seguido**. Es lo único
que viaja entre equipos: lo que no quede ahí escrito, se pierde. Un documento de
estado que miente es peor que no tenerlo, porque la siguiente sesión arranca
convencida.

Anota también los rodeos, no solo los aciertos: por qué se descartó una vía o qué
diagnóstico resultó falso. Eso es justo lo que evita repetir el camino largo.

## Arrancar en un equipo nuevo

```bash
npm install
npx playwright install        # los motores no viajan con el repo
npm run dev
```

Hace falta un `.env.local` que **no está versionado** (lo bloquea `.gitignore`).
Necesita `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y
`NEXT_PUBLIC_APP_URL`; hay plantilla en `.env.example`. Sin él la app no arranca:
pídeselo a Mario en vez de inventarlo.

Node 24, npm 11.

## Comandos

| Qué | Comando |
|---|---|
| Desarrollo | `npm run dev` |
| Tests unitarios | `npm test` (vitest) |
| Tests de navegador | `npm run e2e` — ver `docs/testing-navegadores.md` |
| Tipos | `npx tsc --noEmit` |
| Lint | `npm run lint` |

**El rendimiento y el pintado se miden sobre `npm run build && npm start`, nunca
sobre `npm run dev`**: en desarrollo el CSS y el JS van sin optimizar y lo que se
ve no es lo real.

## Cómo está montado

```
app/(dashboard)/     inicio · mi-semana · disenos · equipo · ajustes
app/api/designs/     rutas de servidor, con validación zod en lib/api/schemas.ts
components/ui/       sistema de diseño propio (Surface, Row, PulseDot…) + shadcn
components/layout/   shell: header, sidebar, tab bar móvil
lib/hooks/           datos vía SWR
lib/utils/           lógica pura — aquí es donde viven los tests
supabase/migrations/ SQL numerado
e2e/                 Playwright
```

**La lógica que merece test vive en `lib/utils/`, en funciones puras**, y el hook
solo hace el fetch. Ese es el patrón del proyecto: si algo necesita pruebas,
sácalo ahí en vez de testear el componente.

## Convenciones

- **Castellano en todo**, incluidos los comentarios. Los identificadores de
  código, en inglés.
- Los comentarios explican **por qué**, no qué. Si algo parece un error y no lo
  es —un `bg-background/[0.99]`, por ejemplo—, di por qué o alguien lo
  «arreglará».
- Mensajes de commit en imperativo y en prosa: `fix(movil): la pastilla del menú
  deja de caer en diagonal`. Describen el efecto observable, no el diff.
- No se hace commit ni push salvo que Mario lo pida.

## Trampas conocidas

**Sesiones en paralelo sobre el mismo árbol.** A veces hay otra sesión de Claude
Code trabajando en el mismo directorio y cambiando de rama. Comprueba
`git branch --show-current` antes de commitear, y añade rutas explícitas — nunca
`git add -A`.

**El historial de migraciones diverge de los archivos locales.** Hay números
duplicados y migraciones aplicadas a mano que no constan en el registro de
Supabase. Antes de escribir DDL: mira el número real con un `ls` de la carpeta e
**inspecciona el estado vivo de la base** (`pg_policies`, `pg_trigger`,
`pg_get_functiondef`) en vez de fiarte de los archivos.

**La base de datos de desarrollo es la de producción.** No hay entorno de
staging: `.env.local` apunta al proyecto real. Todo lo que se escriba lo ven los
diseñadores. Lee cuanto quieras; para escribir, pregunta.

**Ante un fallo visual, mira la pantalla antes de teorizar.** Hay matriz de
Playwright: se puede cargar una página, medir cajas, leer estilos calculados y
capturar, en cuatro motores. Un fallo de maquetación se diagnosticó en minutos
así, después de cuatro intentos fallidos razonando sobre el motor sin verlo.
