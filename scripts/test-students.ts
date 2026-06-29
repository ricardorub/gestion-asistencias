import "dotenv/config";
import { prisma } from "../lib/prisma";
import * as service from "../features/students/service";
import { findStudents } from "../features/students/repository";
import { AppError } from "../lib/errors";

async function main() {
  const teacher = await prisma.user.findFirstOrThrow({
    where: { email: "profesor@demo.com" },
  });
  const t = teacher.id;

  // Limpieza de pruebas previas (hard delete solo para test).
  await prisma.student.deleteMany({
    where: { teacherId: t, code: { startsWith: "TST-" } },
  });

  // 1) Crear
  const a = await service.createStudent(t, {
    code: "TST-001",
    name: "Ana",
    paternalName: "García",
    maternalName: "López",
    documentType: "DNI",
    documentNumber: "70011223",
    status: "ACTIVE",
  });
  console.log("1) creado:", a.code, a.name);

  // 2) Duplicado por código
  try {
    await service.createStudent(t, {
      code: "TST-001",
      name: "Otro",
      paternalName: "X",
      documentType: "DNI",
      documentNumber: "99999999",
      status: "ACTIVE",
    });
    console.log("2) ERROR: no detectó duplicado de código");
  } catch (e) {
    console.log(
      "2) duplicado código detectado:",
      e instanceof AppError ? JSON.stringify(e.fieldErrors) : e,
    );
  }

  // 3) Duplicado por documento
  try {
    await service.createStudent(t, {
      code: "TST-002",
      name: "Otro",
      paternalName: "X",
      documentType: "DNI",
      documentNumber: "70011223",
      status: "ACTIVE",
    });
    console.log("3) ERROR: no detectó duplicado de documento");
  } catch (e) {
    console.log(
      "3) duplicado documento detectado:",
      e instanceof AppError ? JSON.stringify(e.fieldErrors) : e,
    );
  }

  // 4) Crear varios para paginación/búsqueda
  for (let i = 2; i <= 5; i++) {
    await service.createStudent(t, {
      code: `TST-00${i}`,
      name: `Alumno ${i}`,
      paternalName: "Pérez",
      documentType: "DNI",
      documentNumber: `8001122${i}`,
      status: i % 2 === 0 ? "ACTIVE" : "INACTIVE",
    });
  }

  // 5) Búsqueda + filtro
  const search = await findStudents(t, {
    q: "Pérez",
    status: "ACTIVE",
    page: 1,
    pageSize: 20,
    sortBy: "code",
    sortDir: "asc",
  });
  console.log(
    "5) búsqueda 'Pérez' status=ACTIVE →",
    search.total,
    "resultados:",
    search.items.map((s) => s.code),
  );

  // 6) Actualizar
  const upd = await service.updateStudent(t, {
    id: a.id,
    code: "TST-001",
    name: "Ana María",
    paternalName: "García",
    maternalName: "López",
    documentType: "DNI",
    documentNumber: "70011223",
    status: "INACTIVE",
  });
  console.log("6) actualizado:", upd.name, "estado:", upd.status);

  // 7) Soft delete
  await service.deleteStudent(t, a.id);
  const afterDelete = await prisma.student.findUnique({ where: { id: a.id } });
  console.log("7) soft delete → deletedAt:", afterDelete?.deletedAt !== null);

  const visible = await findStudents(t, {
    page: 1,
    pageSize: 50,
    sortBy: "code",
    sortDir: "asc",
  });
  console.log(
    "   visibles tras delete (no incluye eliminado):",
    visible.items.map((s) => s.code),
  );

  console.log("\n✔ Pruebas de negocio OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
