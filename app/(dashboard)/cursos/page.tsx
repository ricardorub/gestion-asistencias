import { GraduationCapIcon, PlusIcon } from "lucide-react";
import { requireTeacher } from "@/lib/rbac";
import { findCourses } from "@/features/courses/repository";
import { courseFilterSchema } from "@/features/courses/schema";
import { CoursesToolbar } from "@/features/courses/components/courses-toolbar";
import {
  CourseCard,
  type CourseCardData,
} from "@/features/courses/components/course-card";
import { CourseFormDialog } from "@/features/courses/components/course-form-dialog";
import { Button } from "@/components/ui/button";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireTeacher();
  const filter = courseFilterSchema.parse(await searchParams);
  const { items } = await findCourses(session.user.id, filter);

  const courses: CourseCardData[] = items.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    description: c.description ?? undefined,
    passingGrade: c.passingGrade.toNumber(),
    enrolledCount: c._count.enrollments,
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="eyebrow">Gestión</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
          Cursos
        </h1>
        <p className="mt-1 text-muted-foreground">
          Crea cursos y matricula a tus alumnos.
        </p>
      </header>

      <CoursesToolbar q={filter.q} />

      {courses.length === 0 ? (
        <Empty className="rounded-lg border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GraduationCapIcon />
            </EmptyMedia>
            <EmptyTitle>
              {filter.q ? "Sin resultados" : "Aún no tienes cursos"}
            </EmptyTitle>
            <EmptyDescription>
              {filter.q
                ? "Prueba con otro término de búsqueda."
                : "Crea tu primer curso para empezar a matricular alumnos."}
            </EmptyDescription>
          </EmptyHeader>
          {!filter.q && (
            <EmptyContent>
              <CourseFormDialog>
                <Button>
                  <PlusIcon data-icon="inline-start" />
                  Nuevo curso
                </Button>
              </CourseFormDialog>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
