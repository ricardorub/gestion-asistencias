import { CalendarCheckIcon, RadioIcon } from "lucide-react";
import {
  getSessionView,
  getSessionHistory,
} from "../service";
import { StartAttendance } from "./start-attendance";
import { LiveSession } from "./live-session";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

const dateFmt = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export async function AttendanceSection({
  teacherId,
  courseId,
}: {
  teacherId: string;
  courseId: string;
}) {
  const [view, history] = await Promise.all([
    getSessionView(teacherId, courseId),
    getSessionHistory(teacherId, courseId),
  ]);

  const closedHistory = history.filter((h) => h.status === "CLOSED");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Asistencia</h2>
          <p className="text-sm text-muted-foreground">
            Registra la asistencia del día para tus alumnos.
          </p>
        </div>
      </div>

      {view.students.length === 0 ? (
        <Empty className="rounded-lg border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RadioIcon />
            </EmptyMedia>
            <EmptyTitle>Sin alumnos matriculados</EmptyTitle>
            <EmptyDescription>
              Matricula alumnos para poder tomar asistencia.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <LiveSession courseId={courseId} view={view} />
      )}

      {closedHistory.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Historial
          </h3>
          <ul className="divide-y rounded-lg border bg-card">
            {closedHistory.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="inline-flex items-center gap-2 text-sm">
                  <CalendarCheckIcon className="size-4 text-muted-foreground" />
                  {dateFmt.format(new Date(h.startedAt))}
                </span>
                <span className="flex items-center gap-1.5">
                  <Badge className="bg-present/15 text-present">
                    {h.present} presentes
                  </Badge>
                  {h.late > 0 && (
                    <Badge className="bg-late/15 text-late">
                      {h.late} tardanzas
                    </Badge>
                  )}
                  {h.absent > 0 && (
                    <Badge className="bg-absent/15 text-absent">
                      {h.absent} faltas
                    </Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
