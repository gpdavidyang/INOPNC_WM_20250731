import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create response object first
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const pathname = request.nextUrl.pathname
    
    // Skip middleware for static assets, API routes, and auth callback
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/icons/') ||
      pathname.startsWith('/manifest') ||
      pathname.includes('.') || // static files
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml'
    ) {
      return response
    }

    // Demo pages that are accessible regardless of auth status - COMPLETELY BYPASS MIDDLEWARE
    const demoPaths = [
      '/mobile-demo', 
      '/components',
      '/test-simple',
      '/ui-showcase',
      '/design-system-demo',
      '/design-system-preview',
      '/public-demo',
      '/complete-ui-showcase',
      '/simple-test',
      '/design-system-showcase',
      '/design-system-html'
    ]
    
    // Check if current path is a demo path
    const isDemoPath = demoPaths.some(path => pathname === path || pathname.startsWith(path + '/'))
    
    // Skip ALL middleware processing for demo pages
    if (isDemoPath) {
      console.log('Demo page accessed:', pathname, '- bypassing all middleware')
      return response
    }

    // Public routes that don't require authentication
    const publicPaths = ['/auth/login', '/auth/signup', '/auth/signup-request', '/auth/reset-password', '/auth/update-password']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

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
                httpOnly: false,
                path: '/'
              }
              response.cookies.set(name, value, cookieOptions)
            })
          },
        },
      }
    )

    // Optimize auth check - try session first, then verify user if needed
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    let user = session?.user || null
    
    // Verify user for critical paths - required for critical test compliance
    if (session && !sessionError) {
      try {
        const { data: { user: verifiedUser } } = await supabase.auth.getUser()
        user = verifiedUser
      } catch (userError) {
        // If getUser fails, try refresh
        try {
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
          if (refreshedSession) {
            user = refreshedSession.user
          }
        } catch (refreshError) {
          // If refresh fails, clear session
          user = null
        }
      }
    }

    // Debug logging - only log important events, not every request
    if (sessionError || (!user && !isPublicPath)) {
      console.log('Middleware auth issue:', {
        pathname,
        hasUser: !!user,
        isPublicPath,
        error: sessionError?.message,
        cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
        sessionExists: !!session,
        userExists: !!user
      })
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
     * - api/ (API routes)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}