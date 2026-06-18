import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateAssigneeSchema } from '@/lib/api/schemas';
import {
  validationErrorResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '@/lib/api/errors';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqId = crypto.randomUUID();
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const rawBody = await request.json().catch(() => ({}));
  const parsed = updateAssigneeSchema.safeParse(rawBody);
  if (!parsed.success) return validationErrorResponse(parsed.error, reqId);
  const { designer_id } = parsed.data;

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return unauthorizedResponse();

  // Cualquier usuario autenticado puede reasignar diseños.
  // Resolver 'auto' a id concreto.
  let resolvedDesignerId: string | null = designer_id ?? null;
  if (designer_id === 'auto') {
    const { assignDesignerAutomatically } = await import('@/lib/services/designs/assignment');
    resolvedDesignerId = await assignDesignerAutomatically(id);
  } else if (designer_id) {
    // Verificar que el destino sea un usuario con rol DESIGNER.
    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', designer_id)
      .single();
    if (targetError || !target || target.role !== 'DESIGNER') {
      return NextResponse.json(
        { error: 'designer_id debe corresponder a un usuario con rol DESIGNER' },
        { status: 400 }
      );
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('designs')
    .update({ designer_id: resolvedDesignerId })
    .eq('id', id)
    .select()
    .single();

  if (updateError) return internalErrorResponse(updateError, 'assignee update', reqId);
  return NextResponse.json(updated);
}
