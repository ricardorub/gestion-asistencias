import { prisma } from "@/lib/prisma";
import type { CategoryItemDTO } from "./schema";

export function getCategories(courseId: string) {
  return prisma.gradeCategory.findMany({
    where: { courseId, deletedAt: null },
    orderBy: { order: "asc" },
  });
}

/**
 * Reemplaza el set de evaluaciones de un curso de forma atómica:
 * actualiza las existentes, crea las nuevas y elimina (con sus notas) las
 * que el profesor quitó. Acotado por courseId para no tocar otro curso.
 */
export function replaceCategories(courseId: string, items: CategoryItemDTO[]) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.gradeCategory.findMany({
      where: { courseId },
      select: { id: true },
    });
    const incomingIds = new Set(
      items.filter((i) => i.id).map((i) => i.id as string),
    );
    const toDelete = existing
      .filter((e) => !incomingIds.has(e.id))
      .map((e) => e.id);

    if (toDelete.length) {
      await tx.grade.deleteMany({
        where: { gradeCategoryId: { in: toDelete } },
      });
      await tx.gradeCategory.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (const item of items) {
      if (item.id) {
        await tx.gradeCategory.updateMany({
          where: { id: item.id, courseId },
          data: {
            name: item.name,
            percentage: item.percentage,
            order: item.order,
          },
        });
      } else {
        await tx.gradeCategory.create({
          data: {
            courseId,
            name: item.name,
            percentage: item.percentage,
            order: item.order,
          },
        });
      }
    }
  });
}

export function getGrades(courseId: string) {
  return prisma.grade.findMany({
    where: { gradeCategory: { courseId } },
    select: {
      studentId: true,
      gradeCategoryId: true,
      score: true,
      comment: true,
    },
  });
}

export function upsertGrade(
  studentId: string,
  gradeCategoryId: string,
  score: number,
  comment?: string,
) {
  return prisma.grade.upsert({
    where: { studentId_gradeCategoryId: { studentId, gradeCategoryId } },
    create: { studentId, gradeCategoryId, score, comment: comment || null },
    update: { score, comment: comment || null },
  });
}

export function deleteGrade(studentId: string, gradeCategoryId: string) {
  return prisma.grade.deleteMany({ where: { studentId, gradeCategoryId } });
}

export function categoryBelongsToCourse(
  gradeCategoryId: string,
  courseId: string,
) {
  return prisma.gradeCategory.findFirst({
    where: { id: gradeCategoryId, courseId, deletedAt: null },
    select: { id: true },
  });
}

export function saveAllGrades(
  grades: { studentId: string; gradeCategoryId: string; score: number | null }[],
) {
  return prisma.$transaction(async (tx) => {
    for (const g of grades) {
      if (g.score === null) {
        await tx.grade.deleteMany({
          where: { studentId: g.studentId, gradeCategoryId: g.gradeCategoryId },
        });
      } else {
        await tx.grade.upsert({
          where: {
            studentId_gradeCategoryId: {
              studentId: g.studentId,
              gradeCategoryId: g.gradeCategoryId,
            },
          },
          create: {
            studentId: g.studentId,
            gradeCategoryId: g.gradeCategoryId,
            score: g.score,
          },
          update: { score: g.score },
        });
      }
    }
  });
}

