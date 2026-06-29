"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/rbac";
import { toActionError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { ok, type ActionResult } from "@/lib/result";
import { createCourseSchema, updateCourseSchema } from "./schema";
import * as service from "./service";

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
