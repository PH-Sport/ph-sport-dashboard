import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { weekFiltersSchema } from '@/lib/api/schemas';
import {
  validationErrorResponse,
  internalErrorResponse,
  unauthorizedResponse,
} from '@/lib/api/errors';

export async function GET(request: Request) {
  const reqId = crypto.randomUUID();
  const { searchParams } = new URL(request.url);

  const parsed = weekFiltersSchema.safeParse({
    weekStart: searchParams.get('weekStart') ?? '',
    weekEnd: searchParams.get('weekEnd') ?? '',
    status: searchParams.get('status') ?? undefined,
    designerId: searchParams.get('designerId') ?? undefined,
  });

  if (!parsed.success) return validationErrorResponse(parsed.error, reqId);
  const filters = parsed.data;

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) return unauthorizedResponse();

  const weekStartDate = new Date(filters.weekStart);
  weekStartDate.setHours(0, 0, 0, 0);
  const weekEndDate = new Date(filters.weekEnd);
  weekEndDate.setHours(23, 59, 59, 999);

  let query = supabase
    .from('designs')
    .select('*')
    .gte('deadline_at', weekStartDate.toISOString())
    .lte('deadline_at', weekEndDate.toISOString());

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.designerId) query = query.eq('designer_id', filters.designerId);

  const { data: items, error } = await query;

  if (error) {
    logger.serverError('[API designs GET] Supabase error', { reqId, error });
    return internalErrorResponse(error, 'designs GET', reqId);
  }

  return NextResponse.json({ items: items ?? [], count: items?.length ?? 0 });
}
