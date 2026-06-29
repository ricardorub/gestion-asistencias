import { weightedAverage } from "@/features/grades/average";
import * as repo from "./repository";

export interface DashboardKpis {
  courses: number;
  students: number;
  enrollments: number;
  /** Tasa de asistencia global: (presentes + tardes) / total, en %. */
  attendanceRate: number | null;
}

export interface AttendanceBreakdown {
  present: number;
  late: number;
  absent: number;
  total: number;
}

export interface SessionTrendPoint {
  label: string;
  course: string;
  rate: number;
  total: number;
}

export interface CourseMetric {
  id: string;
  name: string;
  students: number;
  attendanceRate: number | null;
  approvalRate: number | null;
  passingGrade: number;
}

export interface CourseAttendanceBreakdown {
  courseId: string;
  present: number;
  late: number;
  absent: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  breakdown: AttendanceBreakdown;
  trend: SessionTrendPoint[];
  courses: CourseMetric[];
  courseAttendance: CourseAttendanceBreakdown[];
}

function rate(present: number, late: number, total: number): number | null {
  if (total === 0) return null;
  return Math.round(((present + late) / total) * 1000) / 10;
}

export async function getDashboardData(
  teacherId: string,
): Promise<DashboardData> {
  const [
    courses,
    students,
    enrollments,
    statusGroups,
    sessions,
    courseData,
    grades,
    attByCourse,
  ] = await Promise.all([
    repo.countCourses(teacherId),
    repo.countStudents(teacherId),
    repo.countActiveEnrollments(teacherId),
    repo.attendanceByStatus(teacherId),
    repo.recentSessions(teacherId),
    repo.coursesWithGradeData(teacherId),
    repo.gradesForTeacher(teacherId),
    repo.attendanceByCourse(teacherId),
  ]);

  // Distribución global de asistencia.
  const countOf = (s: string) =>
    statusGroups.find((g) => g.status === s)?._count._all ?? 0;
  const present = countOf("PRESENT");
  const late = countOf("LATE");
  const absent = countOf("ABSENT");
  const totalAtt = present + late + absent;
  const breakdown: AttendanceBreakdown = {
    present,
    late,
    absent,
    total: totalAtt,
  };

  // Tendencia por sesión (de más antigua a más reciente).
  const trend: SessionTrendPoint[] = [...sessions]
    .reverse()
    .map((s) => {
      const total = s.attendances.length;
      const p = s.attendances.filter((a) => a.status === "PRESENT").length;
      const l = s.attendances.filter((a) => a.status === "LATE").length;
      return {
        label: new Intl.DateTimeFormat("es-PE", {
          day: "2-digit",
          month: "2-digit",
        }).format(s.startedAt),
        course: s.course.name,
        rate: rate(p, l, total) ?? 0,
        total,
      };
    });

  // Índice de asistencia por curso.
  const attMap = new Map<string, { present: number; late: number; total: number }>();
  for (const r of attByCourse) {
    const e = attMap.get(r.courseId) ?? { present: 0, late: 0, total: 0 };
    const c = Number(r.count);
    if (r.status === "PRESENT") e.present += c;
    if (r.status === "LATE") e.late += c;
    e.total += c;
    attMap.set(r.courseId, e);
  }

  // Índice de notas: studentId → categoryId → score.
  const gradeMap = new Map<string, Map<string, number>>();
  for (const g of grades) {
    const key = g.studentId;
    if (!gradeMap.has(key)) gradeMap.set(key, new Map());
    gradeMap.get(key)!.set(g.gradeCategory.id, g.score.toNumber());
  }

  // Métricas por curso (alumnos, asistencia, aprobación).
  const courseMetrics: CourseMetric[] = courseData.map((c) => {
    const passingGrade = c.passingGrade.toNumber();
    const cats = c.gradeCategories.map((g) => ({
      id: g.id,
      percentage: g.percentage.toNumber(),
    }));

    // Aprobación: promedio ponderado por alumno vs nota aprobatoria.
    let evaluated = 0;
    let approved = 0;
    for (const e of c.enrollments) {
      const scores = gradeMap.get(e.studentId);
      const avg = weightedAverage(
        cats.map((cat) => ({
          percentage: cat.percentage,
          score: scores?.get(cat.id) ?? null,
        })),
      );
      if (avg !== null) {
        evaluated += 1;
        if (avg >= passingGrade) approved += 1;
      }
    }

    const att = attMap.get(c.id);
    return {
      id: c.id,
      name: c.name,
      students: c.enrollments.length,
      attendanceRate: att ? rate(att.present, att.late, att.total) : null,
      approvalRate:
        evaluated > 0 ? Math.round((approved / evaluated) * 1000) / 10 : null,
      passingGrade,
    };
  });

  const courseAttendance: CourseAttendanceBreakdown[] = courseData.map((c) => {
    const att = attMap.get(c.id) ?? { present: 0, late: 0, total: 0 };
    const absent = att.total - (att.present + att.late);
    return {
      courseId: c.id,
      present: att.present,
      late: att.late,
      absent: absent > 0 ? absent : 0,
    };
  });

  return {
    kpis: {
      courses,
      students,
      enrollments,
      attendanceRate: rate(present, late, totalAtt),
    },
    breakdown,
    trend,
    courses: courseMetrics,
    courseAttendance,
  };
}
