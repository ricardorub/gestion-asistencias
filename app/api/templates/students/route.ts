import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { xlsxDownloadHeaders } from "@/lib/excel";
import { buildStudentTemplate } from "@/features/students/export";

export async function GET() {
  try {
    await requireTeacher();
    const buffer = await buildStudentTemplate();
    return new NextResponse(new Uint8Array(buffer), {
      headers: xlsxDownloadHeaders("plantilla_alumnos.xlsx"),
    });
  } catch (e) {
    if (e instanceof AppError && e.code === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "No se pudo generar la plantilla." },
      { status: 500 },
    );
  }
}
