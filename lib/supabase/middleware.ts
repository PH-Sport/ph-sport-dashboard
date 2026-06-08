import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { config } from '@/lib/config'
import { logger } from '@/lib/utils/logger'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    logger.serverError('[Auth] getUser error in middleware:', userError)
    return response
  }

  const path = request.nextUrl.pathname

  // Rutas públicas que no requieren auth
  const isPublicRoute = path === '/login' || path.startsWith('/invite') || path.startsWith('/auth')

  // Redirecciones
  if (!user && !isPublicRoute) {
    // Si no hay usuario y trata de ir a protegida -> Login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Si hay usuario y trata de ir a login/register -> redirigir según rol
    if (isPublicRoute) {
       // Obtener perfil para saber rol
       const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const url = request.nextUrl.clone()
      if (profile?.role === 'ADMIN') {
        url.pathname = '/inicio'
      } else {
        url.pathname = '/mi-semana'
      }
      return NextResponse.redirect(url)
    }
  }

  return response
}
