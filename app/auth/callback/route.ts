import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { safeNextPath } from '@/lib/utils/safe-redirect';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeNextPath(requestUrl.searchParams.get('next'));
  
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successful code exchange - redirect to the next page
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(
    new URL('/login?error=auth_error', requestUrl.origin)
  );
}
