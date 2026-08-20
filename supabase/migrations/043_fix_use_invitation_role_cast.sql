-- 043: use_invitation vuelve a poder aplicar el rol de la invitación.
--
-- invitations.role es `text` y profiles.role es `public.role_enum`. Postgres no
-- convierte text a enum por su cuenta, así que el UPDATE del rol reventaba con
-- 42804 «column "role" is of type public.role_enum but expression is of type
-- text» — siempre, fuera cual fuera el valor. PostgREST lo devolvía como 400.
--
-- Efecto que tenía: la cuenta SÍ se creaba (eso lo hace el trigger
-- on_auth_user_created, en otra transacción), pero la invitación no se consumía
-- y el rol no se aplicaba. El alta quedaba a medias sin que nadie lo viese: el
-- nuevo miembro entraba siempre como DESIGNER, que es el valor por defecto del
-- trigger. Con una invitación de ADMIN habría entrado con menos permisos de los
-- debidos, y el enlace habría seguido vivo para quien lo tuviera.
--
-- Nace el 2026-04-23 con el commit f014860 («apply invitation role server-side»),
-- que añadió este UPDATE. El último alta que funcionó es del 20 de abril, tres
-- días antes. No se detectó porque desde entonces no entró nadie nuevo, y porque
-- la 025 rompió validate_invitation una puerta antes (ver migración 042): el
-- primer fallo tapaba al segundo. Al arreglar la 042, el alta avanzó hasta aquí
-- y chocó — que es exactamente como se encontró.
--
-- El cast es deliberado, no defensivo: si alguien mete en invitations.role algo
-- que no sea ADMIN o DESIGNER, el enum lo rechaza en vez de asignar basura.
-- Que las dos columnas no compartan tipo es la deuda de fondo, y sigue ahí.
--
-- De paso se corrige el search_path, por el mismo motivo que la 042: lo tenía
-- entrecomillado. Aquí no rompía nada porque el cuerpo ya cualificaba sus tablas,
-- pero dejarlo arreglado evita que el siguiente cambio descuidado lo despierte.

CREATE OR REPLACE FUNCTION public.use_invitation(
  p_invitation_id uuid,
  p_user_id uuid,
  p_email text,
  p_full_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_invitation RECORD;
  v_current_uses INT;
BEGIN
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación no encontrada';
  END IF;

  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < NOW() THEN
    RAISE EXCEPTION 'Esta invitación ha expirado';
  END IF;

  SELECT COUNT(*) INTO v_current_uses
  FROM public.invitation_uses
  WHERE invitation_id = p_invitation_id;

  IF v_current_uses >= v_invitation.max_uses THEN
    RAISE EXCEPTION 'Esta invitación ya ha alcanzado el límite de usos';
  END IF;

  INSERT INTO public.invitation_uses (invitation_id, user_id, email, full_name)
  VALUES (p_invitation_id, p_user_id, p_email, p_full_name);

  -- El rol lo dicta la invitación, nunca el cliente (fix de seguridad de 027).
  UPDATE public.profiles
  SET role = v_invitation.role::public.role_enum
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$function$;
