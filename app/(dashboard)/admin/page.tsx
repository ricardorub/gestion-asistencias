import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Users, Award, Check, X, Clock } from "lucide-react";
import { approveUserAction, rejectUserAction } from "@/features/auth/actions";

export const revalidate = 0;

export default async function AdminPage() {
  await requireAdmin();

  // Obtener todos los usuarios del sistema
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          courses: true,
          students: true,
        },
      },
    },
  });

  const pendingUsers = users.filter((u) => u.status === "PENDING");
  const processedUsers = users.filter((u) => u.status !== "PENDING");

  const totalUsers = users.length;
  const totalApproved = users.filter((u) => u.status === "APPROVED").length;
  const totalPending = pendingUsers.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Gestión de accesos, aprobación de solicitudes y roles de profesores.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registrados en la plataforma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApproved}</div>
            <p className="text-xs text-muted-foreground">Cuentas activas con acceso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">Esperando revisión</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card className={pendingUsers.length > 0 ? "border-amber-200 bg-amber-50/10" : ""}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Solicitudes de Registro Pendientes</CardTitle>
            {pendingUsers.length > 0 && (
              <Badge variant="warning" className="animate-pulse">
                {pendingUsers.length} Nuevas
              </Badge>
            )}
          </div>
          <CardDescription>
            Profesores registrados que solicitan acceso al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              No hay solicitudes pendientes de aprobación.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <form action={approveUserAction.bind(null, user.id)}>
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <Check className="h-4 w-4" /> Aceptar
                          </Button>
                        </form>
                        <form action={rejectUserAction.bind(null, user.id)}>
                          <Button
                            type="submit"
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                          >
                            <X className="h-4 w-4" /> Rechazar
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Processed Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Lista de profesores y administradores procesados en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Cursos</TableHead>
                <TableHead>Alumnos</TableHead>
                <TableHead>Fecha Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role === "ADMIN" ? "Administrador" : "Profesor"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "APPROVED"
                          ? "default"
                          : user.status === "REJECTED"
                          ? "destructive"
                          : "secondary"
                      }
                      className={
                        user.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          : ""
                      }
                    >
                      {user.status === "APPROVED"
                        ? "Aprobado"
                        : user.status === "REJECTED"
                        ? "Rechazado"
                        : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user._count.courses}</TableCell>
                  <TableCell>{user._count.students}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("es-ES")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
