import { z } from "zod";

export const enrollSchema = z.object({
  courseId: z.string().min(1),
  studentIds: z.array(z.string().min(1)).min(1, "Selecciona al menos un alumno."),
});

export type EnrollDTO = z.infer<typeof enrollSchema>;

export const removeEnrollmentSchema = z.object({
  courseId: z.string().min(1),
  studentId: z.string().min(1),
});

export type RemoveEnrollmentDTO = z.infer<typeof removeEnrollmentSchema>;
