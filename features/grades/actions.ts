"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/rbac";
import { toActionError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { ok, type ActionResult } from "@/lib/result";
import { saveCategoriesSchema, upsertGradeSchema, saveAllGradesSchema } from "./schema";
import * as service from "./service";

export async function saveCategoriesAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireTeacher();
    const parsed = saveCategoriesSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ?? "Datos inválidos.",
      };
    }
    await service.saveCategories(
      session.user.id,
      parsed.data.courseId,
      parsed.data.categories,
    );
    await recordAudit({
      userId: session.user.id,
      action: "grade.categories.save",
      entity: "GradeCategory",
      entityId: parsed.data.courseId,
      metadata: { count: parsed.data.categories.length },
    });
    revalidatePath(`/cursos/${parsed.data.courseId}`);
    return ok(undefined);
  } catch (e) {
    return toActionError(e);
  }
}

export async function upsertGradeAction(
  input: unknown,
): Promise<ActionResult<{ average: number | null }>> {
  try {
    const session = await requireTeacher();
    const parsed = upsertGradeSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Nota inválida.",
      };
    }
    await service.upsertGrade(session.user.id, parsed.data);
    await recordAudit({
      userId: session.user.id,
      action: "grade.upsert",
      entity: "Grade",
      entityId: parsed.data.studentId,
      metadata: {
        gradeCategoryId: parsed.data.gradeCategoryId,
        score: parsed.data.score,
      },
    });
    return ok({ average: null });
  } catch (e) {
    return toActionError(e);
  }
}

export async function saveAllGradesAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireTeacher();
    const parsed = saveAllGradesSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Datos de notas inválidos.",
      };
    }

    await service.saveAllGrades(
      session.user.id,
      parsed.data.courseId,
      parsed.data.grades,
    );

    await recordAudit({
      userId: session.user.id,
      action: "grade.bulk.save",
      entity: "Course",
      entityId: parsed.data.courseId,
      metadata: { count: parsed.data.grades.length },
    });

    revalidatePath(`/cursos/${parsed.data.courseId}`);
    return ok(undefined);
  } catch (e) {
    return toActionError(e);
  }
}

