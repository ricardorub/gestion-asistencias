-- Reglas que no se expresan en schema.prisma (índices parciales y CHECK).

-- Solo puede existir UNA sesión OPEN por curso a la vez.
CREATE UNIQUE INDEX "one_open_session_per_course"
  ON "AttendanceSession" ("courseId")
  WHERE status = 'OPEN';

-- El código solo debe ser único entre sesiones vigentes (OPEN),
-- permitiendo reutilizar códigos de sesiones ya cerradas.
CREATE UNIQUE INDEX "unique_open_code"
  ON "AttendanceSession" ("code")
  WHERE status = 'OPEN';

-- Rangos de validez para notas (escala 0-20) y porcentajes (0-100).
ALTER TABLE "Grade"
  ADD CONSTRAINT "score_range" CHECK ("score" >= 0 AND "score" <= 20);

ALTER TABLE "GradeCategory"
  ADD CONSTRAINT "percentage_range" CHECK ("percentage" >= 0 AND "percentage" <= 100);