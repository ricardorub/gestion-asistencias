import { z } from "zod";

export const DOCUMENT_TYPES = ["DNI", "CE", "PASSPORT"] as const;
export const STUDENT_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const DOCUMENT_TYPE_LABELS: Record<
  (typeof DOCUMENT_TYPES)[number],
  string
> = {
  DNI: "DNI",
  CE: "Carné de extranjería",
  PASSPORT: "Pasaporte",
};

export const STUDENT_STATUS_LABELS: Record<
  (typeof STUDENT_STATUSES)[number],
  string
> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

const optionalEmail = z
  .string()
  .trim()
  .email("Correo inválido.")
  .or(z.literal(""))
  .optional();

const optionalText = (max: number) => z.string().trim().max(max).optional();

import { nanoid } from "nanoid";

export const createStudentSchema = z.object({
  code: z.string().trim().default(() => `ALU-${nanoid(6).toUpperCase()}`),
  name: z.string().trim().min(1, "Requerido.").max(80),
  paternalName: z.string().trim().min(1, "Requerido.").max(80),
  maternalName: optionalText(80),
  documentType: z.enum(DOCUMENT_TYPES).default("DNI"),
  documentNumber: z.string().trim().default(() => `DNI-${nanoid(8)}`),
  email: optionalEmail,
  phone: optionalText(20),
  status: z.enum(STUDENT_STATUSES).default("ACTIVE"),
  enrollInCourseId: z.string().optional(),
});

export type CreateStudentInput = z.input<typeof createStudentSchema>;
export type CreateStudentDTO = z.output<typeof createStudentSchema>;

export const updateStudentSchema = createStudentSchema.extend({
  id: z.string().min(1),
});

export type UpdateStudentDTO = z.infer<typeof updateStudentSchema>;

export const studentFilterSchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(STUDENT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(20),
  sortBy: z.enum(["name", "code", "createdAt"]).catch("createdAt"),
  sortDir: z.enum(["asc", "desc"]).catch("desc"),
});

export type StudentFilterDTO = z.infer<typeof studentFilterSchema>;
