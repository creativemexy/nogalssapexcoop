import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
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

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          cooperativeId: user.cooperativeId ?? null,
          leaderId: (user as any).leaderId ?? null,
          apexId: (user as any).apexId ?? null,
          businessId: user.businessId ?? null,
        };
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Use type assertion to extend user with custom properties
        const customUser = user as typeof user & {
          role?: string;
          cooperativeId?: string | null;
          leaderId?: string | null;
          apexId?: string | null;
          businessId?: string | null;
        };
        token.role = customUser.role;
        token.cooperativeId = customUser.cooperativeId;
        token.leaderId = customUser.leaderId;
        token.apexId = customUser.apexId;
        token.businessId = customUser.businessId;
      }
      
      // Handle impersonation updates
      if (trigger === 'update' && token.impersonating) {
        // When impersonating, we'll update the token with the target user's data
        // This will be handled by the impersonation API
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // TypeScript fix: add 'id' to session.user via type assertion
        // TypeScript fix: add custom properties to session.user via type assertion
        (session.user as typeof session.user & {
          id?: string;
          role?: string;
          cooperativeId?: string | null;
          leaderId?: string | null;
          apexId?: string | null;
          businessId?: string | null;
          impersonating?: boolean;
          originalAdmin?: {
            id: string;
            email: string;
          };
        }).id = token.sub as string;

        (session.user as typeof session.user & { role?: string }).role = token.role as string | undefined;
        (session.user as typeof session.user & { cooperativeId?: string | null }).cooperativeId = token.cooperativeId as string | null | undefined;
        (session.user as typeof session.user & { leaderId?: string | null }).leaderId = token.leaderId as string | null | undefined;
        (session.user as typeof session.user & { apexId?: string | null }).apexId = token.apexId as string | null | undefined;
        (session.user as typeof session.user & { businessId?: string | null }).businessId = token.businessId as string | null | undefined;
        (session.user as typeof session.user & { impersonating?: boolean }).impersonating = token.impersonating as boolean | undefined;
        (session.user as typeof session.user & { originalAdmin?: any }).originalAdmin = token.originalAdmin as any;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  }
};