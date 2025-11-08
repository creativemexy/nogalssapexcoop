import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Auth0Provider from "next-auth/providers/auth0";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTOTPToken } from "@/lib/utils";

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
        totp: { label: "2FA Code", type: "text" }
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
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
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
        }
      } else if (user) {
        // Handle credentials login
        token.role = (user as any).role;
        token.id = user.id;
        token.cooperativeId = (user as any).cooperativeId;
        token.businessId = (user as any).businessId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).cooperativeId = token.cooperativeId;
        (session.user as any).businessId = token.businessId;
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