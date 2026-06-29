"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CourseMetric } from "../service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GroupedData {
  name: string;
  Asistencia: number;
  Aprobacion: number;
  count: number;
}

function parseGradeAndSection(name: string) {
  const combined = name.toLowerCase();
  
  let grade = "Otros";
  if (/\b(1|1ro|1°|primero)\b/.test(combined)) grade = "1° Sec";
  else if (/\b(2|2do|2°|segundo)\b/.test(combined)) grade = "2° Sec";
  else if (/\b(3|3ro|3°|tercero)\b/.test(combined)) grade = "3° Sec";
  else if (/\b(4|4to|4°|cuarto)\b/.test(combined)) grade = "4° Sec";
  else if (/\b(5|5to|5°|quinto)\b/.test(combined)) grade = "5° Sec";

  let section = "General";
  if (/\b(a|seccion\s+a|sección\s+a)\b/.test(combined) || combined.endsWith(" a") || combined.includes("-a") || combined.includes(" a ")) {
    section = "Sección A";
  } else if (/\b(b|seccion\s+b|sección\s+b)\b/.test(combined) || combined.endsWith(" b") || combined.includes("-b") || combined.includes(" b ")) {
    section = "Sección B";
  }

  return { grade, section };
}

export function ComparisonCharts({ courses }: { courses: CourseMetric[] }) {
  const [compareBy, setCompareBy] = useState<"grade" | "course">("grade");

  if (courses.length === 0) {
    return null;
  }

  // Group and aggregate data
  const gradeGroups: Record<string, { totalAtt: number; countAtt: number; totalApp: number; countApp: number }> = {};

  const standardGrades = ["1° Sec", "2° Sec", "3° Sec", "4° Sec", "5° Sec", "Otros"];

  courses.forEach((c) => {
    const { grade } = parseGradeAndSection(c.name);

    // Grados
    if (!gradeGroups[grade]) {
      gradeGroups[grade] = { totalAtt: 0, countAtt: 0, totalApp: 0, countApp: 0 };
    }
    if (c.attendanceRate !== null) {
      gradeGroups[grade].totalAtt += c.attendanceRate;
      gradeGroups[grade].countAtt += 1;
    }
    if (c.approvalRate !== null) {
      gradeGroups[grade].totalApp += c.approvalRate;
      gradeGroups[grade].countApp += 1;
    }
  });

  let chartData: GroupedData[] = [];

  if (compareBy === "course") {
    chartData = courses.map((c) => ({
      name: c.name,
      Asistencia: c.attendanceRate !== null ? Math.round(c.attendanceRate) : 0,
      Aprobacion: c.approvalRate !== null ? Math.round(c.approvalRate) : 0,
      count: 1,
    }));
  } else {
    chartData = standardGrades
      .map((key) => {
        const group = gradeGroups[key];
        if (!group) return null;

        return {
          name: key,
          Asistencia: group.countAtt > 0 ? Math.round(group.totalAtt / group.countAtt) : 0,
          Aprobacion: group.countApp > 0 ? Math.round(group.totalApp / group.countApp) : 0,
          count: Math.max(group.countAtt, group.countApp),
        };
      })
      .filter((v): v is GroupedData => v !== null);
  }

  const hasSecondaryData = courses.some(c => {
    const { grade } = parseGradeAndSection(c.name);
    return grade !== "Otros";
  });

  return (
    <Card className="lg:col-span-5">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Comparativa de Rendimiento</CardTitle>
          <CardDescription>
            Compara la asistencia y aprobación promedio por grado o curso.
          </CardDescription>
        </div>
        <div className="flex gap-1.5 self-start sm:self-center">
          <Button
            variant={compareBy === "grade" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareBy("grade")}
          >
            Por Grado
          </Button>
          <Button
            variant={compareBy === "course" ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareBy("course")}
          >
            Por Cursos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasSecondaryData && compareBy !== "course" && (
          <p className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            💡 **Tip:** Nombra tus cursos incluyendo el grado (ej. *"Matemática 1° A"*, *"Historia 5° B"*) para que los promedios se clasifiquen y grafiquen automáticamente.
          </p>
        )}

        {chartData.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            No hay suficientes datos de cursos con asistencia o notas registradas para comparar.
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  dy={6}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md space-y-1">
                        <p className="font-bold text-foreground">{p.name}</p>
                        <p className="text-present font-semibold">Asistencia Promedio: {p.Asistencia}%</p>
                        <p className="text-marker font-semibold">Tasa de Aprobación: {p.Aprobacion}%</p>
                      </div>
                    );
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="Asistencia"
                  name="Asistencia Promedio"
                  fill="var(--present)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  dataKey="Aprobacion"
                  name="Tasa de Aprobación"
                  fill="var(--marker)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
