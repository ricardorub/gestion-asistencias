import "dotenv/config";
import { prisma } from "../lib/prisma";
import * as courseSvc from "../features/courses/service";
import * as enrollSvc from "../features/enrollments/service";
import { findCourses } from "../features/courses/repository";
import { AppError } from "../lib/errors";

async function main() {
  const teacher = await prisma.user.findFirstOrThrow({
    where: { email: "profesor@demo.com" },
  });
  const t = teacher.id;

  // Limpieza de pruebas previas.
  const prev = await prisma.course.findMany({
    where: { teacherId: t, code: { startsWith: "CRS-" } },
    select: { id: true },
  });
  const ids = prev.map((c) => c.id);
  await prisma.attendanceSession.deleteMany({ where: { courseId: { in: ids } } });
  await prisma.enrollment.deleteMany({ where: { courseId: { in: ids } } });
  await prisma.course.deleteMany({ where: { id: { in: ids } } });

  // 1) Crear curso
  const course = await courseSvc.createCourse(t, {
    code: "CRS-101",
    name: "Matemática Básica",
    description: "Curso de prueba",
    passingGrade: 11,
  });
  console.log("1) curso creado:", course.code, course.name);

  // 2) Código duplicado
  try {
    await courseSvc.createCourse(t, {
      code: "CRS-101",
      name: "Otro",
      passingGrade: 11,
    });
    console.log("2) ERROR: no detectó código duplicado");
  } catch (e) {
    console.log(
      "2) duplicado detectado:",
      e instanceof AppError ? JSON.stringify(e.fieldErrors) : e,
    );
  }

  // 3) Alumnos del profesor para matricular
  const students = await prisma.student.findMany({
    where: { teacherId: t, deletedAt: null },
    take: 3,
    select: { id: true, code: true },
  });
  console.log("3) alumnos a matricular:", students.map((s) => s.code));

  // 4) Matrícula masiva
  const enrolled = await enrollSvc.enrollStudents(
    t,
    course.id,
    students.map((s) => s.id),
  );
  console.log("4) matriculados:", enrolled.enrolled);

  // 5) Matrícula idempotente (skipDuplicates) — re-matricular no duplica
  const again = await enrollSvc.enrollStudents(
    t,
    course.id,
    students.map((s) => s.id),
  );
  console.log("5) re-matrícula (debe ser 0 nuevos):", again.enrolled);

  // 6) Alumnos disponibles (no incluye los ya matriculados)
  const available = await enrollSvc.getAvailableStudents(t, course.id);
  console.log(
    "6) disponibles (sin los 3 matriculados):",
    available.map((s) => s.code),
  );

  // 7) Conteo de matriculados en el listado
  const list = await findCourses(t, {
    page: 1,
    pageSize: 12,
    sortBy: "code",
    sortDir: "asc",
  });
  const found = list.items.find((c) => c.id === course.id);
  console.log("7) _count.enrollments:", found?._count.enrollments);

  // 8) Quitar matrícula
  await enrollSvc.removeStudent(t, course.id, students[0].id);
  const afterRemove = await enrollSvc.getEnrolledStudents(t, course.id);
  console.log("8) tras quitar 1 →", afterRemove.length, "matriculados");

  // 9) No se puede eliminar curso con sesión OPEN
  await prisma.attendanceSession.create({
    data: {
      courseId: course.id,
      code: "ZZZ999",
      expiresAt: new Date(Date.now() + 600000),
      status: "OPEN",
    },
  });
  try {
    await courseSvc.deleteCourse(t, course.id);
    console.log("9) ERROR: permitió eliminar con sesión abierta");
  } catch (e) {
    console.log(
      "9) bloqueo por sesión OPEN:",
      e instanceof AppError ? e.message : e,
    );
  }

  // 10) Aislamiento: otro teacherId no encuentra el curso
  try {
    await courseSvc.assertCourseOwned("otro-teacher-inexistente", course.id);
    console.log("10) ERROR: no aisló por profesor");
  } catch (e) {
    console.log(
      "10) aislamiento por profesor OK:",
      e instanceof AppError ? e.code : e,
    );
  }

  console.log("\n✔ Pruebas de cursos + matrículas OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
