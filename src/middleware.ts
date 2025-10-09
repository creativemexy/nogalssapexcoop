import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applyRateLimit } from '@/middleware/rate-limit';
import { validateEnvironmentOnStartup } from '@/lib/startup';
import { 
  applySecurityHeaders, 
  shouldRedirectToHTTPS, 
  getHTTPSRedirectURL, 
  handleCORSRequest,
  createSecurityHeadersMiddleware 
} from '@/middleware/security-headers';
// Note: securityConfig will be imported dynamically to avoid Edge Runtime issues

// Run environment validation once on startup
let envValidated = false;
if (!envValidated) {
  try {
    validateEnvironmentOnStartup();
    envValidated = true;
  } catch (error) {
    console.error('Environment validation failed:', error);
    // Don't exit in middleware, just log the error
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests (using default config to avoid Edge Runtime issues)
  const corsResponse = handleCORSRequest(request);
  if (corsResponse) {
    return corsResponse;
  }

  // Enforce HTTPS in production
  if (shouldRedirectToHTTPS(request, { enforce: process.env.NODE_ENV === 'production', redirect: true, hsts: true, hstsMaxAge: 31536000, includeSubDomains: true, preload: true })) {
    return NextResponse.redirect(getHTTPSRedirectURL(request), 301);
  }

  // Skip middleware for public routes
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/public/') ||
    pathname.startsWith('/api/events') ||
    pathname.startsWith('/api/occupations') ||
    pathname.startsWith('/api/test-investment') ||
    pathname === '/' ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/logo.png') ||
    pathname.startsWith('/android-chrome-') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/favicon-') ||
    pathname.startsWith('/site.webmanifest') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/browserconfig.xml')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });

  // Check if user is authenticated
  if (!token) {
    const response = NextResponse.redirect(new URL('/auth/signin', request.url));
    return applySecurityHeaders(request, response);
  }

  // Check session timeout
  if (token.exp && Date.now() / 1000 > (token.exp as number)) {
    const response = NextResponse.redirect(new URL('/auth/signin?error=SessionExpired', request.url));
    return applySecurityHeaders(request, response);
  }

  // Role-based access control
  const userRole = token.role as string;
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isApex = userRole === 'APEX';
  const isLeader = userRole === 'LEADER';
  const isCooperative = userRole === 'COOPERATIVE';
  const isMember = userRole === 'MEMBER';
  const isBusiness = userRole === 'BUSINESS';
  const isFinance = userRole === 'FINANCE';
  const isApexFunds = userRole === 'APEX_FUNDS';
  const isNogalssFunds = userRole === 'NOGALSS_FUNDS';

  // Super admin routes
  if (pathname.startsWith('/dashboard/super-admin')) {
    if (!isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }

  // Apex Funds routes (must come before /dashboard/apex)
  if (pathname.startsWith('/dashboard/apex-funds')) {
    if (!isApexFunds && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }

  // Apex routes (exclude apex-funds and apex-funds subroutes)
  if (pathname.startsWith('/dashboard/apex') && !pathname.startsWith('/dashboard/apex-funds')) {
    if (!isApex && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }

  // Leader routes
  if (pathname.startsWith('/dashboard/leader')) {
    if (!isLeader && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }

  // Cooperative routes
  if (pathname.startsWith('/dashboard/cooperative')) {
    if (!isCooperative && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }

  // Member routes
  if (pathname.startsWith('/dashboard/member')) {
    if (!isMember && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }

  // Business routes
  if (pathname.startsWith('/dashboard/business')) {
    if (!isBusiness && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }

  // Finance routes
  if (pathname.startsWith('/dashboard/finance')) {
    if (!isFinance && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }


  // Nogalss Funds routes
  if (pathname.startsWith('/dashboard/nogalss-funds')) {
    if (!isNogalssFunds && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }
  }

  // API route protection
  if (pathname.startsWith('/api/admin/')) {
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (pathname.startsWith('/api/apex/')) {
    if (!isApex && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (pathname.startsWith('/api/leader/')) {
    if (!isLeader && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const response = NextResponse.next();
  
  // Apply security headers to all responses (using default config)
  return applySecurityHeaders(request, response);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
}; 