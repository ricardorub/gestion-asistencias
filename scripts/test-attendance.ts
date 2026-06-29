import "dotenv/config";
import { prisma } from "../lib/prisma";
import * as att from "../features/attendance/service";
import { AppError } from "../lib/errors";

async function expectError(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`   ${label}: ERROR (no lanzó)`);
  } catch (e) {
    console.log(`   ${label}:`, e instanceof AppError ? e.code : e);
  }
}

async function main() {
  const t = (
    await prisma.user.findFirstOrThrow({ where: { email: "profesor@demo.com" } })
  ).id;
  const course = await prisma.course.findFirstOrThrow({
    where: { teacherId: t, code: "CRS-101" },
  });

  // Limpieza de sesiones previas
  const prevSessions = await prisma.attendanceSession.findMany({
    where: { courseId: course.id },
    select: { id: true },
  });
  const sids = prevSessions.map((s) => s.id);
  await prisma.attendance.deleteMany({
    where: { attendanceSessionId: { in: sids } },
  });
  await prisma.attendanceSession.deleteMany({ where: { courseId: course.id } });

  const enrolled = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    include: { student: { select: { code: true } } },
  });
  const codes = enrolled.map((e) => e.student.code);
  console.log("matriculados:", codes);
  if (codes.length < 2) {
    console.log("Se requieren ≥2 alumnos matriculados. Aborto.");
    return;
  }

  // 1) Abrir sesión
  const session = await att.openSession(t, course.id, 15);
  console.log("1) sesión abierta, código:", session.code);

  // 2) Una sola sesión OPEN por curso
  await expectError("2) segunda apertura bloqueada", () =>
    att.openSession(t, course.id, 15),
  );

  // 3) Marcado válido
  const r = await att.markAttendancePublic({
    attendanceCode: session.code,
    studentCode: codes[0],
  });
  console.log("3) marcado OK:", r.studentName, "→", r.courseName);

  // 4) Duplicado
  await expectError("4) duplicado", () =>
    att.markAttendancePublic({
      attendanceCode: session.code,
      studentCode: codes[0],
    }),
  );

  // 5) Código inválido
  await expectError("5) código inválido", () =>
    att.markAttendancePublic({
      attendanceCode: "XXXXXX",
      studentCode: codes[0],
    }),
  );

  // 6) Alumno que existe pero NO está matriculado en el curso → FORBIDDEN
  const notEnrolled = await prisma.student.findFirst({
    where: {
      teacherId: t,
      deletedAt: null,
      code: { notIn: codes },
      enrollments: { none: { courseId: course.id } },
    },
    select: { code: true },
  });
  if (notEnrolled) {
    await expectError(`6) no matriculado (${notEnrolled.code})`, () =>
      att.markAttendancePublic({
        attendanceCode: session.code,
        studentCode: notEnrolled.code,
      }),
    );
  } else {
    console.log("   6) (sin alumno no-matriculado disponible para probar)");
  }

  // 7) Alumno inexistente
  await expectError("7) alumno inexistente", () =>
    att.markAttendancePublic({
      attendanceCode: session.code,
      studentCode: "NO-EXISTE",
    }),
  );

  // 8) Corrección manual: segundo alumno → TARDANZA
  const secondStudent = enrolled[1].studentId;
  await att.correctAttendance(t, session.id, secondStudent, "LATE");
  console.log("8) corrección manual aplicada (LATE)");

  // 9) Vista de sesión
  const view = await att.getSessionView(t, course.id);
  console.log("9) counts:", view.counts);

  // 10) Cerrar (marca FALTA a los que no marcaron)
  await att.closeSession(t, session.id);
  const history = await att.getSessionHistory(t, course.id);
  const last = history[0];
  console.log(
    "10) cerrada → present:",
    last.present,
    "late:",
    last.late,
    "absent:",
    last.absent,
    "status:",
    last.status,
  );

  console.log("\n✔ Pruebas de asistencia OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
