import {
  ClipboardListIcon,
  DownloadIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from "lucide-react";
import type { GradeSheet } from "../service";
import { CategoriesDialog } from "./categories-dialog";
import { GradeSheetTable } from "./grade-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export function GradesSection({
  courseId,
  sheet,
  passingGrade,
}: {
  courseId: string;
  sheet: GradeSheet;
  passingGrade: number;
}) {
  const { categories, rows, totalPercentage } = sheet;
  const hasCategories = categories.length > 0;
  const sums100 = Math.abs(totalPercentage - 100) < 0.01;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Notas</h2>
          <p className="text-sm text-muted-foreground">
            Configura las evaluaciones e ingresa las notas (escala 0–20).
          </p>
        </div>
        {hasCategories && (
          <div className="flex items-center gap-2">
            {rows.length > 0 && (
              <Button
                variant="outline"
                nativeButton={false}
                render={<a href={`/api/export/grades/${courseId}`} />}
              >
                <DownloadIcon data-icon="inline-start" />
                Exportar notas
              </Button>
            )}
            <CategoriesDialog courseId={courseId} categories={categories}>
              <Button variant="outline">
                <SlidersHorizontalIcon data-icon="inline-start" />
                Configurar evaluaciones
              </Button>
            </CategoriesDialog>
          </div>
        )}
      </div>

      {hasCategories && (
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1.5">
              {c.name}
              <span className="font-mono text-xs text-muted-foreground">
                {c.percentage}%
              </span>
            </Badge>
          ))}
          <span
            className={cn(
              "ml-1 font-mono text-xs font-semibold",
              sums100 ? "text-present" : "text-destructive",
            )}
          >
            Total {totalPercentage}%{sums100 ? "" : " ⚠"}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            Aprueba con{" "}
            <span className="font-mono font-semibold text-foreground">
              {passingGrade}
            </span>
          </span>
        </div>
      )}

      {!hasCategories ? (
        <Empty className="rounded-lg border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardListIcon />
            </EmptyMedia>
            <EmptyTitle>Sin evaluaciones configuradas</EmptyTitle>
            <EmptyDescription>
              Define las evaluaciones del curso (ej. Práctica, Parcial, Final) y
              sus pesos. Deben sumar 100%.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CategoriesDialog courseId={courseId} categories={categories}>
              <Button>
                <SlidersHorizontalIcon data-icon="inline-start" />
                Configurar evaluaciones
              </Button>
            </CategoriesDialog>
          </EmptyContent>
        </Empty>
      ) : rows.length === 0 ? (
        <Empty className="rounded-lg border border-dashed py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>Sin alumnos matriculados</EmptyTitle>
            <EmptyDescription>
              Matricula alumnos en la pestaña “Matrículas” para registrar notas.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <GradeSheetTable
          courseId={courseId}
          sheet={sheet}
          passingGrade={passingGrade}
        />
      )}
    </div>
  );
}
