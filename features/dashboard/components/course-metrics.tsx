import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import type { CourseMetric } from "../service";

function Meter({
  value,
  tone,
}: {
  value: number | null;
  tone: "present" | "marker";
}) {
  if (value === null) {
    return <span className="font-mono text-xs text-muted-foreground">—</span>;
  }
  const color = tone === "present" ? "var(--present)" : "var(--marker)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="w-11 text-right font-mono text-xs tabular-nums">
        {value}%
      </span>
    </div>
  );
}

export function CourseMetrics({ courses }: { courses: CourseMetric[] }) {
  if (courses.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Crea tu primer curso para ver métricas por curso.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="pb-2 font-medium text-muted-foreground">Curso</th>
            <th className="pb-2 text-right font-medium text-muted-foreground">
              Alumnos
            </th>
            <th className="hidden pb-2 font-medium text-muted-foreground sm:table-cell">
              Asistencia
            </th>
            <th className="pb-2 font-medium text-muted-foreground">
              Aprobación
            </th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr
              key={c.id}
              className="border-b border-border/60 last:border-0"
            >
              <td className="py-3 pr-4 font-medium">{c.name}</td>
              <td className="py-3 text-right font-mono tabular-nums">
                {c.students}
              </td>
              <td className="hidden py-3 sm:table-cell">
                <Meter value={c.attendanceRate} tone="present" />
              </td>
              <td className="py-3">
                <Meter value={c.approvalRate} tone="marker" />
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/cursos/${c.id}`}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ver
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
