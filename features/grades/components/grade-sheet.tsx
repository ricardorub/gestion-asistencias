"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2Icon } from "lucide-react";
import { saveAllGradesAction } from "../actions";
import { weightedAverage } from "../average";
import type { GradeSheet } from "../service";
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
import { cn } from "@/lib/utils";

type Scores = Record<string, Record<string, string>>; // studentId → catId → value

export function GradeSheetTable({
  courseId,
  sheet,
  passingGrade,
}: {
  courseId: string;
  sheet: GradeSheet;
  passingGrade: number;
}) {
  const router = useRouter();
  const { categories, rows } = sheet;
  const [saving, startSave] = useTransition();

  // Estado local editable: valores como string para permitir edición libre.
  const [scores, setScores] = useState<Scores>(() => {
    const init: Scores = {};
    for (const r of rows) {
      init[r.studentId] = {};
      for (const c of categories) {
        const v = r.scores[c.id];
        init[r.studentId][c.id] = v !== undefined ? String(v) : "";
      }
    }
    return init;
  });

  function rowAverage(studentId: string): number | null {
    return weightedAverage(
      categories.map((c) => {
        const raw = scores[studentId]?.[c.id];
        const num = raw === "" || raw === undefined ? null : Number(raw);
        return {
          percentage: c.percentage,
          score: num !== null && Number.isFinite(num) ? num : null,
        };
      }),
    );
  }

  function onChange(studentId: string, categoryId: string, value: string) {
    setScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [categoryId]: value },
    }));
  }

  function handleSaveAll() {
    const gradesList: { studentId: string; gradeCategoryId: string; score: number | null }[] = [];

    for (const studentId of Object.keys(scores)) {
      for (const categoryId of Object.keys(scores[studentId])) {
        const val = scores[studentId][categoryId].trim();
        if (val === "") {
          gradesList.push({ studentId, gradeCategoryId: categoryId, score: null });
        } else {
          const num = Number(val);
          if (isNaN(num) || num < 0 || num > 20) {
            toast.error("Todas las notas deben ser valores numéricos entre 0 y 20.");
            return;
          }
          gradesList.push({ studentId, gradeCategoryId: categoryId, score: num });
        }
      }
    }

    startSave(async () => {
      const result = await saveAllGradesAction({
        courseId,
        grades: gradesList,
      });
      if (result.ok) {
        toast.success("Notas guardadas correctamente.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 bg-card text-muted-foreground px-6 py-3">
                Alumno
              </TableHead>
              {categories.map((c) => (
                <TableHead key={c.id} className="text-center text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <span className="max-w-32 truncate">{c.name}</span>
                    <span className="font-mono text-xs font-normal text-muted-foreground/80">
                      {c.percentage}%
                    </span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center text-muted-foreground px-6 py-3">
                Promedio
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const avg = rowAverage(r.studentId);
              return (
                <TableRow key={r.studentId} className="transition-all duration-200">
                  <TableCell className="sticky left-0 bg-card px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{r.fullName}</span>
                    </div>
                  </TableCell>
                  {categories.map((c) => (
                    <TableCell key={c.id} className="p-1.5 text-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={20}
                        step="0.1"
                        value={scores[r.studentId]?.[c.id] ?? ""}
                        onChange={(e) =>
                          onChange(r.studentId, c.id, e.target.value)
                        }
                        className="h-9 w-16 rounded-md border border-transparent bg-transparent text-center font-mono text-base tabular-nums outline-none hover:border-input focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/30 transition-all"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-center px-6 py-4">
                    <span
                      className={cn(
                        "font-mono font-semibold text-base tabular-nums",
                        avg === null
                          ? "text-muted-foreground"
                          : avg >= passingGrade
                            ? "text-present"
                            : "text-destructive",
                      )}
                    >
                      {avg === null ? "—" : avg.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-primary text-primary-foreground font-semibold shadow-sm px-6"
        >
          {saving ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <CheckCircle2Icon className="size-4 mr-2" />
          )}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
