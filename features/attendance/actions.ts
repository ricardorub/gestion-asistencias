"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/rbac";
import { toActionError } from "@/lib/errors";
import { recordAudit } from "@/lib/audit";
import { ok, type ActionResult } from "@/lib/result";
import {
  openSessionSchema,
  closeSessionSchema,
  correctAttendanceSchema,
} from "./schema";
import * as service from "./service";

export async function openSessionAction(
  input: unknown,
): Promise<ActionResult<{ id: string; code: string }>> {
  try {
    const session = await requireTeacher();
    const parsed = openSessionSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Datos inválidos." };

    const created = await service.openSession(
      session.user.id,
      parsed.data.courseId,
      parsed.data.ttlMinutes,
    );
    await recordAudit({
      userId: session.user.id,
      action: "attendance.session.open",
      entity: "AttendanceSession",
      entityId: created.id,
      metadata: { courseId: parsed.data.courseId },
    });
    revalidatePath(`/cursos/${parsed.data.courseId}`);
    return ok({ id: created.id, code: created.code });
  } catch (e) {
    return toActionError(e);
  }
}

export async function closeSessionAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireTeacher();
    const parsed = closeSessionSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Datos inválidos." };

    await service.closeSession(session.user.id, parsed.data.sessionId);
    await recordAudit({
      userId: session.user.id,
      action: "attendance.session.close",
      entity: "AttendanceSession",
      entityId: parsed.data.sessionId,
      metadata: { courseId: parsed.data.courseId },
    });
    revalidatePath(`/cursos/${parsed.data.courseId}`);
    return ok(undefined);
  } catch (e) {
    return toActionError(e);
  }
}

export async function correctAttendanceAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireTeacher();
    const parsed = correctAttendanceSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Datos inválidos." };

    await service.correctAttendance(
      session.user.id,
      parsed.data.sessionId,
      parsed.data.studentId,
      parsed.data.status,
    );
    await recordAudit({
      userId: session.user.id,
      action: "attendance.correct",
      entity: "Attendance",
      entityId: parsed.data.sessionId,
      metadata: {
        studentId: parsed.data.studentId,
        status: parsed.data.status,
      },
    });
    return ok(undefined);
  } catch (e) {
    return toActionError(e);
  }
}

import { saveAttendanceSchema } from "./schema";

export async function saveAttendanceAction(
  input: unknown,
): Promise<ActionResult> {
  try {
    const session = await requireTeacher();
    const parsed = saveAttendanceSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Datos inválidos." };

    await service.saveAttendance(session.user.id, parsed.data);
    await recordAudit({
      userId: session.user.id,
      action: "attendance.save_batch",
      entity: "AttendanceSession",
      metadata: { courseId: parsed.data.courseId },
    });
    revalidatePath(`/cursos/${parsed.data.courseId}`);
    return ok(undefined);
  } catch (e) {
    return toActionError(e);
  }
}
