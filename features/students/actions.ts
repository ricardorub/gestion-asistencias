"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/rbac";
import { toActionError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { ok, type ActionResult } from "@/lib/result";
import {
  createStudentSchema,
  updateStudentSchema,
  type CreateStudentDTO,
} from "./schema";
import * as service from "./service";
import { parseStudentRows } from "./import";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB

export async function createStudentAction(
  input: CreateStudentDTO,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTeacher();
    const parsed = createStudentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const student = await service.createStudent(session.user.id, parsed.data);
    await recordAudit({
      userId: session.user.id,
      action: "student.create",
      entity: "Student",
      entityId: student.id,
      metadata: { code: parsed.data.code },
    });
    revalidatePath("/alumnos");
    if (parsed.data.enrollInCourseId) {
      revalidatePath(`/cursos/${parsed.data.enrollInCourseId}`);
    }
    return ok({ id: student.id });
  } catch (e) {
    return toActionError(e);
  }
}

export async function updateStudentAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireTeacher();
    const parsed = updateStudentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Datos inválidos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }
    const student = await service.updateStudent(session.user.id, parsed.data);
    await recordAudit({
      userId: session.user.id,
      action: "student.update",
      entity: "Student",
      entityId: student.id,
      metadata: { code: parsed.data.code },
    });
    revalidatePath("/alumnos");
    return ok({ id: student.id });
  } catch (e) {
    return toActionError(e);
  }
}

export async function importStudentsAction(
  formData: FormData,
): Promise<ActionResult<service.ImportReport>> {
  try {
    const session = await requireTeacher();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Selecciona un archivo .xlsx." };
    }
    if (file.size > MAX_IMPORT_BYTES) {
      return { ok: false, error: "El archivo supera el límite de 2 MB." };
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return { ok: false, error: "El formato debe ser .xlsx (Excel)." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = await parseStudentRows(buffer);
    if (rows.length === 0) {
      return { ok: false, error: "El archivo no contiene filas de alumnos." };
    }

    const report = await service.importStudents(session.user.id, rows);
    await recordAudit({
      userId: session.user.id,
      action: "student.import",
      entity: "Student",
      metadata: {
        total: report.total,
        created: report.created,
        errors: report.errors.length,
      },
    });
    revalidatePath("/alumnos");
    return ok(report);
  } catch (e) {
    return toActionError(e);
  }
}
export async function deleteStudentAction(
  id: string,
): Promise<ActionResult> {
  try {
    const session = await requireTeacher();
    await service.deleteStudent(session.user.id, id);
    await recordAudit({
      userId: session.user.id,
      action: "student.delete",
      entity: "Student",
      entityId: id,
    });
    revalidatePath("/alumnos");
    return ok(undefined);
  } catch (e) {
    return toActionError(e);
  }
}
