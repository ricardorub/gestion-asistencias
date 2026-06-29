import { requireTeacher } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getGradeSheet } from "@/features/grades/service";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, GraduationCap } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const revalidate = 0;

export default async function AlumnosResumenPage() {
  const session = await requireTeacher();
  
  // Obtener fecha actual en formato local de Lima, Perú
  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const formattedDateCapitalized =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Rangos de inicio y fin de hoy
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  // Obtener todos los cursos del profesor
  const courses = await prisma.course.findMany({
    where: { teacherId: session.user.id, deletedAt: null },
    orderBy: { name: "asc" },
  });

  // Agrupar datos de alumnos, notas y asistencia por curso
  const coursesData = await Promise.all(
    courses.map(async (course) => {
      // Obtener planilla de notas (contiene la lista de alumnos matriculados y sus promedios)
      const gradeSheet = await getGradeSheet(session.user.id, course.id);

      // Obtener sesión de asistencia registrada hoy
      const todaySession = await prisma.attendanceSession.findFirst({
        where: {
          courseId: course.id,
          startedAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        include: {
          attendances: true,
        },
      });

      // Crear mapa de asistencia: studentId -> status
      const attendanceMap = new Map<string, string>();
      if (todaySession) {
        for (const att of todaySession.attendances) {
          attendanceMap.set(att.studentId, att.status);
        }
      }

      // Mapear alumnos matriculados con su promedio y su asistencia de hoy
      const students = gradeSheet.rows.map((row) => {
        const attendanceStatus = attendanceMap.get(row.studentId) || null;
        return {
          studentId: row.studentId,
          fullName: row.fullName,
          scores: row.scores,
          average: row.average,
          attendanceStatus,
        };
      });

      return {
        courseId: course.id,
        courseName: course.name,
        passingGrade: course.passingGrade.toNumber(),
        categories: gradeSheet.categories,
        students,
      };
    })
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Encabezado Principal */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card to-background p-6 md:p-8 shadow-sm">
        <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/80 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-present" />
              Estado Diario
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Resumen de Alumnos
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Vista general consolidada con los nombres, promedios de notas y asistencia registrada para el día de hoy.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card/50 px-4 py-3 shadow-inner">
            <CalendarIcon className="size-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Fecha de Hoy</span>
              <span className="font-medium text-sm text-foreground">{formattedDateCapitalized}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Listado de Cursos agrupados */}
      <div className="space-y-8">
        {coursesData.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-card/20">
            <GraduationCap className="size-12 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-bold">No tienes cursos registrados</h3>
            <p className="text-muted-foreground text-sm max-w-xs mt-1">
              Crea un curso en la pestaña de cursos para comenzar a gestionar alumnos.
            </p>
          </div>
        ) : (
          coursesData.map((cData) => (
            <div key={cData.courseId} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {/* Encabezado del Curso - Sección */}
              <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">
                      {cData.courseName}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {cData.students.length} {cData.students.length === 1 ? "alumno matriculado" : "alumnos matriculados"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabla de Alumnos para este Curso */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-muted-foreground px-6">Alumno</TableHead>
                      {cData.categories.map((cat) => (
                        <TableHead key={cat.id} className="text-center text-muted-foreground whitespace-nowrap">
                          {cat.name} ({cat.percentage}%)
                        </TableHead>
                      ))}
                      <TableHead className="text-center text-muted-foreground">Promedio</TableHead>
                      <TableHead className="text-center text-muted-foreground px-6">Asistencia de Hoy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cData.students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3 + cData.categories.length} className="text-center py-8 text-muted-foreground text-sm">
                          No hay alumnos matriculados en este curso.
                        </TableCell>
                      </TableRow>
                    ) : (
                      cData.students.map((student) => {
                        const scoreColor =
                          student.average === null
                            ? "text-muted-foreground"
                            : student.average >= cData.passingGrade
                              ? "text-present"
                              : "text-destructive";

                        return (
                          <TableRow key={student.studentId}>
                            <TableCell className="font-medium text-foreground py-3.5 px-6 whitespace-nowrap">
                              {student.fullName}
                            </TableCell>
                            {cData.categories.map((cat) => {
                              const score = student.scores[cat.id];
                              const cellColor =
                                score === undefined
                                  ? "text-muted-foreground"
                                  : score >= cData.passingGrade
                                    ? "text-present"
                                    : "text-destructive";

                              return (
                                <TableCell key={cat.id} className="text-center py-3.5">
                                  <span className={`font-mono ${cellColor}`}>
                                    {score !== undefined ? score.toFixed(1) : "—"}
                                  </span>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center py-3.5">
                              <span className={`font-mono font-semibold ${scoreColor}`}>
                                {student.average === null ? "—" : student.average.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-3.5 px-6">
                              {student.attendanceStatus === "PRESENT" ? (
                                <Badge className="bg-present/10 text-present hover:bg-present/15 border-transparent font-medium">
                                  Asistió
                                </Badge>
                              ) : student.attendanceStatus === "ABSENT" ? (
                                <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/15 border-transparent font-medium">
                                  Falta
                                </Badge>
                              ) : student.attendanceStatus === "LATE" ? (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-150 border-transparent font-medium">
                                  Tarde
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground border-transparent font-medium">
                                  Sin registro
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
