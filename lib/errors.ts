import { Prisma } from "@prisma/client";
import type { ActionResult } from "./result";
import { logger } from "./logger";

export type AppErrorCode =
  | "DUPLICATE"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHENTICATED"
  | "VALIDATION"
  | "CONFLICT";

/** Error de negocio controlado. Su `message` es seguro de mostrar al usuario. */
export class AppError extends Error {
  constructor(
    public code: AppErrorCode,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Convierte cualquier error capturado en una Server Action a un ActionResult. */
export function toActionError(e: unknown): ActionResult<never> {
  if (e instanceof AppError) {
    return { ok: false, error: e.message, fieldErrors: e.fieldErrors };
  }

  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") {
      return { ok: false, error: "Ya existe un registro con esos datos." };
    }
    if (e.code === "P2025") {
      return { ok: false, error: "El registro no existe o fue eliminado." };
    }
  }

  logger.error("unexpected.error", {
    message: e instanceof Error ? e.message : String(e),
  });
  return { ok: false, error: "Ocurrió un error inesperado." };
}
