"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { removeEnrollmentAction } from "../actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export interface EnrolledStudent {
  studentId: string;
  code: string;
  fullName: string;
  status: "ACTIVE" | "INACTIVE";
}

export function EnrolledStudents({
  courseId,
  students,
}: {
  courseId: string;
  students: EnrolledStudent[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(studentId: string) {
    setPendingId(studentId);
    startTransition(async () => {
      const result = await removeEnrollmentAction({ courseId, studentId });
      if (result.ok) {
        toast.success("Matrícula eliminada.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setPendingId(null);
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground">Alumno</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.studentId}>
              <TableCell className="font-medium">{s.fullName}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  disabled={pendingId === s.studentId}
                  onClick={() => remove(s.studentId)}
                >
                  {pendingId === s.studentId ? (
                    <Spinner className="size-4" />
                  ) : (
                    <XIcon className="size-4" />
                  )}
                  <span className="sr-only">Quitar</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
