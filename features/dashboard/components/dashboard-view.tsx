"use client";

import { useState } from "react";
import {
  GraduationCapIcon,
  UsersIcon,
  PercentIcon,
} from "lucide-react";
import type { DashboardData } from "../service";
import { AttendanceDonut } from "./attendance-donut";
import { TrendChart } from "./trend-chart";
import { CourseMetrics } from "./course-metrics";
import { ComparisonCharts } from "./comparison-charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardView({ data }: { data: DashboardData }) {
  const { kpis, breakdown, trend, courses, courseAttendance } = data;

  // Filtros independientes de Curso para cada gráfico
  const [selectedCourseTrend, setSelectedCourseTrend] = useState<string>("ALL");
  const [selectedCourseDist, setSelectedCourseDist] = useState<string>("ALL");

  // 1. Filtrar datos para Tendencia de Asistencia por Curso
  const filteredCoursesTrend = courses.filter((c) => {
    return selectedCourseTrend === "ALL" || c.id === selectedCourseTrend;
  });

  const filteredTrend = trend.filter((t) =>
    filteredCoursesTrend.some((c) => c.name === t.course)
  );

  // 2. Filtrar datos para Distribución (Donut) por Curso
  const filteredCoursesDist = courses.filter((c) => {
    return selectedCourseDist === "ALL" || c.id === selectedCourseDist;
  });

  const filteredCourseIdsDist = new Set(filteredCoursesDist.map((c) => c.id));
  const filteredAttendanceDist = courseAttendance.filter((ca) =>
    filteredCourseIdsDist.has(ca.courseId)
  );
  const sumPresent = filteredAttendanceDist.reduce((acc, ca) => acc + ca.present, 0);
  const sumLate = filteredAttendanceDist.reduce((acc, ca) => acc + ca.late, 0);
  const sumAbsent = filteredAttendanceDist.reduce((acc, ca) => acc + ca.absent, 0);
  const totalAttendance = sumPresent + sumLate + sumAbsent;
  
  const filteredBreakdown = {
    present: sumPresent,
    late: sumLate,
    absent: sumAbsent,
    total: totalAttendance,
  };

  const stats = [
    { label: "Cursos", value: kpis.courses, icon: GraduationCapIcon },
    { label: "Alumnos", value: kpis.students, icon: UsersIcon },
    {
      label: "Asistencia",
      value: kpis.attendanceRate === null ? "—" : `${kpis.attendanceRate}%`,
      icon: PercentIcon,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border/60 hover:shadow-md transition-all">
            <CardContent className="flex items-center justify-between py-6">
              <div className="flex flex-col gap-1">
                <span className="eyebrow">{label}</span>
                <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                  {value}
                </span>
              </div>
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Card de Tendencia */}
        <Card className="lg:col-span-3 border-border/60 shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Tendencia de Asistencia</CardTitle>
              <CardDescription>
                Tasa de presentes y tardanzas en las últimas sesiones.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {/* Selector de Curso - Tendencia */}
              <Select value={selectedCourseTrend} onValueChange={(val) => setSelectedCourseTrend(val ?? "ALL")}>
                <SelectTrigger className="h-8 w-[280px] text-[11px]">
                  <SelectValue placeholder="Curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los cursos</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChart data={filteredTrend} />
          </CardContent>
        </Card>

        {/* Card de Distribución */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Distribución</CardTitle>
              <CardDescription>Todas las marcas registradas.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {/* Selector de Curso - Distribución */}
              <Select value={selectedCourseDist} onValueChange={(val) => setSelectedCourseDist(val ?? "ALL")}>
                <SelectTrigger className="h-8 w-[280px] text-[11px]">
                  <SelectValue placeholder="Curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los cursos</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <AttendanceDonut data={filteredBreakdown} />
          </CardContent>
        </Card>
      </div>

      <ComparisonCharts courses={courses} />

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Comparativa de Rendimiento por Curso</CardTitle>
          <CardDescription>
            Asistencia y aprobación según la nota aprobatoria de cada curso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CourseMetrics courses={courses} />
        </CardContent>
      </Card>
    </div>
  );
}
