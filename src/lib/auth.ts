import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { checkLoginAttempt, clearLoginFailures, recordLoginFailure } from "@/lib/login-guard";
import type { AdminRole } from "@/types";

declare module "next-auth" {
  interface Session { user: { id: string; name: string | null; email: string | null; role: AdminRole } }
  interface User { role: AdminRole }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  providers: [Credentials({
    name: "Kredensial admin",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Kata sandi", type: "password" } },
    async authorize(credentials) {
      if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") return null;
      const email = credentials.email.trim().toLowerCase();
      if (!checkLoginAttempt(email)) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      const fallbackHash = "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSm8MZ6Y8v9SXwUZP5l19ClzQbP4eFe";
      const valid = await bcrypt.compare(credentials.password, user?.passwordHash ?? fallbackHash);
      if (!user || !user.active || !valid) { recordLoginFailure(email); return null; }
      clearLoginFailures(email);
      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user) { token.sub = user.id; token.role = user.role; } return token; },
    session({ session, token }) {
      const role = token.role;
      if (typeof token.sub === "string" && (role === "SUPER_ADMIN" || role === "AIRPORT_ADMIN")) {
        session.user.id = token.sub;
        session.user.role = role;
      }
      return session;
    },
  },
  pages: { signIn: "/auth/signin" },
});
