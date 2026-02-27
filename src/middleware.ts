import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Edge Middleware — runs BEFORE every page render.
 * 
 * Security responsibilities:
 * 1. Redirect unauthenticated users away from protected routes
 * 2. Redirect root `/` to `/login`
 * 3. Redirect authenticated users away from `/login` to their dashboard
 */

const PUBLIC_PATHS = ['/login', '/register']

// Role-to-dashboard mapping
const ROLE_DASHBOARDS: Record<string, string> = {
    super_admin: '/super-admin',
    admin: '/admin/dashboard',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Allow Next.js internals and static assets
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // static files (favicon.ico, images, etc.)
    ) {
        return NextResponse.next()
    }

    // Check for auth token — we check the cookie first, then fall back
    // to checking if the token exists. Since localStorage isn't accessible
    // in edge middleware, we use a cookie-based approach.
    const token = request.cookies.get('School24_token')?.value

    const isPublicPath = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

    // If no token and trying to access protected route → redirect to /login
    if (!token && !isPublicPath) {
        const loginUrl = new URL('/login', request.url)
        // Preserve the original URL so we can redirect back after login
        if (pathname !== '/') {
            loginUrl.searchParams.set('redirect', pathname)
        }
        return NextResponse.redirect(loginUrl)
    }

    // If token exists and on login page → redirect to dashboard
    // We parse the JWT payload (base64) to get the role without verifying signature
    // (signature verification happens server-side on API calls)
    if (token && isPublicPath) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            const role = payload.role as string
            const dashboard = ROLE_DASHBOARDS[role] || '/login'
            if (dashboard !== '/login') {
                return NextResponse.redirect(new URL(dashboard, request.url))
            }
        } catch {
            // Invalid token — let them proceed to login
        }
    }

    return NextResponse.next()
}

export const config = {
    // Match all routes except API routes and static files
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
