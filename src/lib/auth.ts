import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTOTPToken } from "@/lib/utils";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "2FA Code", type: "text" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

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

          // Check if user has 2FA enabled
          if (user.twoFactorEnabled) {
            // If 2FA is enabled, TOTP code is required
            if (!credentials.totp) {
              throw new Error('2FA_REQUIRED');
            }

            // Verify the TOTP code
            if (!user.twoFactorSecret) {
              throw new Error('2FA_NOT_SETUP');
            }

            const isTotpValid = verifyTOTPToken(user.twoFactorSecret, credentials.totp);
            if (!isTotpValid) {
              throw new Error('2FA_INVALID');
            }
          } else {
            // Check if global 2FA is enabled
            const global2FASetting = await prisma.setting.findUnique({
              where: { key: 'global_2fa_enabled' }
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
              if (!isTotpValid) {
                throw new Error('2FA_INVALID');
              }
            }
          }

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
          // Re-throw 2FA specific errors
          if (error instanceof Error && error.message.startsWith('2FA_')) {
            throw error;
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
    async jwt({ token, user }) {
      if (user) {
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