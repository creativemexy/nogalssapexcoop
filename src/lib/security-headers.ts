/**
 * Security Headers for NDPA Compliance
 * Implements comprehensive security headers and HTTPS enforcement
 */

import { NextRequest, NextResponse } from 'next/server';

export interface SecurityConfig {
  enableHSTS: boolean;
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableFrameOptions: boolean;
  enableReferrerPolicy: boolean;
  enablePermissionsPolicy: boolean;
}

export class SecurityHeaders {
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    enableHSTS: true,
    enableCSP: true,
    enableXSSProtection: true,
    enableFrameOptions: true,
    enableReferrerPolicy: true,
    enablePermissionsPolicy: true
  };

  /**
   * Apply comprehensive security headers
   */
  static applySecurityHeaders(
    response: NextResponse,
    config: Partial<SecurityConfig> = {}
  ): NextResponse {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Strict Transport Security (HSTS)
    if (finalConfig.enableHSTS) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // Content Security Policy (CSP)
    if (finalConfig.enableCSP) {
      response.headers.set(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
          "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
          "img-src 'self' data: https: blob:",
          "connect-src 'self' https: wss:",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "upgrade-insecure-requests"
        ].join('; ')
      );
    }

    // X-Content-Type-Options
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    if (finalConfig.enableFrameOptions) {
      response.headers.set('X-Frame-Options', 'DENY');
    }

    // X-XSS-Protection
    if (finalConfig.enableXSSProtection) {
      response.headers.set('X-XSS-Protection', '1; mode=block');
    }

    // Referrer Policy
    if (finalConfig.enableReferrerPolicy) {
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Permissions Policy
    if (finalConfig.enablePermissionsPolicy) {
      response.headers.set(
        'Permissions-Policy',
        [
          'camera=()',
          'microphone=()',
          'geolocation=()',
          'gyroscope=()',
          'magnetometer=()',
          'payment=()',
          'usb=()',
          'accelerometer=()',
          'ambient-light-sensor=()',
          'autoplay=()',
          'battery=()',
          'display-capture=()',
          'document-domain=()',
          'encrypted-media=()',
          'fullscreen=(self)',
          'picture-in-picture=()',
          'publickey-credentials-get=()',
          'screen-wake-lock=()',
          'sync-xhr=()',
          'web-share=()',
          'xr-spatial-tracking=()'
        ].join(', ')
      );
    }

    // Additional security headers
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    return response;
  }

  /**
   * Enforce HTTPS redirect
   */
  static enforceHTTPS(request: NextRequest): NextResponse | null {
    const { protocol, host } = request.nextUrl;
    
    // Skip HTTPS enforcement in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Redirect HTTP to HTTPS
    if (protocol === 'http:') {
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = 'https:';
      return NextResponse.redirect(httpsUrl, 301);
    }

    return null;
  }

  /**
   * Validate request security
   */
  static validateRequest(request: NextRequest): { valid: boolean; reason?: string } {
    const userAgent = request.headers.get('user-agent');
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Block requests with suspicious user agents
    if (userAgent && this.isSuspiciousUserAgent(userAgent)) {
      return { valid: false, reason: 'Suspicious user agent' };
    }

    // Validate origin for CORS
    if (origin && !this.isValidOrigin(origin)) {
      return { valid: false, reason: 'Invalid origin' };
    }

    // Check for common attack patterns
    if (this.containsAttackPatterns(request.url)) {
      return { valid: false, reason: 'Potential attack pattern detected' };
    }

    return { valid: true };
  }

  /**
   * Check if user agent is suspicious
   */
  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /php/i,
      /java/i,
      /perl/i,
      /ruby/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Validate origin for CORS
   */
  private static isValidOrigin(origin: string): boolean {
    const allowedOrigins = [
      process.env.NEXTAUTH_URL,
      'https://nogalss.org',
      'https://www.nogalss.org',
      'https://nogalss.com',
      'https://www.nogalss.com'
    ].filter(Boolean);

    return allowedOrigins.includes(origin);
  }

  /**
   * Check for common attack patterns
   */
  private static containsAttackPatterns(url: string): boolean {
    const attackPatterns = [
      /\.\.\//,  // Directory traversal
      /<script/i,  // XSS
      /javascript:/i,  // JavaScript injection
      /vbscript:/i,  // VBScript injection
      /onload=/i,  // Event handler injection
      /onerror=/i,  // Event handler injection
      /union\s+select/i,  // SQL injection
      /drop\s+table/i,  // SQL injection
      /insert\s+into/i,  // SQL injection
      /delete\s+from/i,  // SQL injection
      /exec\s*\(/i,  // Command injection
      /system\s*\(/i,  // Command injection
      /eval\s*\(/i,  // Code injection
      /base64/i,  // Base64 encoding (potential obfuscation)
      /%00/,  // Null byte injection
      /%2e%2e%2f/,  // URL encoded directory traversal
      /%252e%252e%252f/  // Double URL encoded directory traversal
    ];

    return attackPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Rate limiting headers
   */
  static applyRateLimitHeaders(
    response: NextResponse,
    limit: number,
    remaining: number,
    resetTime: number
  ): NextResponse {
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    
    if (remaining === 0) {
      response.headers.set('Retry-After', '60');
    }

    return response;
  }

  /**
   * Data protection headers
   */
  static applyDataProtectionHeaders(response: NextResponse): NextResponse {
    // Prevent caching of sensitive data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'DENY');

    return response;
  }

  /**
   * Apply all security measures
   */
  static applyComprehensiveSecurity(
    request: NextRequest,
    response: NextResponse,
    config: Partial<SecurityConfig> = {}
  ): NextResponse {
    // Apply security headers
    this.applySecurityHeaders(response, config);
    
    // Apply data protection headers for sensitive endpoints
    if (this.isSensitiveEndpoint(request.url)) {
      this.applyDataProtectionHeaders(response);
    }

    return response;
  }

  /**
   * Check if endpoint is sensitive
   */
  private static isSensitiveEndpoint(url: string): boolean {
    const sensitivePatterns = [
      /\/api\/auth\//,
      /\/api\/privacy\//,
      /\/api\/admin\//,
      /\/dashboard\//,
      /\/profile\//,
      /\/settings\//
    ];

    return sensitivePatterns.some(pattern => pattern.test(url));
  }
}

