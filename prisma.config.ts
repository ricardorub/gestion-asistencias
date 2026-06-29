import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Configuración de Prisma 7. La conexión para Migrate/introspección vive aquí
 * (ya no en schema.prisma). El cliente en runtime usa el driver adapter
 * configurado en lib/prisma.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
