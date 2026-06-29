import { prisma } from "@/lib/prisma";

export function listEnrolledStudents(courseId: string) {
  return prisma.enrollment.findMany({
    where: { courseId },
    orderBy: { student: { paternalName: "asc" } },
    include: { student: true },
  });
}

/** Alumnos del profesor que NO están matriculados en el curso. */
export function listAvailableStudents(
  teacherId: string,
  courseId: string,
  q?: string,
) {
  return prisma.student.findMany({
    where: {
      teacherId,
      deletedAt: null,
      enrollments: { none: { courseId } },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { paternalName: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { paternalName: "asc" },
    take: 100,
  });
}

/** Devuelve los ids (de los pasados) que realmente pertenecen al profesor. */
export async function filterOwnedStudentIds(
  teacherId: string,
  studentIds: string[],
) {
  const rows = await prisma.student.findMany({
    where: { teacherId, deletedAt: null, id: { in: studentIds } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export function enrollMany(courseId: string, studentIds: string[]) {
  return prisma.enrollment.createMany({
    data: studentIds.map((studentId) => ({ courseId, studentId })),
    skipDuplicates: true,
  });
}

export function removeEnrollment(courseId: string, studentId: string) {
  // Hard delete: permite re-matricular y no orfana asistencias/notas.
  return prisma.enrollment.deleteMany({ where: { courseId, studentId } });
}
