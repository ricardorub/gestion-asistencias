import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon, UsersIcon, UserPlusIcon } from "lucide-react";
import { requireTeacher } from "@/lib/rbac";
import { findCourseById } from "@/features/courses/repository";
import { getEnrolledStudents } from "@/features/enrollments/service";
import { getGradeSheet } from "@/features/grades/service";
import { CourseFormDialog } from "@/features/courses/components/course-form-dialog";
import { StudentFormDialog } from "@/features/students/components/student-form-dialog";
import {
  EnrolledStudents,
  type EnrolledStudent,
} from "@/features/enrollments/components/enrolled-students";
import { GradesSection } from "@/features/grades/components/grades-section";
import { AttendanceSection } from "@/features/attendance/components/attendance-section";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireTeacher();
  const { courseId } = await params;

  const course = await findCourseById(session.user.id, courseId);
  if (!course) notFound();

  const [enrollments, gradeSheet] = await Promise.all([
    getEnrolledStudents(session.user.id, courseId),
    getGradeSheet(session.user.id, courseId),
  ]);

  const students: EnrolledStudent[] = enrollments.map((e) => ({
    studentId: e.studentId,
    code: e.student.code,
    fullName:
      `${e.student.paternalName} ${e.student.maternalName ?? ""}, ${e.student.name}`.trim(),
    status: e.student.status,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Cursos
        </Link>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
              {course.name}
            </h1>
            {course.description && (
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {course.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StudentFormDialog enrollInCourseId={course.id}>
              <Button>
                <UserPlusIcon data-icon="inline-start" />
                Asignar alumnos
              </Button>
            </StudentFormDialog>

            <CourseFormDialog
              initial={{
                id: course.id,
                code: course.code,
                name: course.name,
                description: course.description ?? undefined,
                passingGrade: course.passingGrade.toNumber(),
              }}
            >
              <Button variant="outline">
                <PencilIcon data-icon="inline-start" />
                Editar
              </Button>
            </CourseFormDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="alumnos">
        <TabsList>
          <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
          <TabsTrigger value="asistencia">Asistencia</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="alumnos" className="mt-6">
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  Alumnos
                </h2>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {students.length}
                  </span>{" "}
                  {students.length === 1
                    ? "alumno registrado"
                    : "alumnos registrados"}
                </p>
              </div>
            </div>

            {students.length === 0 ? (
              <Empty className="rounded-lg border border-dashed py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>Sin alumnos asignados</EmptyTitle>
                  <EmptyDescription>
                    Usa “Asignar alumnos” para registrar y asignar alumnos a este curso.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <EnrolledStudents courseId={course.id} students={students} />
            )}
          </section>
        </TabsContent>

        <TabsContent value="asistencia" className="mt-6">
          <AttendanceSection teacherId={session.user.id} courseId={course.id} />
        </TabsContent>

        <TabsContent value="notas" className="mt-6">
          <GradesSection
            courseId={course.id}
            sheet={gradeSheet}
            passingGrade={course.passingGrade.toNumber()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
