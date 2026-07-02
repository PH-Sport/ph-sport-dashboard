import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateDesignSchema } from '@/lib/api/schemas';
import {
  validationErrorResponse,
  internalErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '@/lib/api/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) return unauthorizedResponse();

  const { data: design, error } = await supabase
    .from('designs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !design) return notFoundResponse('Diseño');
  return NextResponse.json(design);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqId = crypto.randomUUID();
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const rawBody = await request.json().catch(() => ({}));
  const parsed = updateDesignSchema.safeParse(rawBody);
  if (!parsed.success) return validationErrorResponse(parsed.error, reqId);
  const body = parsed.data;

  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return unauthorizedResponse();

  // Cualquier usuario autenticado puede editar y reasignar diseños.
  // Whitelist explícita: solo se modifican los campos permitidos por el schema.
  // Resolver designer_id 'auto' a un id real antes de enviar a DB.
  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (key === 'designer_id' && value === 'auto') {
      const { assignDesignerAutomatically } = await import('@/lib/services/designs/assignment');
      const deadlineAt = typeof body.deadline_at === 'string' ? body.deadline_at : undefined;
      updateData.designer_id = await assignDesignerAutomatically(id, deadlineAt);
    } else {
      updateData[key] = value;
    }
  }

  const { data: updated, error } = await supabase
    .from('designs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return internalErrorResponse(error, 'design update', reqId);
  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqId = crypto.randomUUID();
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return unauthorizedResponse();

  // Cualquier usuario autenticado puede eliminar diseños.
  const { error } = await supabase.from('designs').delete().eq('id', id);
  if (error) return internalErrorResponse(error, 'design delete', reqId);

  return NextResponse.json({ ok: true, message: 'Diseño eliminado' });
}
