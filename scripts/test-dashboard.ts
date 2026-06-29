import "dotenv/config";
import { prisma } from "../lib/prisma";
import { getDashboardData } from "../features/dashboard/service";

async function main() {
  const t = (
    await prisma.user.findFirstOrThrow({ where: { email: "profesor@demo.com" } })
  ).id;

  const data = await getDashboardData(t);

  console.log("KPIs:", data.kpis);
  console.log("Distribución:", data.breakdown);
  console.log(
    "Tendencia (",
    data.trend.length,
    "sesiones):",
    data.trend.map((p) => `${p.label} ${p.rate}%`).join("  "),
  );
  console.log("Cursos:");
  for (const c of data.courses) {
    console.log(
      `  - ${c.name}: ${c.students} alum · asist ${c.attendanceRate ?? "—"}% · aprob ${c.approvalRate ?? "—"}% (umbral ${c.passingGrade})`,
    );
  }

  // Coherencia: la distribución debe sumar el total.
  const sum =
    data.breakdown.present + data.breakdown.late + data.breakdown.absent;
  console.log(
    "\nCoherencia distribución:",
    sum === data.breakdown.total ? "OK" : `FALLA (${sum} != ${data.breakdown.total})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
