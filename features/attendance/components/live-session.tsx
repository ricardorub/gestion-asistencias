"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { saveAttendanceAction } from "../actions";
import type { LiveSessionView } from "../service";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LiveSession({
  courseId,
  view,
}: {
  courseId: string;
  view: LiveSessionView;
}) {
  const router = useRouter();
  
  // Set all initial states to "PRESENT" (Asistió) if they don't have any status yet
  const [statuses, setStatuses] = useState<Record<string, "PRESENT" | "ABSENT">>(() => 
    Object.fromEntries(view.students.map((s) => [
      s.studentId, 
      (s.status === "PRESENT" || s.status === "ABSENT") ? s.status : "PRESENT"
    ]))
  );
  
  const [saving, startSave] = useTransition();

  function setStatus(studentId: string, value: "PRESENT" | "ABSENT") {
    setStatuses((s) => ({ ...s, [studentId]: value }));
  }

  function handleSave() {
    const marks = Object.entries(statuses).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    startSave(async () => {
      const result = await saveAttendanceAction({
        courseId,
        marks,
      });

      if (result.ok) {
        toast.success("Asistencia guardada correctamente.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* STUDENT ATTENDANCE LIST TABLE */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold">Registro de Asistencia</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nombres y apellidos de los alumnos registrados en este curso.
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground px-6 py-3">Nombres y Apellidos</TableHead>
              <TableHead className="text-right text-muted-foreground px-6 py-3">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {view.students.map((s) => {
              const currentStatus = statuses[s.studentId];

              return (
                <TableRow key={s.studentId} className="transition-all duration-200">
                  <TableCell className="px-6 py-4">
                    <span className="text-base font-medium text-foreground">
                      {s.fullName}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex justify-end">
                      <Select
                        items={{ PRESENT: "Asistió", ABSENT: "Falta" }}
                        value={currentStatus}
                        onValueChange={(v) => setStatus(s.studentId, (v as any) ?? "PRESENT")}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRESENT">Asistió</SelectItem>
                          <SelectItem value="ABSENT">Falta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground font-semibold shadow-sm px-6">
          {saving ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <CheckCircle2Icon data-icon="inline-start" />
          )}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
