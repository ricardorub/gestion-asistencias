import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/rbac";
import { AppError } from "@/lib/errors";
import { xlsxDownloadHeaders } from "@/lib/excel";
import { assertCourseOwned } from "@/features/courses/service";
import { getGradeSheet } from "@/features/grades/service";
import { buildGradeSheetWorkbook } from "@/features/grades/export";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await requireTeacher();
    const { courseId } = await ctx.params;

    const course = await assertCourseOwned(session.user.id, courseId);
    const sheet = await getGradeSheet(session.user.id, courseId);
    const buffer = await buildGradeSheetWorkbook(
      sheet,
      course.name,
      course.passingGrade.toNumber(),
    );

    const safeName = course.code.replace(/[^a-zA-Z0-9_-]/g, "");
    return new NextResponse(new Uint8Array(buffer), {
      headers: xlsxDownloadHeaders(`notas_${safeName || courseId}.xlsx`),
    });
  } catch (e) {
    if (e instanceof AppError) {
      const status = e.code === "UNAUTHENTICATED" ? 401 : 404;
      return NextResponse.json({ error: e.message }, { status });
    }
    return NextResponse.json(
      { error: "No se pudo generar el archivo." },
      { status: 500 },
    );
  }
}
