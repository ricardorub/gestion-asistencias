import { prisma } from "@/lib/prisma";

/** Conteos base del profesor (cursos, alumnos, matrículas activas). */
export function countCourses(teacherId: string) {
  return prisma.course.count({ where: { teacherId, deletedAt: null } });
}

export function countStudents(teacherId: string) {
  return prisma.student.count({ where: { teacherId, deletedAt: null } });
}

export function countActiveEnrollments(teacherId: string) {
  return prisma.enrollment.count({
    where: { deletedAt: null, course: { teacherId, deletedAt: null } },
  });
}

/** Distribución global de asistencia por estado. */
export function attendanceByStatus(teacherId: string) {
  return prisma.attendance.groupBy({
    by: ["status"],
    where: { session: { course: { teacherId } } },
    _count: { _all: true },
  });
}

/** Últimas sesiones con sus marcas, para la tendencia de asistencia. */
export function recentSessions(teacherId: string, take = 8) {
  return prisma.attendanceSession.findMany({
    where: { course: { teacherId, deletedAt: null } },
    orderBy: { startedAt: "desc" },
    take,
    select: {
      id: true,
      startedAt: true,
      course: { select: { name: true } },
      attendances: { select: { status: true } },
    },
  });
}

/** Cursos con categorías y matrículas, para calcular aprobación. */
export function coursesWithGradeData(teacherId: string) {
  return prisma.course.findMany({
    where: { teacherId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      passingGrade: true,
      gradeCategories: {
        where: { deletedAt: null },
        select: { id: true, percentage: true },
      },
      enrollments: {
        where: { deletedAt: null },
        select: { studentId: true },
      },
    },
  });
}

/** Todas las notas del profesor (con su curso y peso), para el cálculo de promedios. */
export function gradesForTeacher(teacherId: string) {
  return prisma.grade.findMany({
    where: { gradeCategory: { course: { teacherId, deletedAt: null } } },
    select: {
      studentId: true,
      score: true,
      gradeCategory: { select: { id: true, courseId: true } },
    },
  });
}

/** Asistencia por curso y estado (groupBy de Prisma no cruza relaciones). */
export function attendanceByCourse(teacherId: string) {
  return prisma.$queryRaw<
    { courseId: string; status: string; count: bigint }[]
  >`
    SELECT c."id" AS "courseId", a."status" AS "status", COUNT(*) AS "count"
    FROM "Attendance" a
    JOIN "AttendanceSession" s ON s."id" = a."attendanceSessionId"
    JOIN "Course" c ON c."id" = s."courseId"
    WHERE c."teacherId" = ${teacherId} AND c."deletedAt" IS NULL
    GROUP BY c."id", a."status"
  `;
}
