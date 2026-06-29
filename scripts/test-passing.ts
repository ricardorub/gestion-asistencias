import "dotenv/config";
import { prisma } from "../lib/prisma";
import * as courseSvc from "../features/courses/service";

async function main() {
  const t = (
    await prisma.user.findFirstOrThrow({ where: { email: "profesor@demo.com" } })
  ).id;

  await prisma.course.deleteMany({ where: { teacherId: t, code: "CRS-PASS" } });

  // 1) Crear curso con nota aprobatoria 10.5
  const course = await courseSvc.createCourse(t, {
    code: "CRS-PASS",
    name: "Curso 10.5",
    passingGrade: 10.5,
  });
  const fetched = await prisma.course.findUniqueOrThrow({
    where: { id: course.id },
  });
  console.log("1) creado con passingGrade:", fetched.passingGrade.toString());

  // 2) Evaluar un promedio de 10.7 contra 10.5 (aprueba) y contra 12 (desaprueba)
  const avg = 10.7;
  console.log(
    `2) promedio ${avg} con umbral 10.5 →`,
    avg >= 10.5 ? "APROBADO" : "DESAPROBADO",
  );

  // 3) Editar nota aprobatoria a 12
  await courseSvc.updateCourse(t, {
    id: course.id,
    code: "CRS-PASS",
    name: "Curso 12",
    passingGrade: 12,
  });
  const updated = await prisma.course.findUniqueOrThrow({
    where: { id: course.id },
  });
  console.log("3) editado a passingGrade:", updated.passingGrade.toString());
  console.log(
    `   promedio ${avg} con umbral 12 →`,
    avg >= updated.passingGrade.toNumber() ? "APROBADO" : "DESAPROBADO",
  );

  // 4) Curso existente sin valor explícito usa el default 11
  const demo = await prisma.course.findFirst({
    where: { teacherId: t, code: "CRS-101" },
  });
  console.log("4) CRS-101 passingGrade (default):", demo?.passingGrade.toString());

  await prisma.course.deleteMany({ where: { id: course.id } });
  console.log("\n✔ Nota aprobatoria configurable OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
