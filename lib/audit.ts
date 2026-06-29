import "server-only";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { logger } from "./logger";

interface AuditInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

async function resolveIp(): Promise<string | null> {
  try {
    const h = await headers();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  } catch {
    return null;
  }
}

/**
 * Registra una entrada en la bitácora de auditoría. Nunca lanza: si el log
 * falla, no debe tumbar la operación de negocio que ya se ejecutó; se reporta
 * por el logger estructurado.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const ip = await resolveIp();
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
        ip,
      },
    });
  } catch {
    logger.error("audit.write.failed", {
      action: input.action,
      entity: input.entity,
    });
  }
}
