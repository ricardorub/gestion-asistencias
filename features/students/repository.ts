import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateStudentDTO,
  StudentFilterDTO,
  UpdateStudentDTO,
} from "./schema";

function buildWhere(
  teacherId: string,
  f: Pick<StudentFilterDTO, "q" | "status">,
): Prisma.StudentWhereInput {
  return {
    teacherId,
    deletedAt: null,
    ...(f.status ? { status: f.status } : {}),
    ...(f.q
      ? {
          OR: [
            { name: { contains: f.q, mode: "insensitive" } },
            { paternalName: { contains: f.q, mode: "insensitive" } },
            { maternalName: { contains: f.q, mode: "insensitive" } },
            { code: { contains: f.q, mode: "insensitive" } },
            { documentNumber: { contains: f.q } },
          ],
        }
      : {}),
  };
}

export async function findStudents(teacherId: string, f: StudentFilterDTO) {
  const where = buildWhere(teacherId, f);

  const [items, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      orderBy: { [f.sortBy]: f.sortDir },
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return { items, total, page: f.page, pageSize: f.pageSize };
}

/** Todos los alumnos que cumplen el filtro, sin paginar (para exportar). */
export function findStudentsForExport(
  teacherId: string,
  f: Pick<StudentFilterDTO, "q" | "status">,
) {
  return prisma.student.findMany({
    where: buildWhere(teacherId, f),
    orderBy: [{ paternalName: "asc" }, { name: "asc" }],
  });
}

export function findStudentById(teacherId: string, id: string) {
  return prisma.student.findFirst({
    where: { id, teacherId, deletedAt: null },
  });
}

export function findByCode(teacherId: string, code: string) {
  return prisma.student.findFirst({
    where: { teacherId, code, deletedAt: null },
    select: { id: true },
  });
}

export function findByDocument(
  teacherId: string,
  documentType: CreateStudentDTO["documentType"],
  documentNumber: string,
) {
  return prisma.student.findFirst({
    where: { teacherId, documentType, documentNumber, deletedAt: null },
    select: { id: true },
  });
}

function normalize(data: Omit<CreateStudentDTO, "enrollInCourseId">) {
  return {
    ...data,
    maternalName: data.maternalName || null,
    email: data.email || null,
    phone: data.phone || null,
  };
}

export function createStudent(teacherId: string, { enrollInCourseId, ...data }: CreateStudentDTO) {
  return prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: {
        ...normalize(data),
        teacherId,
      },
    });

    if (enrollInCourseId) {
      await tx.enrollment.create({
        data: {
          courseId: enrollInCourseId,
          studentId: student.id,
        },
      });
    }

    return student;
  });
}

export function updateStudent({ id, ...data }: UpdateStudentDTO) {
  return prisma.student.update({ where: { id }, data: normalize(data) });
}

export function softDeleteStudent(id: string) {
  return prisma.student.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
