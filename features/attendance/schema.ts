import { z } from "zod";

export const ATTENDANCE_STATUSES = ["PRESENT", "LATE", "ABSENT"] as const;
export type AttendanceStatusValue = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatusValue, string> = {
  PRESENT: "Presente",
  LATE: "Tardanza",
  ABSENT: "Falta",
};

export const openSessionSchema = z.object({
  courseId: z.string().min(1),
  ttlMinutes: z.coerce.number().int().min(1).max(240).default(15),
});

export type OpenSessionDTO = z.output<typeof openSessionSchema>;

export const closeSessionSchema = z.object({
  sessionId: z.string().min(1),
  courseId: z.string().min(1),
});

export type CloseSessionDTO = z.output<typeof closeSessionSchema>;

export const correctAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  studentId: z.string().min(1),
  status: z.enum(ATTENDANCE_STATUSES),
});

export type CorrectAttendanceDTO = z.output<typeof correctAttendanceSchema>;

// Marcado público: lo envía el alumno desde /asistencia.
export const markPublicSchema = z.object({
  attendanceCode: z
    .string()
    .trim()
    .min(4, "Código inválido.")
    .max(12)
    .transform((v) => v.toUpperCase()),
  studentCode: z.string().trim().min(1, "Ingresa tu código de alumno.").max(20),
});

export type MarkPublicDTO = z.output<typeof markPublicSchema>;

export const saveAttendanceSchema = z.object({
  courseId: z.string().min(1),
  marks: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(ATTENDANCE_STATUSES),
    })
  ),
});

export type SaveAttendanceDTO = z.output<typeof saveAttendanceSchema>;
