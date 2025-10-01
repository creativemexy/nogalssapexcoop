import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';

// Validation middleware factory
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (request: NextRequest) => {
    return async (): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> => {
      try {
        const body = await request.json();
        const result = validateInput(schema, body);
        
        if (!result.success) {
        return {
          success: false,
          response: NextResponse.json(
            { 
              error: 'Validation failed',
              details: (result as any).errors 
            },
            { status: 400 }
          )
        };
        }
        
        return { success: true, data: result.data };
      } catch (error) {
        return {
          success: false,
          response: NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        };
      }
    };
  };
}

// Query parameter validation
export function validateQueryParams<T>(schema: z.ZodSchema<T>, request: NextRequest): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const result = validateInput(schema, params);
    
    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: 'Invalid query parameters',
            details: (result as any).errors 
          },
          { status: 400 }
        )
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    };
  }
}

// Headers validation
export function validateHeaders<T>(schema: z.ZodSchema<T>, request: NextRequest): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const headers = Object.fromEntries(request.headers.entries());
    const result = validateInput(schema, headers);
    
    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          { 
            error: 'Invalid headers',
            details: (result as any).errors 
          },
          { status: 400 }
        )
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid headers' },
        { status: 400 }
      )
    };
  }
}

// Content-Type validation
export function validateContentType(request: NextRequest, expectedType: string = 'application/json'): { success: true } | { success: false; response: NextResponse } {
  const contentType = request.headers.get('content-type');
  
  if (!contentType || !contentType.includes(expectedType)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `Content-Type must be ${expectedType}` },
        { status: 400 }
      )
    };
  }
  
  return { success: true };
}

// File upload validation
export function validateFileUpload(request: NextRequest, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  required?: boolean;
} = {}): { success: true } | { success: false; response: NextResponse } {
  const contentType = request.headers.get('content-type');
  
  if (!contentType) {
    if (options.required) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'File upload is required' },
          { status: 400 }
        )
      };
    }
    return { success: true };
  }
  
  // Check file type
  if (options.allowedTypes && !options.allowedTypes.some(type => contentType.includes(type))) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}` },
        { status: 400 }
      )
    };
  }
  
  // Check file size
  const contentLength = request.headers.get('content-length');
  if (options.maxSize && contentLength && parseInt(contentLength) > options.maxSize) {
    return {
      success: false,
      response: NextResponse.json(
        { error: `File too large. Maximum size: ${options.maxSize} bytes` },
        { status: 400 }
      )
    };
  }
  
  return { success: true };
}

// Rate limiting validation
export function validateRateLimit(request: NextRequest, options: {
  maxRequests?: number;
  windowMs?: number;
  keyGenerator?: (req: NextRequest) => string;
} = {}): { success: true } | { success: false; response: NextResponse } {
  // This would integrate with your rate limiting system
  // For now, just return success
  return { success: true };
}

// CSRF protection validation
export function validateCSRF(request: NextRequest): { success: true } | { success: false; response: NextResponse } {
  const csrfToken = request.headers.get('x-csrf-token');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // Basic CSRF validation
  if (!csrfToken) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'CSRF token required' },
        { status: 403 }
      )
    };
  }
  
  // Validate origin/referer
  const allowedOrigins = [
    'http://localhost:3000',
    'https://nogalssapexcoop.org',
    'https://www.nogalssapexcoop.org'
  ];
  
  if (origin && !allowedOrigins.includes(origin)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      )
    };
  }
  
  return { success: true };
}

// Comprehensive validation wrapper
export function validateRequest<T>(request: NextRequest, options: {
  bodySchema?: z.ZodSchema<T>;
  querySchema?: z.ZodSchema<any>;
  headersSchema?: z.ZodSchema<any>;
  contentType?: string;
  fileUpload?: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
  };
  csrf?: boolean;
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
  };
}): Promise<{ success: true; data?: T; query?: any; headers?: any } | { success: false; response: NextResponse }> {
  return new Promise(async (resolve) => {
    try {
      // Validate Content-Type
      if (options.contentType) {
        const contentTypeResult = validateContentType(request, options.contentType);
        if (!contentTypeResult.success) {
          resolve(contentTypeResult);
          return;
        }
      }
      
      // Validate file upload
      if (options.fileUpload) {
        const fileResult = validateFileUpload(request, options.fileUpload);
        if (!fileResult.success) {
          resolve(fileResult);
          return;
        }
      }
      
      // Validate CSRF
      if (options.csrf) {
        const csrfResult = validateCSRF(request);
        if (!csrfResult.success) {
          resolve(csrfResult);
          return;
        }
      }
      
      // Validate rate limiting
      if (options.rateLimit) {
        const rateLimitResult = validateRateLimit(request, options.rateLimit);
        if (!rateLimitResult.success) {
          resolve(rateLimitResult);
          return;
        }
      }
      
      // Validate headers
      let headersData: any = undefined;
      if (options.headersSchema) {
        const headersResult = validateHeaders(options.headersSchema, request);
        if (!headersResult.success) {
          resolve(headersResult);
          return;
        }
        headersData = headersResult.data;
      }
      
      // Validate query parameters
      let queryData: any = undefined;
      if (options.querySchema) {
        const queryResult = validateQueryParams(options.querySchema, request);
        if (!queryResult.success) {
          resolve(queryResult);
          return;
        }
        queryData = queryResult.data;
      }
      
      // Validate request body
      let bodyData: T | undefined = undefined;
      if (options.bodySchema) {
        const body = await request.json();
        const bodyResult = validateInput(options.bodySchema, body);
        if (!bodyResult.success) {
          resolve({
            success: false,
            response: NextResponse.json(
              { 
                error: 'Validation failed',
                details: (bodyResult as any).errors 
              },
              { status: 400 }
            )
          });
          return;
        }
        bodyData = bodyResult.data;
      }
      
      resolve({
        success: true,
        data: bodyData,
        query: queryData,
        headers: headersData
      } as { success: true; data?: T; query?: any; headers?: any });
      
    } catch (error) {
      resolve({
        success: false,
        response: NextResponse.json(
          { error: 'Request validation failed' },
          { status: 400 }
        )
      });
    }
  });
}
