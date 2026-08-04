import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNextPath } from '@/lib/utils/safe-redirect';

/**
 * Verifica los enlaces de email de Supabase (recuperación, invitación, cambio de email).
 *
 * A diferencia de /auth/callback —que intercambia un `code` del dominio *.supabase.co—
 * aquí el enlace apunta a phsport.app y traemos el `token_hash`. Que el enlace viva en
 * nuestro propio dominio es justo lo que evita que Gmail lo trate como phishing y le
 * quite el href al renderizarlo.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get('next'));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth_error', requestUrl.origin));
}
