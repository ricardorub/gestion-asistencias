import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { xlsxDownloadHeaders } from "@/lib/excel";
import { studentFilterSchema } from "@/features/students/schema";
import { findStudentsForExport } from "@/features/students/repository";
import { buildStudentsWorkbook } from "@/features/students/export";

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacher();

    const sp = req.nextUrl.searchParams;
    const f = studentFilterSchema.parse({
      q: sp.get("q") ?? undefined,
      status: sp.get("status") ?? undefined,
    });

    const rows = await findStudentsForExport(session.user.id, {
      q: f.q,
      status: f.status,
    });
    const buffer = await buildStudentsWorkbook(rows);

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buffer), {
      headers: xlsxDownloadHeaders(`alumnos_${date}.xlsx`),
    });
  } catch (e) {
    if (e instanceof AppError && e.code === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "No se pudo generar el archivo." },
      { status: 500 },
    );
  }
}
