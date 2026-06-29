"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/rbac";
import { toActionError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { ok, type ActionResult } from "@/lib/result";
import { enrollSchema, removeEnrollmentSchema } from "./schema";
import * as service from "./service";

export interface AvailableStudent {
  id: string;
  code: string;
  fullName: string;
}

export async function getAvailableStudentsAction(
  courseId: string,
  q?: string,
): Promise<ActionResult<AvailableStudent[]>> {
  try {
    const session = await requireTeacher();
    const students = await service.getAvailableStudents(
      session.user.id,
      courseId,
      q,
    );
    return ok(
      students.map((s) => ({
        id: s.id,
        code: s.code,
        fullName: `${s.paternalName} ${s.maternalName ?? ""}, ${s.name}`.trim(),
      })),
    );
  } catch (e) {
    return toActionError(e);
  }
}

export async function enrollStudentsAction(
  input: unknown,
): Promise<ActionResult<{ enrolled: number }>> {
  try {
    const session = await requireTeacher();
    const parsed = enrollSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos." };
    }
    const result = await service.enrollStudents(
      session.user.id,
      parsed.data.courseId,
      parsed.data.studentIds,
    );
    await recordAudit({
      userId: session.user.id,
      action: "enrollment.create",
      entity: "Enrollment",
      entityId: parsed.data.courseId,
      metadata: { enrolled: result.enrolled },
    });
    revalidatePath(`/cursos/${parsed.data.courseId}`);
    return ok(result);
  } catch (e) {
    return toActionError(e);
  }
}

export async function removeEnrollmentAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireTeacher();
    const parsed = removeEnrollmentSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos." };
    }
    await service.removeStudent(
      session.user.id,
      parsed.data.courseId,
      parsed.data.studentId,
    );
    await recordAudit({
      userId: session.user.id,
      action: "enrollment.remove",
      entity: "Enrollment",
      entityId: parsed.data.courseId,
      metadata: { studentId: parsed.data.studentId },
    });
    revalidatePath(`/cursos/${parsed.data.courseId}`);
    return ok(undefined);
  } catch (e) {
    return toActionError(e);
  }
}
