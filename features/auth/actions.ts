"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema, registerSchema } from "./schema";
import type { ActionResult } from "@/lib/result";
import { fail, ok } from "@/lib/result";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { requireAdmin } from "@/lib/rbac";
import { revalidatePath } from "next/cache";

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Datos inválidos.", parsed.error.flatten().fieldErrors);
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return ok(undefined);
  } catch (e) {
    if (e instanceof AuthError) {
      const cause = (e.cause as any)?.err?.message;
      if (cause === "PENDING_APPROVAL") {
        return fail("Tu cuenta está pendiente de aprobación por el administrador.");
      }
      if (cause === "REJECTED_APPROVAL") {
        return fail("Tu solicitud de registro ha sido rechazada.");
      }
      return fail("Correo o contraseña incorrectos.");
    }
    throw e;
  }
}

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Datos inválidos.", parsed.error.flatten().fieldErrors);
  }

  const { name, email, password } = parsed.data;

  try {
    // Verificar si ya existe un usuario con el mismo correo
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return fail("El correo ya está registrado por otro usuario.");
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear el usuario con rol TEACHER y estado PENDING
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "TEACHER",
        status: "PENDING",
      },
    });

    return ok(undefined);
  } catch (e) {
    return fail("Ocurrió un error inesperado al registrar el usuario.");
  }
}

export async function approveUserAction(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.user.update({
      where: { id: userId },
      data: { status: "APPROVED" },
    });
    revalidatePath("/admin");
    return ok(undefined);
  } catch (e) {
    return fail("Error al aprobar el usuario.");
  }
}

export async function rejectUserAction(userId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await prisma.user.update({
      where: { id: userId },
      data: { status: "REJECTED" },
    });
    revalidatePath("/admin");
    return ok(undefined);
  } catch (e) {
    return fail("Error al rechazar el usuario.");
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

