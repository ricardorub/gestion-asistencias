"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/rbac";
import { toActionError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { ok, type ActionResult } from "@/lib/result";
import { createCourseSchema, updateCourseSchema } from "./schema";
import * as service from "./service";
import { prisma } from "@/lib/prisma";


export async function createCourseAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTeacher();
    const parsed = createCourseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const course = await service.createCourse(session.user.id, parsed.data);
    await recordAudit({
      userId: session.user.id,
      action: "course.create",
      entity: "Course",
      entityId: course.id,
      metadata: { code: parsed.data.code },
    });
    revalidatePath("/cursos");
    return ok({ id: course.id });
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateCourseAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTeacher();
    const parsed = updateCourseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const course = await service.updateCourse(session.user.id, parsed.data);
    await recordAudit({
      userId: session.user.id,
      action: "course.update",
      entity: "Course",
      entityId: course.id,
      metadata: { code: parsed.data.code },
    });
    revalidatePath("/cursos");
    revalidatePath(`/cursos/${course.id}`);
    return ok({ id: course.id });
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  try {
    const session = await requireTeacher();
    await service.deleteCourse(session.user.id, id);
    await recordAudit({
      userId: session.user.id,
      action: "course.delete",
      entity: "Course",
      entityId: id,
    });
    revalidatePath("/cursos");
    return ok(undefined);
  } catch (e) {
    return toActionError(e);
  }
}

export async function acceptCourseAction(courseId: string): Promise<ActionResult> {
  try {
    // 1. Validamos que el usuario esté autenticado en la sesión
    const session = await requireTeacher();

    // 2. Modificamos el estado en el contenedor de Docker a ACCEPTED
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { status: "ACCEPTED" },
    });

    // 3. Registramos la acción en la bitácora de auditoría del sistema
    await recordAudit({
      userId: session.user.id,
      action: "course.accept",
      entity: "Course",
      entityId: course.id,
      metadata: { name: course.name, code: course.code },
    });

    // 4. Rompemos la caché de manera agresiva para recalcular asistencias, KPI y gráficos al instante
    revalidatePath("/");
    revalidatePath("/cursos");
    revalidatePath(`/cursos/${course.id}`);

    return ok(undefined);
  } catch (e) {
    // Retornamos el error formateado con el gestor nativo de la app
    return toActionError(e);
  }
}