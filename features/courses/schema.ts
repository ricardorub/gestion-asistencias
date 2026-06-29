import { z } from "zod";

export const createCourseSchema = z.object({
  code: z.string().trim().min(1, "Requerido.").max(20),
  name: z.string().trim().min(1, "Requerido.").max(120),
  description: z.string().trim().max(500).optional(),
  passingGrade: z.coerce
    .number()
    .min(0, "≥ 0")
    .max(20, "≤ 20")
    .default(11),
});

export type CreateCourseInput = z.input<typeof createCourseSchema>;
export type CreateCourseDTO = z.output<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.extend({
  id: z.string().min(1),
});

export type UpdateCourseDTO = z.output<typeof updateCourseSchema>;

export const courseFilterSchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(100).catch(12),
  sortBy: z.enum(["name", "code", "createdAt"]).catch("createdAt"),
  sortDir: z.enum(["asc", "desc"]).catch("desc"),
});

export type CourseFilterDTO = z.infer<typeof courseFilterSchema>;
