import { NextRequest, NextResponse } from 'next/server';

// Security headers configuration
export interface SecurityHeadersConfig {
  // Content Security Policy
  csp: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    mediaSrc: string[];
    frameSrc: string[];
    baseUri: string[];
    formAction: string[];
    frameAncestors: string[];
    upgradeInsecureRequests: boolean;
  };
  
  // CORS configuration
  cors: {
    origin: string[];
    methods: string[];
    allowedHeaders: string[];
    credentials: boolean;
    maxAge: number;
  };
  
  // HTTPS enforcement
  https: {
    enforce: boolean;
    redirect: boolean;
    hsts: boolean;
    hstsMaxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  
  // Additional security headers
  additional: {
    xFrameOptions: string;
    xContentTypeOptions: string;
    xXssProtection: string;
    referrerPolicy: string;
    permissionsPolicy: string;
  };
}

// Default security configuration
const defaultSecurityConfig: SecurityHeadersConfig = {
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Note: Consider removing unsafe-inline and unsafe-eval in production
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "https://api.paystack.co", "https://api.ethereal.email"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: true,
  },
  
  cors: {
    origin: [
      'http://localhost:3000',
      'https://nogalssapexcoop.org',
      'https://www.nogalssapexcoop.org',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
  
  https: {
    enforce: true,
    redirect: true,
    hsts: true,
    hstsMaxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  additional: {
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
};

// Generate Content Security Policy header
export function generateCSPHeader(config: SecurityHeadersConfig['csp']): string {
  const directives = [
    `default-src ${config.defaultSrc.join(' ')}`,
    `script-src ${config.scriptSrc.join(' ')}`,
    `style-src ${config.styleSrc.join(' ')}`,
    `img-src ${config.imgSrc.join(' ')}`,
    `connect-src ${config.connectSrc.join(' ')}`,
    `font-src ${config.fontSrc.join(' ')}`,
    `object-src ${config.objectSrc.join(' ')}`,
    `media-src ${config.mediaSrc.join(' ')}`,
    `frame-src ${config.frameSrc.join(' ')}`,
    `base-uri ${config.baseUri.join(' ')}`,
    `form-action ${config.formAction.join(' ')}`,
    `frame-ancestors ${config.frameAncestors.join(' ')}`,
  ];
  
  if (config.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }
  
  return directives.join('; ');
}

// Generate CORS headers
export function generateCORSHeaders(config: SecurityHeadersConfig['cors'], origin?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  
  // Check if origin is allowed
  const isAllowedOrigin = !origin || config.origin.includes(origin) || config.origin.includes('*');
  
  if (isAllowedOrigin) {
    headers['Access-Control-Allow-Origin'] = origin || config.origin[0];
    headers['Access-Control-Allow-Methods'] = config.methods.join(', ');
    headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
    headers['Access-Control-Allow-Credentials'] = config.credentials.toString();
    headers['Access-Control-Max-Age'] = config.maxAge.toString();
  }
  
  return headers;
}

// Generate HTTPS enforcement headers
export function generateHTTPSHeaders(config: SecurityHeadersConfig['https']): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (config.hsts) {
    let hstsValue = `max-age=${config.hstsMaxAge}`;
    if (config.includeSubDomains) {
      hstsValue += '; includeSubDomains';
    }
    if (config.preload) {
      hstsValue += '; preload';
    }
    headers['Strict-Transport-Security'] = hstsValue;
  }
  
  return headers;
}

// Generate additional security headers
export function generateAdditionalHeaders(config: SecurityHeadersConfig['additional']): Record<string, string> {
  return {
    'X-Frame-Options': config.xFrameOptions,
    'X-Content-Type-Options': config.xContentTypeOptions,
    'X-XSS-Protection': config.xXssProtection,
    'Referrer-Policy': config.referrerPolicy,
    'Permissions-Policy': config.permissionsPolicy,
  };
}

// Apply security headers to response
export function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  config?: SecurityHeadersConfig
): NextResponse {
  const securityConfig = config || defaultSecurityConfig;
  const origin = request.headers.get('origin');
  
  // Apply CORS headers
  const corsHeaders = generateCORSHeaders(securityConfig.cors, origin || undefined);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Apply HTTPS enforcement headers
  const httpsHeaders = generateHTTPSHeaders(securityConfig.https);
  Object.entries(httpsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Apply additional security headers
  const additionalHeaders = generateAdditionalHeaders(securityConfig.additional);
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Apply Content Security Policy
  const cspHeader = generateCSPHeader(securityConfig.csp);
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Apply Cache-Control for sensitive endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  return response;
}

// Check if request should be redirected to HTTPS
export function shouldRedirectToHTTPS(request: NextRequest, config: SecurityHeadersConfig['https']): boolean {
  if (!config.enforce || !config.redirect) {
    return false;
  }
  
  // Only redirect in production
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }
  
  // Check if request is already HTTPS
  const protocol = request.headers.get('x-forwarded-proto') || 
                   (request.url.startsWith('https://') ? 'https' : 'http');
  
  return protocol !== 'https';
}

// Get HTTPS redirect URL
export function getHTTPSRedirectURL(request: NextRequest): string {
  const url = new URL(request.url);
  url.protocol = 'https:';
  return url.toString();
}

// Handle CORS preflight requests
export function handleCORSRequest(request: NextRequest, config?: SecurityHeadersConfig): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    const corsConfig = config?.cors || defaultSecurityConfig.cors;
    const corsHeaders = generateCORSHeaders(corsConfig, origin || undefined);
    
    const response = new NextResponse(null, { status: 200 });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
  
  return null;
}

// Security headers middleware factory
export function createSecurityHeadersMiddleware(config?: Partial<SecurityHeadersConfig>) {
  const securityConfig: SecurityHeadersConfig = {
    ...defaultSecurityConfig,
    ...config,
    csp: { ...defaultSecurityConfig.csp, ...config?.csp },
    cors: { ...defaultSecurityConfig.cors, ...config?.cors },
    https: { ...defaultSecurityConfig.https, ...config?.https },
    additional: { ...defaultSecurityConfig.additional, ...config?.additional },
  };
  
  return (request: NextRequest, response: NextResponse): NextResponse => {
    return applySecurityHeaders(request, response, securityConfig);
  };
}
