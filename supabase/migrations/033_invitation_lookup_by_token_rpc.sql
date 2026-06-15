-- 033: Cerrar la enumeración de invitaciones.
--
-- Antes: la policy "Anon can read valid invitations" permitía a cualquier anónimo
-- hacer `GET /rest/v1/invitations` y leer el token + rol de TODA invitación no
-- caducada (RLS filtra filas, no puede exigir un filtro por token). Eso permitía
-- enumerar tokens válidos, incluido alguno de rol ADMIN → escalada de privilegios.
-- (Además su subcondición de usos estaba mal correlacionada y no filtraba nada.)
--
-- Ahora: el alta valida UN token concreto mediante un RPC SECURITY DEFINER que
-- devuelve solo {id, role, valid} y nunca expone la tabla. Sin token exacto no se
-- puede listar nada. La policy de lectura anónima se elimina; anon ya no tiene
-- ninguna policy SELECT sobre invitations (RLS deny-by-default).
--
-- Cliente actualizado: app/(auth)/invite/[token]/page.tsx usa el RPC.

create or replace function public.get_invitation_by_token(p_token text)
returns table (id uuid, role text, valid boolean)
language sql
security definer
set search_path = ''
as $$
  select i.id, i.role::text,
    ((i.expires_at is null or i.expires_at > now())
      and (select count(*) from public.invitation_uses u where u.invitation_id = i.id) < i.max_uses) as valid
  from public.invitations i
  where i.token = p_token;
$$;

revoke execute on function public.get_invitation_by_token(text) from public;
grant execute on function public.get_invitation_by_token(text) to anon, authenticated;

drop policy if exists "Anon can read valid invitations" on public.invitations;
