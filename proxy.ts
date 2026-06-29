import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next.js 16: el antiguo "middleware" ahora se llama "proxy".
// Hace chequeos optimistas (redirige a /login). La autorización real
// se valida en cada Server Action / Route Handler (ver lib/rbac.ts).
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!api/auth|api/attendance|asistencia|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
