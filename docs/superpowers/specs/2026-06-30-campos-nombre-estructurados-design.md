# Diseño — Campos de nombre estructurados (Nombre / Primer Apellido / Alias)

Fecha: 2026-06-30

## Objetivo

Dividir el `full_name` (campo único) de `profiles` en campos estructurados —
**Nombre**, **Primer Apellido** y **Alias (opcional)**— para que la interfaz
muestre nombres cortos y limpios (p. ej. "Lluís" en vez de "Lluís Burguet"),
manteniendo el dato completo para gestión, notificaciones y emails.

## Decisiones acordadas (brainstorming)

1. **Regla de display:** se muestra el **Alias si existe; si no, el Nombre**.
   El apellido solo aparece en gestión de miembros.
2. **Dónde se editan:** los 3 campos en **ambos** sitios — al aceptar la
   invitación (el propio usuario) y en el panel de Miembros (el Mánager).
3. **Obligatoriedad:** Nombre siempre obligatorio. Primer Apellido obligatorio
   solo en **altas nuevas** (invitación); los actuales sin apellido (Lorenzo,
   Mario) quedan válidos (grandfathered) y se editan sin forzar. Alias opcional.
4. **Modelo de datos:** columnas estructuradas como fuente de verdad +
   `full_name`/`display_name` como **columnas generadas** por Postgres (no
   mantenidas a mano), para no duplicar la lógica de formateo entre runtimes
   (app React, triggers plpgsql, edge function Deno).

## 1. Modelo de datos

En `public.profiles`:

```sql
given_name   text NOT NULL,          -- Nombre (obligatorio)
family_name  text,                   -- Primer apellido (nullable)
alias        text,                   -- Nombre para mostrar (opcional)

full_name    text GENERATED ALWAYS AS
               (btrim(given_name || ' ' || coalesce(family_name, ''))) STORED,
display_name text GENERATED ALWAYS AS
               (coalesce(nullif(btrim(alias), ''), given_name)) STORED
```

- Fuente de verdad: `given_name`, `family_name`, `alias`.
- `full_name` conserva el **mismo nombre** que hoy → todo lo que ya lo lee
  (triggers de notificación, edge function de email) sigue leyendo una columna
  válida, sin re-derivar nada.
- `display_name` centraliza la regla de display en una sola expresión SQL.
- Ambas generadas (`STORED`) → no pueden desincronizarse de la fuente.

## 2. Migración de datos (los 8 usuarios actuales)

Backfill genérico: `given_name` = primer token; `family_name` = segundo token
(primer apellido; el resto se ignora). Resultado esperado:

| full_name actual | given_name | family_name |
|---|---|---|
| Diego Hernansanz | Diego | Hernansanz |
| Eva Alcazar | Eva | Alcazar |
| Izan Amez | Izan | Amez |
| Lluís Burguet | Lluís | Burguet |
| Pau Guiu | Pau | Guiu |
| Lorenzo | Lorenzo | _(null)_ |
| Mario | Mario | **Rodríguez** (override) |
| José Joaquín Blandino Rizo | **José Joaquín** | **Blandino** (override) |

Overrides manuales (por `id`):
- José Joaquín (`6c47fb85-9508-4e53-9c10-0a7473a4d922`): `given='José Joaquín'`,
  `family='Blandino'` (se descarta "Rizo", 2º apellido — solo guardamos Primer
  Apellido).
- Mario (`07ac09f2-9daf-4734-9d59-06731195dc11`): `family='Rodríguez'`.

Salvaguarda: cualquier fila que quede con `given_name` nulo/vacío tras el
backfill se rellena con `'Usuario'` antes de aplicar `NOT NULL`.

## 3. Caminos de escritura (backend)

- **Trigger `handle_new_user`** (migración 027): hoy inserta `full_name` desde
  `raw_user_meta_data`. Pasa a insertar `given_name` / `family_name` / `alias`
  desde metadata (no puede escribir en `full_name`, ahora generada). Mantiene
  `role='DESIGNER'` por defecto (fix de seguridad de 027 intacto). `given_name`
  cae a `'Usuario'` si falta en metadata.
- **`signUp`** (invitación): `options.data` pasa
  `{ given_name, family_name, alias }` en vez de `{ full_name }`.
- **API `PATCH /api/users/[id]`**: el esquema zod pasa de `full_name` a
  `given_name` (trim, min 1, max 80) + `family_name` (trim, max 80, anulable,
  opcional) + `alias` (trim, max 80, anulable, opcional) + `role`. El `update`
  escribe esos campos (nunca `full_name`). El `.refine` exige al menos un campo.
  El `select` de respuesta devuelve `given_name, family_name, alias, full_name,
  display_name, role`.
- **`use_invitation` / `invitation_uses`**: la tabla de auditoría conserva su
  columna `full_name` (snapshot histórico de lo introducido), alimentada con el
  nombre compuesto desde el cliente. Sin cambios de estructura.
- **Ajustes self-service** (DESCUBIERTO 2026-06-30, el spec inicial lo daba por
  inexistente): `lib/hooks/use-user-preferences.ts` `save()` escribe `full_name`
  desde un campo único en `account-tab.tsx`. Es una 3ª superficie de edición del
  nombre y también rompe al ser `full_name` generada. Pasa a los 3 campos
  (given_name/family_name/alias), como Miembros (apellido no forzado).

## 4. Caminos de lectura / display

Criterio único:

- **App React — día a día → `display_name`**: sidebar, header, menú de usuario,
  saludo de Inicio, píldora "Ver como", cards de equipo/diseñador, panel
  "Compañeros", nombre del diseñador en la tabla de Diseños.
- **App React — gestión → `full_name`**: cards y popup del panel de Miembros
  (Nombre + Apellido).
- **Iniciales del avatar**: siguen derivándose de `full_name` (p. ej. "LB"),
  pasando `full_name` al prop `name` de `UserAvatar`. Estable.
- **Server-side**: la única dependencia de `full_name` fuera de la app es la
  edge function de email (`send-notification-email`), que pasa a seleccionar y
  saludar con `display_name` (se elimina el `getGreetingName(...)`). NOTA
  (verificado por inspección viva 2026-06-30): las funciones de notificación
  004/009 que leían `full_name` ya NO existen en la BD (la feature de comentarios
  se eliminó en los fixes de seguridad). El único objeto de BD que referencia
  `full_name` y hay que actualizar es el trigger `handle_new_user`.

Parches actuales que se **eliminan**:
- `getFirstName(...full_name.split(' ')[0])` en `app/(dashboard)/inicio/page.tsx`.
- `designer.name.split(' ')[0]` en `components/features/designs/designs-table.tsx`.

Tipos: `Profile` (en `lib/auth/auth-context.tsx` y `lib/hooks/use-users-data.ts`)
gana `given_name`, `family_name`, `alias`, `display_name`. El comparador de
`setState` del AuthProvider incluye los nuevos campos. `view-as-context.tsx`
construye el perfil simulado con `given_name`/`display_name` coherentes.

## 5. Formularios y validación

- **Invitación** (`app/(auth)/invite/[token]/page.tsx`): el campo único "Nombre
  completo" → **Nombre** (obligatorio) + **Primer Apellido** (obligatorio) +
  **Alias** (opcional). El `signUp` pasa los 3 en metadata.
- **Miembros** (`components/features/account/members-panel.tsx`): el input único
  "Nombre" → los 3 campos. Nombre obligatorio; Apellido y Alias editables pero
  **no forzados** (respeta el grandfathering). Guarda vía `PATCH`.
- **Regla**: el apellido obligatorio se exige solo en el alta por invitación
  (validación cliente). En edición de existentes no se bloquea. La BD solo fuerza
  `given_name NOT NULL`.

## 6. Alcance (ficheros)

- **Migración SQL nueva**: columnas + generadas + backfill + overrides +
  `handle_new_user`. (Las funciones de notificación 004/009 ya no existen en la
  BD viva — no se tocan.)
- `supabase/functions/send-notification-email/index.tsx` (requiere deploy).
- `app/api/users/[id]/route.ts`
- `app/(auth)/invite/[token]/page.tsx`
- `components/features/account/members-panel.tsx`
- `lib/auth/auth-context.tsx`
- `lib/hooks/use-users-data.ts`
- `lib/hooks/use-designers.ts`
- `lib/hooks/use-team-data.ts`
- `app/(dashboard)/inicio/page.tsx`
- `components/features/designs/designs-table.tsx`
- `components/features/team/designer-card.tsx`
- `app/(dashboard)/equipo/page.tsx`
- `app/(dashboard)/equipo/[id]/page.tsx`
- `lib/auth/view-as-context.tsx`
- `app/(dashboard)/ajustes/page.tsx` (self-service, descubierto)
- `components/features/account/account-tab.tsx` (self-service: 3 campos)
- `lib/hooks/use-user-preferences.ts` (self-service: save escribe given/family/alias)

## 7. Fases de implementación (con validación)

1. **Migración BD** (prod vía MCP). Inspeccionar esquema vivo y dependencias de
   `full_name` ANTES del DDL. Aplicar transaccional. Verificar los 8 quedan con
   `given_name` + `full_name`/`display_name` correctos.
2. **Tipos + hooks**: `Profile` (auth-context, use-users-data), `use-designers`,
   `use-team-data` exponen los campos nuevos. type-check.
3. **Display app**: sustituir nombres por `display_name` (día a día) /
   `full_name` (gestión); eliminar los `.split(' ')` sueltos; `view-as`.
4. **Formularios**: invitación (3 campos + signUp metadata) y Miembros (3 campos).
5. **API**: zod + update en `PATCH /api/users/[id]`.
6. **Server-side display**: edge function de email a `display_name` (deploy
   aparte). No hay funciones de notificación que tocar (no existen en la BD viva).
7. **Verificación**: type-check + lint + build; Playwright en prod build.

Cada fase valida type-check/lint antes de continuar.

## 8. Verificación

- Migración: `SELECT given_name, family_name, alias, full_name, display_name`
  de los 8 → coinciden con la tabla de la sección 2.
- type-check / lint / build limpios.
- Playwright (prod build): Miembros muestra nombre completo; sidebar / saludo /
  cards muestran `display_name`; al poner un alias la UI cambia a él; el form de
  invitación renderiza los 3 campos.

## 9. Despliegue

El cambio del **email** requiere `supabase functions deploy
send-notification-email`. Si no se despliega, no se rompe nada: el email seguiría
leyendo `full_name` (que sigue existiendo). Es el único paso que necesita deploy
aparte.

## 10. Fuera de alcance (YAGNI)

- Segundo apellido como campo propio (solo Primer Apellido).
- Edición del propio nombre/alias en Ajustes (self-service) — hoy el nombre se
  pone al invitarse y lo edita el Mánager; no se añade superficie nueva.
- Desambiguación automática cuando dos personas comparten nombre (se resuelve
  manualmente con el Alias).
