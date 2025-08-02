import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { applySecurityHeaders, handleCORSPreflight, applyCORSHeaders, logSecurityEvent } from '@/lib/security/security-headers'
import { withRateLimit, getRateLimitIdentifier, getRateLimitType } from '@/lib/security/rate-limiter'

/**
 * Enhanced Production Middleware with Security Features
 * 
 * Features:
 * - Authentication and session management
 * - Rate limiting protection
 * - Security headers injection
 * - CORS handling
 * - Security event logging
 * - Request validation
 */

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname
    const method = request.method
    const origin = request.headers.get('origin')
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ip = getRateLimitIdentifier(request)

    // Handle CORS preflight requests first
    const corsResponse = handleCORSPreflight(request)
    if (corsResponse) {
      return applySecurityHeaders(corsResponse as any, process.env.NODE_ENV !== 'production')
    }

    // Create response object
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Apply security headers to all responses
    response = applySecurityHeaders(response, process.env.NODE_ENV !== 'production')

    // Apply CORS headers
    if (origin) {
      response = applyCORSHeaders(response, origin)
    }

    // Skip authentication and rate limiting for static assets and certain API routes
    const isStaticAsset = pathname.startsWith('/_next') ||
                         pathname.includes('.') ||
                         pathname.startsWith('/favicon') ||
                         pathname.startsWith('/manifest') ||
                         pathname.startsWith('/icons')

    const isAuthCallback = pathname.startsWith('/auth/callback')
    const isHealthCheck = pathname === '/api/health'
    const isCSPReport = pathname === '/api/csp-report'

    if (isStaticAsset || isAuthCallback || isHealthCheck || isCSPReport) {
      return response
    }

    // Apply rate limiting (except for health checks and static assets)
    let userId: string | undefined
    
    // Get user ID for authenticated rate limiting (if possible)
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // Don't set cookies in rate limiting check
            },
          },
        }
      )
      
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    } catch (error) {
      // Continue without user ID if auth check fails
    }

    // Apply rate limiting
    const rateLimitResponse = await withRateLimit(request, userId)
    if (rateLimitResponse) {
      // Log rate limit violation
      logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
        details: {
          pathname,
          method,
          userId,
          limitType: getRateLimitType(request)
        }
      })
      
      return rateLimitResponse
    }

    // For API routes, apply additional security headers and return
    if (pathname.startsWith('/api/')) {
      response.headers.set('X-Request-ID', crypto.randomUUID())
      return response
    }

    // Authentication logic for non-API routes
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
                path: '/',
                // Additional security for production
                ...(process.env.NODE_ENV === 'production' && {
                  domain: process.env.COOKIE_DOMAIN,
                  secure: true
                })
              }
              response.cookies.set(name, value, cookieOptions)
            })
          },
        },
      }
    )

    // Get session with retry logic for production
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Enhanced session refresh logic for production
    if (error && !user) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        try {
          await supabase.auth.refreshSession()
          const refreshResult = await supabase.auth.getUser()
          if (refreshResult.data.user) {
            return response
          }
        } catch (refreshError) {
          // Log failed refresh attempt
          logSecurityEvent({
            type: 'unauthorized_access',
            severity: 'low',
            ip,
            userAgent,
            timestamp: new Date().toISOString(),
            details: {
              pathname,
              reason: 'session_refresh_failed',
              originalError: error.message,
              refreshError: refreshError instanceof Error ? refreshError.message : 'unknown'
            }
          })
        }
      }
    }

    // Public routes that don't require authentication
    const publicPaths = ['/auth/login', '/auth/signup', '/auth/reset-password']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    // Demo pages that are accessible regardless of auth status
    const demoPaths = ['/mobile-demo', '/components']
    const isDemoPath = demoPaths.some(path => pathname.startsWith(path))

    // Admin routes that require special permissions
    const adminPaths = ['/dashboard/admin', '/dashboard/performance', '/dashboard/analytics']
    const isAdminPath = adminPaths.some(path => pathname.startsWith(path))

    // Skip auth check for demo pages
    if (isDemoPath) {
      return response
    }

    // Check for suspicious activity patterns
    if (!user && !isPublicPath) {
      // Log unauthorized access attempts to protected routes
      logSecurityEvent({
        type: 'unauthorized_access',
        severity: 'low',
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
        details: {
          pathname,
          reason: 'unauthenticated_access_attempt'
        }
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

    // Additional admin route protection
    if (user && isAdminPath) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
          // Log unauthorized admin access attempt
          logSecurityEvent({
            type: 'unauthorized_access',
            severity: 'high',
            ip,
            userAgent,
            timestamp: new Date().toISOString(),
            details: {
              pathname,
              userId: user.id,
              userRole: profile?.role || 'unknown',
              reason: 'insufficient_permissions_for_admin_route'
            }
          })
          
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (error) {
        // If we can't verify permissions, redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Add security context to response headers for debugging in dev
    if (process.env.NODE_ENV !== 'production') {
      response.headers.set('X-User-ID', user?.id || 'anonymous')
      response.headers.set('X-Request-IP', ip)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    
    // Log middleware errors as security events
    logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'medium',
      ip: getRateLimitIdentifier(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      details: {
        error: error instanceof Error ? error.message : 'unknown_middleware_error',
        pathname: request.nextUrl.pathname
      }
    })
    
    // Return a basic response with security headers
    const errorResponse = NextResponse.next()
    return applySecurityHeaders(errorResponse, process.env.NODE_ENV !== 'production')
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
     * - sw.js (service worker)
     * - manifest.json
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}