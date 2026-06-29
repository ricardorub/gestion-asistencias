import type { NextAuthConfig } from "next-auth";

/**
 * Configuración edge-safe (sin Prisma ni bcrypt).
 * La usa proxy.ts y se extiende en auth.ts con el provider de credenciales.
 */
const PUBLIC_PREFIXES = ["/login", "/register", "/asistencia", "/api/attendance"];

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isRoot = pathname === "/";
      const isPublic = isRoot || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
      if (isPublic) return true;
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "TEACHER" | "ADMIN";
      }
      return session;
    },
  },
  providers: [],
};
