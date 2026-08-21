import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;
        if (user.isBlocked) {
          throw new Error("Your account has been suspended by administration.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }: any) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.avatar = (user as any).avatar && (user as any).avatar.startsWith("data:") ? null : (user as any).avatar;
        token.guideStatus = (user as any).guideStatus;
        token.walletAddress = (user as any).walletAddress;
      }
      if (trigger === "update" && session) {
        if (session.walletAddress !== undefined) {
          token.walletAddress = session.walletAddress;
        }
        if (session.name !== undefined) token.name = session.name;
        if (session.role !== undefined) token.role = session.role;
        if (session.avatar !== undefined) token.avatar = session.avatar;
      }
      // Always fetch the freshest user role, guideStatus and walletAddress from the database
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true, avatar: true, guideStatus: true, isBlocked: true, walletAddress: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.avatar = dbUser.avatar && dbUser.avatar.startsWith("data:") ? null : dbUser.avatar;
          token.guideStatus = dbUser.guideStatus;
          token.isBlocked = dbUser.isBlocked;
          token.walletAddress = dbUser.walletAddress;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).avatar = token.avatar;
        (session.user as any).guideStatus = token.guideStatus;
        (session.user as any).isBlocked = token.isBlocked;
        (session.user as any).walletAddress = token.walletAddress;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (user.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (dbUser?.isBlocked) {
          return false;
        }
      }
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "Google User",
              avatar: user.image,
              role: "TOURIST",
            },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
