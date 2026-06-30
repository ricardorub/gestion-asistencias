"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCapIcon, UsersIcon, ShieldAlertIcon } from "lucide-react";
import Link from "next/link";

interface AdminDashboardProps {
  stats: {
    totalCourses: number;
    totalStudents: number;
    totalTeachers: number;
  };
  courses: {
    id: string;
    name: string;
    code: string;
    status: string;
    teacher: { name: string | null } | null;
  }[];
}

export function AdminDashboardView({ stats, courses }: AdminDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Tarjetas de Métricas Globales del Administrador */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex flex-col gap-1">
              <span className="eyebrow">Total Cursos</span>
              <span className="font-mono text-3xl font-semibold text-foreground">{stats.totalCourses}</span>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <GraduationCapIcon className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex flex-col gap-1">
              <span className="eyebrow">Alumnos Matriculados</span>
              <span className="font-mono text-3xl font-semibold text-foreground">{stats.totalStudents}</span>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <UsersIcon className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex flex-col gap-1">
              <span className="eyebrow">Cuerpo Docente</span>
              <span className="font-mono text-3xl font-semibold text-foreground">{stats.totalTeachers}</span>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <ShieldAlertIcon className="size-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Gestión y Asignación de Materias */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Control de Asignaciones y Cursos</CardTitle>
            <CardDescription>Monitoreo de materias y estado de confirmación por el profesor.</CardDescription>
          </div>
          <Link href="/cursos">
            <Button size="sm">Crear Nuevo Curso</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                <tr>
                  <th className="p-4 text-left">Código</th>
                  <th className="p-4 text-left">Curso</th>
                  <th className="p-4 text-left">Docente Dictante</th>
                  <th className="p-4 text-left">Estado del Docente</th>
                  <th className="p-4 text-right">Gestión</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((curso) => (
                  <tr key={curso.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-mono text-xs">{curso.code}</td>
                    <td className="p-4 font-medium">{curso.name}</td>
                    <td className="p-4 text-muted-foreground">{curso.teacher?.name ?? "No asignado"}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        curso.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {curso.status === "ACCEPTED" ? "Aceptado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/cursos/${curso.id}`}>
                        <Button size="sm" variant="outline">Asignar / Editar</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}