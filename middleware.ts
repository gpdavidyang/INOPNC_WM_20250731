import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  try {
    // Create response object first
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Skip middleware for static assets, API routes, and auth callback
    const pathname = request.nextUrl.pathname
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/auth/callback') ||
      pathname.includes('.') // static files
    ) {
      return response
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const cookieOptions = {
                ...options,
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                path: '/'
              }
              response.cookies.set(name, value, cookieOptions)
            })
          },
        },
      }
    )

    // Get session - use getUser for more reliable auth check
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // If there's an error, try to refresh the session
    if (error && !user) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Session exists but getUser failed, try to refresh
        await supabase.auth.refreshSession()
        const refreshResult = await supabase.auth.getUser()
        if (refreshResult.data.user) {
          // Successfully refreshed
          return response
        }
      }
    }

    // Public routes that don't require authentication
    const publicPaths = ['/auth/login', '/auth/signup']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    // Demo pages that are accessible regardless of auth status
    const demoPaths = ['/mobile-demo', '/components']
    const isDemoPath = demoPaths.some(path => pathname.startsWith(path))

    // Debug logging - only log important events, not every request
    if (error || (!user && !isPublicPath && !isDemoPath)) {
      console.log('Middleware auth issue:', {
        pathname,
        hasUser: !!user,
        isPublicPath,
        isDemoPath,
        error: error?.message
      })
    }
    
    // Skip auth check for demo pages
    if (isDemoPath) {
      return response
    }

    // If user is not signed in and tries to access protected route
    if (!user && !isPublicPath) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and tries to access auth pages
    if (user && isPublicPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}