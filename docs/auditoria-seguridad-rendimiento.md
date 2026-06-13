# Auditoría de seguridad y rendimiento — 2026-06-13

> Dos auditorías READ-ONLY ejecutadas por agentes sobre el árbol actual (post-Fase 7).
> Pedidas por el usuario antes del porteo del nuevo look (Fase 8).
> **Nada de esto está arreglado todavía** — es el mapa para la fase de fixes.

---

## SEGURIDAD

### Hallazgo transversal: deriva de esquema (migrations ≠ producción)

Las tablas `invitations` / `invitation_uses`, la función `validate_invitation()`, `check_upcoming_deadlines()`/`reset_deadline_notified()` y las columnas `profiles.notification_preferences` y `designs.player_status` **no existen en `supabase/migrations/`** — se crearon a mano en el dashboard. La migración 027 las referencia pero ninguna las crea. Consecuencia: la tanda de seguridad 021-029 **no es verificable desde el repo** para invitaciones, y un `supabase db reset` produciría una BD distinta a producción.
**Fix:** `supabase db pull` + commitear el esquema real con sus policies explícitas.

### CRÍTICO (condicional — depende de policies que NO están en el repo; comprobar en BD viva YA)

- **C1 — Creación de invitaciones 100% client-side con rol elegido por el cliente.** `components/invitations/create-invitation-dialog.tsx:63-70` inserta en `invitations` desde el navegador con `role` a elección (incluye ADMIN). Si la policy INSERT de `invitations` no exige `is_admin()`, cualquier DESIGNER puede emitir invitación ADMIN y auto-promocionarse vía `use_invitation`. **Fix:** policy INSERT `WITH CHECK (is_admin(auth.uid()))` + mover creación a API server-side.
- **C2 — Lectura anónima de `invitations` (enumeración de tokens).** `app/(auth)/invite/[token]/page.tsx:51-56` lee la tabla sin sesión → exige una policy SELECT para `anon`. Si es `USING(true)`, cualquiera puede volcar todos los tokens y sus roles. **Fix:** RPC `SECURITY DEFINER` que devuelva solo `{role, valid}` por token; SELECT solo-admin.

### ALTO

- **A1 — `designs` legible por todos, incluido `anon`.** `002_prd_schema.sql:138-143`: policy `designs_read` con `USING (... OR true)` y sin `TO authenticated` → con la anon key se puede `GET /rest/v1/designs` y leer todo saltándose la API. 021/026 no tocan esta policy. **Fix:** recrear como `FOR SELECT TO authenticated USING (true)`.
- **A2 — Deriva de esquema** (ver transversal).

### MEDIO

- **M1 — Tablas de comentarios vivas** (feature borrado del frontend): `comments` legible/insertable por cualquier autenticado y aún en `supabase_realtime`. **Fix:** `DROP TABLE comments CASCADE` (+ `message_read_status`).
- **M2 — Spam de notificaciones/emails vía `comments`:** insertar dispara `notify_on_comment()` (SECURITY DEFINER) → notifica a todos los ADMIN + encola emails, esquivando el hardening de 028. **Fix:** eliminar tabla/trigger.
- **M3 — Bucket `avatars` sin restricción de ruta/tipo/tamaño:** cualquier autenticado sube cualquier fichero a la raíz del bucket público (hosting de phishing). **Fix:** policy `WITH CHECK (... (storage.foldername(name))[1] = auth.uid()::text)` + validar MIME/size.
- **M4 — Edge Function de email confía en el body** (`user_id`/`type` arbitrarios). Confirmar `verify_jwt = true` y exigir `delivery_id` válido en outbox.

### BAJO

- B1: RLS de `designs` a nivel fila — designer puede escribir columnas no editables (`delivered_at`, `deadline_at`…) en SUS filas vía PostgREST. Trigger que congele columnas para no-admin.
- B2: `weekFiltersSchema`/`bulkCreateDesignsSchema` sin `.strict()`.
- B3: `notifications` sin policy DELETE → el borrado del dropdown falla en silencio (bug funcional).
- B4: token de invitación con `Math.random()` → `crypto.getRandomValues`.
- B5: páginas admin solo gateadas en cliente (parpadeo de UI admin; los datos sí los protege RLS). `/reset-password` fuera del matcher del middleware.

### Verificado correcto (no tocar)

API de diseños completa (auth+rol+propiedad server-side, sin IDOR) · escalada por signup cerrada (027, `handle_new_user` fija DESIGNER) · guard de usos de invitación atómico (FOR UPDATE) · `search_path` fijado en funciones · RLS habilitado en tablas antes desprotegidas (024) · realtime de notificaciones filtrado server-side por RLS · sin secretos en cliente · logout limpio.

### Veredicto

Aceptable para uso interno PERO el flujo de invitaciones deja una vía plausible de escalada a ADMIN cuya seguridad depende de policies no auditables desde el repo. **Tratar como vulnerabilidad abierta hasta comprobar la BD viva.** Top 3: (1) policy INSERT de `invitations` + creación server-side, (2) cerrar lectura anónima de `invitations` con RPC, (3) quitar `OR true` de `designs_read` + commitear esquema real.

---

## RENDIMIENTO

Contexto: la Fase 7 ya eliminó los peores patrones (localItems, window.location.reload, fetch manual en sheet). Lo que queda:

### Top 5 (por impacto/esfuerzo)

1. **`useDesigners` → SWR (S).** `lib/hooks/use-designers.ts:18-46` es el último hook useEffect+fetch sin caché; montado 4 veces en /disenos → 4 queries idénticas por visita. Convertir a `useSWR('designers', …)`.
2. **Status optimista en /mi-semana (S).** `mi-semana/page.tsx:48-77` espera el round-trip; /disenos ya tiene el patrón optimista+rollback — copiar.
3. **Limpieza (S):** deps muertas `@dnd-kit/*` (0 imports), plugins FullCalendar sobrantes (`timegrid`, `interaction` — solo se usa dayGrid), carpetas vacías (`kanban/`, `app/calendar/`), y `app/page.tsx` redirige en CLIENTE (pinta "Cargando…", hidrata y luego salta) → `redirect()` server-side.
4. **`getClaims()` + rol en JWT claims (M).** Cada request hace `auth.getUser()` (red) 2× (middleware + route) + query a `profiles` por el rol = 2-3 round-trips antes del dato. Mayor recorte de latencia percibida por interacción.
5. **LazyMotion (M).** framer-motion completo en el bundle de TODAS las páginas (~25-30 KB gz) vía sidebar/dialog. `LazyMotion features={domAnimation}` + `m.` en 10 ficheros.

Menor: debounce en el callback realtime de `use-notifications` ("marcar todo leído" dispara N×2 refetches + parpadeo del loader).

### Verificado correcto (no tocar)

SWR global bien configurado · /inicio y /disenos comparten caché (misma URL) · FullCalendar ya es dynamic import solo en vista calendario · lucide/date-fns tree-shakeable · fonts con next/font · sin console.log sueltos · índices de DB existentes suficientes a esta escala (no crear más) · NO consolidar use-team-data hacia API (esfuerzo M, ganancia ~0) · NO memoizar tablas de 10 filas.
