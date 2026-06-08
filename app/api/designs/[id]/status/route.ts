import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateStatusSchema } from '@/lib/api/schemas';
import {
  validationErrorResponse,
  internalErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from '@/lib/api/errors';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqId = crypto.randomUUID();
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const rawBody = await request.json().catch(() => ({}));
  const parsed = updateStatusSchema.safeParse(rawBody);
  if (!parsed.success) return validationErrorResponse(parsed.error, reqId);
  const { status } = parsed.data;

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return unauthorizedResponse();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) return internalErrorResponse(profileError, 'role check', reqId);

  const { data: originalDesign, error: originalError } = await supabase
    .from('designs')
    .select('designer_id, status')
    .eq('id', id)
    .single();

  if (originalError || !originalDesign) return notFoundResponse('Diseño');

  // Diseñador solo puede mover sus propios diseños.
  if (profile?.role !== 'ADMIN' && originalDesign.designer_id !== user.id) {
    return forbiddenResponse();
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'DELIVERED') {
    updateData.delivered_at = new Date().toISOString();
  } else if (originalDesign.status === 'DELIVERED') {
    updateData.delivered_at = null;
  }

  const { data: updated, error: updateError } = await supabase
    .from('designs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) return internalErrorResponse(updateError, 'status update', reqId);
  return NextResponse.json(updated);
}
