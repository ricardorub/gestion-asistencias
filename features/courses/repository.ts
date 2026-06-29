import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CourseFilterDTO,
  CreateCourseDTO,
  UpdateCourseDTO,
} from "./schema";

function buildWhere(
  teacherId: string,
  f: Pick<CourseFilterDTO, "q">,
): Prisma.CourseWhereInput {
  return {
    teacherId,
    deletedAt: null,
    ...(f.q
      ? {
          OR: [
            { name: { contains: f.q, mode: "insensitive" } },
            { code: { contains: f.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function findCourses(teacherId: string, f: CourseFilterDTO) {
  const where = buildWhere(teacherId, f);

  const [items, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      orderBy: { [f.sortBy]: f.sortDir },
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
      include: { _count: { select: { enrollments: true } } },
    }),
    prisma.course.count({ where }),
  ]);

  return { items, total, page: f.page, pageSize: f.pageSize };
}

export function findCourseById(teacherId: string, id: string) {
  return prisma.course.findFirst({
    where: { id, teacherId, deletedAt: null },
    include: { _count: { select: { enrollments: true } } },
  });
}

export function findByCode(teacherId: string, code: string) {
  return prisma.course.findFirst({
    where: { teacherId, code, deletedAt: null },
    select: { id: true },
  });
}

export function createCourse(teacherId: string, data: CreateCourseDTO) {
  return prisma.course.create({
    data: {
      ...data,
      description: data.description || null,
      teacherId,
    },
  });
}

export function updateCourse({ id, ...data }: UpdateCourseDTO) {
  return prisma.course.update({
    where: { id },
    data: { ...data, description: data.description || null },
  });
}

export function softDeleteCourse(id: string) {
  return prisma.course.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export function countOpenSessions(courseId: string) {
  return prisma.attendanceSession.count({
    where: { courseId, status: "OPEN" },
  });
}
