import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Auth0Provider from "next-auth/providers/auth0";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTOTPToken } from "@/lib/utils";
import { SessionManager } from "@/lib/session-manager";
import {
  isAccountLocked,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
  getRemainingLockoutTime,
  getFailedLoginAttempts,
} from "@/lib/account-lockout";
import {
  isPasswordExpired,
  getPasswordExpirationStatus,
} from "@/lib/password-expiration";
import {
  verifyCaptcha,
  isCaptchaRequired,
} from "@/lib/captcha";

export const authOptions: NextAuthOptions = {
  providers: [
    // Auth0 Provider (shared identity for web and mobile)
    ...(process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET && process.env.AUTH0_ISSUER
      ? [
          Auth0Provider({
            clientId: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET,
            issuer: process.env.AUTH0_ISSUER,
            authorization: {
              params: {
                scope: "openid profile email",
              },
            },
          }),
        ]
      : []),
    // Credentials Provider (for direct email/password login)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email, Phone, or NIN", type: "text" },
        password: { label: "Password", type: "password" },
        totp: { label: "2FA Code", type: "text" },
        captchaToken: { label: "CAPTCHA Token", type: "text" }
      },
      async authorize(credentials) {
        try {
          console.log('Auth attempt:', {
            emailOrPhoneOrNin: credentials?.email,
            hasPassword: !!credentials?.password,
            hasTotp: !!credentials?.totp,
            totpValue: credentials?.totp
          });
          
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Check if input is email, phone, or NIN and find user accordingly
          const isEmail = credentials.email.includes('@');
          const isPhone = /^(\+?234|0)?[789][01]\d{8}$/.test(credentials.email); // Nigerian phone number pattern
          const isNIN = /^\d{11}$/.test(credentials.email); // NIN is 11 digits
          let user;
          
          if (isEmail) {
            // Login with email
            user = await prisma.user.findUnique({
              where: {
                email: credentials.email
              }
            });
          } else if (isPhone) {
            // Login with phone number
            // Normalize phone number format
            let normalizedPhone = credentials.email;
            if (normalizedPhone.startsWith('+234')) {
              normalizedPhone = '0' + normalizedPhone.substring(4);
            } else if (normalizedPhone.startsWith('234')) {
              normalizedPhone = '0' + normalizedPhone.substring(3);
            }
            
            user = await prisma.user.findFirst({
              where: {
                phoneNumber: normalizedPhone
              }
            });
          } else if (isNIN) {
            // Login with NIN
            user = await prisma.user.findFirst({
              where: {
                nin: credentials.email
              }
            });
          } else {
            console.log('Invalid login format:', credentials.email);
            return null;
          }

          if (!user || !user.password) {
            // Don't reveal if user exists for security
            return null;
          }

          // Check if account is locked
          const accountLocked = await isAccountLocked(user.id);
          if (accountLocked) {
            const remainingMinutes = await getRemainingLockoutTime(user.id);
            throw new Error(
              `Account locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s) or contact support.`
            );
          }

          // Check if CAPTCHA is required and verify it
          const failedAttempts = await getFailedLoginAttempts(user.id);
          const captchaRequired = await isCaptchaRequired(user.id, failedAttempts);
          
          if (captchaRequired) {
            if (!credentials.captchaToken) {
              throw new Error('CAPTCHA_REQUIRED');
            }
            
            const captchaValid = await verifyCaptcha(credentials.captchaToken);
            if (!captchaValid) {
              // Record failed attempt for invalid CAPTCHA
              await recordFailedLoginAttempt(user.id);
              throw new Error('Invalid CAPTCHA. Please try again.');
            }
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            // Record failed login attempt
            const lockoutResult = await recordFailedLoginAttempt(user.id);
            
            if (lockoutResult.isLocked) {
              const remainingMinutes = Math.ceil(
                (lockoutResult.lockoutUntil!.getTime() - new Date().getTime()) / (1000 * 60)
              );
              throw new Error(
                `Too many failed login attempts. Account locked for ${remainingMinutes} minute(s). Please try again later or contact support.`
              );
            }
            
            // Don't reveal if password is wrong or user doesn't exist (security best practice)
            return null;
          }

          console.log('User 2FA status:', {
            twoFactorEnabled: user.twoFactorEnabled,
            hasSecret: !!user.twoFactorSecret,
            secretValue: user.twoFactorSecret ? 'present' : 'null'
          });

          // Check if user has 2FA enabled
          if (user.twoFactorEnabled) {
            console.log('2FA is enabled, checking for TOTP code...');
            // If 2FA is enabled, TOTP code is REQUIRED
            if (!credentials.totp) {
              throw new Error('2FA_REQUIRED');
            }

            // Verify the TOTP code
            if (!user.twoFactorSecret) {
              throw new Error('2FA_NOT_SETUP');
            }

            const isTotpValid = verifyTOTPToken(user.twoFactorSecret, credentials.totp);
            console.log('2FA Verification:', {
              secret: user.twoFactorSecret ? 'present' : 'missing',
              token: credentials.totp,
              isValid: isTotpValid
            });
            if (!isTotpValid) {
              throw new Error('2FA_INVALID');
            }
          } else {
            console.log('2FA is NOT enabled for user, checking global 2FA...');
            // Check if global 2FA is enabled
            const global2FASetting = await prisma.setting.findUnique({
              where: { key: 'global_2fa_enabled' }
            });
            
            console.log('Global 2FA setting:', {
              found: !!global2FASetting,
              value: global2FASetting?.value,
              isEnabled: global2FASetting?.value === 'true'
            });

            if (global2FASetting?.value === 'true') {
              // Global 2FA is enabled, user must have 2FA set up
              if (!user.twoFactorEnabled) {
                throw new Error('2FA_REQUIRED_GLOBAL');
              }

              // Verify TOTP code for global 2FA
              if (!credentials.totp) {
                throw new Error('2FA_REQUIRED');
              }

              if (!user.twoFactorSecret) {
                throw new Error('2FA_NOT_SETUP');
              }

              const isTotpValid = verifyTOTPToken(user.twoFactorSecret, credentials.totp);
              console.log('Global 2FA Verification:', {
                secret: user.twoFactorSecret ? 'present' : 'missing',
                token: credentials.totp,
                isValid: isTotpValid
              });
              if (!isTotpValid) {
                throw new Error('2FA_INVALID');
              }
            }
            // If no 2FA is required, continue with normal login
            console.log('No 2FA required, proceeding with normal login');
          }

          // Reset failed login attempts on successful authentication (after password and 2FA verification)
          await resetFailedLoginAttempts(user.id);

          // Check if password is expired
          const passwordExpired = await isPasswordExpired(user.id);
          if (passwordExpired) {
            const expirationStatus = await getPasswordExpirationStatus(user.id);
            throw new Error(
              `PASSWORD_EXPIRED: Your password has expired. Please change your password to continue. Days expired: ${expirationStatus.daysUntilExpiration ? Math.abs(expirationStatus.daysUntilExpiration) : 'unknown'}`
            );
          }

          console.log('Authentication successful, returning user data');
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            cooperativeId: user.cooperativeId,
            businessId: user.businessId,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          // For 2FA errors, we need to pass them through NextAuth
          if (error instanceof Error && error.message.startsWith('2FA_')) {
            // Return null but store the error in a way NextAuth can access
            return null;
          }
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes in seconds (inactivity timeout)
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      // Handle Auth0 login
      if (account?.provider === 'auth0' && profile) {
        // Find or create user in database from Auth0 profile
        let dbUser = await prisma.user.findUnique({
          where: { email: profile.email as string }
        });
        
        if (!dbUser && profile.email) {
          // Create user from Auth0 profile if doesn't exist
          // You may want to handle this differently based on your requirements
          // Auth0 profile has given_name and family_name, but Profile type doesn't include them
          const auth0Profile = profile as any;
          const nameParts = (profile.name || '').split(' ');
          dbUser = await prisma.user.create({
            data: {
              email: profile.email,
              firstName: auth0Profile.given_name || nameParts[0] || 'User',
              lastName: auth0Profile.family_name || nameParts.slice(1).join(' ') || '',
              password: '', // Auth0 users don't have passwords in our DB
              role: 'MEMBER', // Default role, adjust as needed
              isActive: true,
              isVerified: true,
            }
          });
        }
        
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
          token.cooperativeId = dbUser.cooperativeId;
          token.businessId = dbUser.businessId;
          
          // Create session in database for Auth0 login
          if (account && !token.sessionId) {
            try {
              const sessionInfo = await SessionManager.createSession(
                dbUser.id,
                undefined, // IP address not available in this context
                undefined  // User agent not available in this context
              );
              token.sessionId = sessionInfo.sessionId;
            } catch (error) {
              console.error('Failed to create session for Auth0 user:', error);
            }
          }
        }
      } else if (user) {
        // Handle credentials login
        token.role = (user as any).role;
        token.id = user.id;
        token.cooperativeId = (user as any).cooperativeId;
        token.businessId = (user as any).businessId;
        
        // Create session in database for credentials login
        if (account && !token.sessionId) {
          try {
            const sessionInfo = await SessionManager.createSession(
              user.id,
              undefined, // IP address not available in this context
              undefined  // User agent not available in this context
            );
            token.sessionId = sessionInfo.sessionId;
          } catch (error) {
            console.error('Failed to create session for credentials user:', error);
          }
        }
      }
      
      // On each request, validate and update session expiration
      // Optimized: Only validate if token is close to expiring or hasn't been validated recently
      // This reduces database queries and prevents connection pool exhaustion
      if (token.sessionId && token.id) {
        const now = Math.floor(Date.now() / 1000);
        const tokenExp = (token.exp as number) || 0;
        const timeUntilExpiry = tokenExp - now;
        
        // Only validate session if:
        // 1. Token is expired or expiring soon (within 5 minutes)
        // 2. Or if we haven't validated recently (validate at most once per 5 minutes to reduce DB load)
        const lastValidation = (token.lastSessionValidation as number) || 0;
        const shouldValidate = timeUntilExpiry < 300 || (now - lastValidation) > 300;
        
        if (shouldValidate) {
          try {
            const sessionInfo = await SessionManager.validateSession(token.sessionId as string);
            if (!sessionInfo) {
              // If session validation returned null, it could mean:
              // 1. Session expired/invalid in database
              // 2. Database timeout/connection error
              // Only invalidate if JWT token is also expired or expiring very soon
              // This prevents invalidating valid sessions due to database timeouts
              if (timeUntilExpiry < 60) {
                // JWT is expiring soon or expired, safe to invalidate
                token.sessionId = undefined;
                token.exp = 0; // Force expiration
              } else {
                // JWT is still valid, likely a database timeout - keep session valid
                // Don't update lastValidation so we'll retry validation later
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Session validation returned null but JWT is still valid. Likely a timeout. Keeping session.');
                }
              }
            } else {
              // Update token expiration based on session expiration
              token.exp = Math.floor(sessionInfo.expiresAt.getTime() / 1000);
              token.lastSessionValidation = now; // Track when we last validated
            }
          } catch (error) {
            // If validation fails due to timeout or connection issues, don't invalidate the session
            // Just continue with existing token expiration - the session is still valid based on JWT
            if (error instanceof Error && (
              error.message.includes('connection pool') || 
              error.message.includes('timeout') ||
              error.message.includes('Session validation timeout')
            )) {
              // Silently skip validation on timeout - session is still valid based on JWT expiration
              // Don't update lastValidation so we'll retry later, but don't spam logs
              if (process.env.NODE_ENV === 'development') {
                console.warn('Session validation skipped due to timeout. Will retry later.');
              }
            } else {
              // For other errors, log but don't invalidate session
              console.error('Failed to validate session:', error);
              // Don't invalidate session on validation errors - JWT is still valid
            }
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).cooperativeId = token.cooperativeId;
        (session.user as any).businessId = token.businessId;
        (session.user as any).sessionId = token.sessionId;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // This callback is called before the authorize function
      return true;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
};