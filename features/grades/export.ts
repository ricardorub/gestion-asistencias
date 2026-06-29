import "server-only";
import { ExcelJS, styleHeaderRow, workbookToBuffer } from "@/lib/excel";
import type { GradeSheet } from "./service";

/**
 * Libro con el acta de notas de un curso: una columna por evaluación
 * (con su peso), el promedio ponderado y la condición según la nota aprobatoria.
 */
export async function buildGradeSheetWorkbook(
  sheet: GradeSheet,
  courseName: string,
  passingGrade: number,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Notas");

  const columns: Partial<ExcelJS.Column>[] = [
    { header: "Código", key: "code", width: 14 },
    { header: "Alumno", key: "name", width: 30 },
    ...sheet.categories.map((c) => ({
      header: `${c.name} (${c.percentage}%)`,
      key: `cat_${c.id}`,
      width: 16,
    })),
    { header: "Promedio", key: "average", width: 12 },
    { header: "Condición", key: "condition", width: 14 },
  ];
  ws.columns = columns;
  styleHeaderRow(ws.getRow(1));
  ws.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];

  for (const row of sheet.rows) {
    const record: Record<string, string | number> = {
      code: row.code,
      name: row.fullName,
    };
    for (const c of sheet.categories) {
      const score = row.scores[c.id];
      record[`cat_${c.id}`] = score === undefined ? "" : score;
    }
    record.average = row.average === null ? "" : row.average;
    record.condition =
      row.average === null
        ? "Pendiente"
        : row.average >= passingGrade
          ? "Aprobado"
          : "Desaprobado";
    ws.addRow(record);
  }

  // Pie con el resumen del curso.
  ws.addRow({});
  const footer = ws.addRow({
    name: `Curso: ${courseName} · Nota aprobatoria: ${passingGrade}`,
  });
  footer.font = { italic: true, color: { argb: "FF6B7280" } };

  return workbookToBuffer(wb);
}
