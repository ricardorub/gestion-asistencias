import "dotenv/config";
import { prisma } from "../lib/prisma";
import * as gradeSvc from "../features/grades/service";
import { weightedAverage } from "../features/grades/average";
import { AppError } from "../lib/errors";

async function main() {
  const t = (
    await prisma.user.findFirstOrThrow({ where: { email: "profesor@demo.com" } })
  ).id;
  const course = await prisma.course.findFirstOrThrow({
    where: { teacherId: t, code: "CRS-101" },
  });

  // 0) Función pura
  const avg = weightedAverage([
    { percentage: 30, score: 15 },
    { percentage: 30, score: 18 },
    { percentage: 40, score: null },
  ]);
  console.log("0) promedio parcial (30/30 calificadas, 40 pendiente):", avg, "(esperado 16.5)");

  // 1) Rechazar suma != 100
  try {
    await gradeSvc.saveCategories(t, course.id, [
      { name: "PC1", percentage: 30, order: 0 },
      { name: "PC2", percentage: 30, order: 1 },
    ]);
    console.log("1) ERROR: aceptó suma 60%");
  } catch (e) {
    console.log("1) rechazó suma != 100:", e instanceof AppError ? e.message : e);
  }

  // 2) Guardar evaluaciones válidas (suman 100)
  await gradeSvc.saveCategories(t, course.id, [
    { name: "Práctica 1", percentage: 30, order: 0 },
    { name: "Parcial", percentage: 30, order: 1 },
    { name: "Final", percentage: 40, order: 2 },
  ]);
  let sheet = await gradeSvc.getGradeSheet(t, course.id);
  console.log(
    "2) evaluaciones:",
    sheet.categories.map((c) => `${c.name} ${c.percentage}%`),
    "total:",
    sheet.totalPercentage,
  );

  // 3) Ingresar notas a un alumno
  const student = sheet.rows[0];
  if (!student) {
    console.log("   (no hay alumnos matriculados, omito notas)");
  } else {
    const cats = sheet.categories;
    await gradeSvc.upsertGrade(t, {
      courseId: course.id,
      studentId: student.studentId,
      gradeCategoryId: cats[0].id,
      score: 15,
    });
    await gradeSvc.upsertGrade(t, {
      courseId: course.id,
      studentId: student.studentId,
      gradeCategoryId: cats[1].id,
      score: 18,
    });
    sheet = await gradeSvc.getGradeSheet(t, course.id);
    const row = sheet.rows.find((r) => r.studentId === student.studentId)!;
    console.log(
      "3) notas:",
      row.scores,
      "promedio parcial:",
      row.average,
      "(esperado 16.5)",
    );

    // 4) Validar rango (nota > 20)
    try {
      const { upsertGradeSchema } = await import("../features/grades/schema");
      const parsed = upsertGradeSchema.safeParse({
        courseId: course.id,
        studentId: student.studentId,
        gradeCategoryId: cats[0].id,
        score: 25,
      });
      console.log("4) score=25 válido?", parsed.success, "(esperado false)");
    } catch (e) {
      console.log("4) error inesperado:", e);
    }
  }

  // 5) Reconfigurar quitando "Final" → debe borrar sus notas y reajustar
  await gradeSvc.saveCategories(t, course.id, [
    { id: sheet.categories[0].id, name: "Práctica 1", percentage: 50, order: 0 },
    { id: sheet.categories[1].id, name: "Parcial", percentage: 50, order: 1 },
  ]);
  sheet = await gradeSvc.getGradeSheet(t, course.id);
  console.log(
    "5) tras quitar 'Final':",
    sheet.categories.map((c) => `${c.name} ${c.percentage}%`),
    "total:",
    sheet.totalPercentage,
  );
  if (sheet.rows[0]) {
    console.log("   promedio recalculado:", sheet.rows[0].average);
  }

  console.log("\n✔ Pruebas de notas OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
