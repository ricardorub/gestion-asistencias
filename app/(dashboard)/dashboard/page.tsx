import { requireTeacher } from "@/lib/rbac";
import { getDashboardData } from "@/features/dashboard/service";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { AdminDashboardView } from "@/features/dashboard/components/admin-dashboard-view"; // Importamos la nueva vista Admin
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await requireTeacher();

  const isTeacher = session.user.role === "TEACHER";
  const isAdmin = session.user.role === "ADMIN";

  // ───────── FLUJO 1: COMPONENTE DASHBOARD DOCENTE ─────────
  if (isTeacher) {
    const data = await getDashboardData(session.user.id);

    const pendingCourses = await prisma.course.findMany({
      where: {
        teacherId: session.user.id,
        status: "PENDING",
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return (
      <div className="flex flex-col gap-8">
        <header>
          <p className="eyebrow">Panel del Docente</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Hola, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Un vistazo a tus cursos, asistencia y rendimiento en Gotitas del Saber.
          </p>
        </header>

        <DashboardView data={data} pendingCourses={pendingCourses} />
      </div>
    );
  }

  // ───────── FLUJO 2: COMPONENTE DASHBOARD ADMINISTRADOR ─────────
  if (isAdmin) {
    // 1. Calculamos los conteos globales de la institución en Docker
    const [totalCourses, totalStudents, totalTeachers] = await Promise.all([
      prisma.course.count({ where: { deletedAt: null } }),
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
    ]);

    // 2. Traemos todas las asignaturas para la tabla de control
    const allCourses = await prisma.course.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        teacher: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="flex flex-col gap-8">
        <header>
          <p className="eyebrow">Consola de Administración</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Hola, {session.user.name?.split(" ")[0]} (Admin)
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestión centralizada de asignaturas, alumnos y estado de confirmación docente.
          </p>
        </header>

        {/* Renderizamos el nuevo componente exclusivo para administradores */}
        <AdminDashboardView 
          stats={{ totalCourses, totalStudents, totalTeachers }} 
          courses={allCourses} 
        />
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-sm text-muted-foreground">
      No cuentas con los permisos necesarios para visualizar este panel.
    </div>
  );
}