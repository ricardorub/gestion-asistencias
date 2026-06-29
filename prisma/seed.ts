import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "profesor@demo.com";
  const passwordHash = await bcrypt.hash("password123", 10);

  const teacher = await prisma.user.upsert({
    where: { email },
    update: {
      status: "APPROVED"
    },
    create: {
      email,
      name: "Profesor Demo",
      passwordHash,
      role: "TEACHER",
      status: "APPROVED",
    },
  });

  console.log(`✔ Profesor de prueba listo: ${teacher.email} / password123`);

  const adminEmail = "admin@demo.com";
  const adminPasswordHash = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      status: "APPROVED"
    },
    create: {
      email: adminEmail,
      name: "Administrador Demo",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  console.log(`✔ Administrador de prueba listo: ${admin.email} / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
