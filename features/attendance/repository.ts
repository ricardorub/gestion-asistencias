import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";
import type { AttendanceStatusValue } from "./schema";

// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I).
const genCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export function newCode() {
  return genCode();
}

export function createSession(
  courseId: string,
  code: string,
  expiresAt: Date,
) {
  return prisma.attendanceSession.create({
    data: { courseId, code, expiresAt, status: "OPEN" },
  });
}

/** Sesión OPEN del curso (independiente de expiración, para la vista del profesor). */
export function findOpenSessionByCourse(courseId: string) {
  return prisma.attendanceSession.findFirst({
    where: { courseId, status: "OPEN" },
  });
}

/** Sesión vigente por código (OPEN y no expirada), para el marcado público. */
export function findLiveSessionByCode(code: string) {
  return prisma.attendanceSession.findFirst({
    where: { code, status: "OPEN", expiresAt: { gt: new Date() } },
  });
}

export function getSession(sessionId: string) {
  return prisma.attendanceSession.findUnique({ where: { id: sessionId } });
}

export function getAttendances(sessionId: string) {
  return prisma.attendance.findMany({
    where: { attendanceSessionId: sessionId },
  });
}

export function closeSession(sessionId: string) {
  return prisma.attendanceSession.update({
    where: { id: sessionId },
    data: { status: "CLOSED" },
  });
}

export function createAttendance(
  sessionId: string,
  studentId: string,
  status: AttendanceStatusValue,
  source: "PUBLIC" | "MANUAL",
) {
  return prisma.attendance.create({
    data: { attendanceSessionId: sessionId, studentId, status, source },
  });
}

export function upsertAttendance(
  sessionId: string,
  studentId: string,
  status: AttendanceStatusValue,
  source: "PUBLIC" | "MANUAL",
) {
  return prisma.attendance.upsert({
    where: {
      attendanceSessionId_studentId: {
        attendanceSessionId: sessionId,
        studentId,
      },
    },
    create: {
      attendanceSessionId: sessionId,
      studentId,
      status,
      source,
    },
    update: { status, source },
  });
}

/** Marca ABSENT a los matriculados que no tienen registro en la sesión. */
export function markRemainingAbsent(sessionId: string, courseId: string) {
  return prisma.$executeRaw`
    INSERT INTO "Attendance" ("id", "attendanceSessionId", "studentId", "status", "source", "registeredAt")
    SELECT gen_random_uuid()::text, ${sessionId}, e."studentId", 'ABSENT', 'MANUAL', now()
    FROM "Enrollment" e
    WHERE e."courseId" = ${courseId}
      AND NOT EXISTS (
        SELECT 1 FROM "Attendance" a
        WHERE a."attendanceSessionId" = ${sessionId}
          AND a."studentId" = e."studentId"
      )
  `;
}

export function findCourseForSession(courseId: string) {
  return prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: { id: true, name: true, teacherId: true },
  });
}

export function findStudentByCode(teacherId: string, code: string) {
  return prisma.student.findFirst({
    where: { teacherId, code, deletedAt: null },
    select: { id: true, name: true, paternalName: true },
  });
}

export function findEnrollment(studentId: string, courseId: string) {
  return prisma.enrollment.findFirst({
    where: { studentId, courseId },
    select: { id: true },
  });
}

export function listSessions(courseId: string, take = 20) {
  return prisma.attendanceSession.findMany({
    where: { courseId },
    orderBy: { startedAt: "desc" },
    take,
    include: {
      _count: { select: { attendances: true } },
      attendances: { select: { status: true } },
    },
  });
}
