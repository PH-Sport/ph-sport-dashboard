import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  validationErrorResponse,
  internalErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api/errors';

const updateUserSchema = z
  .object({
    given_name: z.string().trim().min(1, 'El nombre no puede estar vacío').max(80).optional(),
    family_name: z.string().trim().max(80).nullable().optional(),
    alias: z.string().trim().max(80).nullable().optional(),
    role: z.enum(['ADMIN', 'DESIGNER']).optional(),
  })
  .refine(
    (d) =>
      d.given_name !== undefined ||
      d.family_name !== undefined ||
      d.alias !== undefined ||
      d.role !== undefined,
    { message: 'Nada que actualizar' }
  );

/**
 * PATCH /api/users/[id] — renombrar y/o cambiar el rol de un miembro.
 * Solo Mánager (ADMIN). El cambio de rol es una acción extraordinaria con guardas:
 * no puedes cambiar tu propio rol ni dejar al equipo sin ningún Mánager.
 * La política RLS `profiles_owner_admin_upd` ya autoriza a un admin a editar
 * cualquier perfil, así que no hace falta service-role.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqId = crypto.randomUUID();
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const rawBody = await request.json().catch(() => ({}));
  const parsed = updateUserSchema.safeParse(rawBody);
  if (!parsed.success) return validationErrorResponse(parsed.error, reqId);
  const body = parsed.data;

  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return unauthorizedResponse();

  const { data: me, error: meError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (meError) return internalErrorResponse(meError, 'role check', reqId);
  if (me?.role !== 'ADMIN') return forbiddenResponse();

  // Estado actual del objetivo (para guardas de rol).
  const { data: target, error: targetError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', id)
    .single();
  if (targetError || !target) return notFoundResponse('Usuario');

  if (body.role !== undefined && body.role !== target.role) {
    // No puedes cambiar tu propio rol (evita autobloqueo).
    if (id === user.id) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol' },
        { status: 403 }
      );
    }
    // No dejar al equipo sin ningún Mánager.
    if (target.role === 'ADMIN' && body.role === 'DESIGNER') {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'ADMIN');
      if (countError) return internalErrorResponse(countError, 'admin count', reqId);
      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: 'Debe quedar al menos un Mánager en el equipo' },
          { status: 409 }
        );
      }
    }
  }

  const updateData: Record<string, unknown> = {};
  if (body.given_name !== undefined) updateData.given_name = body.given_name;
  if (body.family_name !== undefined) updateData.family_name = body.family_name || null;
  if (body.alias !== undefined) updateData.alias = body.alias || null;
  if (body.role !== undefined) updateData.role = body.role;
  updateData.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', id)
    .select('id, given_name, family_name, alias, full_name, display_name, role')
    .single();

  if (error) return internalErrorResponse(error, 'user update', reqId);
  return NextResponse.json(updated);
}
