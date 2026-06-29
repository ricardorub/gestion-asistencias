import "server-only";
import { ExcelJS } from "@/lib/excel";
import { STUDENT_COLUMNS } from "./export";

export interface RawStudentRow {
  /** Número de fila en el Excel (1 = encabezado), útil para reportar errores. */
  rowNumber: number;
  code: string;
  name: string;
  paternalName: string;
  maternalName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  status: string;
}

// Rango de marcas diacríticas combinantes (acentos) U+0300–U+036F.
const DIACRITICS = /[̀-ͯ]/g;

function normalizeHeader(h: string) {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "");
}

const HEADER_TO_KEY = new Map(
  STUDENT_COLUMNS.map((c) => [normalizeHeader(c.header), c.key]),
);

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    // Celdas con fórmula, hipervínculo o texto enriquecido.
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return String(value.result ?? "");
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((r) => r.text).join("");
    }
    return "";
  }
  return String(value).trim();
}

/**
 * Lee el primer worksheet, mapea columnas por encabezado (sin importar el orden)
 * y devuelve las filas no vacías como texto crudo.
 */
export async function parseStudentRows(
  buffer: Buffer,
): Promise<RawStudentRow[]> {
  const wb = new ExcelJS.Workbook();
  // Los tipos de exceljs usan un `Buffer` no genérico que no coincide con el
  // `Buffer<ArrayBufferLike>` de @types/node; en runtime acepta el buffer tal cual.
  await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  // Mapa columna(número) → clave del modelo, según el encabezado de la fila 1.
  const colKey = new Map<number, string>();
  ws.getRow(1).eachCell((cell, col) => {
    const key = HEADER_TO_KEY.get(normalizeHeader(cellText(cell.value)));
    if (key) colKey.set(col, key);
  });

  const rows: RawStudentRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // encabezado

    const values: Record<string, string> = {};
    for (const [col, key] of colKey) {
      values[key] = cellText(row.getCell(col).value);
    }

    // Saltar filas completamente vacías.
    if (Object.values(values).every((v) => v === "")) return;

    rows.push({
      rowNumber,
      code: values.code ?? "",
      name: values.name ?? "",
      paternalName: values.paternalName ?? "",
      maternalName: values.maternalName ?? "",
      documentType: values.documentType ?? "",
      documentNumber: values.documentNumber ?? "",
      email: values.email ?? "",
      phone: values.phone ?? "",
      status: values.status ?? "",
    });
  });

  return rows;
}
