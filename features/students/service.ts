import { AppError } from "@/lib/errors";
import * as repo from "./repository";
import {
  createStudentSchema,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  STUDENT_STATUSES,
  STUDENT_STATUS_LABELS,
  type CreateStudentDTO,
  type UpdateStudentDTO,
} from "./schema";
import type { RawStudentRow } from "./import";

async function assertNoDuplicates(
  teacherId: string,
  data: CreateStudentDTO,
  excludeId?: string,
) {
  const fieldErrors: Record<string, string[]> = {};

  const byCode = await repo.findByCode(teacherId, data.code);
  if (byCode && byCode.id !== excludeId) {
    fieldErrors.code = ["Ya tienes un alumno con este código."];
  }

  const byDoc = await repo.findByDocument(
    teacherId,
    data.documentType,
    data.documentNumber,
  );
  if (byDoc && byDoc.id !== excludeId) {
    fieldErrors.documentNumber = ["Ya tienes un alumno con este documento."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError("DUPLICATE", "Datos duplicados.", fieldErrors);
  }
}

export async function createStudent(teacherId: string, data: CreateStudentDTO) {
  await assertNoDuplicates(teacherId, data);
  return repo.createStudent(teacherId, data);
}

export async function updateStudent(teacherId: string, data: UpdateStudentDTO) {
  const existing = await repo.findStudentById(teacherId, data.id);
  if (!existing) throw new AppError("NOT_FOUND", "Alumno no encontrado.");

  await assertNoDuplicates(teacherId, data, data.id);
  return repo.updateStudent(data);
}

export async function deleteStudent(teacherId: string, id: string) {
  const existing = await repo.findStudentById(teacherId, id);
  if (!existing) throw new AppError("NOT_FOUND", "Alumno no encontrado.");

  return repo.softDeleteStudent(id);
}

// ───────── Importación masiva ─────────

function normalizeToken(v: string) {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Acepta el código del enum o su etiqueta en español.
const DOC_TYPE_LOOKUP = new Map<string, (typeof DOCUMENT_TYPES)[number]>();
for (const code of DOCUMENT_TYPES) {
  DOC_TYPE_LOOKUP.set(normalizeToken(code), code);
  DOC_TYPE_LOOKUP.set(normalizeToken(DOCUMENT_TYPE_LABELS[code]), code);
}

const STATUS_LOOKUP = new Map<string, (typeof STUDENT_STATUSES)[number]>();
for (const code of STUDENT_STATUSES) {
  STATUS_LOOKUP.set(normalizeToken(code), code);
  STATUS_LOOKUP.set(normalizeToken(STUDENT_STATUS_LABELS[code]), code);
}

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportReport {
  total: number;
  created: number;
  errors: ImportError[];
}

/**
 * Importa alumnos desde filas crudas de Excel. Valida fila por fila, detecta
 * duplicados (dentro del archivo y contra la BD) y crea los válidos. No corta
 * ante un error: reporta cada fila problemática para que el profesor corrija.
 */
export async function importStudents(
  teacherId: string,
  rows: RawStudentRow[],
): Promise<ImportReport> {
  const errors: ImportError[] = [];
  let created = 0;

  // Duplicados dentro del propio archivo.
  const seenCodes = new Set<string>();
  const seenDocs = new Set<string>();

  for (const raw of rows) {
    const docType = DOC_TYPE_LOOKUP.get(normalizeToken(raw.documentType));
    if (raw.documentType && !docType) {
      errors.push({
        row: raw.rowNumber,
        message: `Tipo de documento no reconocido: "${raw.documentType}".`,
      });
      continue;
    }

    const status = raw.status
      ? STATUS_LOOKUP.get(normalizeToken(raw.status))
      : "ACTIVE";
    if (raw.status && !status) {
      errors.push({
        row: raw.rowNumber,
        message: `Estado no reconocido: "${raw.status}".`,
      });
      continue;
    }

    const parsed = createStudentSchema.safeParse({
      code: raw.code,
      name: raw.name,
      paternalName: raw.paternalName,
      maternalName: raw.maternalName,
      documentType: docType,
      documentNumber: raw.documentNumber,
      email: raw.email,
      phone: raw.phone,
      status,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      errors.push({
        row: raw.rowNumber,
        message: first ? `${first.path.join(".")}: ${first.message}` : "Datos inválidos.",
      });
      continue;
    }

    const data = parsed.data;
    const codeKey = data.code.toLowerCase();
    const docKey = `${data.documentType}:${data.documentNumber}`;

    if (seenCodes.has(codeKey)) {
      errors.push({ row: raw.rowNumber, message: `Código "${data.code}" repetido en el archivo.` });
      continue;
    }
    if (seenDocs.has(docKey)) {
      errors.push({ row: raw.rowNumber, message: `Documento "${data.documentNumber}" repetido en el archivo.` });
      continue;
    }

    try {
      await assertNoDuplicates(teacherId, data);
    } catch {
      errors.push({
        row: raw.rowNumber,
        message: `Ya existe un alumno con el código "${data.code}" o el documento "${data.documentNumber}".`,
      });
      continue;
    }

    await repo.createStudent(teacherId, data);
    seenCodes.add(codeKey);
    seenDocs.add(docKey);
    created += 1;
  }

  return { total: rows.length, created, errors };
}
