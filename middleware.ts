import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of paths that require authentication
const protectedPaths = ['/dashboard', '/profile', '/settings'];

// List of paths that are only accessible to non-authenticated users
const authOnlyPaths = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

// List of public paths that should bypass middleware
const publicPaths = [
  '/api/auth/callback/google', // Allow Google OAuth callback
  '/_next',
  '/public',
  '/favicon.ico',
  '/api/auth'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get NextAuth session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAuthOnlyPath = authOnlyPaths.some(path => pathname.startsWith(path));

  // If path requires auth and user is not authenticated, redirect to login
  if (isProtectedPath && !token) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If path is auth-only and user is authenticated, redirect to dashboard
  if (isAuthOnlyPath && token) {
    const from = request.nextUrl.searchParams.get('from');
    const redirectUrl = from ? new URL(from, request.url) : new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Update the config to be more specific about which paths to include/exclude
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/auth routes (for NextAuth)
     * - _next (Next.js internals)
     * - public (static files)
     * - favicon.ico
     */
    '/((?!api/auth|_next/|public/|favicon.ico).*)',
  ],
}; 