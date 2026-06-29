import { AppError } from "@/lib/errors";
import { assertCourseOwned } from "@/features/courses/service";
import { getEnrolledStudents } from "@/features/enrollments/service";
import * as repo from "./repository";
import { weightedAverage } from "./average";
import type { CategoryItemDTO, UpsertGradeDTO } from "./schema";

export { weightedAverage };

export async function saveCategories(
  teacherId: string,
  courseId: string,
  categories: CategoryItemDTO[],
) {
  await assertCourseOwned(teacherId, courseId);

  const total = categories.reduce((s, c) => s + c.percentage, 0);
  if (Math.abs(total - 100) > 0.01) {
    throw new AppError(
      "VALIDATION",
      `Los porcentajes deben sumar 100% (suman ${total}%).`,
    );
  }

  await repo.replaceCategories(courseId, categories);
}

export async function upsertGrade(teacherId: string, data: UpsertGradeDTO) {
  await assertCourseOwned(teacherId, data.courseId);

  const belongs = await repo.categoryBelongsToCourse(
    data.gradeCategoryId,
    data.courseId,
  );
  if (!belongs) throw new AppError("NOT_FOUND", "Evaluación no encontrada.");

  return repo.upsertGrade(
    data.studentId,
    data.gradeCategoryId,
    data.score,
    data.comment,
  );
}

export async function deleteGrade(
  teacherId: string,
  courseId: string,
  studentId: string,
  gradeCategoryId: string,
) {
  await assertCourseOwned(teacherId, courseId);
  await repo.deleteGrade(studentId, gradeCategoryId);
}

export interface GradeSheetCategory {
  id: string;
  name: string;
  percentage: number;
  order: number;
}

export interface GradeSheetRow {
  studentId: string;
  code: string;
  fullName: string;
  status: "ACTIVE" | "INACTIVE";
  scores: Record<string, number>;
  average: number | null;
}

export interface GradeSheet {
  categories: GradeSheetCategory[];
  rows: GradeSheetRow[];
  totalPercentage: number;
}

export async function getGradeSheet(
  teacherId: string,
  courseId: string,
): Promise<GradeSheet> {
  await assertCourseOwned(teacherId, courseId);

  const [categoriesRaw, enrollments, gradesRaw] = await Promise.all([
    repo.getCategories(courseId),
    getEnrolledStudents(teacherId, courseId),
    repo.getGrades(courseId),
  ]);

  const categories: GradeSheetCategory[] = categoriesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    percentage: c.percentage.toNumber(),
    order: c.order,
  }));

  // Índice de notas: studentId → categoryId → score
  const gradeMap = new Map<string, Map<string, number>>();
  for (const g of gradesRaw) {
    if (!gradeMap.has(g.studentId)) gradeMap.set(g.studentId, new Map());
    gradeMap.get(g.studentId)!.set(g.gradeCategoryId, g.score.toNumber());
  }

  const rows: GradeSheetRow[] = enrollments.map((e) => {
    const studentGrades = gradeMap.get(e.studentId) ?? new Map();
    const scores: Record<string, number> = {};
    for (const [catId, score] of studentGrades) scores[catId] = score;

    const average = weightedAverage(
      categories.map((c) => ({
        percentage: c.percentage,
        score: scores[c.id] ?? null,
      })),
    );

    return {
      studentId: e.studentId,
      code: e.student.code,
      fullName:
        `${e.student.paternalName} ${e.student.maternalName ?? ""}, ${e.student.name}`.trim(),
      status: e.student.status,
      scores,
      average,
    };
  });

  return {
    categories,
    rows,
    totalPercentage: categories.reduce((s, c) => s + c.percentage, 0),
  };
}

export async function saveAllGrades(
  teacherId: string,
  courseId: string,
  grades: { studentId: string; gradeCategoryId: string; score: number | null }[],
) {
  await assertCourseOwned(teacherId, courseId);

  // Validar propiedad de las categorías en el curso
  const categories = await repo.getCategories(courseId);
  const categoryIds = new Set(categories.map((c) => c.id));

  for (const g of grades) {
    if (!categoryIds.has(g.gradeCategoryId)) {
      throw new Error("Categoría de nota inválida para este curso.");
    }
  }

  await repo.saveAllGrades(grades);
}

