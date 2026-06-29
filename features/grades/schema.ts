import { z } from "zod";

export const categoryItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Requerido.").max(80),
  percentage: z.coerce
    .number()
    .min(0, "≥ 0")
    .max(100, "≤ 100"),
  order: z.coerce.number().int().min(0),
});

export type CategoryItemInput = z.input<typeof categoryItemSchema>;
export type CategoryItemDTO = z.output<typeof categoryItemSchema>;

export const saveCategoriesSchema = z
  .object({
    courseId: z.string().min(1),
    categories: z.array(categoryItemSchema).min(1, "Agrega al menos una evaluación."),
  })
  .refine(
    (v) =>
      Math.abs(v.categories.reduce((s, c) => s + c.percentage, 0) - 100) < 0.01,
    {
      message: "Los porcentajes deben sumar exactamente 100%.",
      path: ["categories"],
    },
  );

export type SaveCategoriesDTO = z.output<typeof saveCategoriesSchema>;

export const upsertGradeSchema = z.object({
  courseId: z.string().min(1),
  studentId: z.string().min(1),
  gradeCategoryId: z.string().min(1),
  score: z.coerce.number().min(0, "≥ 0").max(20, "≤ 20"),
  comment: z.string().trim().max(300).optional(),
});

export type UpsertGradeDTO = z.output<typeof upsertGradeSchema>;

export const saveAllGradesSchema = z.object({
  courseId: z.string().min(1),
  grades: z.array(
    z.object({
      studentId: z.string().min(1),
      gradeCategoryId: z.string().min(1),
      score: z.preprocess(
        (val) => (val === "" || val === undefined || val === null ? null : val),
        z.coerce.number().min(0).max(20).nullable()
      ),
    })
  ),
});

export type SaveAllGradesDTO = z.output<typeof saveAllGradesSchema>;

