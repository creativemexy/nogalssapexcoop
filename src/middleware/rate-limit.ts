import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security';

// Rate limiting configuration
const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  '/api/auth/': { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  '/api/admin/': { limit: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  '/api/': { limit: 200, windowMs: 15 * 60 * 1000 }, // 200 requests per 15 minutes
  // Default limit
  default: { limit: 100, windowMs: 15 * 60 * 1000 },
};

export function getRateLimitConfig(pathname: string): { limit: number; windowMs: number } {
  // Check for specific path patterns
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config;
    }
  }
  
  return RATE_LIMITS.default;
}

export function createRateLimitResponse(
  remaining: number,
  resetTime: number,
  limit: number
): NextResponse {
  const response = NextResponse.json(
    { 
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
    },
    { status: 429 }
  );

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
  response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());

  return response;
}

export function getClientIdentifier(request: NextRequest): string {
  // Use IP address as primary identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             request.ip || 
             'unknown';
  
  // Add user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return `${ip}:${userAgent}`;
}

export function applyRateLimit(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const config = getRateLimitConfig(pathname);
  const identifier = getClientIdentifier(request);
  
  const result = checkRateLimit(identifier, config.limit, config.windowMs);
  
  if (!result.allowed) {
    return createRateLimitResponse(result.remaining, result.resetTime, config.limit);
  }
  
  return null;
}

