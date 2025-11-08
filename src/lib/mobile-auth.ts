import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { decode } from 'next-auth/jwt';

/**
 * Authenticate request from mobile app (NextAuth JWT) or web app (NextAuth session)
 * Returns user info in NextAuth session format for compatibility
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  id: string;
  role: string;
  cooperativeId?: string | null;
  email?: string;
} | null> {
  // First, try to get NextAuth JWT token from Authorization header (mobile app)
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Decode NextAuth JWT token
      const decoded = await decode({
        token: token,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      
      if (decoded && decoded.id) {
        return {
          id: decoded.id as string,
          role: decoded.role as string,
          cooperativeId: decoded.cooperativeId as string | null | undefined,
          email: decoded.email as string | undefined,
        };
      }
    } catch (error) {
      console.error('NextAuth JWT token verification failed:', error);
      // Fall through to try NextAuth session
    }
  }
  
  // Fallback to NextAuth session (web app)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return {
        id: (session.user as any).id,
        role: (session.user as any).role,
        cooperativeId: (session.user as any).cooperativeId,
        email: session.user.email || undefined,
      };
    }
  } catch (error) {
    console.error('NextAuth session check failed:', error);
  }
  
  return null;
}

