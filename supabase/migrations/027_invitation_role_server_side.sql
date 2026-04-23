-- Privilege-escalation fix for the invitation flow.
-- Before this change, the client passed `role` in auth.signUp options, which
-- ended up in raw_user_meta_data. handle_new_user then trusted that value and
-- wrote it into profiles.role. A user could tamper with the signUp payload and
-- promote themselves to ADMIN.
--
-- After:
--   * handle_new_user ignores raw_user_meta_data->>'role' and always inserts
--     profiles.role='DESIGNER' as a safe default.
--   * use_invitation (SECURITY DEFINER) reads the real role from the
--     invitations table (admin-controlled) and updates profiles.role
--     accordingly after the invite is validated.
-- The client-side invite page no longer sends role in signUp options.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    'DESIGNER'::public.role_enum
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.use_invitation(
  p_invitation_id uuid,
  p_user_id uuid,
  p_email text,
  p_full_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, pg_temp'
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

  UPDATE public.profiles
  SET role = v_invitation.role
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$function$;
