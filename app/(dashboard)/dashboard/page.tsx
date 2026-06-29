import { requireTeacher } from "@/lib/rbac";
import { getDashboardData } from "@/features/dashboard/service";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export default async function DashboardPage() {
  const session = await requireTeacher();
  const data = await getDashboardData(session.user.id);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="eyebrow">Panel</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
          Hola, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Un vistazo a tus cursos, asistencia y rendimiento en Gotitas del Saber.
        </p>
      </header>

      <DashboardView data={data} />
    </div>
  );
}
