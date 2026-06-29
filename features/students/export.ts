import "server-only";
import type { Student } from "@prisma/client";
import {
  ExcelJS,
  styleHeaderRow,
  workbookToBuffer,
} from "@/lib/excel";
import { DOCUMENT_TYPE_LABELS, STUDENT_STATUS_LABELS } from "./schema";

/** Columnas de la hoja de alumnos. Compartidas por exportación, plantilla e importación. */
export const STUDENT_COLUMNS = [
  { key: "code", header: "Código", width: 14 },
  { key: "name", header: "Nombres", width: 22 },
  { key: "paternalName", header: "Apellido paterno", width: 20 },
  { key: "maternalName", header: "Apellido materno", width: 20 },
  { key: "documentType", header: "Tipo de documento", width: 18 },
  { key: "documentNumber", header: "Número de documento", width: 20 },
  { key: "email", header: "Correo", width: 26 },
  { key: "phone", header: "Teléfono", width: 16 },
  { key: "status", header: "Estado", width: 12 },
] as const;

const SHEET_NAME = "Alumnos";

function baseSheet(wb: ExcelJS.Workbook) {
  const ws = wb.addWorksheet(SHEET_NAME);
  ws.columns = STUDENT_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));
  styleHeaderRow(ws.getRow(1));
  ws.views = [{ state: "frozen", ySplit: 1 }];
  return ws;
}

/** Libro con los alumnos dados (uno por fila). */
export async function buildStudentsWorkbook(rows: Student[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = baseSheet(wb);

  for (const s of rows) {
    ws.addRow({
      code: s.code,
      name: s.name,
      paternalName: s.paternalName,
      maternalName: s.maternalName ?? "",
      documentType: s.documentType,
      documentNumber: s.documentNumber,
      email: s.email ?? "",
      phone: s.phone ?? "",
      status: STUDENT_STATUS_LABELS[s.status],
    });
  }

  return workbookToBuffer(wb);
}

/** Plantilla vacía con una fila de ejemplo y una hoja de ayuda. */
export async function buildStudentTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = baseSheet(wb);

  ws.addRow({
    code: "A001",
    name: "Ana María",
    paternalName: "Pérez",
    maternalName: "Gómez",
    documentType: "DNI",
    documentNumber: "12345678",
    email: "ana@correo.com",
    phone: "987654321",
    status: "Activo",
  });

  const help = wb.addWorksheet("Instrucciones");
  help.columns = [{ width: 24 }, { width: 60 }];
  styleHeaderRow(help.addRow(["Campo", "Indicación"]));
  const lines: [string, string][] = [
    ["Código", "Obligatorio. Único por profesor. Máx. 20 caracteres."],
    ["Nombres", "Obligatorio. Máx. 80 caracteres."],
    ["Apellido paterno", "Obligatorio. Máx. 80 caracteres."],
    ["Apellido materno", "Opcional."],
    [
      "Tipo de documento",
      `Uno de: ${Object.entries(DOCUMENT_TYPE_LABELS)
        .map(([k, v]) => `${k} (${v})`)
        .join(", ")}.`,
    ],
    ["Número de documento", "Obligatorio. Entre 6 y 20 caracteres. Único."],
    ["Correo", "Opcional. Formato de correo válido."],
    ["Teléfono", "Opcional. Máx. 20 caracteres."],
    ["Estado", "Activo o Inactivo. Si se deja vacío, queda Activo."],
  ];
  for (const l of lines) help.addRow(l);

  return workbookToBuffer(wb);
}
