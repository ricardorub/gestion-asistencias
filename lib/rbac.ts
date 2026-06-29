import { auth } from "./auth";
import { AppError } from "./errors";

/**
 * Verifica que haya una sesión válida y la devuelve.
 * Defensa real de autorización: se llama dentro de CADA Server Action y
 * Route Handler protegido, porque las Server Functions son alcanzables por
 * POST directo (no basta con el proxy).
 */
export async function requireTeacher() {
  const session = await auth();
  if (!session?.user) {
    throw new AppError("UNAUTHENTICATED", "No autenticado.");
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    throw new AppError("UNAUTHENTICATED", "No autenticado.");
  }
  if (session.user.role !== "ADMIN") {
    throw new AppError("FORBIDDEN", "No tienes permisos de administrador.");
  }
  return session;
}

