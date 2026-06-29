import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { assertCourseOwned } from "@/features/courses/service";
import { getEnrolledStudents } from "@/features/enrollments/service";
import * as repo from "./repository";
import type { AttendanceStatusValue, MarkPublicDTO } from "./schema";

export async function openSession(
  teacherId: string,
  courseId: string,
  ttlMinutes: number,
) {
  await assertCourseOwned(teacherId, courseId);

  const existing = await repo.findOpenSessionByCourse(courseId);
  if (existing) {
    throw new AppError(
      "CONFLICT",
      "Ya hay una asistencia abierta para este curso.",
    );
  }

  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  return repo.createSession(courseId, repo.newCode(), expiresAt);
}

/** Verifica que la sesión pertenezca a un curso del profesor. */
async function assertSessionOwned(teacherId: string, sessionId: string) {
  const session = await repo.getSession(sessionId);
  if (!session) throw new AppError("NOT_FOUND", "Sesión no encontrada.");
  await assertCourseOwned(teacherId, session.courseId);
  return session;
}

export async function closeSession(teacherId: string, sessionId: string) {
  const session = await assertSessionOwned(teacherId, sessionId);
  // Al cerrar, los matriculados que no marcaron quedan como FALTA.
  await repo.markRemainingAbsent(sessionId, session.courseId);
  return repo.closeSession(sessionId);
}

export async function correctAttendance(
  teacherId: string,
  sessionId: string,
  studentId: string,
  status: AttendanceStatusValue,
) {
  await assertSessionOwned(teacherId, sessionId);
  return repo.upsertAttendance(sessionId, studentId, status, "MANUAL");
}

/**
 * Marcado público del alumno. Ejecuta las 6 validaciones del flujo.
 * No requiere sesión de usuario; el rate limiting va en el Route Handler.
 */
export async function markAttendancePublic(data: MarkPublicDTO) {
  // 1) Código válido y vigente
  const session = await repo.findLiveSessionByCode(data.attendanceCode);
  if (!session) {
    throw new AppError("NOT_FOUND", "Código inválido o expirado.");
  }

  // 2) Curso de la sesión
  const course = await repo.findCourseForSession(session.courseId);
  if (!course) {
    throw new AppError("NOT_FOUND", "El curso ya no está disponible.");
  }

  // 3) Alumno existente (código único por profesor dueño del curso)
  const student = await repo.findStudentByCode(
    course.teacherId,
    data.studentCode,
  );
  if (!student) {
    throw new AppError("NOT_FOUND", "Alumno no encontrado.");
  }

  // 4) Matrícula válida en el curso
  const enrollment = await repo.findEnrollment(student.id, course.id);
  if (!enrollment) {
    throw new AppError("FORBIDDEN", "No estás matriculado en este curso.");
  }

  // 5) Registrar (6) anti-duplicado vía índice único; P2002 → ya marcó
  try {
    await repo.createAttendance(session.id, student.id, "PRESENT", "PUBLIC");
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      throw new AppError("CONFLICT", "Ya registraste tu asistencia.");
    }
    logger.error("attendance.mark.failed", { sessionId: session.id });
    throw new AppError("CONFLICT", "No se pudo registrar la asistencia.");
  }

  return {
    courseName: course.name,
    studentName: `${student.name} ${student.paternalName}`,
  };
}

// ───────── Vistas para el profesor ─────────

export interface SessionStudentRow {
  studentId: string;
  code: string;
  fullName: string;
  status: AttendanceStatusValue | null;
  source: "PUBLIC" | "MANUAL" | null;
}

export interface LiveSessionView {
  session: {
    id: string;
    code: string;
    startedAt: Date;
    expiresAt: Date;
  } | null;
  students: SessionStudentRow[];
  counts: { present: number; late: number; absent: number; pending: number };
}

export async function getSessionView(
  teacherId: string,
  courseId: string,
): Promise<LiveSessionView> {
  await assertCourseOwned(teacherId, courseId);

  const open = await repo.findOpenSessionByCourse(courseId);
  const enrollments = await getEnrolledStudents(teacherId, courseId);

  const attendanceMap = new Map<
    string,
    { status: AttendanceStatusValue; source: "PUBLIC" | "MANUAL" }
  >();
  if (open) {
    const attendances = await repo.getAttendances(open.id);
    for (const a of attendances) {
      attendanceMap.set(a.studentId, {
        status: a.status as AttendanceStatusValue,
        source: a.source as "PUBLIC" | "MANUAL",
      });
    }
  }

  const students: SessionStudentRow[] = enrollments.map((e) => {
    const att = attendanceMap.get(e.studentId);
    return {
      studentId: e.studentId,
      code: e.student.code,
      fullName:
        `${e.student.paternalName} ${e.student.maternalName ?? ""}, ${e.student.name}`.trim(),
      status: att?.status ?? null,
      source: att?.source ?? null,
    };
  });

  const counts = { present: 0, late: 0, absent: 0, pending: 0 };
  for (const s of students) {
    if (s.status === "PRESENT") counts.present++;
    else if (s.status === "LATE") counts.late++;
    else if (s.status === "ABSENT") counts.absent++;
    else counts.pending++;
  }

  return {
    session: open
      ? {
          id: open.id,
          code: open.code,
          startedAt: open.startedAt,
          expiresAt: open.expiresAt,
        }
      : null,
    students,
    counts,
  };
}

export interface SessionHistoryItem {
  id: string;
  startedAt: Date;
  status: "OPEN" | "CLOSED";
  present: number;
  late: number;
  absent: number;
  total: number;
}

export async function getSessionHistory(
  teacherId: string,
  courseId: string,
): Promise<SessionHistoryItem[]> {
  await assertCourseOwned(teacherId, courseId);
  const sessions = await repo.listSessions(courseId);

  return sessions.map((s) => {
    const present = s.attendances.filter((a) => a.status === "PRESENT").length;
    const late = s.attendances.filter((a) => a.status === "LATE").length;
    const absent = s.attendances.filter((a) => a.status === "ABSENT").length;
    return {
      id: s.id,
      startedAt: s.startedAt,
      status: s.status as "OPEN" | "CLOSED",
      present,
      late,
      absent,
      total: s._count.attendances,
    };
  });
}

import { saveAttendanceSchema, type SaveAttendanceDTO } from "./schema";

export async function saveAttendance(teacherId: string, data: SaveAttendanceDTO) {
  await assertCourseOwned(teacherId, data.courseId);

  // Create session expiring in 2 hours
  const expiresAt = new Date(Date.now() + 120 * 60_000);
  const session = await repo.createSession(data.courseId, repo.newCode(), expiresAt);

  // Upsert all marks
  for (const m of data.marks) {
    await repo.upsertAttendance(session.id, m.studentId, m.status, "MANUAL");
  }

  // Mark remaining absent
  await repo.markRemainingAbsent(session.id, data.courseId);

  // Close session immediately
  await repo.closeSession(session.id);

  return session;
}
