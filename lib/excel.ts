import "server-only";
import ExcelJS from "exceljs";

export const EXCEL_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Estilo de encabezado consistente (tinta sobre ámbar suave). */
export function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FF1F2433" } };
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF3D9A4" },
    };
    cell.alignment = { vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: { argb: "FFD9C28A" } } };
  });
}

/** Serializa el libro a Buffer de Node para responder desde un Route Handler. */
export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const data = await wb.xlsx.writeBuffer();
  return Buffer.from(data);
}

/** Cabeceras de descarga para un archivo .xlsx. */
export function xlsxDownloadHeaders(filename: string) {
  return {
    "Content-Type": EXCEL_CONTENT_TYPE,
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
}

export { ExcelJS };
