import "dotenv/config";
import { prisma } from "../lib/prisma";
import { recordAudit } from "../lib/audit";

async function main() {
  const before = await prisma.auditLog.count();

  await recordAudit({
    userId: null,
    action: "test.audit",
    entity: "Test",
    entityId: "smoke",
    metadata: { hello: "world" },
  });

  const after = await prisma.auditLog.count();
  const last = await prisma.auditLog.findFirst({
    where: { action: "test.audit" },
    orderBy: { createdAt: "desc" },
  });

  console.log("conteo antes/después:", before, after, after === before + 1 ? "OK" : "FALLA");
  console.log("último registro:", JSON.stringify(last, null, 2));

  // Limpieza.
  await prisma.auditLog.deleteMany({ where: { action: "test.audit" } });
  console.log("limpieza OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
