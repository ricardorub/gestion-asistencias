import "dotenv/config";
import { prisma } from "../lib/prisma";
import { ExcelJS } from "../lib/excel";
import {
  STUDENT_COLUMNS,
  buildStudentsWorkbook,
  buildStudentTemplate,
} from "../features/students/export";
import { parseStudentRows } from "../features/students/import";
import { importStudents } from "../features/students/service";
import { getGradeSheet } from "../features/grades/service";
import { buildGradeSheetWorkbook } from "../features/grades/export";

async function makeUploadBuffer(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Alumnos");
  ws.columns = STUDENT_COLUMNS.map((c) => ({ header: c.header, key: c.key }));

  // 2 válidos, 1 con tipo de doc inválido, 1 duplicado de código dentro del archivo.
  ws.addRow({ code: "IMP-1", name: "Lucía", paternalName: "Ramos", maternalName: "", documentType: "DNI", documentNumber: "70011111", email: "lucia@x.com", phone: "", status: "Activo" });
  ws.addRow({ code: "IMP-2", name: "Bruno", paternalName: "Díaz", maternalName: "Soto", documentType: "Carné de extranjería", documentNumber: "70022222", email: "", phone: "999", status: "" });
  ws.addRow({ code: "IMP-3", name: "Mara", paternalName: "Lopez", maternalName: "", documentType: "XYZ", documentNumber: "70033333", email: "", phone: "", status: "" });
  ws.addRow({ code: "IMP-1", name: "Repetido", paternalName: "Repe", maternalName: "", documentType: "DNI", documentNumber: "70044444", email: "", phone: "", status: "" });

  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data);
}

async function main() {
  const t = (
    await prisma.user.findFirstOrThrow({ where: { email: "profesor@demo.com" } })
  ).id;

  // Limpieza previa.
  await prisma.student.deleteMany({
    where: { teacherId: t, code: { in: ["IMP-1", "IMP-2", "IMP-3"] } },
  });

  // 1) Plantilla.
  const tpl = await buildStudentTemplate();
  console.log("1) plantilla generada:", tpl.length, "bytes");

  // 2) Parseo del archivo de carga.
  const buf = await makeUploadBuffer();
  const rows = await parseStudentRows(buf);
  console.log("2) filas parseadas:", rows.length, "(esperado 4)");

  // 3) Importación.
  const report = await importStudents(t, rows);
  console.log("3) reporte:", JSON.stringify(report, null, 2));
  console.log(
    "   esperado → created 2, errores en filas 4 (tipo doc) y 5 (código repetido)",
  );

  // 4) Reimportar el mismo archivo → todos deben fallar por duplicado en BD.
  const report2 = await importStudents(t, rows);
  console.log("4) reimport created (esperado 0):", report2.created);

  // 5) Export de alumnos.
  const created = await prisma.student.findMany({
    where: { teacherId: t, code: { in: ["IMP-1", "IMP-2"] } },
  });
  const xlsx = await buildStudentsWorkbook(created);
  console.log("5) export alumnos:", xlsx.length, "bytes,", created.length, "filas");

  // 6) Export de notas (primer curso del profesor con evaluaciones).
  const course = await prisma.course.findFirst({
    where: { teacherId: t, deletedAt: null, gradeCategories: { some: {} } },
  });
  if (course) {
    const sheet = await getGradeSheet(t, course.id);
    const notas = await buildGradeSheetWorkbook(
      sheet,
      course.name,
      course.passingGrade.toNumber(),
    );
    console.log("6) export notas:", notas.length, "bytes para", course.name);
  } else {
    console.log("6) (sin curso con evaluaciones para probar export de notas)");
  }

  // Limpieza.
  await prisma.student.deleteMany({
    where: { teacherId: t, code: { in: ["IMP-1", "IMP-2", "IMP-3"] } },
  });
  console.log("\nLimpieza OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
